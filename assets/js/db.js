// IndexedDB wrapper untuk Offline-First storage
const DB_NAME = 'BaitulHikmahDB';
const DB_VERSION = 1;

let db = null;

// UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Init IndexedDB
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Buku
      if (!db.objectStoreNames.contains('buku')) {
        const bukuStore = db.createObjectStore('buku', { keyPath: 'id' });
        bukuStore.createIndex('kode_buku', 'kode_buku', { unique: true });
        bukuStore.createIndex('kategori', 'kategori', { unique: false });
        bukuStore.createIndex('synced', 'synced', { unique: false });
        bukuStore.createIndex('deleted', 'deleted', { unique: false });
      }
      
      // Kategori
      if (!db.objectStoreNames.contains('kategori')) {
        const kategoriStore = db.createObjectStore('kategori', { keyPath: 'id' });
        kategoriStore.createIndex('nama', 'nama', { unique: true });
      }
      
      // Anggota
      if (!db.objectStoreNames.contains('anggota')) {
        const anggotaStore = db.createObjectStore('anggota', { keyPath: 'id' });
        anggotaStore.createIndex('nomor_anggota', 'nomor_anggota', { unique: true });
        anggotaStore.createIndex('synced', 'synced', { unique: false });
        anggotaStore.createIndex('deleted', 'deleted', { unique: false });
      }
      
      // Petugas
      if (!db.objectStoreNames.contains('petugas')) {
        const petugasStore = db.createObjectStore('petugas', { keyPath: 'id' });
        petugasStore.createIndex('username', 'username', { unique: true });
        petugasStore.createIndex('synced', 'synced', { unique: false });
      }
      
      // Peminjaman
      if (!db.objectStoreNames.contains('peminjaman')) {
        const peminjamanStore = db.createObjectStore('peminjaman', { keyPath: 'id' });
        peminjamanStore.createIndex('kode_transaksi', 'kode_transaksi', { unique: true });
        peminjamanStore.createIndex('status', 'status', { unique: false });
        peminjamanStore.createIndex('anggota_id', 'anggota_id', { unique: false });
        peminjamanStore.createIndex('synced', 'synced', { unique: false });
        peminjamanStore.createIndex('deleted', 'deleted', { unique: false });
      }
      
      // Pengaturan
      if (!db.objectStoreNames.contains('pengaturan')) {
        db.createObjectStore('pengaturan', { keyPath: 'key' });
      }
      
      // Sync Log
      if (!db.objectStoreNames.contains('sync_log')) {
        const syncLogStore = db.createObjectStore('sync_log', { keyPath: 'id', autoIncrement: true });
        syncLogStore.createIndex('waktu', 'waktu', { unique: false });
      }
    };
  });
}

// Generic CRUD operations
async function addRecord(storeName, data) {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  const record = {
    ...data,
    id: data.id || generateUUID(),
    created_at: data.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted: 0,
    synced: 0
  };
  
  return new Promise((resolve, reject) => {
    const request = store.add(record);
    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
}

async function updateRecord(storeName, id, data) {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (!record) {
        reject(new Error('Record not found'));
        return;
      }
      
      const updated = {
        ...record,
        ...data,
        id: record.id,
        created_at: record.created_at,
        updated_at: new Date().toISOString(),
        synced: 0
      };
      
      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve(updated);
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

async function deleteRecord(storeName, id) {
  // Soft delete
  return updateRecord(storeName, id, { deleted: 1 });
}

async function getRecord(storeName, id) {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllRecords(storeName, filter = {}) {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      let results = request.result;
      
      // Filter deleted by default
      if (filter.includeDeleted !== true) {
        results = results.filter(r => r.deleted === 0);
      }
      
      // Additional filters
      if (filter.where) {
        Object.keys(filter.where).forEach(key => {
          results = results.filter(r => r[key] === filter.where[key]);
        });
      }
      
      resolve(results);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function getRecordsByIndex(storeName, indexName, value) {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const index = store.index(indexName);
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result.filter(r => r.deleted === 0));
    request.onerror = () => reject(request.error);
  });
}

// Transaction wrapper for atomic operations
async function transaction(storeName, mode, callback) {
  const tx = db.transaction(storeName, mode);
  
  try {
    const result = await callback(tx);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
    });
  } catch (error) {
    tx.abort();
    throw error;
  }
}

