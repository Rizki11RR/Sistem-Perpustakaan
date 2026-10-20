// Modul Buku - Katalog lengkap dengan barcode
window.BukuModule = {
  currentPage: 1,
  perPage: 20,
  searchTerm: '',
  filterKategori: '',
  selectedBooks: new Set(),

  async init() {
    await this.render();
  },

  async render() {
    const container = document.getElementById('bukuPage');
    const kategoriList = await getAllRecords('kategori');
    const buku = await getAllRecords('buku');
    
    // Generate next kode_buku
    const lastCode = buku.length > 0 
      ? Math.max(...buku.map(b => {
          const match = b.kode_buku.match(/BH-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }))
      : 0;
    const nextCode = `BH-${String(lastCode + 1).padStart(4, '0')}`;
    
    container.innerHTML = `
      <!-- Form Tambah/Edit -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 class="text-lg font-bold mb-4">Form Buku</h3>
        <form id="formBuku" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input type="hidden" id="bukuId">
          
          <div>
            <label class="block text-sm font-medium mb-2">Kode Buku *</label>
            <input type="text" id="bukuKode" value="${nextCode}" required class="w-full border p-3 rounded-lg">
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Judul Buku *</label>
            <input type="text" id="bukuJudul" required class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Pengarang *</label>
            <input type="text" id="bukuPengarang" required class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Penerbit</label>
            <input type="text" id="bukuPenerbit" class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Tahun Terbit</label>
            <input type="text" id="bukuTahun" maxlength="4" class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">ISBN</label>
            <input type="text" id="bukuISBN" class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Kategori *</label>
            <select id="bukuKategori" required class="w-full border p-3 rounded-lg">
              <option value="">Pilih Kategori</option>
              ${kategoriList.map(k => `<option value="${k.nama}">${k.nama}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Rak/Lokasi</label>
            <input type="text" id="bukuRak" class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Jumlah Eksemplar *</label>
            <input type="number" id="bukuJumlah" value="1" min="1" required class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Sumber Perolehan</label>
            <select id="bukuSumber" class="w-full border p-3 rounded-lg">
              <option value="">-</option>
              <option value="Pembelian">Pembelian</option>
              <option value="Hibah">Hibah</option>
              <option value="Sumbangan">Sumbangan</option>
            </select>
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Keterangan</label>
            <textarea id="bukuKeterangan" rows="2" class="w-full border p-3 rounded-lg"></textarea>
          </div>
          
          <div class="md:col-span-3 flex gap-3">
            <button type="submit" class="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold">
              💾 Simpan
            </button>
            <button type="button" onclick="BukuModule.resetForm()" class="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400 font-semibold">
              ↺ Reset
            </button>
          </div>
        </form>
      </div>
      
      <!-- Daftar Buku -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <div class="flex-1">
            <input type="text" id="searchBuku" placeholder="🔍 Cari judul, pengarang, kode, ISBN..." 
              class="w-full border p-3 rounded-lg" value="${this.searchTerm}">
          </div>
          
          <select id="filterKategoriBuku" class="border p-3 rounded-lg">
            <option value="">Semua Kategori</option>
            ${kategoriList.map(k => `<option value="${k.nama}" ${this.filterKategori === k.nama ? 'selected' : ''}>${k.nama}</option>`).join('')}
          </select>
          
          <button onclick="BukuModule.showBarcodeModal()" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap">
            🏷️ Cetak Barcode
          </button>
        </div>
        
        <div id="bukuList"></div>
      </div>
    `;
    
    // Setup form
    document.getElementById('formBuku').onsubmit = (e) => this.handleSubmit(e);
    document.getElementById('searchBuku').oninput = (e) => this.handleSearch(e);
    document.getElementById('filterKategoriBuku').onchange = (e) => this.handleFilter(e);
    
    await this.renderList();
  },

  async renderList() {
    const container = document.getElementById('bukuList');
    let buku = await getAllRecords('buku');
    
    // Apply search
    if (this.searchTerm) {
      buku = UI.filterData(buku, this.searchTerm, ['judul', 'pengarang', 'kode_buku', 'isbn']);
    }
    
    // Apply filter
    if (this.filterKategori) {
      buku = buku.filter(b => b.kategori === this.filterKategori);
    }
    
    // Sort by kode
    buku.sort((a, b) => a.kode_buku.localeCompare(b.kode_buku));
    
    // Paginate
    const paginated = UI.paginate(buku, this.currentPage, this.perPage);
    
    if (paginated.items.length === 0) {
      container.innerHTML = UI.renderEmptyState('Tidak ada data buku', '📚');
      return;
    }
    
    // Desktop view
    const desktopView = `
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-3 text-left">
                <input type="checkbox" onchange="BukuModule.toggleSelectAll(this)" class="w-4 h-4">
              </th>
              <th class="p-3 text-left">Kode</th>
              <th class="p-3 text-left">Judul</th>
              <th class="p-3 text-left">Pengarang</th>
              <th class="p-3 text-left">Kategori</th>
              <th class="p-3 text-left">Stok</th>
              <th class="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${paginated.items.map(b => `
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3">
                  <input type="checkbox" value="${b.id}" onchange="BukuModule.toggleSelect(this)" 
                    ${this.selectedBooks.has(b.id) ? 'checked' : ''} class="w-4 h-4">
                </td>
                <td class="p-3 font-mono text-sm">${UI.escapeHtml(b.kode_buku)}</td>
                <td class="p-3">
                  <p class="font-medium">${UI.escapeHtml(b.judul)}</p>
                  ${b.penerbit ? `<p class="text-xs text-gray-500">${UI.escapeHtml(b.penerbit)}, ${b.tahun_terbit || '-'}</p>` : ''}
                </td>
                <td class="p-3 text-sm">${UI.escapeHtml(b.pengarang)}</td>
                <td class="p-3">
                  <span class="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                    ${UI.escapeHtml(b.kategori)}
                  </span>
                </td>
                <td class="p-3 text-sm">${b.stok_tersedia || 0}/${b.jumlah_total || 1}</td>
                <td class="p-3">
                  <button onclick="BukuModule.edit('${b.id}')" class="text-blue-600 hover:underline mr-2">Edit</button>
                  <button onclick="BukuModule.hapus('${b.id}')" class="text-red-600 hover:underline">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // Mobile view (cards)
    const mobileView = `
      <div class="md:hidden space-y-4">
        ${paginated.items.map(b => `
          <div class="border rounded-lg p-4">
            <div class="flex items-start gap-3 mb-3">
              <input type="checkbox" value="${b.id}" onchange="BukuModule.toggleSelect(this)" 
                ${this.selectedBooks.has(b.id) ? 'checked' : ''} class="w-4 h-4 mt-1">
              <div class="flex-1">
                <p class="font-mono text-sm text-gray-600 mb-1">${UI.escapeHtml(b.kode_buku)}</p>
                <p class="font-semibold">${UI.escapeHtml(b.judul)}</p>
                <p class="text-sm text-gray-600">${UI.escapeHtml(b.pengarang)}</p>
                <div class="flex items-center gap-2 mt-2">
                  <span class="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                    ${UI.escapeHtml(b.kategori)}
                  </span>
                  <span class="text-sm text-gray-600">Stok: ${b.stok_tersedia || 0}/${b.jumlah_total || 1}</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick="BukuModule.edit('${b.id}')" class="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                Edit
              </button>
              <button onclick="BukuModule.hapus('${b.id}')" class="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                Hapus
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    container.innerHTML = desktopView + mobileView + UI.renderPagination(paginated, 'BukuModule.goToPage');
  },

  handleSearch(e) {
    this.searchTerm = e.target.value;
    this.currentPage = 1;
    this.renderList();
  },

  handleFilter(e) {
    this.filterKategori = e.target.value;
    this.currentPage = 1;
    this.renderList();
  },

  goToPage(page) {
    BukuModule.currentPage = page;
    BukuModule.renderList();
  },

  async handleSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('bukuId').value;
    const jumlah = parseInt(document.getElementById('bukuJumlah').value);
    
    const data = {
      kode_buku: document.getElementById('bukuKode').value.trim().toUpperCase(),
      judul: document.getElementById('bukuJudul').value.trim(),
      pengarang: document.getElementById('bukuPengarang').value.trim(),
      penerbit: document.getElementById('bukuPenerbit').value.trim(),
      tahun_terbit: document.getElementById('bukuTahun').value.trim(),
      isbn: document.getElementById('bukuISBN').value.trim(),
      kategori: document.getElementById('bukuKategori').value,
      rak_lokasi: document.getElementById('bukuRak').value.trim(),
      jumlah_total: jumlah,
      stok_tersedia: jumlah,
      sumber: document.getElementById('bukuSumber').value,
      keterangan: document.getElementById('bukuKeterangan').value.trim()
    };
    
    try {
      if (id) {
        // Update - preserve stok
        const existing = await getRecord('buku', id);
        data.stok_tersedia = existing.stok_tersedia + (jumlah - existing.jumlah_total);
        
        await updateRecord('buku', id, data);
        UI.showToast('Buku berhasil diupdate', 'success');
      } else {
        await addRecord('buku', data);
        UI.showToast('Buku berhasil ditambahkan', 'success');
      }
      
      this.resetForm();
      await this.render();
      
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  resetForm() {
    document.getElementById('formBuku').reset();
    document.getElementById('bukuId').value = '';
    
    // Generate next code
    getAllRecords('buku').then(buku => {
      const lastCode = buku.length > 0 
        ? Math.max(...buku.map(b => {
            const match = b.kode_buku.match(/BH-(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }))
        : 0;
      document.getElementById('bukuKode').value = `BH-${String(lastCode + 1).padStart(4, '0')}`;
    });
  },

  async edit(id) {
    const buku = await getRecord('buku', id);
    if (!buku) return;
    
    document.getElementById('bukuId').value = buku.id;
    document.getElementById('bukuKode').value = buku.kode_buku;
    document.getElementById('bukuJudul').value = buku.judul;
    document.getElementById('bukuPengarang').value = buku.pengarang;
    document.getElementById('bukuPenerbit').value = buku.penerbit || '';
    document.getElementById('bukuTahun').value = buku.tahun_terbit || '';
    document.getElementById('bukuISBN').value = buku.isbn || '';
    document.getElementById('bukuKategori').value = buku.kategori;
    document.getElementById('bukuRak').value = buku.rak_lokasi || '';
    document.getElementById('bukuJumlah').value = buku.jumlah_total || 1;
    document.getElementById('bukuSumber').value = buku.sumber || '';
    document.getElementById('bukuKeterangan').value = buku.keterangan || '';
    
    // Scroll to form
    document.getElementById('formBuku').scrollIntoView({ behavior: 'smooth' });
  },

  async hapus(id) {
    const buku = await getRecord('buku', id);
    
    // Check if borrowed
    const peminjaman = await getAllRecords('peminjaman');
    const borrowed = peminjaman.some(p => p.buku_id === id && p.status === 'Dipinjam');
    
    if (borrowed) {
      UI.showToast('Buku sedang dipinjam, tidak dapat dihapus', 'error');
      return;
    }
    
    UI.showConfirm(`Hapus buku "${buku.judul}"?`, async () => {
      try {
        await deleteRecord('buku', id);
        UI.showToast('Buku berhasil dihapus', 'success');
        this.renderList();
      } catch (error) {
        UI.showToast('Error: ' + error.message, 'error');
      }
    });
  },

  toggleSelect(checkbox) {
    if (checkbox.checked) {
      this.selectedBooks.add(checkbox.value);
    } else {
      this.selectedBooks.delete(checkbox.value);
    }
  },

  toggleSelectAll(checkbox) {
    if (checkbox.checked) {
      document.querySelectorAll('#bukuList input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        this.selectedBooks.add(cb.value);
      });
    } else {
      this.selectedBooks.clear();
      document.querySelectorAll('#bukuList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });
    }
  },

  async showBarcodeModal() {
    if (this.selectedBooks.size === 0) {
      UI.showToast('Pilih buku yang akan dicetak barcode', 'warning');
      return;
    }
    
    const selected = Array.from(this.selectedBooks);
    const books = await Promise.all(selected.map(id => getRecord('buku', id)));
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Cetak Barcode (${books.length} buku)</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div class="mb-4 flex gap-3">
          <button onclick="window.print()" class="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            🖨️ Print
          </button>
          <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400">
            Tutup
          </button>
        </div>
        
        <div class="print-area grid grid-cols-2 md:grid-cols-3 gap-4">
          ${books.map(b => `
            <div class="border-2 border-dashed border-gray-300 p-4 flex flex-col items-center text-center">
              <p class="text-xs font-semibold mb-2">Baitul Hikmah</p>
              <svg id="barcode-${b.id}"></svg>
              <p class="text-xs mt-2 font-medium line-clamp-2">${UI.escapeHtml(b.judul)}</p>
              <p class="text-xs text-gray-600">${UI.escapeHtml(b.kode_buku)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Generate barcodes
    books.forEach(b => {
      try {
        JsBarcode(`#barcode-${b.id}`, b.kode_buku, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: false
        });
      } catch (e) {
        console.error('Barcode error:', e);
      }
    });
  }
};
