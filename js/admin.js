/**
 * ============================================================================
 * SERVEHUB PRO - ISOLATED ADMIN WORKSPACE CONTROLLER (js/admin.js)
 * Enforces strict separation between the Login Gateway and the Multi-Tab
 * Admin Control Center (Bookings, Verify Pros, Categories, Cloud & Security)
 * ============================================================================
 */

const AdminApp = {
  activeTab: 'bookings',

  init() {
    window.addEventListener('storage', () => {
      if (ServeHubDB.isAdminLoggedIn()) this.renderDashboard();
    });

    this.checkAuth();
  },

  checkAuth() {
    const loggedIn = ServeHubDB.isAdminLoggedIn();
    document.getElementById('admin-login-screen').classList.toggle('hidden', loggedIn);
    document.getElementById('admin-dashboard-screen').classList.toggle('hidden', !loggedIn);
    if (loggedIn) {
      this.renderDashboard();
      this.switchAdminTab(this.activeTab);
    }
  },

  switchAdminTab(tabId) {
    this.activeTab = tabId;
    const tabs = ['bookings', 'pros', 'categories', 'cloud'];

    tabs.forEach(t => {
      const panel = document.getElementById(`adm-tab-${t}`);
      if (panel) panel.classList.toggle('hidden', t !== tabId);

      const btn = document.getElementById(`anav-${t}`);
      if (btn) {
        btn.className = t === tabId
          ? 'px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-amber-400 text-slate-950 transition'
          : 'px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition';
      }
    });
  },

  handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('admin-user').value;
    const pass = document.getElementById('admin-pass').value;

    if (ServeHubDB.authenticateAdmin(user, pass)) {
      this.notify('Admin workspace unlocked.');
      this.checkAuth();
    } else {
      this.notify('Invalid admin username or password.', 'error');
    }
  },

  handleLogout() {
    ServeHubDB.logoutAdmin();
    this.checkAuth();
    this.notify('Logged out of Admin Control Center.');
  },

  renderDashboard() {
    const state = ServeHubDB.getState();

    const gmv = state.bookings
      .filter(b => b.status !== 'Cancelled')
      .reduce((acc, b) => acc + Number(b.amount || 0), 0);

    document.getElementById('adm-kpi-bookings').textContent = state.bookings.length;
    document.getElementById('adm-kpi-pros').textContent = state.professionals.length;
    document.getElementById('adm-kpi-verified').textContent = state.professionals.filter(p => p.verified).length;
    document.getElementById('adm-kpi-gmv').textContent = ServeHubDB.formatCurrency(gmv);

    const cloud = ServeHubDB.getCloudConfig();
    const badge = document.getElementById('cloud-status-badge');
    if (cloud.binId && cloud.apiKey) {
      badge.textContent = 'Cloud Sync Active';
      badge.className = 'ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300';
      document.getElementById('cloud-bin-id').value = cloud.binId;
      document.getElementById('cloud-api-key').value = cloud.apiKey;
    }

    const secUser = document.getElementById('sec-admin-user');
    if (secUser) secUser.value = state.settings.adminUsername || 'admin';

    this.renderBookingsTable(state);
    this.renderProsTable(state);
    this.renderCategoriesList(state);
  },

  renderBookingsTable(state) {
    const tbody = document.getElementById('adm-bookings-tbody');
    if (state.bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400">No bookings recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.bookings.map(b => `
      <tr class="hover:bg-slate-50">
        <td class="py-3 px-3 font-extrabold text-blue-600">${ServeHubDB.escapeHTML(b.id)}</td>
        <td class="py-3 px-3">
          <div class="font-bold text-slate-900">${ServeHubDB.escapeHTML(b.customerName)}</div>
          <div class="text-slate-500">${ServeHubDB.escapeHTML(b.customerPhone)}</div>
        </td>
        <td class="py-3 px-3 font-semibold text-slate-800">${ServeHubDB.escapeHTML(b.proName)}</td>
        <td class="py-3 px-3">
          <div class="font-bold text-slate-800">${ServeHubDB.escapeHTML(b.serviceTitle)}</div>
          <div class="text-slate-400">${ServeHubDB.escapeHTML(b.preferredDate)} (${ServeHubDB.escapeHTML(b.preferredTime)})</div>
        </td>
        <td class="py-3 px-3 font-extrabold text-slate-900">${ServeHubDB.formatCurrency(b.amount)}</td>
        <td class="py-3 px-3">
          <select onchange="AdminApp.updateBookingStatus('${b.id}', this.value)" class="px-2.5 py-1 rounded-lg border border-slate-300 font-bold text-xs bg-white">
            ${['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map(st => `
              <option value="${st}" ${b.status === st ? 'selected' : ''}>${st}</option>
            `).join('')}
          </select>
        </td>
        <td class="py-3 px-3 text-right">
          <button onclick="AdminApp.deleteBooking('${b.id}')" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  updateBookingStatus(bookingId, status) {
    const state = ServeHubDB.getState();
    const b = state.bookings.find(item => item.id === bookingId);
    if (b) {
      b.status = status;
      ServeHubDB.saveState(state);
      this.renderDashboard();
      this.notify(`Booking ${bookingId} updated to ${status}`);
    }
  },

  deleteBooking(bookingId) {
    if (!confirm(`Delete booking ${bookingId}?`)) return;
    const state = ServeHubDB.getState();
    state.bookings = state.bookings.filter(b => b.id !== bookingId);
    ServeHubDB.saveState(state);
    this.renderDashboard();
    this.notify('Booking deleted.');
  },

  renderProsTable(state) {
    const tbody = document.getElementById('adm-pros-tbody');
    tbody.innerHTML = state.professionals.map(p => `
      <tr class="hover:bg-slate-50">
        <td class="py-3 px-3 flex items-center gap-2.5">
          <img src="${ServeHubDB.escapeHTML(p.avatar)}" class="w-9 h-9 rounded-xl object-cover" />
          <div>
            <div class="font-extrabold text-slate-900">${ServeHubDB.escapeHTML(p.businessName)}</div>
            <div class="text-slate-500">${ServeHubDB.escapeHTML(p.name)} &bull; ${ServeHubDB.escapeHTML(p.phone)}</div>
          </div>
        </td>
        <td class="py-3 px-3 font-mono text-slate-600">@${ServeHubDB.escapeHTML(p.username)}</td>
        <td class="py-3 px-3">
          <span class="font-bold text-blue-600">${ServeHubDB.escapeHTML(p.category)}</span>
          <span class="block text-slate-400">${ServeHubDB.escapeHTML(p.location)}</span>
        </td>
        <td class="py-3 px-3 font-bold">${ServeHubDB.formatCurrency(p.baseRate)}</td>
        <td class="py-3 px-3">
          <button onclick="AdminApp.toggleVerifyPro('${p.id}')" class="px-3 py-1 rounded-full text-[11px] font-extrabold transition ${
            p.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }">
            ${p.verified ? '✓ Verified Pro' : 'Unverified (Click to Verify)'}
          </button>
        </td>
        <td class="py-3 px-3 text-right">
          <button onclick="AdminApp.deletePro('${p.id}')" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  toggleVerifyPro(proId) {
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === proId);
    if (pro) {
      pro.verified = !pro.verified;
      ServeHubDB.saveState(state);
      this.renderDashboard();
      this.notify(`${pro.businessName} verification set to ${pro.verified}`);
    }
  },

  deletePro(proId) {
    if (!confirm('Remove this professional from the platform?')) return;
    const state = ServeHubDB.getState();
    state.professionals = state.professionals.filter(p => p.id !== proId);
    ServeHubDB.saveState(state);
    this.renderDashboard();
    this.notify('Professional removed.');
  },

  renderCategoriesList(state) {
    const list = document.getElementById('adm-categories-list');
    list.innerHTML = state.categories.map(c => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <span class="font-bold text-slate-800"><i class="fa-solid ${ServeHubDB.escapeHTML(c.icon)} text-blue-600 mr-2"></i>${ServeHubDB.escapeHTML(c.name)} (${c.count} pros)</span>
        <button onclick="AdminApp.deleteCategory('${c.id}')" class="text-rose-500 hover:text-rose-700"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join('');
  },

  addCategory(e) {
    e.preventDefault();
    const name = document.getElementById('new-cat-name').value.trim();
    const icon = document.getElementById('new-cat-icon').value.trim() || 'fa-wrench';
    const state = ServeHubDB.getState();

    state.categories.push({ id: 'cat_' + Date.now(), name, icon, count: 0 });
    ServeHubDB.saveState(state);
    e.target.reset();
    this.renderDashboard();
    this.notify(`Category "${name}" added.`);
  },

  deleteCategory(catId) {
    const state = ServeHubDB.getState();
    state.categories = state.categories.filter(c => c.id !== catId);
    ServeHubDB.saveState(state);
    this.renderDashboard();
  },

  saveCloudSettings(e) {
    e.preventDefault();
    const binId = document.getElementById('cloud-bin-id').value;
    const apiKey = document.getElementById('cloud-api-key').value;
    ServeHubDB.saveCloudConfig(binId, apiKey);
    this.renderDashboard();
    this.notify('Cloud credentials saved.');
  },

  updateAdminCredentials(e) {
    e.preventDefault();
    const state = ServeHubDB.getState();
    state.settings.adminUsername = document.getElementById('sec-admin-user').value.trim();
    state.settings.adminPassword = document.getElementById('sec-admin-pass').value.trim();
    ServeHubDB.saveState(state);
    document.getElementById('sec-admin-pass').value = '';
    this.notify('Admin login credentials updated!');
  },

  async syncNow(direction) {
    if (direction === 'push') {
      const res = await ServeHubDB.pushToCloud();
      this.notify(res.ok ? 'Database pushed to JSONBin.io Cloud!' : `Push failed: ${res.reason}`, res.ok ? 'success' : 'error');
    } else {
      const res = await ServeHubDB.pullFromCloud();
      if (res.ok) {
        this.renderDashboard();
        this.notify('Latest data pulled from JSONBin.io Cloud!');
      } else {
        this.notify(`Pull failed: ${res.reason}`, 'error');
      }
    }
  },

  exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ServeHubDB.getState(), null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `servehub_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  },

  importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.professionals && parsed.bookings) {
          ServeHubDB.saveState(parsed);
          this.renderDashboard();
          this.notify('Database backup restored!');
        }
      } catch {
        this.notify('Invalid JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
  },

  resetDatabase() {
    if (!confirm('Reset all data back to factory seed defaults?')) return;
    ServeHubDB.resetToFactory();
    this.renderDashboard();
    this.notify('Database reset to factory defaults.');
  },

  notify(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `${type === 'error' ? 'bg-rose-600' : 'bg-slate-900'} text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in`;
    toast.innerHTML = `<span>${ServeHubDB.escapeHTML(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
};

document.addEventListener('DOMContentLoaded', () => AdminApp.init());