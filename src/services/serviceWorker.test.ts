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
});
