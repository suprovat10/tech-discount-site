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

// In-memory cache for 0ms reads with disk mtime synchronization
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
  } catch (err) {
    console.error('[Store] Error persisting local store to disk:', err);
  }
}

export function invalidateSiteKVCache(key?: string): void {
  isInitialized = false;
  lastMtime = 0;
  memoryCache.clear();
  ensureLoaded(true);
}

export async function getSiteKV<T>(key: string, forceFresh = false): Promise<T | null> {
  ensureLoaded(forceFresh);
  const value = memoryCache.get(key);
  if (value === undefined) return null;
  return value as T;
}

export async function setSiteKV<T>(key: string, value: T): Promise<boolean> {
  ensureLoaded();
  memoryCache.set(key, value);
  persistToDisk();
  return true;
}


