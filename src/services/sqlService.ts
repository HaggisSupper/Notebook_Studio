
import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

/**
 * Initializes the SQL.js database.
 * If a buffer is provided, it loads that database.
 */
export const initDatabase = async (data?: ArrayBuffer): Promise<Database> => {
  const SQL = await initSqlJs({
    // Fetch the wasm file from a CDN or local assets
    locateFile: (file) => `https://sql.js.org/dist/${file}`
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
    const columns = db!.exec(`PRAGMA table_info(${tableName});`);
    const colList = columns[0].values.map(col => `${col[1]} (${col[2]})`).join(', ');
    context += `- TABLE: ${tableName} (COLUMNS: ${colList})\n`;
  });
  
  return context;
};

/**
 * Import a CSV or JSON array into a new table.
 */
export const importToTable = (tableName: string, data: any[]) => {
  if (!db || data.length === 0) return;
  
  const keys = Object.keys(data[0]);
  const columns = keys.map(k => `"${k}" TEXT`).join(', ');
  
  db.run(`CREATE TABLE IF NOT EXISTS "${tableName}" (${columns});`);
  
  const placeholders = keys.map(() => '?').join(', ');
  const stmt = db.prepare(`INSERT INTO "${tableName}" VALUES (${placeholders})`);
  
  data.forEach(row => {
    stmt.run(keys.map(k => row[k]));
  });
  
  stmt.free();
};
