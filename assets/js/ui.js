// UI utilities and components
let currentUser = null;
let sidebarOpen = false;

// Initialize UI
function initUI() {
  // Check login
  const session = localStorage.getItem('session');
  if (session) {
    currentUser = JSON.parse(session);
  }
  
  // Setup sidebar toggle
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebarOpen = !sidebarOpen;
      sidebar.classList.toggle('-translate-x-full', !sidebarOpen);
      overlay.classList.toggle('hidden', !sidebarOpen);
    });
    
    overlay?.addEventListener('click', () => {
      sidebarOpen = false;
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    });
  }
  
  // Close sidebar on navigation (mobile)
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        sidebarOpen = false;
        sidebar?.classList.add('-translate-x-full');
        overlay?.classList.add('hidden');
      }
    });
  });
  
  // Update connection status
  updateConnectionStatus();
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  
  // Update unsynced count periodically
  setInterval(updateUnsyncedIndicator, 5000);
  updateUnsyncedIndicator();
}

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-slideIn ${
    type === 'success' ? 'bg-emerald-600' :
    type === 'error' ? 'bg-red-600' :
    type === 'warning' ? 'bg-amber-600' :
    'bg-blue-600'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-slideOut');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Confirm modal
function showConfirm(message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-md mx-4">
      <h3 class="text-lg font-semibold mb-4">Konfirmasi</h3>
      <p class="text-gray-700 mb-6">${message}</p>
      <div class="flex gap-3 justify-end">
        <button class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300" onclick="this.closest('.fixed').remove()">
          Batal
        </button>
        <button class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700" id="confirmBtn">
          Ya, Lanjutkan
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#confirmBtn').addEventListener('click', () => {
    modal.remove();
    onConfirm();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Loading spinner
function showLoading(message = 'Memuat...') {
  const loading = document.createElement('div');
  loading.id = 'loadingSpinner';
  loading.className = 'fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50';
  loading.innerHTML = `
    <div class="bg-white rounded-lg p-6 flex flex-col items-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
      <p class="text-gray-700">${message}</p>
    </div>
  `;
  
  document.body.appendChild(loading);
}

function hideLoading() {
  document.getElementById('loadingSpinner')?.remove();
}

// Update connection status indicator
async function updateConnectionStatus() {
  const indicator = document.getElementById('connectionStatus');
  if (!indicator) return;
  
  const online = navigator.onLine;
  
  // Ping API if online
  let apiReachable = false;
  if (online) {
    try {
      const apiUrl = await getSetting('api_url');
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/ping.php`, { 
          method: 'GET',
          cache: 'no-cache',
          signal: AbortSignal.timeout(3000)
        });
        apiReachable = response.ok;
      }
    } catch (e) {
      // API not reachable
    }
  }
  
  indicator.innerHTML = `
    <span class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full ${apiReachable ? 'bg-green-500' : online ? 'bg-yellow-500' : 'bg-red-500'}"></span>
      ${apiReachable ? 'Online' : online ? 'Offline' : 'Offline'}
    </span>
  `;
}

// Update unsynced indicator
async function updateUnsyncedIndicator() {
  const indicator = document.getElementById('unsyncedCount');
  if (!indicator) return;
  
  const count = await getUnsyncedCount();
  
  if (count > 0) {
    indicator.textContent = count;
    indicator.classList.remove('hidden');
  } else {
    indicator.classList.add('hidden');
  }
}

// Page navigation
function navigateTo(pageName) {
  // Hide all pages
  document.querySelectorAll('[data-page-content]').forEach(page => {
    page.classList.add('hidden');
  });
  
  // Show target page
  const targetPage = document.querySelector(`[data-page-content="${pageName}"]`);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }
  
  // Update active nav
  document.querySelectorAll('[data-page]').forEach(link => {
    link.classList.remove('bg-emerald-100', 'text-emerald-800', 'border-l-4', 'border-emerald-600');
    if (link.dataset.page === pageName) {
      link.classList.add('bg-emerald-100', 'text-emerald-800', 'border-l-4', 'border-emerald-600');
    }
  });
  
  // Trigger page init
  const event = new CustomEvent('pageChanged', { detail: { page: pageName } });
  window.dispatchEvent(event);
}

// Format date to Indonesian
function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Format datetime
function formatDateTime(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return `${formatDate(dateString)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Empty state component
function renderEmptyState(message, icon = '📭') {
  return `
    <div class="flex flex-col items-center justify-center py-12 text-gray-500">
      <div class="text-6xl mb-4">${icon}</div>
      <p class="text-lg">${message}</p>
    </div>
  `;
}

// Pagination helper
function paginate(items, page = 1, perPage = 20) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  
  return {
    items: items.slice(start, end),
    total: items.length,
    page,
    perPage,
    totalPages: Math.ceil(items.length / perPage),
    hasNext: end < items.length,
    hasPrev: page > 1
  };
}

// Render pagination controls
function renderPagination(paginationData, onPageChange) {
  if (paginationData.totalPages <= 1) return '';
  
  const buttons = [];
  const maxButtons = 5;
  let startPage = Math.max(1, paginationData.page - Math.floor(maxButtons / 2));
  let endPage = Math.min(paginationData.totalPages, startPage + maxButtons - 1);
  
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  
  let html = '<div class="flex justify-center items-center gap-2 mt-4">';
  
  // Previous button
  html += `
    <button 
      class="px-3 py-2 rounded ${paginationData.hasPrev ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
      ${paginationData.hasPrev ? `onclick="${onPageChange}(${paginationData.page - 1})"` : 'disabled'}
    >
      ‹
    </button>
  `;
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button 
        class="px-3 py-2 rounded ${i === paginationData.page ? 'bg-emerald-600 text-white' : 'bg-white border hover:bg-emerald-50'}"
        onclick="${onPageChange}(${i})"
      >
        ${i}
      </button>
    `;
  }
  
  // Next button
  html += `
    <button 
      class="px-3 py-2 rounded ${paginationData.hasNext ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
      ${paginationData.hasNext ? `onclick="${onPageChange}(${paginationData.page + 1})"` : 'disabled'}
    >
      ›
    </button>
  `;
  
  html += '</div>';
  
  return html;
}

// Form validation helper
function validateForm(formElement) {
  const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
  let valid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('border-red-500');
      valid = false;
    } else {
      input.classList.remove('border-red-500');
    }
  });
  
  return valid;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Search/filter helper
function filterData(data, searchTerm, fields) {
  if (!searchTerm) return data;
  
  const term = searchTerm.toLowerCase();
  return data.filter(item => {
    return fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(term);
    });
  });
}

// Auto-resize textarea
function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

// Logout
function logout() {
  showConfirm('Yakin ingin keluar?', () => {
    localStorage.removeItem('session');
    window.location.reload();
  });
}

// Export UI utilities
window.UI = {
  showToast,
  showConfirm,
  showLoading,
  hideLoading,
  updateConnectionStatus,
  updateUnsyncedIndicator,
  navigateTo,
  formatDate,
  formatDateTime,
  renderEmptyState,
  paginate,
  renderPagination,
  validateForm,
  escapeHtml,
  filterData,
  autoResizeTextarea,
  logout
};
