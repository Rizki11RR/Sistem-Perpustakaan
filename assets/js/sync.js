// Sync Module - Sinkronisasi dengan server
window.SyncModule = {
  isSyncing: false,

  async sync() {
    if (this.isSyncing) {
      UI.showToast('Sinkronisasi sedang berjalan', 'warning');
      return;
    }

    const apiUrl = await getSetting('api_url');
    const apiToken = await getSetting('api_token');

    if (!apiUrl || !apiToken) {
      UI.showToast('Konfigurasi API belum lengkap. Atur di menu Pengaturan.', 'error');
      return;
    }

    if (!navigator.onLine) {
      UI.showToast('Tidak ada koneksi internet', 'error');
      return;
    }

    this.isSyncing = true;
    UI.showLoading('Menyinkronkan data...');

    try {
      // Get unsynced records
      const unsyncedBuku = await getRecordsByIndex('buku', 'synced', 0);
      const unsyncedAnggota = await getRecordsByIndex('anggota', 'synced', 0);
      const unsyncedPeminjaman = await getRecordsByIndex('peminjaman', 'synced', 0);
      const unsyncedPetugas = await getRecordsByIndex('petugas', 'synced', 0);

      const totalUnsynced = unsyncedBuku.length + unsyncedAnggota.length + 
                           unsyncedPeminjaman.length + unsyncedPetugas.length;

      if (totalUnsynced === 0) {
        UI.hideLoading();
        UI.showToast('Semua data sudah tersinkron', 'success');
        this.isSyncing = false;
        await this.logSync('push', 0, 'success', 'Tidak ada data baru');
        return;
      }

      // Prepare data
      const payload = {
        buku: unsyncedBuku,
        anggota: unsyncedAnggota,
        peminjaman: unsyncedPeminjaman,
        petugas: unsyncedPetugas.map(p => ({
          ...p,
          password: undefined // Don't sync password hash
        })),
        last_sync: await getSetting('last_sync')
      };

      // Send to server
      const response = await fetch(`${apiUrl}/sync.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Sync failed');
      }

      // Mark as synced
      for (const buku of unsyncedBuku) {
        await updateRecord('buku', buku.id, { synced: 1 });
      }
      for (const anggota of unsyncedAnggota) {
        await updateRecord('anggota', anggota.id, { synced: 1 });
      }
      for (const peminjaman of unsyncedPeminjaman) {
        await updateRecord('peminjaman', peminjaman.id, { synced: 1 });
      }
      for (const petugas of unsyncedPetugas) {
        await updateRecord('petugas', petugas.id, { synced: 1 });
      }

      // Update last sync time
      await setSetting('last_sync', new Date().toISOString());

      // Log
      await this.logSync('push', totalUnsynced, 'success', `${totalUnsynced} record berhasil disinkronkan`);

      UI.hideLoading();
      UI.showToast(`Sinkronisasi berhasil: ${totalUnsynced} data`, 'success');
      UI.updateUnsyncedIndicator();

    } catch (error) {
      console.error('Sync error:', error);
      await this.logSync('push', 0, 'error', error.message);
      UI.hideLoading();
      UI.showToast('Gagal sinkronisasi: ' + error.message, 'error');
    } finally {
      this.isSyncing = false;
    }
  },

  async logSync(arah, jumlah, status, pesan) {
    try {
      await addRecord('sync_log', {
        waktu: new Date().toISOString(),
        arah,
        jumlah_data: jumlah,
        status,
        pesan
      });
    } catch (e) {
      console.error('Log sync error:', e);
    }
  },

  async getSyncLog() {
    return await getAllRecords('sync_log');
  }
};

// Auto-sync when online (if enabled)
window.addEventListener('online', async () => {
  const autoSync = await getSetting('auto_sync', false);
  if (autoSync) {
    setTimeout(() => {
      SyncModule.sync();
    }, 2000);
  }
});
