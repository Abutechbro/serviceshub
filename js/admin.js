/**
 * ============================================================================
 * SERVEHUB PRO - ISOLATED ADMIN WORKSPACE CONTROLLER (js/admin.js)
 * Features:
 * - Real-time Firebase Firestore synchronization via ServeHubDB.initRealtimeSync()
 * - Automated Email Alerts (FormSubmit AJAX) on Booking Status & Pro Verification
 * - Login Loop Fix (Direct DOM state transition + persistent localStorage session)
 * - Global window.AdminApp binding for HTML inline event handlers
 * ============================================================================
 */

const AdminApp = {
  activeTab: 'bookings',

  /* ========================================================================
     1. INITIALIZATION & REAL-TIME FIREBASE SYNC
     ======================================================================== */
  async init() {
    this.checkAuth();

    window.addEventListener('storage', () => {
      if (ServeHubDB.isAdminLoggedIn()) this.renderDashboard();
    });

    if (typeof ServeHubDB !== 'undefined' && ServeHubDB.initRealtimeSync) {
      await ServeHubDB.initRealtimeSync(() => {
        if (ServeHubDB.isAdminLoggedIn()) {
          this.renderDashboard();
        }
      });
    }
  },

  /* ========================================================================
     2. AUTHENTICATION & LOGIN LOOP FIX
     ======================================================================== */
  checkAuth() {
    const loggedIn = ServeHubDB.isAdminLoggedIn();
    const loginScreen = document.getElementById('admin-login-screen');
    const dashboardScreen = document.getElementById('admin-dashboard-screen');

    if (loginScreen) loginScreen.classList.toggle('hidden', loggedIn);
    if (dashboardScreen) dashboardScreen.classList.toggle('hidden', !loggedIn);

    if (loggedIn) {
      this.renderDashboard();
      this.switchAdminTab(this.activeTab);
    }
  },

  async handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();

    const user = (document.getElementById('admin-user')?.value || '').trim();
    const pass = (document.getElementById('admin-pass')?.value || '').trim();

    if (ServeHubDB.authenticateAdmin(user, pass)) {
      // Force-persist session flag and immediately transition DOM to prevent login loops
      localStorage.setItem('SERVEHUB_ADMIN_ACTIVE_SESSION', 'ACTIVE');
      document.getElementById('admin-login-screen')?.classList.add('hidden');
      document.getElementById('admin-dashboard-screen')?.classList.remove('hidden');

      this.renderDashboard();
      this.switchAdminTab(this.activeTab);
      this.notify('Admin workspace unlocked.');
    } else {
      this.notify('Invalid admin username or password.', 'error');
    }
  },

  handleLogout() {
    ServeHubDB.logoutAdmin();
    localStorage.removeItem('SERVEHUB_ADMIN_ACTIVE_SESSION');
    this.checkAuth();
    this.notify('Logged out of Admin Control Center.');
  },

  switchAdminTab(tabId) {
    this.activeTab = tabId;
    const tabs = ['bookings', 'pros', 'categories', 'cloud', 'subscriptions'];

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

  /* ========================================================================
     3. EMAIL NOTIFICATION DISPATCHER (FALLBACK-SAFE)
     ======================================================================== */
  async dispatchEmailNotification(toEmail, subject, payloadData) {
    if (!toEmail || !toEmail.includes('@')) return { ok: false };

    if (typeof ServeHubDB !== 'undefined' && typeof ServeHubDB.sendEmailAlert === 'function') {
      return await ServeHubDB.sendEmailAlert(toEmail, subject, payloadData);
    }

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail.trim())}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: subject,
          _template: 'table',
          _captcha: 'false',
          Platform: 'ServeHub Pro Admin Control Center',
          ...payloadData
        })
      });
      return { ok: response.ok };
    } catch (err) {
      console.warn('Admin Email Dispatch Warning:', err);
      return { ok: false };
    }
  },

  /* ========================================================================
     4. DASHBOARD RENDERING & REAL-TIME METRICS
     ======================================================================== */
  renderDashboard() {
    const state = ServeHubDB.getState();

    const gmv = (state.bookings || [])
      .filter(b => b.status !== 'Cancelled')
      .reduce((acc, b) => acc + Number(b.amount || 0), 0);

    const kpiBookings = document.getElementById('adm-kpi-bookings');
    const kpiPros = document.getElementById('adm-kpi-pros');
    const kpiVerified = document.getElementById('adm-kpi-verified');
    const kpiGmv = document.getElementById('adm-kpi-gmv');

    if (kpiBookings) kpiBookings.textContent = (state.bookings || []).length;
    if (kpiPros) kpiPros.textContent = (state.professionals || []).length;
    if (kpiVerified) kpiVerified.textContent = (state.professionals || []).filter(p => p.verified).length;
    if (kpiGmv) kpiGmv.textContent = ServeHubDB.formatCurrency(gmv);

    // Update Cloud Status Badge
    const cloud = ServeHubDB.getCloudConfig();
    const badge = document.getElementById('cloud-status-badge');
    if (badge) {
      if (cloud.binId && cloud.apiKey) {
        badge.textContent = `Firebase Live (${cloud.binId})`;
        badge.className = 'ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300';
      } else {
        badge.textContent = 'Local Mode (Set FIREBASE_CONFIG in db.js)';
        badge.className = 'ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300';
      }
    }

    const binInput = document.getElementById('cloud-bin-id');
    const keyInput = document.getElementById('cloud-api-key');
    if (binInput && cloud.binId && document.activeElement !== binInput) binInput.value = cloud.binId;
    if (keyInput && cloud.apiKey && document.activeElement !== keyInput) keyInput.value = cloud.apiKey;

    const secUser = document.getElementById('sec-admin-user');
    if (secUser && document.activeElement !== secUser) {
      secUser.value = state.settings?.adminUsername || 'admin';
    }

    this.renderBookingsTable(state);
    this.renderProsTable(state);
    this.renderCategoriesList(state);

    // Inside renderDashboard() in js/admin.js, add:
    const subsContainer = document.getElementById('adm-pending-subs-list');
    if (subsContainer) {
      const pendingPros = (state.professionals || []).filter(p => p.pendingSubscription && p.pendingSubscription.status === 'pending_approval');
      if (pendingPros.length === 0) {
        subsContainer.innerHTML = `<p class="text-xs text-slate-400 py-6 text-center">No pending subscription receipts.</p>`;
      } else {
        subsContainer.innerHTML = pendingPros.map(p => `
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span class="text-xs font-extrabold text-blue-600">${ServeHubDB.escapeHTML(p.businessName)} (@${ServeHubDB.escapeHTML(p.username)})</span>
              <p class="text-xs font-bold text-slate-800 mt-0.5">Tier: <span class="uppercase text-amber-600">${p.pendingSubscription.planTier}</span> &bull; Ref: <span class="font-mono">${ServeHubDB.escapeHTML(p.pendingSubscription.txnRef)}</span></p>
              <p class="text-[11px] text-slate-500">Submitted: ${p.pendingSubscription.submittedAt}</p>
            </div>
            <div class="flex items-center gap-2">
              <a href="${p.pendingSubscription.receiptImage}" target="_blank" class="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold">View Receipt</a>
              <button onclick="AdminApp.approveSubscription('${p.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">Approve</button>
              <button onclick="AdminApp.rejectSubscription('${p.id}')" class="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold">Reject</button>
            </div>
          </div>
        `).join('');
      }

      const s = state.settings || {};
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = val;
    };
    setVal('adm-bank-name', s.bankName || 'Guaranty Trust Bank (GTB)');
    setVal('adm-bank-num', s.bankAccountNumber || '0123456789');
    setVal('adm-bank-holder', s.bankAccountName || 'ServeHub Pro Technologies');
    setVal('adm-paystack-key', s.paystackPublicKey || 'pk_test_YOUR_PAYSTACK_PUBLIC_KEY');

    this.renderSubscriptionPlans(state);

    }

    // Populate Subscription Pricing & Bank Inputs in Admin
    const s = state.settings || {};
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = val;
    };
    setVal('adm-price-pro', s.proPlanPrice ?? 5000);
    setVal('adm-price-featured', s.featuredPlanPrice ?? 12000);
    setVal('adm-plan-days', s.planDurationDays ?? 30);
    setVal('adm-bank-name', s.bankName || 'Guaranty Trust Bank (GTB)');
    setVal('adm-bank-num', s.bankAccountNumber || '0123456789');
    setVal('adm-bank-holder', s.bankAccountName || 'ServeHub Pro Technologies');
    setVal('adm-paystack-key', s.paystackPublicKey || 'pk_test_YOUR_PAYSTACK_PUBLIC_KEY');
  },

  /* ========================================================================
     5. MASTER BOOKINGS PIPELINE & EMAIL ALERTS
     ======================================================================== */
  renderBookingsTable(state) {
    const tbody = document.getElementById('adm-bookings-tbody');
    if (!tbody) return;

    if (!state.bookings || state.bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400">No bookings recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.bookings.map(b => `
      <tr class="hover:bg-slate-50">
        <td class="py-3 px-3 font-extrabold text-blue-600">${ServeHubDB.escapeHTML(b.id)}</td>
        <td class="py-3 px-3">
          <div class="font-bold text-slate-900">${ServeHubDB.escapeHTML(b.customerName)}</div>
          <div class="text-slate-500">${ServeHubDB.escapeHTML(b.customerPhone)}</div>
          ${b.customerEmail ? `<div class="text-[11px] text-blue-600">${ServeHubDB.escapeHTML(b.customerEmail)}</div>` : ''}
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
          <button onclick="AdminApp.deleteBooking('${b.id}')" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold" title="Delete Booking">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  async updateBookingStatus(bookingId, status) {
    const state = ServeHubDB.getState();
    const b = state.bookings.find(item => item.id === bookingId);
    if (!b) return;

    b.status = status;
    await ServeHubDB.saveState(state);
    this.renderDashboard();
    this.notify(`Booking ${bookingId} updated to ${status}. Notifying client...`);

    // Dispatch live job status email to customer
    if (b.customerEmail) {
      await this.dispatchEmailNotification(
        b.customerEmail,
        `🔔 Job Progress Update [${b.id}]: ${status}`,
        {
          Booking_Reference: b.id,
          Updated_Status: status,
          Assigned_Professional: b.proName,
          Professional_Phone: b.proPhone || 'N/A',
          Service_Booked: b.serviceTitle,
          Scheduled_Visit: `${b.preferredDate} (${b.preferredTime})`,
          Total_Estimate: ServeHubDB.formatCurrency(b.amount)
        }
      );
    }
  },

  async deleteBooking(bookingId) {
    if (!confirm(`Delete booking ${bookingId}?`)) return;
    const state = ServeHubDB.getState();
    state.bookings = state.bookings.filter(b => b.id !== bookingId);
    await ServeHubDB.saveState(state);
    this.renderDashboard();
    this.notify('Booking deleted.');
  },

  /* ========================================================================
     6. PROFESSIONALS VERIFICATION, MODERATION & EMAIL ALERTS
     ======================================================================== */
  renderProsTable(state) {
    const tbody = document.getElementById('adm-pros-tbody');
    if (!tbody) return;

    if (!state.professionals || state.professionals.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400">No professionals registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.professionals.map(p => {
      const pendingSub = p.pendingSubscription;
      const subApprovalHTML = pendingSub && pendingSub.status === 'pending_approval' ? `
        <div class="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px]">
          <span class="font-extrabold text-amber-800">Pending ${pendingSub.planTier.toUpperCase()} Request</span>
          <p class="text-slate-600 font-mono">Ref: ${ServeHubDB.escapeHTML(pendingSub.txnRef)}</p>
          <div class="mt-1 flex items-center gap-2">
            <a href="${pendingSub.receiptImage}" target="_blank" class="text-blue-600 font-bold underline">View Receipt</a>
            <button onclick="AdminApp.approveSubscription('${p.id}')" class="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">Approve</button>
            <button onclick="AdminApp.rejectSubscription('${p.id}')" class="px-2 py-0.5 rounded bg-rose-600 text-white font-bold">Reject</button>
          </div>
        </div>
      ` : '';

      return `
        <tr class="hover:bg-slate-50">
          <td class="py-3 px-3 flex items-center gap-2.5">
            <img src="${ServeHubDB.escapeHTML(p.avatar)}" class="w-9 h-9 rounded-xl object-cover" />
            <div>
              <div class="font-extrabold text-slate-900">${ServeHubDB.escapeHTML(p.businessName)}</div>
              <div class="text-slate-500">${ServeHubDB.escapeHTML(p.name)} &bull; ${ServeHubDB.escapeHTML(p.phone)}</div>
              ${p.email ? `<div class="text-[11px] text-blue-600">${ServeHubDB.escapeHTML(p.email)}</div>` : ''}
              ${subApprovalHTML}
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
            <button onclick="AdminApp.deletePro('${p.id}')" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold" title="Remove Professional">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  async toggleVerifyPro(proId) {
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === proId);
    if (!pro) return;

    pro.verified = !pro.verified;
    await ServeHubDB.saveState(state);
    this.renderDashboard();
    this.notify(`${pro.businessName} verification set to ${pro.verified}`);

    // Email the professional when their badge status changes
    if (pro.email) {
      await this.dispatchEmailNotification(
        pro.email,
        pro.verified
          ? `🎉 Your Business is Now Verified on ServeHub Pro!`
          : `⚠️ Verification Status Update - ${pro.businessName}`,
        {
          Business_Name: pro.businessName,
          Username: `@${pro.username}`,
          Verification_Status: pro.verified ? 'Verified Badge Active' : 'Unverified / Under Review',
          Category: pro.category,
          Service_Area: pro.location
        }
      );
    }
  },

  async deletePro(proId) {
    if (!confirm('Remove this professional from the platform?')) return;
    const state = ServeHubDB.getState();
    state.professionals = state.professionals.filter(p => p.id !== proId);
    await ServeHubDB.saveState(state);
    this.renderDashboard();
    this.notify('Professional removed.');
  },

  /* ========================================================================
     7. CATEGORIES, CLOUD SYNC & SECURITY SETTINGS
     ======================================================================== */
  renderCategoriesList(state) {
    const list = document.getElementById('adm-categories-list');
    if (!list) return;

    list.innerHTML = (state.categories || []).map(c => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <span class="font-bold text-slate-800"><i class="fa-solid ${ServeHubDB.escapeHTML(c.icon)} text-blue-600 mr-2"></i>${ServeHubDB.escapeHTML(c.name)} (${c.count} pros)</span>
        <button onclick="AdminApp.deleteCategory('${c.id}')" class="text-rose-500 hover:text-rose-700"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join('');
  },

  async addCategory(e) {
    e.preventDefault();
    const name = document.getElementById('new-cat-name').value.trim();
    const icon = document.getElementById('new-cat-icon').value.trim() || 'fa-wrench';
    const state = ServeHubDB.getState();

    state.categories.push({ id: 'cat_' + Date.now(), name, icon, count: 0 });
    await ServeHubDB.saveState(state);
    e.target.reset();
    this.renderDashboard();
    this.notify(`Category "${name}" added.`);
  },

  async deleteCategory(catId) {
    const state = ServeHubDB.getState();
    state.categories = state.categories.filter(c => c.id !== catId);
    await ServeHubDB.saveState(state);
    this.renderDashboard();
    this.notify('Category removed.');
  },

  saveCloudSettings(e) {
    e.preventDefault();
    this.notify('Firebase credentials are configured directly inside js/db.js (FIREBASE_CONFIG).');
  },

  async updateAdminCredentials(e) {
    e.preventDefault();
    const state = ServeHubDB.getState();
    state.settings.adminUsername = document.getElementById('sec-admin-user').value.trim();
    state.settings.adminPassword = document.getElementById('sec-admin-pass').value.trim();
    await ServeHubDB.saveState(state);
    document.getElementById('sec-admin-pass').value = '';
    this.notify('Admin login credentials updated globally!');
  },

  async syncNow(direction) {
    if (direction === 'push') {
      const res = await ServeHubDB.pushToCloud();
      this.notify(res.ok ? 'All records synced to Firebase Firestore!' : `Sync failed: ${res.reason}`, res.ok ? 'success' : 'error');
    } else {
      const res = await ServeHubDB.pullFromCloud();
      if (res.ok) {
        this.renderDashboard();
        this.notify('Connected to live Firebase Firestore stream!');
      } else {
        this.notify(`Sync failed: ${res.reason}`, 'error');
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
    reader.onload = async ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.professionals && parsed.bookings) {
          await ServeHubDB.saveState(parsed);
          this.renderDashboard();
          this.notify('Database backup restored and synced to Firebase!');
        }
      } catch {
        this.notify('Invalid JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
  },

  async resetDatabase() {
    if (!confirm('Reset all data back to factory seed defaults?')) return;
    await ServeHubDB.resetToFactory();
    this.renderDashboard();
    this.notify('Database reset to factory defaults.');
  },

  /* ========================================================================
     8. TOAST NOTIFICATIONS
     ======================================================================== */
  notify(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `${type === 'error' ? 'bg-rose-600' : 'bg-slate-900'} text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in`;
    toast.innerHTML = `<span>${ServeHubDB.escapeHTML(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },

  async approveSubscription(proId) {
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === proId);
    if (!pro || !pro.pendingSubscription) return;

    const plan = pro.pendingSubscription.planTier;
    pro.planTier = plan;
    pro.planWeight = plan === 'featured' ? 3 : 2;
    pro.verified = true;
    pro.planExpiry = new Date(Date.now() + 30 * 86400000).toISOString(); // 30 Days validity
    pro.pendingSubscription.status = 'approved';

    await ServeHubDB.saveState(state);
    this.renderDashboard();
    this.notify(`Approved ${plan.toUpperCase()} subscription for ${pro.businessName}!`);

    if (pro.email) {
      await this.dispatchEmailNotification(
        pro.email,
        `🎉 Your ${plan.toUpperCase()} Subscription Has Been Approved!`,
        {
          Business_Name: pro.businessName,
          Activated_Plan: plan.toUpperCase(),
          Valid_Until: pro.planExpiry.split('T')[0]
        }
      );
    }
  },

  async rejectSubscription(proId) {
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === proId);
    if (!pro) return;

    delete pro.pendingSubscription;
    await ServeHubDB.saveState(state);
    this.renderDashboard();
    this.notify('Subscription request rejected.');
  },

  async saveSubscriptionSettings(e) {
    e.preventDefault();
    const state = ServeHubDB.getState();
    if (!state.settings) state.settings = {};

    state.settings.proPlanPrice = Number(document.getElementById('adm-price-pro').value || 5000);
    state.settings.featuredPlanPrice = Number(document.getElementById('adm-price-featured').value || 12000);
    state.settings.planDurationDays = Number(document.getElementById('adm-plan-days').value || 30);
    state.settings.bankName = document.getElementById('adm-bank-name').value.trim();
    state.settings.bankAccountNumber = document.getElementById('adm-bank-num').value.trim();
    state.settings.bankAccountName = document.getElementById('adm-bank-holder').value.trim();
    state.settings.paystackPublicKey = document.getElementById('adm-paystack-key').value.trim();

    await ServeHubDB.saveState(state, true);
    this.renderDashboard();
    this.notify('Subscription prices and payment settings updated globally!');
  },

  async approveSubscription(proId) {
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === proId);
    if (!pro || !pro.pendingSubscription) return;

    const days = Number(state.settings?.planDurationDays || 30);
    const plan = pro.pendingSubscription.planTier;
    pro.planTier = plan;
    pro.planWeight = plan === 'featured' ? 3 : 2;
    pro.verified = true;
    pro.planExpiry = new Date(Date.now() + days * 86400000).toISOString();
    pro.pendingSubscription.status = 'approved';

    await ServeHubDB.saveState(state, true);
    this.renderDashboard();
    this.notify(`Approved ${plan.toUpperCase()} subscription for ${pro.businessName}!`);
  },

// Subcription
  getSubscriptionPlans(state) {
    if (!state.settings) state.settings = {};
    if (!Array.isArray(state.settings.subscriptionPlans) || state.settings.subscriptionPlans.length === 0) {
      state.settings.subscriptionPlans = [
        {
          id: 'plan_pro_monthly',
          name: 'Verified Pro Plan',
          badge: 'Verified Badge',
          price: 5000,
          durationDays: 30,
          tierType: 'pro',
          popular: false,
          features: ['Official Verified Blue Badge', 'Ranked above all Free tier pros', 'Up to 10 itemized services']
        },
        {
          id: 'plan_vip_monthly',
          name: 'Featured VIP Plan',
          badge: 'Top Boost',
          price: 12000,
          durationDays: 30,
          tierType: 'featured',
          popular: true,
          features: ['Pinned to Row 1 of search results', 'Gold Featured Badge & Highlighted Card', 'Direct WhatsApp button on main card']
        }
      ];
    }
    return state.settings.subscriptionPlans;
  },

  renderSubscriptionPlans(state) {
    const container = document.getElementById('adm-plans-list');
    if (!container) return;

    const plans = this.getSubscriptionPlans(state);
    container.innerHTML = plans.map(plan => `
      <div class="p-4 rounded-2xl border ${plan.tierType === 'featured' ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50'} flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${plan.tierType === 'featured' ? 'bg-amber-200 text-amber-900' : 'bg-blue-100 text-blue-800'}">
              ${ServeHubDB.escapeHTML(plan.badge)}
            </span>
            ${plan.popular ? '<span class="px-2 py-0.5 rounded bg-slate-900 text-amber-400 text-[10px] font-black uppercase">Most Popular</span>' : ''}
          </div>
          <h5 class="text-sm font-extrabold text-slate-900 mt-1">${ServeHubDB.escapeHTML(plan.name)}</h5>
          <p class="text-xs font-extrabold text-blue-600 mt-0.5">${ServeHubDB.formatCurrency(plan.price)} <span class="text-slate-500 font-normal">/ ${plan.durationDays} days</span></p>
          <ul class="mt-2 space-y-1 text-[11px] text-slate-600">
            ${(plan.features || []).map(f => `<li>• ${ServeHubDB.escapeHTML(f)}</li>`).join('')}
          </ul>
        </div>
        <button onclick="AdminApp.deleteSubscriptionPlan('${plan.id}')" class="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold shrink-0" title="Delete Plan">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');
  },

  async createSubscriptionPlan(e) {
    e.preventDefault();
    const state = ServeHubDB.getState();
    const plans = this.getSubscriptionPlans(state);

    const name = document.getElementById('new-plan-name').value.trim();
    const badge = document.getElementById('new-plan-badge').value.trim();
    const tierType = document.getElementById('new-plan-tier').value;
    const price = Number(document.getElementById('new-plan-price').value || 5000);
    const durationDays = Number(document.getElementById('new-plan-days').value || 30);
    const popular = document.getElementById('new-plan-popular').checked;
    const featuresRaw = document.getElementById('new-plan-features').value;
    const features = featuresRaw.split(',').map(s => s.trim()).filter(Boolean);

    plans.push({
      id: 'plan_' + Date.now(),
      name,
      badge,
      price,
      durationDays,
      tierType,
      popular,
      features: features.length ? features : ['Verified Boost & Priority Placement']
    });

    await ServeHubDB.saveState(state, true);
    e.target.reset();
    this.renderDashboard();
    this.notify(`Created new plan: "${name}"!`);
  },

  async deleteSubscriptionPlan(planId) {
    const state = ServeHubDB.getState();
    const plans = this.getSubscriptionPlans(state);
    if (plans.length <= 1) {
      this.notify('You must keep at least one active subscription plan.', 'error');
      return;
    }
    state.settings.subscriptionPlans = plans.filter(p => p.id !== planId);
    await ServeHubDB.saveState(state, true);
    this.renderDashboard();
    this.notify('Subscription plan deleted.');
  },

  async saveGatewaySettings(e) {
    e.preventDefault();
    const state = ServeHubDB.getState();
    if (!state.settings) state.settings = {};
    state.settings.bankName = document.getElementById('adm-bank-name').value.trim();
    state.settings.bankAccountNumber = document.getElementById('adm-bank-num').value.trim();
    state.settings.bankAccountName = document.getElementById('adm-bank-holder').value.trim();
    state.settings.paystackPublicKey = document.getElementById('adm-paystack-key').value.trim();

    await ServeHubDB.saveState(state, true);
    this.renderDashboard();
    this.notify('Bank & Paystack settings updated!');
  },

  async approveSubscription(proId) {
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === proId);
    if (!pro || !pro.pendingSubscription) return;

    const sub = pro.pendingSubscription;
    const days = Number(sub.durationDays || 30);
    const tier = sub.planTier || 'pro';

    pro.planId = sub.planId || '';
    pro.planName = sub.planName || (tier === 'featured' ? 'Featured VIP Plan' : 'Verified Pro Plan');
    pro.planTier = tier;
    pro.planWeight = tier === 'featured' ? 3 : 2;
    pro.verified = true;
    pro.planExpiry = new Date(Date.now() + days * 86400000).toISOString();
    pro.pendingSubscription.status = 'approved';

    await ServeHubDB.saveState(state, true);
    this.renderDashboard();
    this.notify(`Approved ${pro.planName} (${days} days) for ${pro.businessName}!`);
  },

};

// Expose AdminApp globally so inline onclick="AdminApp.*" handlers work with ES modules
window.AdminApp = AdminApp;

document.addEventListener('DOMContentLoaded', () => AdminApp.init());