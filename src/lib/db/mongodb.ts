import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let lastMongoError: string | null = null;

export function getLastMongoError(): string | null {
  return lastMongoError;
}

function getMongoUri(): string {
  let raw = (
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.STORAGE_URL ||
    process.env.DATABASE_URL ||
    ''
  ).trim();

  // Strip leading variable name if user accidentally pasted MONGODB_URI=...
  if (raw.startsWith('MONGODB_URI=')) {
    raw = raw.replace(/^MONGODB_URI=/, '').trim();
  }
  // Strip surrounding quotes
  raw = raw.replace(/^["']|["']$/g, '').trim();

  return raw;
}

export function isMongoConfigured(): boolean {
  if (typeof window !== 'undefined') return false;
  const uri = getMongoUri();
  return Boolean(uri.length > 0);
}

export async function getMongoDb(): Promise<Db | null> {
  if (typeof window !== 'undefined') {
    return null;
  }

  if (cachedDb) return cachedDb;
  if (!isMongoConfigured()) {
    lastMongoError = 'isMongoConfigured() returned false - no URI';
    return null;
  }

  try {
    const uri = getMongoUri();
    const dbName = (process.env.MONGODB_DB_NAME || 'techpricedrop').replace(/^["']|["']$/g, '').trim();

    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      await cachedClient.connect();
    }

    cachedDb = cachedClient.db(dbName);
    lastMongoError = null;
    return cachedDb;
  } catch (error: any) {
    const msg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    lastMongoError = `[${error?.name || 'Error'}] ${msg}`;
    console.error('[MongoDB] Connection failed:', lastMongoError);
    cachedDb = null;
    cachedClient = null;
    return null;
  }
}
