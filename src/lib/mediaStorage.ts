import { CouplePhoto } from '../types';

const DB_NAME = 'WeddingMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_items';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredMedia(): Promise<CouplePhoto[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as CouplePhoto[];
        resolve(result && result.length > 0 ? result : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB, fallback to null', err);
    return null;
  }
}

export async function saveMediaItem(item: CouplePhoto): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save media item to IndexedDB', err);
  }
}

export async function saveAllMedia(items: CouplePhoto[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      items.forEach((item) => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Failed to save all media to IndexedDB', err);
  }
}

export async function deleteMediaItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to delete media item from IndexedDB', err);
  }
}

export async function clearAllStoredMedia(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to clear IndexedDB media', err);
  }
}

const CAROUSEL_CONFIG_KEY = 'wedding_carousel_config_v1';

export function getCarouselConfig(): { transitionEffect: 'coverflow' | 'slide' | 'fade'; objectFitMode: 'cover' | 'contain' } {
  try {
    const saved = localStorage.getItem(CAROUSEL_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        transitionEffect: parsed.transitionEffect || 'coverflow',
        objectFitMode: parsed.objectFitMode || 'cover',
      };
    }
  } catch (e) {
    console.warn('Could not read carousel config from localStorage', e);
  }
  return {
    transitionEffect: 'coverflow',
    objectFitMode: 'cover',
  };
}

export function saveCarouselConfig(config: { transitionEffect: 'coverflow' | 'slide' | 'fade'; objectFitMode: 'cover' | 'contain' }): void {
  try {
    localStorage.setItem(CAROUSEL_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('wedding_carousel_config_updated', { detail: config }));
  } catch (e) {
    console.error('Failed to save carousel config', e);
  }
}

