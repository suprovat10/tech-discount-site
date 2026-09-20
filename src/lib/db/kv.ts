import { getMongoDb, isMongoConfigured } from './mongodb';

// Safe runtime helpers to avoid client-side webpack resolution issues
function getFs(): any {
  if (typeof window === 'undefined') {
    try {
      return eval('require')('fs');
    } catch {
      return null;
    }
  }
  return null;
}

function getDbPath(): string {
  if (typeof window === 'undefined') {
    try {
      const pathModule = eval('require')('path');
      return pathModule.join(process.cwd(), 'src', 'data', 'store.json');
    } catch {
      return '';
    }
  }
  return '';
}

// In-memory cache for fast reads with disk mtime synchronization
const memoryCache = new Map<string, any>();
let lastMtime = 0;
let isInitialized = false;

function ensureLoaded(forceFresh = false): void {
  const fsModule = getFs();
  const dbPath = getDbPath();
  if (!fsModule || !dbPath) {
    isInitialized = true;
    return;
  }

  try {
    const pathModule = eval('require')('path');
    const dir = pathModule.dirname(dbPath);
    if (!fsModule.existsSync(dir)) {
      fsModule.mkdirSync(dir, { recursive: true });
    }

    if (fsModule.existsSync(dbPath)) {
      const stat = fsModule.statSync(dbPath);
      if (forceFresh || !isInitialized || stat.mtimeMs > lastMtime) {
        const raw = fsModule.readFileSync(dbPath, 'utf-8');
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'object' && parsed !== null) {
            memoryCache.clear();
            Object.entries(parsed).forEach(([k, v]) => {
              memoryCache.set(k, v);
            });
            lastMtime = stat.mtimeMs;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Store] Warning reading local store from disk:', err);
  } finally {
    isInitialized = true;
  }
}

function persistToDisk(): void {
  const fsModule = getFs();
  const dbPath = getDbPath();
  if (!fsModule || !dbPath) return;

  try {
    const pathModule = eval('require')('path');
    const dir = pathModule.dirname(dbPath);
    if (!fsModule.existsSync(dir)) {
      fsModule.mkdirSync(dir, { recursive: true });
    }

    const obj: Record<string, any> = {};
    memoryCache.forEach((value, key) => {
      obj[key] = value;
    });

    const tempPath = `${dbPath}.tmp.${Date.now()}`;
    fsModule.writeFileSync(tempPath, JSON.stringify(obj, null, 2), 'utf-8');
    fsModule.renameSync(tempPath, dbPath);
    try {
      lastMtime = fsModule.statSync(dbPath).mtimeMs;
    } catch {}
  } catch {
    // In serverless read-only filesystems (like Vercel production), writing to disk will fail silently
    // and data will be safely stored in MongoDB Atlas.
  }
}

export function invalidateSiteKVCache(key?: string): void {
  isInitialized = false;
  lastMtime = 0;
  memoryCache.clear();
  ensureLoaded(true);
}

/**
 * Reads a key from MongoDB Atlas (or local store fallback).
 * If key does not exist in MongoDB yet, it automatically seeds from local store.
 */
export async function getSiteKV<T>(key: string, forceFresh = false): Promise<T | null> {
  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      if (db) {
        const doc = await db.collection('site_kv').findOne({ key });
        if (doc && doc.value !== undefined) {
          memoryCache.set(key, doc.value);
          return doc.value as T;
        }

        // Key not yet in MongoDB: auto-seed from local data to prevent data loss
        ensureLoaded(forceFresh);
        const seedValue = memoryCache.get(key);
        if (seedValue !== undefined && seedValue !== null) {
          await db.collection('site_kv').updateOne(
            { key },
            { $set: { key, value: seedValue, updatedAt: new Date() } },
            { upsert: true }
          );
          return seedValue as T;
        }
        return null;
      }
    } catch (mongoErr) {
      console.warn('[Store] MongoDB read fallback:', mongoErr);
    }
  }

  // Fallback to local memory / disk store
  ensureLoaded(forceFresh);
  const value = memoryCache.get(key);
  if (value === undefined) return null;
  return value as T;
}

/**
 * Synchronously reads a key from memoryCache (or disk store fallback).
 */
export function getSiteKVSync<T>(key: string): T | null {
  ensureLoaded();
  const value = memoryCache.get(key);
  if (value === undefined) return null;
  return value as T;
}

/**
 * Saves a key to MongoDB Atlas (and syncs to local store/memory).
 */
export async function setSiteKV<T>(key: string, value: T): Promise<boolean> {
  ensureLoaded();
  memoryCache.set(key, value);
  persistToDisk();

  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection('site_kv').updateOne(
          { key },
          { $set: { key, value, updatedAt: new Date() } },
          { upsert: true }
        );
        return true;
      }
    } catch (mongoErr) {
      console.error('[Store] MongoDB write error:', mongoErr);
    }
  }

  return true;
}
