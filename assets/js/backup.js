// Backup Module - Ekspor/Impor dan Backup Bulanan
window.BackupModule = {
  async init() {
    await this.render();
  },

  async render() {
    const container = document.getElementById('backupPage');
    const lastSync = await getSetting('last_sync');
    const unsyncedCount = await getUnsyncedCount();
    const syncLog = await SyncModule.getSyncLog();
    const latestSync = syncLog.sort((a, b) => new Date(b.waktu) - new Date(a.waktu)).slice(0, 10);

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Sinkronisasi Server -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            <span>☁️</span> Sinkronisasi ke Server
          </h3>
          
          <div class="space-y-4">
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-600 mb-1">Status Koneksi</p>
                  <p class="font-bold" id="syncConnectionStatus">-</p>
                </div>
                <div>
                  <p class="text-gray-600 mb-1">Data Belum Sync</p>
                  <p class="font-bold text-amber-600">${unsyncedCount} record</p>
                </div>
                <div class="col-span-2">
                  <p class="text-gray-600 mb-1">Terakhir Sync</p>
                  <p class="font-bold">${lastSync ? UI.formatDateTime(lastSync) : 'Belum pernah'}</p>
                </div>
              </div>
            </div>
            
            <button onclick="BackupModule.syncNow()" 
              class="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold"
              ${unsyncedCount === 0 ? 'disabled' : ''}>
              🔄 Sinkronkan Sekarang
            </button>
            
            <p class="text-xs text-gray-500">
              💡 Tip: Sinkronisasi otomatis dapat diaktifkan di menu Pengaturan
            </p>
          </div>
        </div>

        <!-- Backup Manual -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            <span>💾</span> Backup Manual (JSON)
          </h3>
          
          <div class="space-y-4">
            <div class="p-4 bg-blue-50 rounded-lg">
              <p class="text-sm text-gray-700 mb-2">
                Backup file JSON dapat disimpan sebagai cadangan offline. 
                File ini berisi semua data perpustakaan.
              </p>
            </div>
            
            <button onclick="BackupModule.exportJSON()" 
              class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold">
              📥 Ekspor Semua Data (JSON)
            </button>
            
            <button onclick="document.getElementById('importFile').click()" 
              class="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 font-semibold">
              📤 Impor dari File JSON
            </button>
            <input type="file" id="importFile" accept=".json" class="hidden" onchange="BackupModule.importJSON(event)">
            
            <p class="text-xs text-red-600">
              ⚠️ Impor data akan menimpa data lokal yang ada. Backup terlebih dahulu!
            </p>
          </div>
        </div>
      </div>

      <!-- Backup Bulanan -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          <span>📅</span> Backup Transaksi Bulanan
        </h3>
        
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium mb-2">Pilih Bulan & Tahun</label>
            <input type="month" id="backupMonth" class="w-full border p-3 rounded-lg">
          </div>
          
          <button onclick="BackupModule.exportMonthly()" 
            class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
            📊 Ekspor Transaksi Bulan Ini
          </button>
        </div>
        
        <p class="text-sm text-gray-600 mt-4">
          Export transaksi peminjaman dalam periode tertentu untuk arsip bulanan.
        </p>
      </div>

      <!-- Log Sinkronisasi -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold mb-4">Log Sinkronisasi Terakhir</h3>
        
        ${latestSync.length > 0 ? `
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="p-2 text-left">Waktu</th>
                  <th class="p-2 text-left">Arah</th>
                  <th class="p-2 text-left">Jumlah</th>
                  <th class="p-2 text-left">Status</th>
                  <th class="p-2 text-left">Pesan</th>
                </tr>
              </thead>
              <tbody>
                ${latestSync.map(log => `
                  <tr class="border-b hover:bg-gray-50">
                    <td class="p-2">${UI.formatDateTime(log.waktu)}</td>
                    <td class="p-2">
                      <span class="px-2 py-1 rounded text-xs ${log.arah === 'push' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                        ${log.arah}
                      </span>
                    </td>
                    <td class="p-2">${log.jumlah_data} record</td>
                    <td class="p-2">
                      <span class="px-2 py-1 rounded text-xs ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${log.status}
                      </span>
                    </td>
                    <td class="p-2 text-xs">${UI.escapeHtml(log.pesan)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="text-center text-gray-500 py-8">Belum ada log sinkronisasi</p>'}
      </div>
    `;

    // Set default month to current
    const now = new Date();
    document.getElementById('backupMonth').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Update connection status
    this.updateConnectionStatus();
  },

  async updateConnectionStatus() {
    const statusEl = document.getElementById('syncConnectionStatus');
    if (!statusEl) return;

    if (!navigator.onLine) {
      statusEl.innerHTML = '<span class="text-red-600">❌ Offline</span>';
      return;
    }

    const apiUrl = await getSetting('api_url');
    if (!apiUrl) {
      statusEl.innerHTML = '<span class="text-gray-600">⚙️ Belum dikonfigurasi</span>';
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/ping.php`, { 
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        statusEl.innerHTML = '<span class="text-green-600">✅ Terhubung</span>';
      } else {
        statusEl.innerHTML = '<span class="text-red-600">❌ Server Error</span>';
      }
    } catch (e) {
      statusEl.innerHTML = '<span class="text-red-600">❌ Tidak Terjangkau</span>';
    }
  },

  async syncNow() {
    await SyncModule.sync();
    await this.render();
  },

  async exportJSON() {
    try {
      UI.showLoading('Menyiapkan backup...');
      
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `baitul-hikmah-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      UI.hideLoading();
      UI.showToast('Backup berhasil diunduh', 'success');
      
    } catch (error) {
      UI.hideLoading();
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  async importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate structure
        if (!data.buku || !data.anggota || !data.peminjaman) {
          UI.showToast('Format file tidak valid!', 'error');
          return;
        }

        // Show preview
        const message = `
          Impor data dari backup?<br><br>
          <strong>Data yang akan diimpor:</strong><br>
          • ${data.buku.length} buku<br>
          • ${data.anggota.length} anggota<br>
          • ${data.peminjaman.length} peminjaman<br>
          • ${data.kategori?.length || 0} kategori<br><br>
          <span class="text-red-600">⚠️ Data lokal akan digabungkan dengan data impor</span>
        `;

        UI.showConfirm(message, async () => {
          try {
            UI.showLoading('Mengimpor data...');
            
            await importData(data, 'merge');
            
            UI.hideLoading();
            UI.showToast('Data berhasil diimpor', 'success');
            
            // Reload current page
            if (app.currentPage === 'backup') {
              await this.render();
            }
            
          } catch (error) {
            UI.hideLoading();
            UI.showToast('Error impor: ' + error.message, 'error');
          }
        });

      } catch (error) {
        UI.showToast('Error membaca file: ' + error.message, 'error');
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  },

  async exportMonthly() {
    const monthInput = document.getElementById('backupMonth').value;
    if (!monthInput) {
      UI.showToast('Pilih bulan terlebih dahulu', 'error');
      return;
    }

    try {
      UI.showLoading('Menyiapkan backup bulanan...');

      const [year, month] = monthInput.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const peminjaman = await getAllRecords('peminjaman');
      const anggota = await getAllRecords('anggota');
      const buku = await getAllRecords('buku');
      const petugas = await getAllRecords('petugas');

      // Filter by month
      const filtered = peminjaman.filter(p => {
        const tglPinjam = new Date(p.tanggal_pinjam);
        return tglPinjam >= startDate && tglPinjam <= endDate;
      });

      // Prepare report
      const report = {
        periode: monthInput,
        tanggal_export: new Date().toISOString(),
        statistik: {
          total_transaksi: filtered.length,
          dipinjam: filtered.filter(p => p.status === 'Dipinjam').length,
          selesai: filtered.filter(p => p.status === 'Selesai').length,
          total_denda: filtered.reduce((sum, p) => sum + (p.denda || 0), 0)
        },
        transaksi: filtered.map(p => {
          const anggotaData = anggota.find(a => a.id === p.anggota_id);
          const bukuData = buku.find(b => b.id === p.buku_id);
          const petugasData = petugas.find(pt => pt.id === p.petugas_id);

          return {
            kode_transaksi: p.kode_transaksi,
            tanggal_pinjam: p.tanggal_pinjam,
            tanggal_jatuh_tempo: p.tanggal_jatuh_tempo,
            tanggal_kembali: p.tanggal_kembali,
            status: p.status,
            anggota: {
              nomor: anggotaData?.nomor_anggota,
              nama: anggotaData?.nama,
              jenis: anggotaData?.jenis
            },
            buku: {
              kode: bukuData?.kode_buku,
              judul: bukuData?.judul,
              pengarang: bukuData?.pengarang
            },
            petugas: petugasData?.nama,
            denda: p.denda || 0,
            catatan: p.catatan
          };
        })
      };

      const json = JSON.stringify(report, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `baitul-hikmah-transaksi-${monthInput}.json`;
      a.click();

      URL.revokeObjectURL(url);

      UI.hideLoading();
      UI.showToast(`Backup transaksi ${monthInput} berhasil diunduh (${filtered.length} transaksi)`, 'success');

    } catch (error) {
      UI.hideLoading();
      UI.showToast('Error: ' + error.message, 'error');
    }
  }
};
