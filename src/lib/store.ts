import { load } from '@tauri-apps/plugin-store';

// We load the store lazily. In Tauri v2, load() returns a promise.
// 'settings.json' will be stored in the app's config directory.
const storePromise = load('settings.json', { autoSave: true, defaults: {} });

export const getStore = () => storePromise;

export async function setSetting<T>(key: string, value: T) {
  const store = await getStore();
  await store.set(key, value);
  // autoSave is true, but we can call save() explicitly if we want to be certain
  await store.save();
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const store = await getStore();
  const val = await store.get<T>(key);
  return val !== null && val !== undefined ? val : defaultValue;
}
