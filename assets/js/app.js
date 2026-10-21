// Main application entry point
let app = {
  initialized: false,
  currentPage: 'dashboard'
};

// Initialize application
async function initApp() {
  if (app.initialized) return;
  
  try {
    UI.showLoading('Memuat aplikasi...');
    
    // Initialize IndexedDB
    await initDB();
    await initDefaultData();
    
    // Check login
    const session = localStorage.getItem('session');
    
    if (!session) {
      // Show login screen
      document.getElementById('loginScreen').classList.remove('hidden');
      document.getElementById('mainApp').classList.add('hidden');
      UI.hideLoading();
      setupLogin();
      return;
    }
    
    // Parse session
    currentUser = JSON.parse(session);
    
    // Check if first login (password = admin123)
    const petugas = await getRecord('petugas', currentUser.id);
    if (petugas && await verifyPassword('admin123', petugas.password)) {
      UI.hideLoading();
      UI.showToast('Harap ganti password default Anda!', 'warning');
      showChangePasswordModal(true);
      return;
    }
    
    // Show main app
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Setup UI
    initUI();
    updateHeaderInfo();
    
    // Setup navigation
    setupNavigation();
    
    // Load dashboard
    navigateTo('dashboard');
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('SW registration failed:', err);
      });
    }
    
    app.initialized = true;
    UI.hideLoading();
    
  } catch (error) {
    console.error('Init error:', error);
    UI.hideLoading();
    UI.showToast('Gagal memuat aplikasi: ' + error.message, 'error');
  }
}

// Setup login form
function setupLogin() {
  const form = document.getElementById('loginForm');
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      UI.showLoading('Memverifikasi...');
      
      // Try pull sync first (if API configured)
      const apiUrl = await getSetting('api_url');
      const apiToken = await getSetting('api_token');
      
      if (apiUrl && apiToken && navigator.onLine) {
        UI.showLoading('Sinkronisasi data...');
        const pullResult = await SyncManager.pullSync();
        if (pullResult.success && pullResult.updated > 0) {
          console.log(`Pulled ${pullResult.updated} records from server`);
        }
      }
      
      UI.showLoading('Memverifikasi...');
      
      // Get all petugas
      const allPetugas = await getAllRecords('petugas');
      const petugas = allPetugas.find(p => p.username === username);
      
      if (!petugas) {
        UI.hideLoading();
        UI.showToast('Username atau password salah', 'error');
        return;
      }
      
      // Verify password
      const valid = await verifyPassword(password, petugas.password);
      
      if (!valid) {
        UI.hideLoading();
        UI.showToast('Username atau password salah', 'error');
        return;
      }
      
      // Create session
      const session = {
        id: petugas.id,
        nama: petugas.nama,
        username: petugas.username,
        peran: petugas.peran,
        loginAt: new Date().toISOString()
      };
      
      localStorage.setItem('session', JSON.stringify(session));
      currentUser = session;
      
      UI.hideLoading();
      
      // Reload app
      window.location.reload();
      
    } catch (error) {
      UI.hideLoading();
      UI.showToast('Error: ' + error.message, 'error');
    }
  };
}

// Update header user info
function updateHeaderInfo() {
  if (currentUser) {
    document.getElementById('headerUserName').textContent = currentUser.nama;
    document.getElementById('headerUserRole').textContent = currentUser.peran === 'admin' ? 'Administrator' : 'Petugas';
  }
}

// Setup navigation
function setupNavigation() {
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
    });
  });
  
  // Listen to page change events
  window.addEventListener('pageChanged', (e) => {
    app.currentPage = e.detail.page;
    loadPage(e.detail.page);
  });
}

// Load page content
async function loadPage(pageName) {
  try {
    switch(pageName) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'buku':
        if (window.BukuModule) {
          await window.BukuModule.init();
        }
        break;
      case 'anggota':
        if (window.AnggotaModule) {
          await window.AnggotaModule.init();
        }
        break;
      case 'petugas':
        await loadPetugas();
        break;
      case 'sirkulasi':
        if (window.SirkulasiModule) {
          await window.SirkulasiModule.init();
        }
        break;
      case 'backup':
        if (window.BackupModule) {
          await window.BackupModule.init();
        }
        break;
      case 'pengaturan':
        await loadPengaturan();
        break;
    }
  } catch (error) {
    console.error('Load page error:', error);
    UI.showToast('Gagal memuat halaman: ' + error.message, 'error');
  }
}

