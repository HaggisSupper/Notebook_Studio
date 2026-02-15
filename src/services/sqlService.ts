
import initSqlJs, { Database } from 'sql.js';
// @ts-ignore
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let db: Database | null = null;

/**
 * Initializes the SQL.js database.
 * If a buffer is provided, it loads that database.
 */
export const initDatabase = async (data?: ArrayBuffer): Promise<Database> => {
  const SQL = await initSqlJs({
    // Use local WASM file via Vite asset handling
    locateFile: (file) => sqlWasmUrl
  });
  
  if (data) {
    db = new SQL.Database(new Uint8Array(data));
  } else {
    db = new SQL.Database();
  }
  
  return db;
};

/**
 * Executes a SQL query and returns the results as a formatted table.
 */
export const runQuery = (query: string): { columns: string[], values: any[][] } => {
  if (!db) throw new Error("Database not initialized");
  
  const res = db.exec(query);
  if (res.length === 0) return { columns: [], values: [] };
  
  return {
    columns: res[0].columns,
    values: res[0].values
  };
};

/**
 * Helper to get all tables and their columns for schema context.
 */
export const getSchemaContext = (): string => {
  if (!db) return "No database initialized.";
  
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
  if (tables.length === 0) return "No tables found in database.";
  
  let context = "SQL DATABASE SCHEMAS:\n";
  
  tables[0].values.forEach(row => {
    const tableName = row[0] as string;
    // Safely get column info
    try {
        const columns = db!.exec(`PRAGMA table_info("${tableName}");`);
        if (columns.length > 0 && columns[0].values) {
             const colList = columns[0].values.map(col => `${col[1]} (${col[2]})`).join(', ');
             context += `- TABLE: ${tableName} (COLUMNS: ${colList})\n`;
        }
    } catch (e) {
        console.warn(`Failed to get schema for table ${tableName}`, e);
    }
  });
  
  return context;
};

/**
 * Import a CSV or JSON array into a new table.
 */
export const importToTable = (tableName: string, data: any[]) => {
  if (!db || data.length === 0) return;
  
  const keys = Object.keys(data[0]);
  // Sanitize column names somewhat
  const columns = keys.map(k => `"${k.replace(/"/g, '""')}" TEXT`).join(', ');
  
  try {
      db.run(`CREATE TABLE IF NOT EXISTS "${tableName.replace(/"/g, '""')}" (${columns});`);

      const placeholders = keys.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT INTO "${tableName.replace(/"/g, '""')}" VALUES (${placeholders})`);

      data.forEach(row => {
        try {
            stmt.run(keys.map(k => row[k]));
        } catch (insertError) {
            console.warn(`Failed to insert row into ${tableName}`, row, insertError);
        }
      });

      stmt.free();
  } catch (tableError) {
      console.error(`Failed to create table ${tableName}`, tableError);
  }
};
