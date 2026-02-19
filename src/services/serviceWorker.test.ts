import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerServiceWorker } from './serviceWorker';

describe('registerServiceWorker', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('registers service worker on window load', async () => {
    const waitingWorker = { postMessage: vi.fn() } as unknown as ServiceWorker;
    const registration = {
      waiting: waitingWorker,
      installing: null,
      addEventListener: vi.fn()
    } as unknown as ServiceWorkerRegistration;

    const registerMock = vi.fn().mockResolvedValue(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerMock,
        controller: {}
      }
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const onUpdate = vi.fn();

    registerServiceWorker(onUpdate);

    const loadHandler = addEventListenerSpy.mock.calls.find(([event]) => event === 'load')?.[1] as EventListener;
    expect(loadHandler).toBeTypeOf('function');

    loadHandler(new Event('load'));
    await Promise.resolve();

    expect(registerMock).toHaveBeenCalledWith('/sw.js');
    expect(onUpdate).toHaveBeenCalledWith(registration);
  });

  it('notifies when an installing worker reaches installed state', async () => {
    const addStateListener = vi.fn();
    const installingWorker = {
      state: 'installing',
      addEventListener: addStateListener
    } as unknown as ServiceWorker;

    const addRegistrationListener = vi.fn();
    const registration = {
      waiting: null,
      installing: installingWorker,
      addEventListener: addRegistrationListener
    } as unknown as ServiceWorkerRegistration;

    const registerMock = vi.fn().mockResolvedValue(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerMock,
        controller: {}
      }
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const onUpdate = vi.fn();

    registerServiceWorker(onUpdate);

    const loadHandler = addEventListenerSpy.mock.calls.find(([event]) => event === 'load')?.[1] as EventListener;
    loadHandler(new Event('load'));
    await Promise.resolve();

    const updateFoundHandler = addRegistrationListener.mock.calls.find(([event]) => event === 'updatefound')?.[1] as EventListener;
    updateFoundHandler(new Event('updatefound'));

    const stateChangeHandler = addStateListener.mock.calls.find(([event]) => event === 'statechange')?.[1] as EventListener;
    (installingWorker as any).state = 'installed';
    stateChangeHandler(new Event('statechange'));

    expect(onUpdate).toHaveBeenCalledWith(registration);
  });

  it('logs registration failures', async () => {
    const registerError = new Error('registration failed');
    const registerMock = vi.fn().mockRejectedValue(registerError);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerMock,
        controller: null
      }
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    registerServiceWorker();

    const loadHandler = addEventListenerSpy.mock.calls.find(([event]) => event === 'load')?.[1] as EventListener;
    loadHandler(new Event('load'));
    await vi.waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith('SW registration failed: ', registerError);
    });
  });
});
