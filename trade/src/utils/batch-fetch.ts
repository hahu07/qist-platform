import { getDoc, type Doc } from "@junobuild/core";

/**
 * Batch fetch multiple documents in parallel with error handling
 * @param collection - Collection name
 * @param keys - Array of document keys to fetch
 * @returns Map of key -> document (null if not found or error)
 */
export async function batchGetDocs<T = any>(
  collection: string,
  keys: string[]
): Promise<Map<string, Doc<T> | null>> {
  const uniqueKeys = [...new Set(keys)]; // Remove duplicates
  
  const results = await Promise.allSettled(
    uniqueKeys.map(key =>
      getDoc<T>({
        collection,
        key,
      })
    )
  );

  const resultMap = new Map<string, Doc<T> | null>();
  
  uniqueKeys.forEach((key, index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      resultMap.set(key, result.value || null);
    } else {
      console.warn(`Failed to fetch document ${key} from ${collection}:`, result.reason);
      resultMap.set(key, null);
    }
  });

  return resultMap;
}

/**
 * Cache for storing fetched documents
 */
class DocumentCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes default

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  setTTL(ttlMs: number) {
    this.ttl = ttlMs;
  }
}

export const documentCache = new DocumentCache();
