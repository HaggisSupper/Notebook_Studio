import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initDatabase, runQuery, getSchemaContext, importToTable } from './sqlService';

// Mock sql.js
vi.mock('sql.js', () => ({
  default: vi.fn(() => Promise.resolve({
    Database: vi.fn().mockImplementation(() => ({
      exec: vi.fn((query: string) => {
        if (query.includes('sqlite_master')) {
          return [{ values: [['test_table']] }];
        }
        if (query.includes('PRAGMA')) {
          return [{ values: [[0, 'id', 'INTEGER'], [1, 'name', 'TEXT']] }];
        }
        if (query.includes('SELECT')) {
          return [{ columns: ['id', 'name'], values: [[1, 'Test'], [2, 'Data']] }];
        }
        return [];
      }),
      run: vi.fn(),
      prepare: vi.fn(() => ({
        run: vi.fn(),
        free: vi.fn()
      }))
    }))
  }))
}));

describe('sqlService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initDatabase', () => {
    it('should initialize an empty database', async () => {
      const db = await initDatabase();
      expect(db).toBeDefined();
    });

    it('should initialize database with existing data', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const db = await initDatabase(mockBuffer);
      expect(db).toBeDefined();
    });
  });

  describe('runQuery', () => {
    it('should execute a SELECT query and return results', async () => {
      await initDatabase();
      const result = runQuery('SELECT * FROM test_table');
      
      expect(result.columns).toContain('id');
      expect(result.columns).toContain('name');
      expect(result.values).toHaveLength(2);
    });

    it('should handle empty results gracefully', async () => {
      await initDatabase();
      // Query that returns no rows - mock returns empty array for non-matching queries
      const result = runQuery('DELETE FROM non_existent');
      
      expect(result.columns).toEqual([]);
      expect(result.values).toEqual([]);
    });
  });

  describe('getSchemaContext', () => {
    it('should return schema context string', async () => {
      await initDatabase();
      const context = getSchemaContext();
      
      expect(context).toContain('TABLE');
    });
  });

  describe('importToTable', () => {
    it('should import JSON array into a table', async () => {
      await initDatabase();
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      
      // Should not throw
      expect(() => importToTable('users', data)).not.toThrow();
    });

    it('should handle empty data gracefully', async () => {
      await initDatabase();
      
      // Should not throw
      expect(() => importToTable('empty_table', [])).not.toThrow();
    });
  });
});
