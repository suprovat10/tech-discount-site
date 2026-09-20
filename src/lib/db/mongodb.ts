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

export function isMongoConfigured(): boolean {
  if (typeof window !== 'undefined') return false;
  const uri = process.env.MONGODB_URI;
  return Boolean(uri && uri.trim().length > 0);
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
    const uri = process.env.MONGODB_URI!.trim();
    const dbName = process.env.MONGODB_DB_NAME || 'techpricedrop';

    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
      global._mongoClientPromise = client.connect();
    }

    const client = await global._mongoClientPromise;
    cachedDb = client.db(dbName);
    return cachedDb;
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    return null;
  }
}
