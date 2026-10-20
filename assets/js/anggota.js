// Modul Anggota - Pendataan anggota perpustakaan
window.AnggotaModule = {
  currentPage: 1,
  perPage: 20,
  searchTerm: '',
  filterJenis: '',
  filterKelas: '',

  async init() {
    await this.render();
  },

  async render() {
    const container = document.getElementById('anggotaPage');
    const anggota = await getAllRecords('anggota');
    
    // Generate next nomor_anggota
    const lastNum = anggota.length > 0 
      ? Math.max(...anggota.map(a => {
          const match = a.nomor_anggota.match(/A-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }))
      : 0;
    const nextNum = `A-${String(lastNum + 1).padStart(5, '0')}`;
    
    container.innerHTML = `
      <!-- Form Tambah/Edit -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 class="text-lg font-bold mb-4">Form Anggota</h3>
        <form id="formAnggota" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input type="hidden" id="anggotaId">
          
          <div>
            <label class="block text-sm font-medium mb-2">Nomor Anggota *</label>
            <input type="text" id="anggotaNomor" value="${nextNum}" required class="w-full border p-3 rounded-lg">
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Nama Lengkap *</label>
            <input type="text" id="anggotaNama" required class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Jenis Anggota *</label>
            <select id="anggotaJenis" required class="w-full border p-3 rounded-lg" onchange="AnggotaModule.toggleKelas()">
              <option value="siswa">Siswa</option>
              <option value="guru">Guru</option>
              <option value="staf">Staf</option>
            </select>
          </div>
          
          <div id="kelasField">
            <label class="block text-sm font-medium mb-2">Kelas *</label>
            <select id="anggotaKelas" class="w-full border p-3 rounded-lg">
              <option value="">Pilih Kelas</option>
              <option value="1">Kelas 1</option>
              <option value="2">Kelas 2</option>
              <option value="3">Kelas 3</option>
              <option value="4">Kelas 4</option>
              <option value="5">Kelas 5</option>
              <option value="6">Kelas 6</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Jenis Kelamin *</label>
            <select id="anggotaJK" required class="w-full border p-3 rounded-lg">
              <option value="">Pilih</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Alamat</label>
            <textarea id="anggotaAlamat" rows="2" class="w-full border p-3 rounded-lg"></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">No. HP/WA</label>
            <input type="tel" id="anggotaHP" class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Tanggal Daftar *</label>
            <input type="date" id="anggotaTglDaftar" value="${new Date().toISOString().split('T')[0]}" required class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Status *</label>
            <select id="anggotaStatus" required class="w-full border p-3 rounded-lg">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
          
          <div class="md:col-span-3 flex gap-3">
            <button type="submit" class="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold">
              💾 Simpan
            </button>
            <button type="button" onclick="AnggotaModule.resetForm()" class="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400 font-semibold">
              ↺ Reset
            </button>
          </div>
        </form>
      </div>
      
      <!-- Daftar Anggota -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <div class="flex-1">
            <input type="text" id="searchAnggota" placeholder="🔍 Cari nama, nomor anggota..." 
              class="w-full border p-3 rounded-lg" value="${this.searchTerm}">
          </div>
          
          <select id="filterJenisAnggota" class="border p-3 rounded-lg">
            <option value="">Semua Jenis</option>
            <option value="siswa">Siswa</option>
            <option value="guru">Guru</option>
            <option value="staf">Staf</option>
          </select>
          
          <select id="filterKelasAnggota" class="border p-3 rounded-lg">
            <option value="">Semua Kelas</option>
            <option value="1">Kelas 1</option>
            <option value="2">Kelas 2</option>
            <option value="3">Kelas 3</option>
            <option value="4">Kelas 4</option>
            <option value="5">Kelas 5</option>
            <option value="6">Kelas 6</option>
          </select>
        </div>
        
        <div id="anggotaList"></div>
      </div>
    `;
    
    // Setup form
    document.getElementById('formAnggota').onsubmit = (e) => this.handleSubmit(e);
    document.getElementById('searchAnggota').oninput = (e) => this.handleSearch(e);
    document.getElementById('filterJenisAnggota').onchange = (e) => {
      this.filterJenis = e.target.value;
      this.currentPage = 1;
      this.renderList();
    };
    document.getElementById('filterKelasAnggota').onchange = (e) => {
      this.filterKelas = e.target.value;
      this.currentPage = 1;
      this.renderList();
    };
    
    await this.renderList();
  },

  async renderList() {
    const container = document.getElementById('anggotaList');
    let anggota = await getAllRecords('anggota');
    
    // Apply search
    if (this.searchTerm) {
      anggota = UI.filterData(anggota, this.searchTerm, ['nama', 'nomor_anggota']);
    }
    
    // Apply filters
    if (this.filterJenis) {
      anggota = anggota.filter(a => a.jenis === this.filterJenis);
    }
    if (this.filterKelas) {
      anggota = anggota.filter(a => a.kelas === this.filterKelas);
    }
    
    // Sort by nomor
    anggota.sort((a, b) => a.nomor_anggota.localeCompare(b.nomor_anggota));
    
    // Paginate
    const paginated = UI.paginate(anggota, this.currentPage, this.perPage);
    
    if (paginated.items.length === 0) {
      container.innerHTML = UI.renderEmptyState('Tidak ada data anggota', '👥');
      return;
    }
    
    // Desktop view
    const desktopView = `
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-3 text-left">Nomor</th>
              <th class="p-3 text-left">Nama</th>
              <th class="p-3 text-left">Jenis</th>
              <th class="p-3 text-left">Kelas</th>
              <th class="p-3 text-left">Kontak</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${paginated.items.map(a => `
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3 font-mono text-sm">${UI.escapeHtml(a.nomor_anggota)}</td>
                <td class="p-3">
                  <p class="font-medium">${UI.escapeHtml(a.nama)}</p>
                  <p class="text-xs text-gray-500">${a.jenis_kelamin === 'L' ? '👨' : '👩'} ${a.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                </td>
                <td class="p-3">
                  <span class="px-2 py-1 text-xs rounded-full ${
                    a.jenis === 'siswa' ? 'bg-blue-100 text-blue-800' :
                    a.jenis === 'guru' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }">
                    ${a.jenis.charAt(0).toUpperCase() + a.jenis.slice(1)}
                  </span>
                </td>
                <td class="p-3 text-sm">${a.kelas ? 'Kelas ' + a.kelas : '-'}</td>
                <td class="p-3 text-sm">${UI.escapeHtml(a.no_hp || '-')}</td>
                <td class="p-3">
                  <span class="px-2 py-1 text-xs rounded-full ${
                    a.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }">
                    ${a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </span>
                </td>
                <td class="p-3">
                  <button onclick="AnggotaModule.edit('${a.id}')" class="text-blue-600 hover:underline mr-2">Edit</button>
                  <button onclick="AnggotaModule.toggleStatus('${a.id}')" class="text-amber-600 hover:underline mr-2">
                    ${a.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // Mobile view
    const mobileView = `
      <div class="md:hidden space-y-4">
        ${paginated.items.map(a => `
          <div class="border rounded-lg p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <p class="font-mono text-sm text-gray-600 mb-1">${UI.escapeHtml(a.nomor_anggota)}</p>
                <p class="font-semibold">${UI.escapeHtml(a.nama)}</p>
                <p class="text-sm text-gray-600">${a.jenis_kelamin === 'L' ? '👨 Laki-laki' : '👩 Perempuan'}</p>
              </div>
              <span class="px-2 py-1 text-xs rounded-full ${
                a.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }">
                ${a.status.charAt(0).toUpperCase() + a.status.slice(1)}
              </span>
            </div>
            
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2 py-1 text-xs rounded-full ${
                a.jenis === 'siswa' ? 'bg-blue-100 text-blue-800' :
                a.jenis === 'guru' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }">
                ${a.jenis.charAt(0).toUpperCase() + a.jenis.slice(1)}
              </span>
              ${a.kelas ? `<span class="text-sm text-gray-600">Kelas ${a.kelas}</span>` : ''}
            </div>
            
            ${a.no_hp ? `<p class="text-sm text-gray-600 mb-3">📱 ${UI.escapeHtml(a.no_hp)}</p>` : ''}
            
            <div class="flex gap-2">
              <button onclick="AnggotaModule.edit('${a.id}')" class="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                Edit
              </button>
              <button onclick="AnggotaModule.toggleStatus('${a.id}')" class="flex-1 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium">
                ${a.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    container.innerHTML = desktopView + mobileView + UI.renderPagination(paginated, 'AnggotaModule.goToPage');
  },

  handleSearch(e) {
    this.searchTerm = e.target.value;
    this.currentPage = 1;
    this.renderList();
  },

  goToPage(page) {
    AnggotaModule.currentPage = page;
    AnggotaModule.renderList();
  },

  toggleKelas() {
    const jenis = document.getElementById('anggotaJenis').value;
    const kelasField = document.getElementById('kelasField');
    const kelasSelect = document.getElementById('anggotaKelas');
    
    if (jenis === 'siswa') {
      kelasField.style.display = 'block';
      kelasSelect.required = true;
    } else {
      kelasField.style.display = 'none';
      kelasSelect.required = false;
      kelasSelect.value = '';
    }
  },

  async handleSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('anggotaId').value;
    const jenis = document.getElementById('anggotaJenis').value;
    
    const data = {
      nomor_anggota: document.getElementById('anggotaNomor').value.trim().toUpperCase(),
      nama: document.getElementById('anggotaNama').value.trim(),
      jenis: jenis,
      kelas: jenis === 'siswa' ? document.getElementById('anggotaKelas').value : '',
      jenis_kelamin: document.getElementById('anggotaJK').value,
      alamat: document.getElementById('anggotaAlamat').value.trim(),
      no_hp: document.getElementById('anggotaHP').value.trim(),
      tanggal_daftar: document.getElementById('anggotaTglDaftar').value,
      status: document.getElementById('anggotaStatus').value
    };
    
    // Validate kelas for siswa
    if (data.jenis === 'siswa' && !data.kelas) {
      UI.showToast('Kelas wajib diisi untuk siswa', 'error');
      return;
    }
    
    try {
      if (id) {
        await updateRecord('anggota', id, data);
        UI.showToast('Anggota berhasil diupdate', 'success');
      } else {
        await addRecord('anggota', data);
        UI.showToast('Anggota berhasil ditambahkan', 'success');
      }
      
      this.resetForm();
      await this.render();
      
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  resetForm() {
    document.getElementById('formAnggota').reset();
    document.getElementById('anggotaId').value = '';
    document.getElementById('anggotaTglDaftar').value = new Date().toISOString().split('T')[0];
    
    // Reset kelas visibility
    document.getElementById('kelasField').style.display = 'block';
    document.getElementById('anggotaKelas').required = true;
    
    // Generate next nomor
    getAllRecords('anggota').then(anggota => {
      const lastNum = anggota.length > 0 
        ? Math.max(...anggota.map(a => {
            const match = a.nomor_anggota.match(/A-(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }))
        : 0;
      document.getElementById('anggotaNomor').value = `A-${String(lastNum + 1).padStart(5, '0')}`;
    });
  },

  async edit(id) {
    const anggota = await getRecord('anggota', id);
    if (!anggota) return;
    
    document.getElementById('anggotaId').value = anggota.id;
    document.getElementById('anggotaNomor').value = anggota.nomor_anggota;
    document.getElementById('anggotaNama').value = anggota.nama;
    document.getElementById('anggotaJenis').value = anggota.jenis;
    document.getElementById('anggotaKelas').value = anggota.kelas || '';
    document.getElementById('anggotaJK').value = anggota.jenis_kelamin;
    document.getElementById('anggotaAlamat').value = anggota.alamat || '';
    document.getElementById('anggotaHP').value = anggota.no_hp || '';
    document.getElementById('anggotaTglDaftar').value = anggota.tanggal_daftar || '';
    document.getElementById('anggotaStatus').value = anggota.status;
    
    this.toggleKelas();
    
    // Scroll to form
    document.getElementById('formAnggota').scrollIntoView({ behavior: 'smooth' });
  },

  async toggleStatus(id) {
    const anggota = await getRecord('anggota', id);
    const newStatus = anggota.status === 'aktif' ? 'nonaktif' : 'aktif';
    
    // Check if has active loans
    if (newStatus === 'nonaktif') {
      const peminjaman = await getAllRecords('peminjaman');
      const hasActive = peminjaman.some(p => p.anggota_id === id && p.status === 'Dipinjam');
      
      if (hasActive) {
        UI.showToast('Anggota masih memiliki peminjaman aktif', 'error');
        return;
      }
    }
    
    UI.showConfirm(
      `${newStatus === 'nonaktif' ? 'Nonaktifkan' : 'Aktifkan'} anggota "${anggota.nama}"?`,
      async () => {
        try {
          await updateRecord('anggota', id, { status: newStatus });
          UI.showToast(`Anggota berhasil di${newStatus === 'nonaktif' ? 'nonaktif' : 'aktif'}kan`, 'success');
          this.renderList();
        } catch (error) {
          UI.showToast('Error: ' + error.message, 'error');
        }
      }
    );
  }
};
