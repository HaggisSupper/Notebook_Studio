import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadPersistedNotebooks, useNotebookPersistence } from './useNotebookPersistence';
import { renderHook, act } from '@testing-library/react';
import { Notebook } from '../types';

const STORAGE_KEY = 'notebook-studio-notebooks';

const makeNotebook = (overrides: Partial<Notebook> = {}): Notebook => ({
  id: 'nb-1',
  name: 'Test Notebook',
  sources: [],
  pages: [
    {
      id: 'pg-1',
      name: 'Page 1',
      generatedContent: {},
      chatHistory: [],
    },
  ],
  ...overrides,
});

// Use a real in-memory store so the hook can read back what it writes
function createLocalStorageStore() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    store,
  };
}

describe('loadPersistedNotebooks', () => {
  let lsMock: ReturnType<typeof createLocalStorageStore>;

  beforeEach(() => {
    lsMock = createLocalStorageStore();
    global.localStorage = lsMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when localStorage is empty', () => {
    expect(loadPersistedNotebooks()).toBeNull();
  });

  it('returns null for invalid JSON in localStorage', () => {
    lsMock.store[STORAGE_KEY] = 'not-json';
    expect(loadPersistedNotebooks()).toBeNull();
  });

  it('returns null when notebooks array is empty', () => {
    lsMock.store[STORAGE_KEY] = JSON.stringify({ version: 1, notebooks: [], savedAt: new Date().toISOString() });
    expect(loadPersistedNotebooks()).toBeNull();
  });

  it('loads and migrates valid notebooks', () => {
    const nb = makeNotebook();
    lsMock.store[STORAGE_KEY] = JSON.stringify({ version: 1, notebooks: [nb], savedAt: new Date().toISOString() });
    const result = loadPersistedNotebooks();
    expect(result).not.toBeNull();
    expect(result!.length).toBe(1);
    expect(result![0].name).toBe('Test Notebook');
  });

  it('migrates notebook with missing fields', () => {
    const partial = { id: 'nb-x', name: 'Partial' }; // no pages or sources
    lsMock.store[STORAGE_KEY] = JSON.stringify({ version: 1, notebooks: [partial], savedAt: new Date().toISOString() });
    const result = loadPersistedNotebooks();
    expect(result).not.toBeNull();
    const nb = result![0];
    expect(nb.sources).toEqual([]);
    expect(nb.pages.length).toBe(1);
    expect(nb.pages[0].name).toBe('Page 1');
  });
});

describe('useNotebookPersistence', () => {
  let lsMock: ReturnType<typeof createLocalStorageStore>;

  beforeEach(() => {
    lsMock = createLocalStorageStore();
    global.localStorage = lsMock as any;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes lastSaved as null when no data in localStorage', () => {
    const notebooks = [makeNotebook()];
    const { result } = renderHook(() => useNotebookPersistence(notebooks));
    expect(result.current.lastSaved).toBeNull();
  });

  it('initializes lastSaved from existing localStorage entry', () => {
    const savedAt = '2024-01-01T00:00:00.000Z';
    lsMock.store[STORAGE_KEY] = JSON.stringify({ version: 1, notebooks: [makeNotebook()], savedAt });
    const { result } = renderHook(() => useNotebookPersistence([makeNotebook()]));
    expect(result.current.lastSaved).toBe(savedAt);
  });

  it('auto-saves notebooks after debounce delay', () => {
    const notebooks = [makeNotebook()];
    renderHook(() => useNotebookPersistence(notebooks));

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    const raw = lsMock.store[STORAGE_KEY];
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw);
    expect(data.notebooks).toHaveLength(1);
    expect(data.notebooks[0].id).toBe('nb-1');
    expect(data.savedAt).toBeTruthy();
  });

  it('updates lastSaved after auto-save', () => {
    const notebooks = [makeNotebook()];
    const { result } = renderHook(() => useNotebookPersistence(notebooks));

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current.lastSaved).not.toBeNull();
    expect(typeof result.current.lastSaved).toBe('string');
  });

  it('persistNow saves immediately without waiting for debounce', () => {
    const notebooks = [makeNotebook()];
    const { result } = renderHook(() => useNotebookPersistence(notebooks));

    act(() => {
      result.current.persistNow();
    });

    const raw = lsMock.store[STORAGE_KEY];
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw);
    expect(data.notebooks[0].id).toBe('nb-1');
  });

  it('debounces rapid notebook changes', () => {
    const { rerender } = renderHook(
      ({ notebooks }: { notebooks: Notebook[] }) => useNotebookPersistence(notebooks),
      { initialProps: { notebooks: [makeNotebook()] } }
    );

    rerender({ notebooks: [makeNotebook({ name: 'Updated 1' })] });
    rerender({ notebooks: [makeNotebook({ name: 'Updated 2' })] });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Not yet saved (debounce hasn't fired)
    expect(lsMock.store[STORAGE_KEY]).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(700);
    });

    const raw = lsMock.store[STORAGE_KEY];
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw);
    // Should save the latest value
    expect(data.notebooks[0].name).toBe('Updated 2');
  });
});