// Settings helper
async function getSetting(key, defaultValue = null) {
  const tx = db.transaction('pengaturan', 'readonly');
  const store = tx.objectStore('pengaturan');
  
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.value : defaultValue);
    };
    request.onerror = () => reject(request.error);
  });
}

async function setSetting(key, value) {
  const tx = db.transaction('pengaturan', 'readwrite');
  const store = tx.objectStore('pengaturan');
  
  return new Promise((resolve, reject) => {
    const request = store.put({ key, value });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Initialize default data
async function initDefaultData() {
  // Default categories
  const defaultKategori = [
    'Fiqih', 'Akidah Akhlak', "Al-Qur'an Hadis", 'SKI',
    'Bahasa', 'IPA', 'IPS', 'Cerita Anak', 'Referensi', 'Umum'
  ];
  
  const existingKategori = await getAllRecords('kategori');
  
  if (existingKategori.length === 0) {
    for (const nama of defaultKategori) {
      await addRecord('kategori', { nama });
    }
  }
  
  // Default settings
  const defaultSettings = {
    lama_pinjam_hari: 7,
    maks_buku_per_anggota: 2,
    denda_per_hari: 0,
    api_url: '',
    api_token: '',
    last_sync: null,
    auto_sync: false
  };
  
  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = await getSetting(key);
    if (existing === null) {
      await setSetting(key, value);
    }
  }
  
  // Default admin account
  const existingPetugas = await getAllRecords('petugas');
  
  if (existingPetugas.length === 0) {
    // Simple hash for default password (must change on first login)
    await addRecord('petugas', {
      nama: 'Administrator',
      jabatan: 'Admin',
      username: 'admin',
      password: await hashPassword('admin123'), // ponytail: must change on first login
      no_hp: '',
      peran: 'admin',
      synced: 0
    });
  }
}

// Simple password hash (use bcrypt-like in production)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify password
async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
}

// Count unsynced records
async function getUnsyncedCount() {
  const stores = ['buku', 'anggota', 'peminjaman', 'petugas'];
  let total = 0;
  
  for (const storeName of stores) {
    const records = await getRecordsByIndex(storeName, 'synced', 0);
    total += records.length;
  }
  
  return total;
}

// Export all data as JSON
async function exportAllData() {
  const data = {
    version: DB_VERSION,
    exported_at: new Date().toISOString(),
    buku: await getAllRecords('buku', { includeDeleted: true }),
    kategori: await getAllRecords('kategori'),
    anggota: await getAllRecords('anggota', { includeDeleted: true }),
    petugas: await getAllRecords('petugas'),
    peminjaman: await getAllRecords('peminjaman', { includeDeleted: true }),
    pengaturan: await getAllRecords('pengaturan')
  };
  
  return data;
}

// Import data from JSON
async function importData(data, mode = 'merge') {
  if (mode === 'replace') {
    // Clear all stores except petugas (keep current login)
    const stores = ['buku', 'kategori', 'anggota', 'peminjaman'];
    for (const storeName of stores) {
      const tx = db.transaction(storeName, 'readwrite');
      await tx.objectStore(storeName).clear();
    }
  }
  
  // Import each store
  const stores = ['kategori', 'buku', 'anggota', 'peminjaman'];
  
  for (const storeName of stores) {
    if (data[storeName]) {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      for (const record of data[storeName]) {
        await store.put(record);
      }
    }
  }
  
  // Import settings
  if (data.pengaturan) {
    for (const setting of data.pengaturan) {
      await setSetting(setting.key, setting.value);
    }
  }
}
