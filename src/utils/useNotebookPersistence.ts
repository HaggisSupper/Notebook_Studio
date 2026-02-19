import { useState, useEffect, useRef, useCallback } from 'react';
import { Notebook, Page } from '../types';

const STORAGE_KEY = 'notebook-studio-notebooks';
const SCHEMA_VERSION = 1;
const DEBOUNCE_MS = 1000;

interface PersistedData {
  version: number;
  notebooks: Notebook[];
  savedAt: string;
}

/**
 * Migrates a raw persisted notebook to the current schema.
 * Add migration cases here as the schema evolves.
 */
function migrateNotebook(nb: any): Notebook {
  const pages: Page[] = (Array.isArray(nb.pages) ? nb.pages : []).map((p: any) => ({
    id: p.id ?? Math.random().toString(36).substr(2, 9),
    name: p.name ?? 'Page 1',
    generatedContent: p.generatedContent ?? {},
    chatHistory: Array.isArray(p.chatHistory) ? p.chatHistory : [],
    complexityLevel: p.complexityLevel,
    styleDefinition: p.styleDefinition,
  }));

  return {
    id: nb.id ?? Math.random().toString(36).substr(2, 9),
    name: nb.name ?? 'Untitled Notebook',
    sources: Array.isArray(nb.sources) ? nb.sources : [],
    pages: pages.length > 0 ? pages : [{
      id: 'pg-1',
      name: 'Page 1',
      generatedContent: {},
      chatHistory: [],
    }],
  };
}

/**
 * Loads and migrates notebooks from localStorage.
 * Returns null if no data is stored or data is invalid.
 */
export function loadPersistedNotebooks(): Notebook[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data: PersistedData = JSON.parse(raw);
    if (!data || !Array.isArray(data.notebooks) || data.notebooks.length === 0) {
      return null;
    }

    return data.notebooks.map(migrateNotebook);
  } catch (err) {
    console.error('[useNotebookPersistence] Failed to load notebooks:', err);
    return null;
  }
}

/**
 * Custom hook that auto-saves notebooks to localStorage (debounced)
 * and returns the timestamp of the last successful save.
 *
 * @param notebooks - The current list of notebooks to persist
 * @returns lastSaved - ISO string of last successful save, or null if never saved
 */
export function useNotebookPersistence(notebooks: Notebook[]): {
  lastSaved: string | null;
  persistNow: () => void;
} {
  const [lastSaved, setLastSaved] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data: PersistedData = JSON.parse(raw);
      return data.savedAt ?? null;
    } catch {
      return null;
    }
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notebooksRef = useRef(notebooks);
  notebooksRef.current = notebooks;

  const persist = useCallback(() => {
    try {
      const savedAt = new Date().toISOString();
      const data: PersistedData = {
        version: SCHEMA_VERSION,
        notebooks: notebooksRef.current,
        savedAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setLastSaved(savedAt);
    } catch (err) {
      console.error('[useNotebookPersistence] Failed to save notebooks:', err);
    }
  }, []);

  // Debounced auto-save whenever notebooks change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(persist, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notebooks, persist]);

  return { lastSaved, persistNow: persist };
}
