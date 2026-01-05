const DB_NAME = 'ChatDirectorDB'
const DB_VERSION = 1
const STORE_NAME = 'director_data'

export const DB_KEYS = {
  CHAT_LOG: 'chat_log',
  CUSTOM_CHARS: 'custom_characters',
  AUTO_SAVE_TIME: 'auto_save_timestamp',
  SLOT_1: 'save_slot_1',
  SLOT_2: 'save_slot_2',
  SLOT_3: 'save_slot_3',
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = (event) => reject('IndexedDB error: ' + event.target.error)
    request.onsuccess = (event) => resolve(event.target.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function saveToDB(key, data) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(data, key)
      request.onsuccess = () => resolve()
      request.onerror = (e) => reject(e)
    })
  } catch (e) {
    console.error('Save to DB failed', e)
  }
}

export async function loadFromDB(key) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = (e) => reject(e)
    })
  } catch (e) {
    console.error('Load from DB failed', e)
    return null
  }
}

export async function deleteFromDB(key) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = (e) => reject(e)
    })
  } catch (e) {
    console.error('Delete from DB failed', e)
  }
}
