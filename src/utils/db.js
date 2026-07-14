/**
 * SQLite database utility using sql.js (SQLite compiled to WebAssembly).
 * Data is persisted across page reloads via localStorage (base64-encoded binary dump).
 */

let db = null;
let SQL = null;

const STORAGE_KEY = 'phishai_sqlite_db';

/**
 * Initializes the sql.js engine and creates/restores the SQLite database.
 * Must be called once at app startup (awaited) before any other db operations.
 */
export async function initDB() {
  const initSqlJs = (await import('sql.js')).default;

  SQL = await initSqlJs({
    // Tells sql.js where to find the compiled WASM binary we copied to /public
    locateFile: (file) => `/${file}`
  });

  // Try to restore persisted database from localStorage
  const savedB64 = localStorage.getItem(STORAGE_KEY);
  if (savedB64) {
    try {
      const binaryStr = atob(savedB64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      db = new SQL.Database(bytes);
    } catch (e) {
      console.warn('[PhishAI DB] Failed to restore existing DB, creating fresh.', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Create schema if not already present
  db.run(`
    CREATE TABLE IF NOT EXISTS scans (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      url         TEXT    NOT NULL,
      risk        TEXT    NOT NULL,
      probability REAL    NOT NULL,
      features    TEXT    NOT NULL,
      scanned_at  TEXT    NOT NULL
    )
  `);

  _persistDB();
  return db;
}

/**
 * Serializes and persists current DB state to localStorage.
 * Called after every write operation.
 */
function _persistDB() {
  if (!db) return;
  try {
    const data = db.export();
    const binaryStr = String.fromCharCode(...data);
    const b64 = btoa(binaryStr);
    localStorage.setItem(STORAGE_KEY, b64);
  } catch (e) {
    console.error('[PhishAI DB] Failed to persist DB.', e);
  }
}

/**
 * Saves a completed scan result to the SQLite database.
 * @param {Object} scanResult - { url, risk, probability, features }
 * @returns {number} ID of the newly inserted row
 */
export function saveScan(scanResult) {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');

  const timestamp = new Date().toISOString();
  db.run(
    `INSERT INTO scans (url, risk, probability, features, scanned_at) VALUES (?, ?, ?, ?, ?)`,
    [
      scanResult.url,
      scanResult.risk,
      scanResult.probability,
      JSON.stringify(scanResult.features),
      timestamp
    ]
  );

  _persistDB();

  // Return the newly created row ID
  const result = db.exec(`SELECT last_insert_rowid() as id`);
  return result[0]?.values[0]?.[0] ?? null;
}

/**
 * Fetches all past scan records, newest first.
 * @returns {Array<Object>} Array of scan records
 */
export function getAllScans() {
  if (!db) return [];

  const result = db.exec(`SELECT id, url, risk, probability, features, scanned_at FROM scans ORDER BY id DESC`);
  if (!result.length) return [];

  const { columns, values } = result[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

/**
 * Returns aggregated scan statistics.
 * @returns {Object} { total, phishing, safe, suspicious }
 */
export function getScanStats() {
  if (!db) return { total: 0, phishing: 0, safe: 0, suspicious: 0 };

  const result = db.exec(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN risk = 'danger'  THEN 1 ELSE 0 END) as phishing,
      SUM(CASE WHEN risk = 'safe'    THEN 1 ELSE 0 END) as safe,
      SUM(CASE WHEN risk = 'warning' THEN 1 ELSE 0 END) as suspicious
    FROM scans
  `);

  if (!result.length) return { total: 0, phishing: 0, safe: 0, suspicious: 0 };

  const [total, phishing, safe, suspicious] = result[0].values[0];
  return { total: total ?? 0, phishing: phishing ?? 0, safe: safe ?? 0, suspicious: suspicious ?? 0 };
}

/**
 * Deletes all scan records from the database and re-persists.
 */
export function clearAllScans() {
  if (!db) return;
  db.run(`DELETE FROM scans`);
  _persistDB();
}

/**
 * Checks whether the DB is ready.
 */
export function isDBReady() {
  return db !== null;
}
