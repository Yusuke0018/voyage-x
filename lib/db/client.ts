import initSqlJs from 'sql.js';
import localforage from 'localforage';

let db: any = null;

export async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`
  });

  const savedData = await localforage.getItem('voyage-db');
  
  if (savedData) {
    db = new SQL.Database(savedData as Uint8Array);
  } else {
    db = new SQL.Database();
    
    // Initialize schema
    const schemaSQL = await fetch('/schema.sql').then(r => r.text());
    db.run(schemaSQL);
    
    await saveDatabase();
  }

  return db;
}

export async function saveDatabase() {
  if (!db) return;
  const data = db.export();
  await localforage.setItem('voyage-db', data);
}

export async function executeQuery(sql: string, params: any[] = []) {
  const database = await initDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  await saveDatabase();
  return results;
}

export async function executeInsert(sql: string, params: any[] = []) {
  const database = await initDatabase();
  database.run(sql, params);
  await saveDatabase();
  return database.exec('SELECT last_insert_rowid()')[0].values[0][0];
}