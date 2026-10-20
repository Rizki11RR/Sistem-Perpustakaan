// Modul Sirkulasi - Peminjaman dan Pengembalian
window.SirkulasiModule = {
  async init() {
    await this.render();
  },

  async render() {
    const container = document.getElementById('sirkulasiPage');
    
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Form Peminjaman -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📤</span> Form Peminjaman Buku
          </h3>
          
          <form id="formPinjam" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Pilih Anggota *</label>
              <div class="relative">
                <input type="text" id="searchAnggotaPinjam" placeholder="🔍 Ketik nama/nomor anggota..." 
                  class="w-full border p-3 rounded-lg" autocomplete="off">
                <div id="anggotaSuggestions" class="hidden absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-auto"></div>
              </div>
              <input type="hidden" id="selectedAnggotaId">
              <div id="selectedAnggotaInfo" class="hidden mt-2 p-3 bg-emerald-50 rounded-lg"></div>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Pilih Buku *</label>
              <div class="relative">
                <input type="text" id="searchBukuPinjam" placeholder="🔍 Ketik judul/kode/scan barcode..." 
                  class="w-full border p-3 rounded-lg" autocomplete="off">
                <div id="bukuSuggestions" class="hidden absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-auto"></div>
              </div>
              <input type="hidden" id="selectedBukuId">
              <div id="selectedBukuInfo" class="hidden mt-2 p-3 bg-blue-50 rounded-lg"></div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Tanggal Pinjam *</label>
                <input type="date" id="tglPinjam" required class="w-full border p-3 rounded-lg">
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Jatuh Tempo *</label>
                <input type="date" id="tglJatuhTempo" required class="w-full border p-3 rounded-lg">
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Catatan</label>
              <textarea id="catatanPinjam" rows="2" class="w-full border p-3 rounded-lg" placeholder="Catatan tambahan (opsional)"></textarea>
            </div>
            
            <button type="submit" class="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold">
              ✅ Proses Peminjaman
            </button>
          </form>
        </div>
        
        <!-- Status Peminjaman Aktif -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <span>📋</span> Peminjaman Aktif
            </h3>
            <button onclick="SirkulasiModule.showRiwayat()" class="text-sm text-blue-600 hover:underline">
              Lihat Riwayat
            </button>
          </div>
          
          <div class="mb-4">
            <input type="text" id="searchPeminjaman" placeholder="🔍 Cari anggota/buku..." 
              class="w-full border p-3 rounded-lg">
          </div>
          
          <div id="peminjamanAktifList" class="space-y-3 max-h-[600px] overflow-auto"></div>
        </div>
      </div>
      
      <!-- Peminjaman Terlambat -->
      <div class="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          <span>⚠️</span> Peminjaman Terlambat
        </h3>
        <div id="peminjamanTerlambatList"></div>
      </div>
    `;
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tglPinjam').value = today;
    
    // Calculate default jatuh tempo
    const lamaPinjam = await getSetting('lama_pinjam_hari', 7);
    const jatuhTempo = new Date();
    jatuhTempo.setDate(jatuhTempo.getDate() + lamaPinjam);
    document.getElementById('tglJatuhTempo').value = jatuhTempo.toISOString().split('T')[0];
    
    // Setup autocomplete
    this.setupAnggotaAutocomplete();
    this.setupBukuAutocomplete();
    
    // Setup form
    document.getElementById('formPinjam').onsubmit = (e) => this.handlePinjam(e);
    
    // Auto-update jatuh tempo when tglPinjam changes
    document.getElementById('tglPinjam').addEventListener('change', async (e) => {
      const lamaPinjam = await getSetting('lama_pinjam_hari', 7);
      const tglPinjam = new Date(e.target.value);
      tglPinjam.setDate(tglPinjam.getDate() + lamaPinjam);
      document.getElementById('tglJatuhTempo').value = tglPinjam.toISOString().split('T')[0];
    });
    
    // Setup search
    document.getElementById('searchPeminjaman').oninput = (e) => this.renderAktif(e.target.value);
    
    // Initial render
    await this.renderAktif();
    await this.renderTerlambat();
    
    // Auto-refresh every 30s
    this.refreshInterval = setInterval(() => {
      this.renderAktif();
      this.renderTerlambat();
    }, 30000);
  },

  async setupAnggotaAutocomplete() {
    const input = document.getElementById('searchAnggotaPinjam');
    const suggestions = document.getElementById('anggotaSuggestions');
    
    input.addEventListener('input', async (e) => {
      const term = e.target.value.trim();
      
      if (term.length < 2) {
        suggestions.classList.add('hidden');
        return;
      }
      
      const anggota = await getAllRecords('anggota');
      const filtered = anggota
        .filter(a => a.status === 'aktif')
        .filter(a => 
          a.nama.toLowerCase().includes(term.toLowerCase()) ||
          a.nomor_anggota.toLowerCase().includes(term.toLowerCase())
        )
        .slice(0, 10);
      
      if (filtered.length === 0) {
        suggestions.innerHTML = '<div class="p-3 text-gray-500 text-sm">Anggota tidak ditemukan</div>';
        suggestions.classList.remove('hidden');
        return;
      }
      
      suggestions.innerHTML = filtered.map(a => `
        <div class="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onclick="SirkulasiModule.selectAnggota('${a.id}')">
          <p class="font-medium">${UI.escapeHtml(a.nama)}</p>
          <p class="text-xs text-gray-600">${UI.escapeHtml(a.nomor_anggota)} • ${a.jenis} ${a.kelas ? '• Kelas ' + a.kelas : ''}</p>
        </div>
      `).join('');
      
      suggestions.classList.remove('hidden');
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.classList.add('hidden');
      }
    });
  },

  async setupBukuAutocomplete() {
    const input = document.getElementById('searchBukuPinjam');
    const suggestions = document.getElementById('bukuSuggestions');
    
    input.addEventListener('input', async (e) => {
      const term = e.target.value.trim();
      
      if (term.length < 2) {
        suggestions.classList.add('hidden');
        return;
      }
      
      const buku = await getAllRecords('buku');
      const filtered = buku
        .filter(b => (b.stok_tersedia || 0) > 0)
        .filter(b => 
          b.judul.toLowerCase().includes(term.toLowerCase()) ||
          b.kode_buku.toLowerCase().includes(term.toLowerCase()) ||
          b.pengarang.toLowerCase().includes(term.toLowerCase())
        )
        .slice(0, 10);
      
      if (filtered.length === 0) {
        suggestions.innerHTML = '<div class="p-3 text-gray-500 text-sm">Buku tidak ditemukan atau stok habis</div>';
        suggestions.classList.remove('hidden');
        return;
      }
      
      suggestions.innerHTML = filtered.map(b => `
        <div class="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onclick="SirkulasiModule.selectBuku('${b.id}')">
          <p class="font-medium">${UI.escapeHtml(b.judul)}</p>
          <p class="text-xs text-gray-600">${UI.escapeHtml(b.kode_buku)} • ${UI.escapeHtml(b.pengarang)} • Stok: ${b.stok_tersedia}</p>
        </div>
      `).join('');
      
      suggestions.classList.remove('hidden');
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.classList.add('hidden');
      }
    });
  },

  async selectAnggota(id) {
    const anggota = await getRecord('anggota', id);
    if (!anggota) return;
    
    // Check max books
    const peminjaman = await getAllRecords('peminjaman');
    const activeCount = peminjaman.filter(p => p.anggota_id === id && p.status === 'Dipinjam').length;
    const maxBuku = await getSetting('maks_buku_per_anggota', 2);
    
    document.getElementById('selectedAnggotaId').value = id;
    document.getElementById('searchAnggotaPinjam').value = anggota.nama;
    document.getElementById('anggotaSuggestions').classList.add('hidden');
    
    const infoDiv = document.getElementById('selectedAnggotaInfo');
    infoDiv.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <p class="font-medium">${UI.escapeHtml(anggota.nama)}</p>
          <p class="text-xs text-gray-600">${UI.escapeHtml(anggota.nomor_anggota)} • ${anggota.jenis}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-600">Peminjaman aktif:</p>
          <p class="font-bold ${activeCount >= maxBuku ? 'text-red-600' : 'text-emerald-600'}">${activeCount}/${maxBuku}</p>
        </div>
      </div>
      ${activeCount >= maxBuku ? '<p class="text-xs text-red-600 mt-2">⚠️ Sudah mencapai batas maksimal peminjaman</p>' : ''}
    `;
    infoDiv.classList.remove('hidden');
    
    // Show alert if max reached
    if (activeCount >= maxBuku) {
      UI.showToast(`⚠️ Anggota sudah meminjam ${activeCount} buku (maksimal ${maxBuku})`, 'error');
    }
  },

  async selectBuku(id) {
    const buku = await getRecord('buku', id);
    if (!buku) return;
    
    document.getElementById('selectedBukuId').value = id;
    document.getElementById('searchBukuPinjam').value = buku.judul;
    document.getElementById('bukuSuggestions').classList.add('hidden');
    
    const infoDiv = document.getElementById('selectedBukuInfo');
    infoDiv.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <p class="font-medium">${UI.escapeHtml(buku.judul)}</p>
          <p class="text-xs text-gray-600">${UI.escapeHtml(buku.kode_buku)} • ${UI.escapeHtml(buku.pengarang)}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-600">Stok tersedia:</p>
          <p class="font-bold text-blue-600">${buku.stok_tersedia}/${buku.jumlah_total}</p>
        </div>
      </div>
    `;
    infoDiv.classList.remove('hidden');
  },

  async handlePinjam(e) {
    e.preventDefault();
    
    const anggotaId = document.getElementById('selectedAnggotaId').value;
    const bukuId = document.getElementById('selectedBukuId').value;
    
    if (!anggotaId) {
      UI.showToast('Pilih anggota terlebih dahulu', 'error');
      return;
    }
    
    if (!bukuId) {
      UI.showToast('Pilih buku terlebih dahulu', 'error');
      return;
    }
    
    // Check max books
    const peminjaman = await getAllRecords('peminjaman');
    const activeCount = peminjaman.filter(p => p.anggota_id === anggotaId && p.status === 'Dipinjam').length;
    const maxBuku = await getSetting('maks_buku_per_anggota', 2);
    
    if (activeCount >= maxBuku) {
      UI.showToast('Anggota sudah mencapai batas maksimal peminjaman', 'error');
      return;
    }
    
    // Check stock
    const buku = await getRecord('buku', bukuId);
    if ((buku.stok_tersedia || 0) < 1) {
      UI.showToast('Stok buku tidak tersedia', 'error');
      return;
    }
    
    try {
      UI.showLoading('Memproses peminjaman...');
      
      // Generate kode transaksi
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const lastTrx = peminjaman
        .filter(p => p.kode_transaksi.startsWith('TRX-' + dateStr))
        .length;
      const kodeTransaksi = `TRX-${dateStr}-${String(lastTrx + 1).padStart(4, '0')}`;
      
      // Create peminjaman
      const data = {
        kode_transaksi: kodeTransaksi,
        anggota_id: anggotaId,
        buku_id: bukuId,
        tanggal_pinjam: document.getElementById('tglPinjam').value,
        tanggal_jatuh_tempo: document.getElementById('tglJatuhTempo').value,
        tanggal_kembali: null,
        status: 'Dipinjam',
        petugas_id: currentUser.id,
        catatan: document.getElementById('catatanPinjam').value.trim(),
        denda: 0
      };
      
      await addRecord('peminjaman', data);
      
      // Update stok
      await updateRecord('buku', bukuId, {
        stok_tersedia: buku.stok_tersedia - 1
      });
      
      UI.hideLoading();
      UI.showToast('Peminjaman berhasil diproses', 'success');
      
      // Reset form
      this.resetFormPinjam();
      
      // Refresh lists
      await this.renderAktif();
      await this.renderTerlambat();
      
    } catch (error) {
      UI.hideLoading();
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  resetFormPinjam() {
    document.getElementById('formPinjam').reset();
    document.getElementById('selectedAnggotaId').value = '';
    document.getElementById('selectedBukuId').value = '';
    document.getElementById('selectedAnggotaInfo').classList.add('hidden');
    document.getElementById('selectedBukuInfo').classList.add('hidden');
    
    // Reset dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tglPinjam').value = today;
    
    getSetting('lama_pinjam_hari', 7).then(lamaPinjam => {
      const jatuhTempo = new Date();
      jatuhTempo.setDate(jatuhTempo.getDate() + lamaPinjam);
      document.getElementById('tglJatuhTempo').value = jatuhTempo.toISOString().split('T')[0];
    });
  },

  async renderAktif(searchTerm = '') {
    const container = document.getElementById('peminjamanAktifList');
    let peminjaman = await getAllRecords('peminjaman');
    const anggota = await getAllRecords('anggota');
    const buku = await getAllRecords('buku');
    
    // Filter aktif
    peminjaman = peminjaman.filter(p => p.status === 'Dipinjam');
    
    // Search
    if (searchTerm) {
      peminjaman = peminjaman.filter(p => {
        const anggotaData = anggota.find(a => a.id === p.anggota_id);
        const bukuData = buku.find(b => b.id === p.buku_id);
        return (
          anggotaData?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bukuData?.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.kode_transaksi.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    // Sort by date
    peminjaman.sort((a, b) => new Date(b.tanggal_pinjam) - new Date(a.tanggal_pinjam));
    
    if (peminjaman.length === 0) {
      container.innerHTML = UI.renderEmptyState('Tidak ada peminjaman aktif', '📭');
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    container.innerHTML = peminjaman.map(p => {
      const anggotaData = anggota.find(a => a.id === p.anggota_id);
      const bukuData = buku.find(b => b.id === p.buku_id);
      const jatuhTempo = new Date(p.tanggal_jatuh_tempo);
      jatuhTempo.setHours(0, 0, 0, 0);
      const isLate = today > jatuhTempo;
      const daysLate = isLate ? Math.floor((today - jatuhTempo) / (1000 * 60 * 60 * 24)) : 0;
      
      return `
        <div class="border rounded-lg p-4 ${isLate ? 'border-red-300 bg-red-50' : 'border-gray-200'}">
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
              <p class="font-mono text-xs text-gray-500">${UI.escapeHtml(p.kode_transaksi)}</p>
              <p class="font-semibold">${UI.escapeHtml(anggotaData?.nama || '-')}</p>
              <p class="text-sm text-gray-600">${UI.escapeHtml(bukuData?.judul || '-')}</p>
            </div>
            ${isLate ? `<span class="px-2 py-1 bg-red-600 text-white text-xs rounded-full">Terlambat ${daysLate} hari</span>` : ''}
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-xs mb-3">
            <div>
              <p class="text-gray-600">Tgl Pinjam</p>
              <p class="font-medium">${UI.formatDate(p.tanggal_pinjam)}</p>
            </div>
            <div>
              <p class="text-gray-600">Jatuh Tempo</p>
              <p class="font-medium ${isLate ? 'text-red-600' : ''}">${UI.formatDate(p.tanggal_jatuh_tempo)}</p>
            </div>
          </div>
          
          <button onclick="SirkulasiModule.kembali('${p.id}')" 
            class="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium">
            ✅ Kembalikan Buku
          </button>
        </div>
      `;
    }).join('');
  },

  async renderTerlambat() {
    const container = document.getElementById('peminjamanTerlambatList');
    let peminjaman = await getAllRecords('peminjaman');
    const anggota = await getAllRecords('anggota');
    const buku = await getAllRecords('buku');
    
    // Filter late
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    peminjaman = peminjaman.filter(p => {
      if (p.status !== 'Dipinjam') return false;
      const jatuhTempo = new Date(p.tanggal_jatuh_tempo);
      jatuhTempo.setHours(0, 0, 0, 0);
      return today > jatuhTempo;
    });
    
    // Sort by most late
    peminjaman.sort((a, b) => new Date(a.tanggal_jatuh_tempo) - new Date(b.tanggal_jatuh_tempo));
    
    if (peminjaman.length === 0) {
      container.innerHTML = `<p class="text-center text-gray-500 py-8">✅ Tidak ada peminjaman yang terlambat</p>`;
      return;
    }
    
    const dendaPerHari = await getSetting('denda_per_hari', 0);
    
    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-red-100">
            <tr>
              <th class="p-3 text-left">Anggota</th>
              <th class="p-3 text-left">Buku</th>
              <th class="p-3 text-left">Jatuh Tempo</th>
              <th class="p-3 text-left">Terlambat</th>
              ${dendaPerHari > 0 ? '<th class="p-3 text-left">Denda</th>' : ''}
              <th class="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${peminjaman.map(p => {
              const anggotaData = anggota.find(a => a.id === p.anggota_id);
              const bukuData = buku.find(b => b.id === p.buku_id);
              const jatuhTempo = new Date(p.tanggal_jatuh_tempo);
              jatuhTempo.setHours(0, 0, 0, 0);
              const daysLate = Math.floor((today - jatuhTempo) / (1000 * 60 * 60 * 24));
              const denda = dendaPerHari * daysLate;
              
              return `
                <tr class="border-b hover:bg-red-50">
                  <td class="p-3">
                    <p class="font-medium">${UI.escapeHtml(anggotaData?.nama || '-')}</p>
                    <p class="text-xs text-gray-600">${UI.escapeHtml(anggotaData?.nomor_anggota || '-')}</p>
                  </td>
                  <td class="p-3">
                    <p class="font-medium text-sm">${UI.escapeHtml(bukuData?.judul || '-')}</p>
                  </td>
                  <td class="p-3 text-sm">${UI.formatDate(p.tanggal_jatuh_tempo)}</td>
                  <td class="p-3">
                    <span class="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-bold">
                      ${daysLate} hari
                    </span>
                  </td>
                  ${dendaPerHari > 0 ? `<td class="p-3 font-bold text-red-600">Rp ${denda.toLocaleString('id-ID')}</td>` : ''}
                  <td class="p-3">
                    <button onclick="SirkulasiModule.kembali('${p.id}')" 
                      class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
                      Kembalikan
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async kembali(id) {
    const peminjaman = await getRecord('peminjaman', id);
    const anggota = await getRecord('anggota', peminjaman.anggota_id);
    const buku = await getRecord('buku', peminjaman.buku_id);
    
    // Calculate denda
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jatuhTempo = new Date(peminjaman.tanggal_jatuh_tempo);
    jatuhTempo.setHours(0, 0, 0, 0);
    const daysLate = Math.max(0, Math.floor((today - jatuhTempo) / (1000 * 60 * 60 * 24)));
    const dendaPerHari = await getSetting('denda_per_hari', 0);
    const totalDenda = dendaPerHari * daysLate;
    
    const message = `
      Kembalikan buku:<br>
      <strong>${buku.judul}</strong><br>
      Peminjam: <strong>${anggota.nama}</strong><br>
      ${daysLate > 0 ? `<span class="text-red-600">Terlambat ${daysLate} hari</span><br>` : ''}
      ${totalDenda > 0 ? `<span class="text-red-600">Denda: Rp ${totalDenda.toLocaleString('id-ID')}</span>` : ''}
    `;
    
    UI.showConfirm(message, async () => {
      try {
        UI.showLoading('Memproses pengembalian...');
        
        // Update peminjaman
        await updateRecord('peminjaman', id, {
          tanggal_kembali: new Date().toISOString().split('T')[0],
          status: 'Selesai',
          denda: totalDenda
        });
        
        // Update stok
        await updateRecord('buku', buku.id, {
          stok_tersedia: buku.stok_tersedia + 1
        });
        
        UI.hideLoading();
        UI.showToast('Buku berhasil dikembalikan', 'success');
        
        // Refresh
        await this.renderAktif();
        await this.renderTerlambat();
        
      } catch (error) {
        UI.hideLoading();
        UI.showToast('Error: ' + error.message, 'error');
      }
    });
  },

  async showRiwayat() {
    const peminjaman = await getAllRecords('peminjaman', { includeDeleted: false });
    const anggota = await getAllRecords('anggota');
    const buku = await getAllRecords('buku');
    
    const riwayat = peminjaman
      .filter(p => p.status === 'Selesai')
      .sort((a, b) => new Date(b.tanggal_kembali) - new Date(a.tanggal_kembali))
      .slice(0, 50);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Riwayat Peminjaman (50 Terakhir)</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="p-2 text-left">Kode</th>
                <th class="p-2 text-left">Anggota</th>
                <th class="p-2 text-left">Buku</th>
                <th class="p-2 text-left">Pinjam</th>
                <th class="p-2 text-left">Kembali</th>
                <th class="p-2 text-left">Denda</th>
              </tr>
            </thead>
            <tbody>
              ${riwayat.map(p => {
                const anggotaData = anggota.find(a => a.id === p.anggota_id);
                const bukuData = buku.find(b => b.id === p.buku_id);
                
                return `
                  <tr class="border-b hover:bg-gray-50">
                    <td class="p-2 font-mono text-xs">${UI.escapeHtml(p.kode_transaksi)}</td>
                    <td class="p-2">${UI.escapeHtml(anggotaData?.nama || '-')}</td>
                    <td class="p-2">${UI.escapeHtml(bukuData?.judul || '-')}</td>
                    <td class="p-2">${UI.formatDate(p.tanggal_pinjam)}</td>
                    <td class="p-2">${UI.formatDate(p.tanggal_kembali)}</td>
                    <td class="p-2 ${p.denda > 0 ? 'text-red-600 font-bold' : ''}">
                      ${p.denda > 0 ? 'Rp ' + p.denda.toLocaleString('id-ID') : '-'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
};
