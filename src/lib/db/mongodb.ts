import type { Db } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<any> | undefined;
}

let cachedDb: Db | null = null;

function getMongoDriver(): any {
  if (typeof window === 'undefined') {
    try {
      return eval('require')('mongodb');
    } catch {
      return null;
    }
  }
  return null;
}

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
  if (!isMongoConfigured()) return null;

  const mongoModule = getMongoDriver();
  if (!mongoModule) return null;

  try {
    const { MongoClient } = mongoModule;
    const uri = getMongoUri();
    const dbName = (process.env.MONGODB_DB_NAME || 'techpricedrop').replace(/^["']|["']$/g, '').trim();

    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      global._mongoClientPromise = client.connect();
    }

    const client = await global._mongoClientPromise;
    cachedDb = client.db(dbName);
    lastMongoError = null;
    return cachedDb;
  } catch (error: any) {
    lastMongoError = error?.message || String(error);
    console.error('[MongoDB] Connection failed:', error);
    global._mongoClientPromise = undefined;
    cachedDb = null;
    return null;
  }
}