// Load dashboard
async function loadDashboard() {
  try {
    const buku = await getAllRecords('buku');
    const anggota = await getAllRecords('anggota');
    const peminjaman = await getAllRecords('peminjaman');
    
    // Calculate stats
    const totalJudul = buku.length;
    const totalEksemplar = buku.reduce((sum, b) => sum + (b.jumlah_total || 1), 0);
    const totalAnggota = anggota.filter(a => a.status === 'aktif').length;
    const peminjamanAktif = peminjaman.filter(p => p.status === 'Dipinjam').length;
    
    // Update stats
    document.getElementById('statTotalJudul').textContent = totalJudul;
    document.getElementById('statTotalEksemplar').textContent = totalEksemplar;
    document.getElementById('statTotalAnggota').textContent = totalAnggota;
    document.getElementById('statPeminjamanAktif').textContent = peminjamanAktif;
    
    // Latest peminjaman
    const latest = peminjaman
      .filter(p => p.status === 'Dipinjam')
      .sort((a, b) => new Date(b.tanggal_pinjam) - new Date(a.tanggal_pinjam))
      .slice(0, 5);
    
    const latestHtml = latest.length > 0 ? latest.map(p => {
      const anggotaData = anggota.find(a => a.id === p.anggota_id);
      const bukuData = buku.find(b => b.id === p.buku_id);
      
      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex-1">
            <p class="font-medium text-sm">${UI.escapeHtml(anggotaData?.nama || '-')}</p>
            <p class="text-xs text-gray-600">${UI.escapeHtml(bukuData?.judul || '-')}</p>
          </div>
          <span class="text-xs text-gray-500">${UI.formatDate(p.tanggal_pinjam)}</span>
        </div>
      `;
    }).join('') : UI.renderEmptyState('Belum ada peminjaman', '📋');
    
    document.getElementById('peminjamanTerbaru').innerHTML = latestHtml;
    
    // Popular books (most borrowed)
    const bookBorrowCount = {};
    peminjaman.forEach(p => {
      bookBorrowCount[p.buku_id] = (bookBorrowCount[p.buku_id] || 0) + 1;
    });
    
    const popular = Object.entries(bookBorrowCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([bukuId, count]) => {
        const bukuData = buku.find(b => b.id === bukuId);
        return { buku: bukuData, count };
      })
      .filter(item => item.buku);
    
    const popularHtml = popular.length > 0 ? popular.map(item => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex-1">
          <p class="font-medium text-sm">${UI.escapeHtml(item.buku.judul)}</p>
          <p class="text-xs text-gray-600">${UI.escapeHtml(item.buku.pengarang)}</p>
        </div>
        <span class="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-semibold">
          ${item.count}x
        </span>
      </div>
    `).join('') : UI.renderEmptyState('Belum ada data', '📊');
    
    document.getElementById('bukuTerpopuler').innerHTML = popularHtml;
    
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

// Load petugas page
async function loadPetugas() {
  const container = document.getElementById('petugasPage');
  
  if (currentUser.peran !== 'admin') {
    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-center py-12">
          <span class="text-6xl mb-4 block">🔒</span>
          <p class="text-lg text-gray-600">Hanya admin yang dapat mengelola data petugas</p>
        </div>
      </div>
    `;
    return;
  }
  
  const petugas = await getAllRecords('petugas');
  
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 class="text-lg font-bold mb-4">Tambah Petugas Baru</h3>
      <form id="formPetugas" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="hidden" id="petugasId">
        <input type="text" id="petugasNama" placeholder="Nama Lengkap" required class="border p-3 rounded-lg">
        <input type="text" id="petugasJabatan" placeholder="Jabatan" class="border p-3 rounded-lg">
        <input type="text" id="petugasUsername" placeholder="Username" required class="border p-3 rounded-lg">
        <input type="password" id="petugasPassword" placeholder="Password" class="border p-3 rounded-lg">
        <input type="tel" id="petugasHP" placeholder="No. HP" class="border p-3 rounded-lg">
        <select id="petugasPeran" class="border p-3 rounded-lg">
          <option value="petugas">Petugas</option>
          <option value="admin">Admin</option>
        </select>
        <div class="md:col-span-2 flex gap-3">
          <button type="submit" class="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Simpan
          </button>
          <button type="button" onclick="resetFormPetugas()" class="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400">
            Reset
          </button>
        </div>
      </form>
    </div>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-bold mb-4">Daftar Petugas</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-3 text-left">Nama</th>
              <th class="p-3 text-left">Username</th>
              <th class="p-3 text-left">Jabatan</th>
              <th class="p-3 text-left">Peran</th>
              <th class="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody id="tabelPetugas">
            ${petugas.map(p => `
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3">${UI.escapeHtml(p.nama)}</td>
                <td class="p-3">${UI.escapeHtml(p.username)}</td>
                <td class="p-3">${UI.escapeHtml(p.jabatan || '-')}</td>
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs ${p.peran === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
                    ${p.peran}
                  </span>
                </td>
                <td class="p-3">
                  <button onclick="editPetugas('${p.id}')" class="text-blue-600 hover:underline mr-3">Edit</button>
                  ${p.id !== currentUser.id ? `<button onclick="hapusPetugas('${p.id}')" class="text-red-600 hover:underline">Hapus</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  // Setup form
  document.getElementById('formPetugas').onsubmit = async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('petugasId').value;
    const data = {
      nama: document.getElementById('petugasNama').value,
      jabatan: document.getElementById('petugasJabatan').value,
      username: document.getElementById('petugasUsername').value,
      no_hp: document.getElementById('petugasHP').value,
      peran: document.getElementById('petugasPeran').value
    };
    
    const password = document.getElementById('petugasPassword').value;
    if (password) {
      data.password = await hashPassword(password);
    }
    
    try {
      if (id) {
        await updateRecord('petugas', id, data);
        UI.showToast('Petugas berhasil diupdate', 'success');
      } else {
        if (!password) {
          UI.showToast('Password wajib diisi untuk petugas baru', 'error');
          return;
        }
        await addRecord('petugas', data);
        UI.showToast('Petugas berhasil ditambahkan', 'success');
      }
      
      resetFormPetugas();
      loadPetugas();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  };
}

window.editPetugas = async (id) => {
  const petugas = await getRecord('petugas', id);
  if (!petugas) return;
  
  document.getElementById('petugasId').value = petugas.id;
  document.getElementById('petugasNama').value = petugas.nama;
  document.getElementById('petugasJabatan').value = petugas.jabatan || '';
  document.getElementById('petugasUsername').value = petugas.username;
  document.getElementById('petugasHP').value = petugas.no_hp || '';
  document.getElementById('petugasPeran').value = petugas.peran;
  document.getElementById('petugasPassword').placeholder = 'Kosongkan jika tidak ingin mengubah password';
};

window.hapusPetugas = (id) => {
  UI.showConfirm('Yakin ingin menghapus petugas ini?', async () => {
    try {
      await deleteRecord('petugas', id);
      UI.showToast('Petugas berhasil dihapus', 'success');
      loadPetugas();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  });
};

window.resetFormPetugas = () => {
  document.getElementById('formPetugas').reset();
  document.getElementById('petugasId').value = '';
  document.getElementById('petugasPassword').placeholder = 'Password';
};

// Load pengaturan page
async function loadPengaturan() {
  const container = document.getElementById('pengaturanPage');
  
  const settings = {
    lama_pinjam_hari: await getSetting('lama_pinjam_hari', 7),
    maks_buku_per_anggota: await getSetting('maks_buku_per_anggota', 2),
    denda_per_hari: await getSetting('denda_per_hari', 0),
    api_url: await getSetting('api_url', ''),
    api_token: await getSetting('api_token', ''),
    auto_sync: await getSetting('auto_sync', false)
  };
  
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold mb-4">Pengaturan Perpustakaan</h3>
        <form id="formPengaturan" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Lama Peminjaman (Hari)</label>
            <input type="number" id="setLamaPinjam" value="${settings.lama_pinjam_hari}" class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Maksimal Buku per Anggota</label>
            <input type="number" id="setMaksBuku" value="${settings.maks_buku_per_anggota}" class="w-full border p-3 rounded-lg">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Denda Keterlambatan per Hari (Rp)</label>
            <input type="number" id="setDenda" value="${settings.denda_per_hari}" class="w-full border p-3 rounded-lg">
          </div>
          
          <button type="submit" class="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700">
            Simpan Pengaturan
          </button>
        </form>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold mb-4">Pengaturan API Server</h3>
        <form id="formAPI" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">URL API Server</label>
            <input type="url" id="setAPIUrl" value="${settings.api_url}" placeholder="https://example.com/api" class="w-full border p-3 rounded-lg">
            <p class="text-xs text-gray-500 mt-1">URL lengkap ke folder /api (tanpa trailing slash)</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Token API</label>
            <input type="text" id="setAPIToken" value="${settings.api_token}" placeholder="Token rahasia" class="w-full border p-3 rounded-lg">
            <p class="text-xs text-gray-500 mt-1">Token harus sama dengan yang di config.php server</p>
          </div>
          
          <div class="flex items-center gap-2">
            <input type="checkbox" id="setAutoSync" ${settings.auto_sync ? 'checked' : ''} class="w-5 h-5">
            <label for="setAutoSync" class="text-sm">Sinkronisasi otomatis saat online</label>
          </div>
          
          <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
            Simpan Pengaturan API
          </button>
        </form>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold mb-4">Profil Saya</h3>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-600">Nama</p>
            <p class="font-medium">${currentUser.nama}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Username</p>
            <p class="font-medium">${currentUser.username}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Peran</p>
            <p class="font-medium">${currentUser.peran}</p>
          </div>
          
          <button onclick="showChangePasswordModal()" class="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700">
            Ganti Password
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Setup forms
  document.getElementById('formPengaturan').onsubmit = async (e) => {
    e.preventDefault();
    
    await setSetting('lama_pinjam_hari', parseInt(document.getElementById('setLamaPinjam').value));
    await setSetting('maks_buku_per_anggota', parseInt(document.getElementById('setMaksBuku').value));
    await setSetting('denda_per_hari', parseInt(document.getElementById('setDenda').value));
    
    UI.showToast('Pengaturan berhasil disimpan', 'success');
  };
  
  document.getElementById('formAPI').onsubmit = async (e) => {
    e.preventDefault();
    
    await setSetting('api_url', document.getElementById('setAPIUrl').value.trim());
    await setSetting('api_token', document.getElementById('setAPIToken').value.trim());
    await setSetting('auto_sync', document.getElementById('setAutoSync').checked);
    
    UI.showToast('Pengaturan API berhasil disimpan', 'success');
    UI.updateConnectionStatus();
  };
}

// Change password modal
function showChangePasswordModal(force = false) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
      <h3 class="text-lg font-semibold mb-4">Ganti Password</h3>
      ${force ? '<p class="text-amber-600 text-sm mb-4">⚠️ Anda harus mengganti password default sebelum melanjutkan!</p>' : ''}
      <form id="formGantiPassword" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Password Lama</label>
          <input type="password" id="oldPassword" required class="w-full border p-3 rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Password Baru</label>
          <input type="password" id="newPassword" required minlength="6" class="w-full border p-3 rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Konfirmasi Password Baru</label>
          <input type="password" id="confirmPassword" required class="w-full border p-3 rounded-lg">
        </div>
        <div class="flex gap-3">
          ${!force ? '<button type="button" onclick="this.closest(\'.fixed\').remove()" class="flex-1 px-4 py-3 bg-gray-300 rounded-lg hover:bg-gray-400">Batal</button>' : ''}
          <button type="submit" class="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Simpan
          </button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  if (!force) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
  
  document.getElementById('formGantiPassword').onsubmit = async (e) => {
    e.preventDefault();
    
    const oldPass = document.getElementById('oldPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    if (newPass !== confirmPass) {
      UI.showToast('Konfirmasi password tidak cocok', 'error');
      return;
    }
    
    if (newPass.length < 6) {
      UI.showToast('Password minimal 6 karakter', 'error');
      return;
    }
    
    try {
      const petugas = await getRecord('petugas', currentUser.id);
      const valid = await verifyPassword(oldPass, petugas.password);
      
      if (!valid) {
        UI.showToast('Password lama salah', 'error');
        return;
      }
      
      const hashedNew = await hashPassword(newPass);
      await updateRecord('petugas', currentUser.id, { password: hashedNew });
      
      UI.showToast('Password berhasil diubah', 'success');
      modal.remove();
      
      if (force) {
        window.location.reload();
      }
      
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  };
}

window.showChangePasswordModal = showChangePasswordModal;

// Start app when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
