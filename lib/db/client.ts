// Database client temporarily disabled for static export
// Will use localStorage for data persistence

interface DBRecord {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

class LocalStorageDB {
  private storageKey = 'voyage-data';
  
  private getData(): Record<string, DBRecord[]> {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {};
  }
  
  private saveData(data: Record<string, DBRecord[]>) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
  
  async query(table: string, filter?: (item: DBRecord) => boolean): Promise<DBRecord[]> {
    const data = this.getData();
    const tableData = data[table] || [];
    return filter ? tableData.filter(filter) : tableData;
  }
  
  async insert(table: string, record: DBRecord): Promise<string> {
    const data = this.getData();
    if (!data[table]) data[table] = [];
    
    const id = `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data[table].push(newRecord);
    this.saveData(data);
    return id;
  }
  
  async update(table: string, id: string, updates: Partial<DBRecord>): Promise<void> {
    const data = this.getData();
    if (!data[table]) return;
    
    const index = data[table].findIndex(item => item.id === id);
    if (index !== -1) {
      data[table][index] = {
        ...data[table][index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveData(data);
    }
  }
  
  async delete(table: string, id: string): Promise<void> {
    const data = this.getData();
    if (!data[table]) return;
    
    data[table] = data[table].filter(item => item.id !== id);
    this.saveData(data);
  }
}

let db: LocalStorageDB | null = null;

export async function initDatabase() {
  if (db) return db;
  db = new LocalStorageDB();
  return db;
}

export async function saveDatabase() {
  // No-op for localStorage implementation
}

export async function executeQuery(sql: string, _params: unknown[] = []) {
  // Parse simple SQL queries for localStorage implementation
  const database = await initDatabase();
  
  // Very basic SQL parsing - in production would need proper parser
  const selectMatch = sql.match(/SELECT .* FROM ([a-zA-Z_]+)/i);
  if (selectMatch) {
    const table = selectMatch[1];
    return database.query(table);
  }
  
  return [];
}

export async function executeInsert(sql: string, params: unknown[] = []) {
  // Parse simple INSERT queries for localStorage implementation
  const database = await initDatabase();
  
  // Very basic SQL parsing
  const insertMatch = sql.match(/INSERT INTO ([a-zA-Z_]+) \((.*?)\) VALUES/i);
  if (insertMatch) {
    const table = insertMatch[1];
    const columns = insertMatch[2].split(',').map((c: string) => c.trim());
    
    const record: DBRecord = {};
    columns.forEach((col: string, i: number) => {
      record[col] = params[i];
    });
    
    return database.insert(table, record);
  }
  
  throw new Error('Unsupported SQL operation');
}