/**
 * ============================================================================
 * SERVEHUB PRO - FRONTEND & POPUP AUTH CONTROLLER (js/app.js)
 * Features:
 * - Real-time Firebase Firestore synchronization via ServeHubDB.initRealtimeSync()
 * - Automated Email Alerts (FormSubmit AJAX) for New Bookings & Job Progress
 * - Popup Modal for Pro Login & Registration
 * - Strict role-based navigation isolation + global window.App binding
 * ============================================================================
 */

const App = {
    activeCategory: 'All',
    activeTab: 'marketplace',
    activeProWorkspaceTab: 'bookings',

    /* ========================================================================
       1. INITIALIZATION & REAL-TIME FIREBASE SYNC
       ======================================================================== */
    async init() {
        this.renderAll();

        window.addEventListener('storage', () => {
            this.renderAll();
        });

        if (typeof ServeHubDB !== 'undefined' && ServeHubDB.initRealtimeSync) {
            await ServeHubDB.initRealtimeSync(() => {
                this.renderAll();
            });
        }
    },

    renderAll() {
        this.syncRoleNavigationUI();
        this.renderCategories();
        this.renderMarketplace();
        this.populateCategorySelect();
        this.renderProPortalState();
    },

    /* ========================================================================
       2. ZERO-BACKEND EMAIL DISPATCHER (FALLBACK-SAFE)
       Uses ServeHubDB.sendEmailAlert if present, or dispatches directly via AJAX
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
                    Platform: 'ServeHub Pro Marketplace',
                    ...payloadData
                })
            });
            return { ok: response.ok };
        } catch (err) {
            console.warn('Email Dispatch Warning:', err);
            return { ok: false };
        }
    },

    /* ========================================================================
       3. POPUP AUTH MODAL CONTROLS (LOGIN & REGISTER)
       ======================================================================== */
    openAuthModal(mode = 'login') {
        const modal = document.getElementById('auth-modal');
        const loginDiv = document.getElementById('auth-modal-login');
        const registerDiv = document.getElementById('auth-modal-register');
        if (!modal) return;

        this.populateCategorySelect();
        modal.classList.remove('hidden');
        loginDiv?.classList.toggle('hidden', mode !== 'login');
        registerDiv?.classList.toggle('hidden', mode !== 'register');
    },

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('hidden');
    },

    switchAuthModal(mode) {
        const loginDiv = document.getElementById('auth-modal-login');
        const registerDiv = document.getElementById('auth-modal-register');
        if (!loginDiv || !registerDiv) return;

        this.populateCategorySelect();
        loginDiv.classList.toggle('hidden', mode !== 'login');
        registerDiv.classList.toggle('hidden', mode !== 'register');
    },

    /* ========================================================================
       4. ROLE-BASED NAVIGATION ISOLATION (GUEST vs LOGGED-IN PRO)
       ======================================================================== */
    syncRoleNavigationUI() {
        const activePro = ServeHubDB.getActivePro();
        const isProLoggedIn = Boolean(activePro);

        const publicAnnouncement = document.getElementById('public-announcement-bar');
        const publicDesktopNav = document.getElementById('public-desktop-nav');
        const publicHeaderActions = document.getElementById('public-header-actions');
        const publicMobileNav = document.getElementById('public-mobile-nav');
        const publicFooter = document.getElementById('public-footer');

        const proDesktopNav = document.getElementById('pro-desktop-nav');
        const proHeaderActions = document.getElementById('pro-header-actions');
        const proMobileNav = document.getElementById('pro-mobile-nav');
        const proWorkspaceFooter = document.getElementById('pro-workspace-footer');
        const brandSubtitle = document.getElementById('brand-subtitle-badge');

        if (isProLoggedIn) {
            publicAnnouncement?.classList.add('hidden');
            publicDesktopNav?.classList.add('hidden');
            publicDesktopNav?.classList.remove('md:flex');
            publicHeaderActions?.classList.add('hidden');
            publicMobileNav?.classList.add('hidden');
            publicMobileNav?.classList.remove('flex');
            publicFooter?.classList.add('hidden');

            proDesktopNav?.classList.remove('hidden');
            proDesktopNav?.classList.add('md:flex');
            proHeaderActions?.classList.remove('hidden');
            proHeaderActions?.classList.add('flex');
            proMobileNav?.classList.remove('hidden');
            proMobileNav?.classList.add('flex');
            proWorkspaceFooter?.classList.remove('hidden');

            if (brandSubtitle) {
                brandSubtitle.textContent = 'Pro Workspace';
                brandSubtitle.className = 'block text-[10px] font-extrabold uppercase tracking-widest text-blue-600 -mt-1';
            }

            const footerUser = document.getElementById('footer-pro-username');
            if (footerUser) footerUser.textContent = `@${activePro.username}`;

            document.getElementById('view-marketplace')?.classList.add('hidden');
            document.getElementById('view-tracker')?.classList.add('hidden');
            document.getElementById('view-pro-portal')?.classList.remove('hidden');
        } else {
            publicAnnouncement?.classList.remove('hidden');
            publicDesktopNav?.classList.remove('hidden');
            publicDesktopNav?.classList.add('md:flex');
            publicHeaderActions?.classList.remove('hidden');
            publicMobileNav?.classList.remove('hidden');
            publicMobileNav?.classList.add('flex');
            publicFooter?.classList.remove('hidden');

            proDesktopNav?.classList.add('hidden');
            proDesktopNav?.classList.remove('md:flex');
            proHeaderActions?.classList.add('hidden');
            proHeaderActions?.classList.remove('flex');
            proMobileNav?.classList.add('hidden');
            proMobileNav?.classList.remove('flex');
            proWorkspaceFooter?.classList.add('hidden');

            if (brandSubtitle) {
                brandSubtitle.textContent = 'Verified Pros';
                brandSubtitle.className = 'block text-[10px] font-bold uppercase tracking-widest text-slate-400 -mt-1';
            }

            document.getElementById('view-pro-portal')?.classList.add('hidden');
            document.getElementById(`view-${this.activeTab}`)?.classList.remove('hidden');
        }
    },

    handleLogoClick() {
        if (ServeHubDB.getActivePro()) {
            this.switchProWorkspaceTab('bookings');
        } else {
            this.switchTab('marketplace');
        }
    },

    switchTab(tabId) {
        if (ServeHubDB.getActivePro()) {
            this.syncRoleNavigationUI();
            return;
        }

        this.activeTab = tabId;
        const views = ['marketplace', 'tracker'];

        views.forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if (el) el.classList.toggle('hidden', v !== tabId);

            const navBtn = document.getElementById(`nav-${v}`);
            if (navBtn) {
                navBtn.className = v === tabId
                    ? 'nav-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-white text-blue-600 shadow-sm'
                    : 'nav-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all text-slate-600 hover:text-slate-900';
            }

            const mnavBtn = document.getElementById(`mnav-${v}`);
            if (mnavBtn) {
                mnavBtn.className = v === tabId
                    ? 'flex-1 py-1.5 text-xs font-bold text-blue-600 border-b-2 border-blue-600'
                    : 'flex-1 py-1.5 text-xs font-bold text-slate-500';
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    switchProWorkspaceTab(subTab) {
        this.activeProWorkspaceTab = subTab;
        const tabs = ['bookings', 'services', 'profile', 'boost'];

        tabs.forEach(t => {
            const panel = document.getElementById(`pro-tab-${t}`);
            if (panel) panel.classList.toggle('hidden', t !== subTab);

            const dBtn = document.getElementById(`pnav-${t}`);
            if (dBtn) {
                dBtn.className = t === subTab
                    ? 'px-4 py-2 rounded-lg text-xs font-extrabold transition-all bg-white text-blue-600 shadow-sm'
                    : 'px-4 py-2 rounded-lg text-xs font-extrabold transition-all text-slate-600 hover:text-slate-900';
            }

            const mBtn = document.getElementById(`mpnav-${t}`);
            if (mBtn) {
                mBtn.className = t === subTab
                    ? 'flex-1 py-1.5 text-xs font-bold text-blue-600 border-b-2 border-blue-600'
                    : 'flex-1 py-1.5 text-xs font-bold text-slate-500';
            }
        });
    },

    previewMyShowroom() {
        const activePro = ServeHubDB.getActivePro();
        if (activePro) this.openShowroom(activePro.id);
    },

    /* ========================================================================
       5. MARKETPLACE & DIRECTORY RENDERING
       ======================================================================== */
    renderCategories() {
        const state = ServeHubDB.getState();
        const container = document.getElementById('category-pills-container');
        if (!container) return;

        const totalPros = state.professionals.length;
        let html = `
      <button onclick="App.selectCategory('All')" class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition ${this.activeCategory === 'All'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
            }">
        <i class="fa-solid fa-border-all"></i> All Services
        <span class="px-2 py-0.5 rounded-full text-[10px] ${this.activeCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }">${totalPros}</span>
      </button>
    `;

        state.categories.forEach(cat => {
            const active = this.activeCategory === cat.name;
            html += `
        <button onclick="App.selectCategory('${ServeHubDB.escapeHTML(cat.name)}')" class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition ${active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
                }">
          <i class="fa-solid ${ServeHubDB.escapeHTML(cat.icon)}"></i>
          <span>${ServeHubDB.escapeHTML(cat.name)}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }">${cat.count}</span>
        </button>
      `;
        });

        container.innerHTML = html;
    },

    selectCategory(catName) {
        this.activeCategory = catName;
        this.renderCategories();
        this.renderMarketplace();
    },

    resetFilters() {
        this.activeCategory = 'All';
        const kw = document.getElementById('search-keyword');
        const loc = document.getElementById('search-location');
        const ver = document.getElementById('filter-verified');
        const avail = document.getElementById('filter-available');

        if (kw) kw.value = '';
        if (loc) loc.value = '';
        if (ver) ver.checked = false;
        if (avail) avail.checked = false;

        this.renderCategories();
        this.renderMarketplace();
    },

  renderMarketplace() {
    const state = ServeHubDB.getState();
    const keyword = (document.getElementById('search-keyword')?.value || '').trim().toLowerCase();
    const location = (document.getElementById('search-location')?.value || '').trim().toLowerCase();
    const verifiedOnly = document.getElementById('filter-verified')?.checked || false;
    const availableOnly = document.getElementById('filter-available')?.checked || false;
    const sortBy = document.getElementById('sort-pros')?.value || 'featured';

    const now = Date.now();
    const getEffectiveWeight = (pro) => {
      if (!pro.planExpiry || new Date(pro.planExpiry).getTime() <= now) return 1;
      if (pro.planTier === 'featured') return 3;
      if (pro.planTier === 'pro') return 2;
      return Number(pro.planWeight || 1);
    };

    let filtered = state.professionals.filter(pro => {
      const matchCat = this.activeCategory === 'All' || pro.category === this.activeCategory;
      const matchLoc = !location || pro.location.toLowerCase().includes(location);
      const matchVer = !verifiedOnly || pro.verified;
      const matchAvail = !availableOnly || pro.available;

      const searchableText = [
        pro.name,
        pro.businessName,
        pro.category,
        pro.bio,
        ...(pro.services || []).map(s => s.title)
      ].join(' ').toLowerCase();

      const matchKey = !keyword || searchableText.includes(keyword);
      return matchCat && matchLoc && matchVer && matchAvail && matchKey;
    });

    filtered.sort((a, b) => {
      const weightDiff = getEffectiveWeight(b) - getEffectiveWeight(a);
      if (weightDiff !== 0) return weightDiff;

      if (sortBy === 'price-asc') return a.baseRate - b.baseRate;
      if (sortBy === 'price-desc') return b.baseRate - a.baseRate;
      if (sortBy === 'jobs-desc') return b.completedJobs - a.completedJobs;
      return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
    });

    const countEl = document.getElementById('pro-results-count');
    if (countEl) countEl.textContent = filtered.length;
    const grid = document.getElementById('professionals-grid');
    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl mb-3">
            <i class="fa-solid fa-user-slash"></i>
          </div>
          <h3 class="text-lg font-extrabold text-slate-900">No Matching Professionals Found</h3>
          <p class="text-xs text-slate-500 mt-1">Try clearing your search filters or selecting another service category.</p>
          <button onclick="App.resetFilters()" class="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">Reset Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(pro => {
      const rating = ServeHubDB.calculateRating(pro);
      const topServices = (pro.services || []).slice(0, 2);
      const weight = getEffectiveWeight(pro);
      const isFeatured = weight === 3;
      const cleanPhone = (pro.phone || '').replace(/\D/g, '');
      const waText = encodeURIComponent(`Hello ${pro.businessName}, I saw your Featured VIP profile on ServeHub Pro and would like to inquire about your services.`);

      const cardClasses = isFeatured
        ? 'pro-card bg-gradient-to-b from-amber-50/60 via-white to-white rounded-3xl border-2 border-amber-400 shadow-lg shadow-amber-500/10 overflow-hidden flex flex-col justify-between relative'
        : 'pro-card bg-white rounded-3xl border border-slate-200/90 overflow-hidden flex flex-col justify-between';

      const featuredBanner = isFeatured
        ? `<div class="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider flex items-center justify-between">
             <span><i class="fa-solid fa-crown mr-1"></i> Featured VIP Pro</span>
             <span class="bg-slate-950/15 px-2 py-0.5 rounded text-[10px]">Top Recommended</span>
           </div>`
        : '';

      return `
        <article class="${cardClasses}">
          <div>
            ${featuredBanner}
            <div class="p-6">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3.5">
                  <img src="${ServeHubDB.escapeHTML(pro.avatar)}" alt="${ServeHubDB.escapeHTML(pro.businessName)}" class="w-14 h-14 rounded-2xl object-cover border-2 ${isFeatured ? 'border-amber-400' : 'border-slate-200'}" />
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="inline-block text-[11px] font-extrabold uppercase tracking-wider ${isFeatured ? 'text-amber-600' : 'text-blue-600'}">${ServeHubDB.escapeHTML(pro.category)}</span>
                      ${isFeatured ? '<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">👑 VIP</span>' : ''}
                    </div>
                    <h3 class="font-extrabold text-slate-900 text-base leading-snug flex items-center gap-1.5">
                      ${ServeHubDB.escapeHTML(pro.businessName)}
                      ${pro.verified ? '<i class="fa-solid fa-circle-check text-blue-600 text-sm" title="Verified Professional"></i>' : ''}
                    </h3>
                    <p class="text-xs text-slate-500 font-medium">${ServeHubDB.escapeHTML(pro.name)} &bull; ${ServeHubDB.escapeHTML(pro.location)}</p>
                  </div>
                </div>
                <span class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  pro.available ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }">
                  <span class="w-1.5 h-1.5 rounded-full ${pro.available ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                  ${pro.available ? 'Available' : 'Busy'}
                </span>
              </div>

              <p class="mt-3.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">${ServeHubDB.escapeHTML(pro.bio)}</p>

              <div class="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-2xl ${isFeatured ? 'bg-amber-50/70 border border-amber-200/70' : 'bg-slate-50 border border-slate-100'} text-center">
                <div>
                  <span class="block text-xs font-extrabold text-slate-900"><i class="fa-solid fa-star text-amber-400 mr-1"></i>${rating}</span>
                  <span class="text-[10px] text-slate-400 font-semibold">${(pro.reviews || []).length} reviews</span>
                </div>
                <div class="border-x border-slate-200/70">
                  <span class="block text-xs font-extrabold text-slate-900">${pro.completedJobs}</span>
                  <span class="text-[10px] text-slate-400 font-semibold">Jobs Done</span>
                </div>
                <div>
                  <span class="block text-xs font-extrabold ${isFeatured ? 'text-amber-600' : 'text-blue-600'}">${ServeHubDB.formatCurrency(pro.baseRate)}</span>
                  <span class="text-[10px] text-slate-400 font-semibold">Starts From</span>
                </div>
              </div>

              <div class="mt-4 space-y-1.5">
                <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Popular Services</p>
                ${topServices.map(s => `
                  <div class="flex items-center justify-between text-xs bg-slate-50/70 px-3 py-1.5 rounded-xl">
                    <span class="text-slate-700 font-medium truncate pr-2">${ServeHubDB.escapeHTML(s.title)}</span>
                    <span class="font-bold text-slate-900 shrink-0">${ServeHubDB.formatCurrency(s.price)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="px-6 py-4 ${isFeatured ? 'bg-amber-50/50 border-t border-amber-200/60' : 'bg-slate-50/80 border-t border-slate-100'} flex items-center gap-2">
            <button onclick="App.openShowroom('${pro.id}')" class="flex-1 py-2.5 px-4 rounded-xl ${isFeatured ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold' : 'bg-slate-900 hover:bg-blue-600 text-white font-bold'} text-xs transition flex items-center justify-center gap-2">
              <span>${isFeatured ? 'Book VIP Pro' : 'View Showroom & Book Now'}</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
            ${isFeatured ? `
              <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" rel="noopener" title="Direct WhatsApp Chat" class="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-sm">
                <i class="fa-brands fa-whatsapp text-sm"></i>
                <span>WhatsApp</span>
              </a>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');
  },

    /* ========================================================================
       6. SHOWROOM MODAL, REVIEWS & BOOKING CREATION (WITH EMAIL INPUT)
       ======================================================================== */
    openShowroom(proId) {
        const state = ServeHubDB.getState();
        const pro = state.professionals.find(p => p.id === proId);
        if (!pro) return;

        const rating = ServeHubDB.calculateRating(pro);
        const modal = document.getElementById('showroom-modal');
        const body = document.getElementById('showroom-modal-body');

        body.innerHTML = `
      <div class="bg-slate-900 text-white p-6 sm:p-8 flex items-start justify-between gap-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <img src="${ServeHubDB.escapeHTML(pro.avatar)}" class="w-20 h-20 rounded-2xl object-cover border-2 border-blue-400" />
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300">${ServeHubDB.escapeHTML(pro.category)}</span>
              ${pro.verified ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300"><i class="fa-solid fa-circle-check mr-1"></i>Verified Business</span>' : ''}
            </div>
            <h2 class="text-2xl font-extrabold mt-1">${ServeHubDB.escapeHTML(pro.businessName)}</h2>
            <p class="text-xs text-slate-300">${ServeHubDB.escapeHTML(pro.name)} &bull; <i class="fa-solid fa-location-dot text-blue-400 mx-1"></i>${ServeHubDB.escapeHTML(pro.location)} &bull; ${pro.yearsExp} Yrs Exp.</p>
          </div>
        </div>
        <button onclick="App.closeShowroom()" class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-7 space-y-6">
          <div>
            <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">About This Professional</h3>
            <p class="text-sm text-slate-700 leading-relaxed">${ServeHubDB.escapeHTML(pro.bio)}</p>
          </div>

          <div>
            <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">Standard Service Price Menu</h3>
            <div class="space-y-2">
              ${(pro.services || []).map(s => `
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span class="text-xs font-bold text-slate-800">${ServeHubDB.escapeHTML(s.title)}</span>
                  <span class="text-xs font-extrabold text-blue-600">${ServeHubDB.formatCurrency(s.price)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Verified Client Reviews (${(pro.reviews || []).length}) &bull; <span class="text-amber-500"><i class="fa-solid fa-star"></i> ${rating}</span>
              </h3>
            </div>

            <div class="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              ${(pro.reviews || []).map(r => `
                <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-slate-900">${ServeHubDB.escapeHTML(r.client)}</span>
                    <span class="text-amber-500">${'★'.repeat(r.rating)}</span>
                  </div>
                  <p class="text-xs text-slate-600 mt-1">${ServeHubDB.escapeHTML(r.comment)}</p>
                </div>
              `).join('')}
            </div>

            <form onsubmit="App.submitReview(event, '${pro.id}')" class="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <p class="text-xs font-bold text-slate-700">Worked with ${ServeHubDB.escapeHTML(pro.businessName)}? Leave a review:</p>
              <div class="grid grid-cols-2 gap-2">
                <input id="rev-client-name" type="text" required placeholder="Your Name" class="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white" />
                <select id="rev-rating" class="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white">
                  <option value="5">★★★★★ (5/5 Excellent)</option>
                  <option value="4">★★★★☆ (4/5 Good)</option>
                  <option value="3">★★★☆☆ (3/5 Average)</option>
                </select>
              </div>
              <input id="rev-comment" type="text" required placeholder="Share your experience..." class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white" />
              <button type="submit" class="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold">Post Review</button>
            </form>
          </div>
        </div>

        <div class="lg:col-span-5">
          <div class="bg-slate-50 rounded-3xl p-5 border border-slate-200 sticky top-4">
            <h3 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <i class="fa-solid fa-calendar-plus text-blue-600"></i> Book This Professional
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Select a service below for an instant estimate and live email confirmation.</p>

            <form onsubmit="App.submitBooking(event, '${pro.id}')" class="mt-4 space-y-3">
              <div>
                <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Required Service *</label>
                <select id="book-service-select" onchange="App.updateBookingEstimate('${pro.id}')" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white">
                  ${(pro.services || []).map(s => `
                    <option value="${ServeHubDB.escapeHTML(s.title)}" data-price="${s.price}">
                      ${ServeHubDB.escapeHTML(s.title)} — ${ServeHubDB.formatCurrency(s.price)}
                    </option>
                  `).join('')}
                  <option value="General Inspection & Custom Quote" data-price="${pro.baseRate}">
                    General Inspection / Custom Job — ${ServeHubDB.formatCurrency(pro.baseRate)}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Urgency Level *</label>
                <select id="book-urgency" onchange="App.updateBookingEstimate('${pro.id}')" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white">
                  <option value="Standard" data-surcharge="0">Standard Scheduled Visit (+₦0)</option>
                  <option value="Emergency" data-surcharge="5000">Urgent Same-Day Express (+₦5,000)</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Preferred Date *</label>
                  <input id="book-date" type="date" required class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Preferred Time *</label>
                  <select id="book-time" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
                    <option>09:00 AM</option>
                    <option>11:00 AM</option>
                    <option>02:00 PM</option>
                    <option>04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Your Full Name *</label>
                <input id="book-client-name" type="text" required placeholder="e.g. Chidi Nwosu" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Phone / WhatsApp *</label>
                  <input id="book-client-phone" type="tel" required placeholder="e.g. 08031234567" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Your Email (Updates) *</label>
                  <input id="book-client-email" type="email" required placeholder="client@email.com" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white" />
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Service Address *</label>
                <input id="book-client-address" type="text" required placeholder="Street, Estate & City" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white" />
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Job Notes / Fault Description</label>
                <textarea id="book-notes" rows="2" placeholder="Briefly describe what needs fixing..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"></textarea>
              </div>

              <div class="p-3.5 rounded-2xl bg-blue-600 text-white flex items-center justify-between">
                <span class="text-xs font-bold">Estimated Total:</span>
                <span id="book-live-total" class="text-lg font-extrabold">${ServeHubDB.formatCurrency((pro.services[0]?.price) || pro.baseRate)}</span>
              </div>

              <button type="submit" class="w-full py-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg">
                Confirm & Send Booking Alerts
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

        const dateInput = document.getElementById('book-date');
        if (dateInput) {
            dateInput.value = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        }

        modal.classList.remove('hidden');
    },

    updateBookingEstimate() {
        const srvSelect = document.getElementById('book-service-select');
        const urgSelect = document.getElementById('book-urgency');
        if (!srvSelect || !urgSelect) return;

        const basePrice = Number(srvSelect.options[srvSelect.selectedIndex]?.dataset.price || 0);
        const surcharge = Number(urgSelect.options[urgSelect.selectedIndex]?.dataset.surcharge || 0);
        document.getElementById('book-live-total').textContent = ServeHubDB.formatCurrency(basePrice + surcharge);
    },

    closeShowroom() {
        document.getElementById('showroom-modal').classList.add('hidden');
    },

    async submitReview(e, proId) {
        e.preventDefault();
        const state = ServeHubDB.getState();
        const pro = state.professionals.find(p => p.id === proId);
        if (!pro) return;

        if (!Array.isArray(pro.reviews)) pro.reviews = [];
        pro.reviews.unshift({
            id: 'rev_' + Date.now(),
            client: document.getElementById('rev-client-name').value.trim(),
            rating: Number(document.getElementById('rev-rating').value),
            date: new Date().toISOString().split('T')[0],
            comment: document.getElementById('rev-comment').value.trim()
        });

        await ServeHubDB.saveState(state);
        this.openShowroom(proId);
        this.renderMarketplace();
        this.notify('Review posted! Thank you for your feedback.');
    },

    /* ========================================================================
       7. BOOKING SUBMISSION, DUAL EMAIL ALERTS & LIVE TRACKER
       ======================================================================== */
    async submitBooking(e, proId) {
        e.preventDefault();
        const state = ServeHubDB.getState();
        const pro = state.professionals.find(p => p.id === proId);
        if (!pro) return;

        const srvSelect = document.getElementById('book-service-select');
        const urgSelect = document.getElementById('book-urgency');
        const basePrice = Number(srvSelect.options[srvSelect.selectedIndex]?.dataset.price || pro.baseRate);
        const surcharge = Number(urgSelect.options[urgSelect.selectedIndex]?.dataset.surcharge || 0);

        const newBooking = {
            id: 'SHB-' + Math.floor(1000 + Math.random() * 9000),
            proId: pro.id,
            proName: `${pro.name} (${pro.businessName})`,
            proPhone: pro.phone,
            proEmail: pro.email || state.settings?.notifyEmail || 'idrisabubakry@gmail.com',
            proCategory: pro.category,
            customerName: document.getElementById('book-client-name').value.trim(),
            customerPhone: document.getElementById('book-client-phone').value.trim(),
            customerEmail: document.getElementById('book-client-email').value.trim(),
            customerAddress: document.getElementById('book-client-address').value.trim(),
            serviceTitle: srvSelect.value,
            amount: basePrice + surcharge,
            preferredDate: document.getElementById('book-date').value,
            preferredTime: document.getElementById('book-time').value,
            urgency: urgSelect.value,
            notes: document.getElementById('book-notes').value.trim() || 'None',
            status: 'Pending',
            createdAt: new Date().toLocaleString(),
            createdAtMs: Date.now()
        };

        state.bookings.unshift(newBooking);
        await ServeHubDB.saveState(state);

        this.closeShowroom();
        this.showBookingReceipt(newBooking);
        this.notify(`Booking ${newBooking.id} confirmed! Sending email alerts...`);

        // 1. Dispatch New Booking Alert Email to the Professional
        this.dispatchEmailNotification(
            newBooking.proEmail,
            `🚨 New Booking Request [${newBooking.id}] - ${newBooking.serviceTitle}`,
            {
                Booking_Reference: newBooking.id,
                Service_Requested: newBooking.serviceTitle,
                Estimated_Amount: ServeHubDB.formatCurrency(newBooking.amount),
                Urgency: newBooking.urgency,
                Preferred_Schedule: `${newBooking.preferredDate} at ${newBooking.preferredTime}`,
                Client_Name: newBooking.customerName,
                Client_Phone: newBooking.customerPhone,
                Client_Email: newBooking.customerEmail,
                Service_Address: newBooking.customerAddress,
                Job_Notes: newBooking.notes
            }
        );

        // 2. Dispatch Instant Confirmation Email to the Customer
        this.dispatchEmailNotification(
            newBooking.customerEmail,
            `✅ Booking Confirmed [${newBooking.id}] - ${pro.businessName}`,
            {
                Booking_Reference: newBooking.id,
                Current_Status: 'Pending Professional Confirmation',
                Assigned_Professional: newBooking.proName,
                Professional_Phone: newBooking.proPhone,
                Service_Booked: newBooking.serviceTitle,
                Estimated_Total: ServeHubDB.formatCurrency(newBooking.amount),
                Scheduled_Visit: `${newBooking.preferredDate} at ${newBooking.preferredTime}`,
                Service_Address: newBooking.customerAddress
            }
        );
    },

    showBookingReceipt(b) {
        const modal = document.getElementById('receipt-modal');
        const body = document.getElementById('receipt-modal-body');

        const waMessage = encodeURIComponent(
            `Hello ${b.proName},\n\n` +
            `I have just booked your service on *ServeHub Pro*!\n` +
            `• *Booking Ref:* ${b.id}\n` +
            `• *Service:* ${b.serviceTitle}\n` +
            `• *Est. Amount:* ${ServeHubDB.formatCurrency(b.amount)}\n` +
            `• *Date & Time:* ${b.preferredDate} at ${b.preferredTime}\n` +
            `• *Address:* ${b.customerAddress}\n` +
            `• *Client:* ${b.customerName} (${b.customerPhone})\n` +
            `• *Notes:* ${b.notes}\n\n` +
            `Please confirm your availability.`
        );

        const cleanPhone = (b.proPhone || '').replace(/\D/g, '');

        body.innerHTML = `
      <div class="text-center">
        <div class="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl mb-3">
          <i class="fa-solid fa-check-double"></i>
        </div>
        <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold">Booking Ref: ${b.id}</span>
        <h3 class="text-xl font-extrabold text-slate-900 mt-2">Booking Request Logged!</h3>
        <p class="text-xs text-slate-500 mt-1">Email confirmation sent to <strong>${ServeHubDB.escapeHTML(b.customerEmail || 'your inbox')}</strong>.</p>
      </div>

      <div class="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
        <div class="flex justify-between"><span class="text-slate-500">Professional:</span><span class="font-bold text-slate-900">${ServeHubDB.escapeHTML(b.proName)}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Service:</span><span class="font-bold text-slate-900">${ServeHubDB.escapeHTML(b.serviceTitle)}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Schedule:</span><span class="font-bold text-slate-900">${ServeHubDB.escapeHTML(b.preferredDate)} (${ServeHubDB.escapeHTML(b.preferredTime)})</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Client:</span><span class="font-bold text-slate-900">${ServeHubDB.escapeHTML(b.customerName)}</span></div>
        <div class="flex justify-between pt-2 border-t border-slate-200"><span class="text-slate-700 font-bold">Total Estimate:</span><span class="font-extrabold text-blue-600 text-sm">${ServeHubDB.formatCurrency(b.amount)}</span></div>
      </div>

      <div class="mt-6 space-y-2.5 no-print">
        <a href="https://wa.me/${cleanPhone}?text=${waMessage}" target="_blank" rel="noopener" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
          <i class="fa-brands fa-whatsapp text-base"></i> Send Instant Alert on WhatsApp
        </a>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="window.print()" class="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
            <i class="fa-solid fa-print mr-1"></i> Print Receipt
          </button>
          <button onclick="App.closeReceiptAndTrack('${b.id}')" class="py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
            Track Live Status
          </button>
        </div>
      </div>
    `;

        modal.classList.remove('hidden');
    },

    closeReceiptAndTrack(bookingId) {
        document.getElementById('receipt-modal').classList.add('hidden');
        if (!ServeHubDB.getActivePro()) {
            this.switchTab('tracker');
            document.getElementById('tracker-query').value = bookingId;
            this.trackBooking();
        }
    },

    trackBooking() {
        const query = (document.getElementById('tracker-query')?.value || '').trim().toLowerCase();
        const box = document.getElementById('tracker-result-box');
        if (!query || !box) return;

        const state = ServeHubDB.getState();
        const matches = state.bookings.filter(
            b =>
                b.id.toLowerCase() === query ||
                (b.customerPhone || '').toLowerCase().includes(query) ||
                (b.customerEmail || '').toLowerCase() === query
        );

        if (matches.length === 0) {
            box.innerHTML = `
        <div class="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center">
          <p class="text-sm font-bold text-rose-700">No Booking Found for "${ServeHubDB.escapeHTML(query)}"</p>
          <p class="text-xs text-rose-500 mt-1">Check your Reference ID (e.g., SHB-8492), phone number, or email and try again.</p>
        </div>
      `;
            return;
        }

        const stages = ['Pending', 'Confirmed', 'In Progress', 'Completed'];

        box.innerHTML = matches.map(b => {
            const currentIdx = stages.indexOf(b.status);
            return `
        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <span class="text-xs font-extrabold text-blue-600">${ServeHubDB.escapeHTML(b.id)}</span>
              <h4 class="text-base font-extrabold text-slate-900">${ServeHubDB.escapeHTML(b.serviceTitle)}</h4>
              <p class="text-xs text-slate-500">Assigned Pro: <strong>${ServeHubDB.escapeHTML(b.proName)}</strong></p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800">${ServeHubDB.escapeHTML(b.status)}</span>
          </div>

          <div class="grid grid-cols-4 gap-2 my-5">
            ${stages.map((st, idx) => `
              <div class="text-center">
                <div class="h-2 rounded-full ${idx <= currentIdx ? 'bg-blue-600' : 'bg-slate-200'}"></div>
                <span class="block mt-1.5 text-[11px] font-bold ${idx <= currentIdx ? 'text-blue-600' : 'text-slate-400'}">${st}</span>
              </div>
            `).join('')}
          </div>

          <div class="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-2">
            <span><i class="fa-regular fa-calendar mr-1"></i> ${ServeHubDB.escapeHTML(b.preferredDate)} at ${ServeHubDB.escapeHTML(b.preferredTime)}</span>
            <span class="font-extrabold text-slate-900">${ServeHubDB.formatCurrency(b.amount)}</span>
          </div>
        </div>
      `;
        }).join('');
    },

    /* ========================================================================
       8. PRO AUTHENTICATION, EMAIL REGISTRATION & WORKSPACE MANAGEMENT
       ======================================================================== */
    populateCategorySelect() {
        const select = document.getElementById('reg-category');
        if (!select) return;
        const { categories } = ServeHubDB.getState();
        select.innerHTML = categories.map(c => `<option value="${ServeHubDB.escapeHTML(c.name)}">${ServeHubDB.escapeHTML(c.name)}</option>`).join('');
    },

    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        if (input) input.type = input.type === 'password' ? 'text' : 'password';
    },

    fillDemoPro(username, password) {
        document.getElementById('pro-login-username').value = username;
        document.getElementById('pro-login-password').value = password;
        this.notify(`Demo credentials loaded for @${username}. Click Login!`);
    },

    handleProLogin(e) {
        e.preventDefault();
        const username = document.getElementById('pro-login-username').value;
        const password = document.getElementById('pro-login-password').value;

        const res = ServeHubDB.authenticatePro(username, password);
        if (!res.ok) {
            this.notify(res.error, 'error');
            return;
        }

        this.closeAuthModal();
        this.activeProWorkspaceTab = 'bookings';
        this.syncRoleNavigationUI();
        this.renderProPortalState();
        this.switchProWorkspaceTab('bookings');
        this.notify(`Logged in as ${res.pro.businessName}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    handleProLogout() {
        ServeHubDB.logoutPro();
        this.syncRoleNavigationUI();
        this.renderProPortalState();
        this.switchTab('marketplace');
        this.notify('You have logged out of your Pro Workspace.');
    },

    addRegServiceRow() {
        const container = document.getElementById('reg-services-list');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'grid grid-cols-12 gap-2 reg-service-item';
        div.innerHTML = `
      <input type="text" required placeholder="Service title" class="col-span-8 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white reg-srv-title" />
      <input type="number" required placeholder="Price (₦)" class="col-span-4 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white reg-srv-price" />
    `;
        container.appendChild(div);
    },

    async handleProRegistration(e) {
        e.preventDefault();
        const state = ServeHubDB.getState();
        const username = document.getElementById('reg-username').value.trim().toLowerCase();
        const password = document.getElementById('reg-password').value.trim();

        if (state.professionals.some(p => (p.username || '').toLowerCase() === username)) {
            this.notify('Username is already taken. Please choose another one.', 'error');
            return;
        }

        const fileInput = document.getElementById('reg-avatar');
        let avatarData = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
        if (fileInput.files && fileInput.files[0]) {
            try {
                avatarData = await ServeHubDB.compressImage(fileInput.files[0]);
            } catch (err) {
                console.warn('Image compression fallback:', err);
            }
        }

        const serviceRows = document.querySelectorAll('.reg-service-item');
        const services = [];
        serviceRows.forEach((row, idx) => {
            const title = row.querySelector('.reg-srv-title')?.value.trim();
            const price = Number(row.querySelector('.reg-srv-price')?.value || 0);
            if (title && price > 0) {
                services.push({ id: `srv_${Date.now()}_${idx}`, title, price });
            }
        });

        const newPro = {
            id: 'PRO-' + Math.floor(100 + Math.random() * 900),
            username,
            password,
            name: document.getElementById('reg-name').value.trim(),
            businessName: document.getElementById('reg-business').value.trim(),
            category: document.getElementById('reg-category').value,
            location: document.getElementById('reg-location').value.trim(),
            phone: document.getElementById('reg-phone').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            verified: false,
            available: true,
            yearsExp: Number(document.getElementById('reg-exp').value || 3),
            completedJobs: 0,
            baseRate: Number(document.getElementById('reg-rate').value || 10000),
            createdAtMs: Date.now(),
            avatar: avatarData,
            bio: document.getElementById('reg-bio').value.trim(),
            badges: ['Registered Pro'],
            services,
            portfolio: [],
            reviews: []
        };

        state.professionals.unshift(newPro);
        await ServeHubDB.saveState(state);
        ServeHubDB.authenticatePro(username, password);

        e.target.reset();
        this.closeAuthModal();
        this.renderAll();
        this.switchProWorkspaceTab('bookings');
        this.notify('Account created! Welcome to your Pro Workspace.');
    },

    renderProPortalState() {
        const activePro = ServeHubDB.getActivePro();
        const dashView = document.getElementById('view-pro-portal');

        if (!activePro) {
            dashView?.classList.add('hidden');
            return;
        }

        dashView?.classList.remove('hidden');

        document.getElementById('dash-pro-avatar').src = activePro.avatar;
        document.getElementById('dash-pro-business').textContent = activePro.businessName;
        document.getElementById('dash-pro-meta').textContent = `@${activePro.username} • ${activePro.name} • ${activePro.category} (${activePro.location})`;
        document.getElementById('dash-pro-verified-badge').innerHTML = activePro.verified
            ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300"><i class="fa-solid fa-circle-check mr-1"></i>Verified Pro</span>'
            : '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300">Pending Verification</span>';

        const headerAvailBtn = document.getElementById('header-availability-btn');
        if (headerAvailBtn) {
            headerAvailBtn.className = activePro.available
                ? 'px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 transition'
                : 'px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 transition';
            headerAvailBtn.innerHTML = activePro.available
                ? '<span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>Available'
                : '<span class="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>Busy';
        }

        const state = ServeHubDB.getState();
        const myBookings = state.bookings.filter(b => b.proId === activePro.id);
        const pendingCount = myBookings.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled').length;
        const completedBookings = myBookings.filter(b => b.status === 'Completed');
        const revenue = completedBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);

        document.getElementById('dash-kpi-total').textContent = myBookings.length;
        document.getElementById('dash-kpi-pending').textContent = pendingCount;
        document.getElementById('dash-kpi-completed').textContent = activePro.completedJobs + completedBookings.length;
        document.getElementById('dash-kpi-revenue').textContent = ServeHubDB.formatCurrency(revenue);

        const bookingsList = document.getElementById('dash-pro-bookings-list');
        if (myBookings.length === 0) {
            bookingsList.innerHTML = `<p class="text-xs text-slate-400 py-8 text-center">No customer bookings assigned yet.</p>`;
        } else {
            bookingsList.innerHTML = myBookings.map(b => `
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-extrabold text-blue-600">${ServeHubDB.escapeHTML(b.id)}</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">${ServeHubDB.escapeHTML(b.status)}</span>
            </div>
            <h4 class="font-extrabold text-slate-900 text-sm mt-1">${ServeHubDB.escapeHTML(b.serviceTitle)} — ${ServeHubDB.formatCurrency(b.amount)}</h4>
            <p class="text-xs text-slate-600 mt-0.5">Client: <strong>${ServeHubDB.escapeHTML(b.customerName)}</strong> (${ServeHubDB.escapeHTML(b.customerPhone)}${b.customerEmail ? ' • ' + ServeHubDB.escapeHTML(b.customerEmail) : ''})</p>
            <p class="text-xs text-slate-500"><i class="fa-solid fa-location-dot mr-1"></i>${ServeHubDB.escapeHTML(b.customerAddress)} &bull; ${ServeHubDB.escapeHTML(b.preferredDate)}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <select onchange="App.updateBookingStatusByPro('${b.id}', this.value)" class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white">
              ${['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map(st => `
                <option value="${st}" ${b.status === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
            <a href="https://wa.me/${(b.customerPhone || '').replace(/\D/g, '')}" target="_blank" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
              <i class="fa-brands fa-whatsapp"></i> Chat Client
            </a>
          </div>
        </div>
      `).join('');
        }

        const srvList = document.getElementById('dash-pro-services-list');
        srvList.innerHTML = (activePro.services || []).map(s => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <span class="font-bold text-slate-800">${ServeHubDB.escapeHTML(s.title)}</span>
        <div class="flex items-center gap-3">
          <span class="font-extrabold text-blue-600">${ServeHubDB.formatCurrency(s.price)}</span>
          <button onclick="App.deleteProService('${s.id}')" class="text-rose-500 hover:text-rose-700"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `).join('');

        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
            document.getElementById('edit-pro-business').value = activePro.businessName || '';
            document.getElementById('edit-pro-name').value = activePro.name || '';
            document.getElementById('edit-pro-location').value = activePro.location || '';
            document.getElementById('edit-pro-phone').value = activePro.phone || '';
            const emailField = document.getElementById('edit-pro-email');
            if (emailField) emailField.value = activePro.email || '';
            document.getElementById('edit-pro-rate').value = activePro.baseRate || 10000;
            document.getElementById('edit-pro-bio').value = activePro.bio || '';
            document.getElementById('edit-pro-password').value = '';
        }

        // Sync dynamic subscription pricing & bank info set by Admin
    const settings = state.settings || {};
    const proPrice = Number(settings.proPlanPrice || 5000);
    const featPrice = Number(settings.featuredPlanPrice || 12000);
    const durationDays = Number(settings.planDurationDays || 30);

    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setText('ui-price-pro', ServeHubDB.formatCurrency(proPrice));
    setText('ui-price-featured', ServeHubDB.formatCurrency(featPrice));
    document.querySelectorAll('.ui-plan-days').forEach(el => (el.textContent = durationDays));

    setText('ui-bank-name', settings.bankName || 'Guaranty Trust Bank (GTB)');
    setText('ui-bank-num', settings.bankAccountNumber || '0123456789');
    setText('ui-bank-holder', settings.bankAccountName || 'ServeHub Pro Technologies');
    setText('ui-bank-pro-price', `${ServeHubDB.formatCurrency(proPrice)} / ${durationDays} Days`);
    setText('ui-bank-feat-price', `${ServeHubDB.formatCurrency(featPrice)} / ${durationDays} Days`);

    setText('opt-manual-pro', `Verified Pro Plan (${ServeHubDB.formatCurrency(proPrice)})`);
    setText('opt-manual-featured', `Featured VIP Plan (${ServeHubDB.formatCurrency(featPrice)})`);

    // Update Active Subscription Banner
    const isPlanActive = activePro.planExpiry && new Date(activePro.planExpiry).getTime() > Date.now();
    if ( activePro.pendingSubscription?.status === 'pending_approval' ) {
      setText('pro-current-plan-title', `Pending ${activePro.pendingSubscription.planTier.toUpperCase()} Approval`);
      setText('pro-current-plan-expiry', `Receipt Ref: ${activePro.pendingSubscription.txnRef} (Under Admin Review)`);
      setText('pro-current-plan-badge', 'Pending Review');
    } else if (isPlanActive && activePro.planTier === 'featured') {
      setText('pro-current-plan-title', 'Featured VIP Plan 👑');
      setText('pro-current-plan-expiry', `Expires on ${activePro.planExpiry.split('T')[0]}`);
      setText('pro-current-plan-badge', 'VIP Active');
    } else if (isPlanActive && activePro.planTier === 'pro') {
      setText('pro-current-plan-title', 'Verified Pro Plan ✓');
      setText('pro-current-plan-expiry', `Expires on ${activePro.planExpiry.split('T')[0]}`);
      setText('pro-current-plan-badge', 'Pro Active');
    } else {
      setText('pro-current-plan-title', 'Free Starter Tier');
      setText('pro-current-plan-expiry', 'Standard listing placement');
      setText('pro-current-plan-badge', 'Active');
    }
    
    // Render Admin's Dynamic Subscription Plans
    const plans = this.getSubscriptionPlans(state);
    const plansGrid = document.getElementById('pro-dynamic-plans-grid');

    if (plansGrid) {
      plansGrid.innerHTML = plans.map(plan => {
        const isVIP = plan.tierType === 'featured';
        return `
          <div class="rounded-3xl border-2 ${isVIP ? 'border-amber-400 bg-gradient-to-b from-amber-50/50 to-white shadow-lg' : 'border-slate-200 hover:border-blue-500'} p-6 flex flex-col justify-between relative overflow-hidden transition">
            ${plan.popular ? `
              <div class="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                Most Popular
              </div>
            ` : ''}
            <div>
              <span class="px-2.5 py-1 rounded-lg ${isVIP ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'} text-[11px] font-extrabold uppercase">
                ${ServeHubDB.escapeHTML(plan.badge)}
              </span>
              <h4 class="text-lg font-extrabold text-slate-900 mt-3">${ServeHubDB.escapeHTML(plan.name)}</h4>
              <div class="mt-2 flex items-baseline gap-1">
                <span class="text-3xl font-black ${isVIP ? 'text-amber-600' : 'text-slate-900'}">${ServeHubDB.formatCurrency(plan.price)}</span>
                <span class="text-xs text-slate-500 font-semibold">/ ${plan.durationDays} days</span>
              </div>
              <ul class="mt-4 space-y-2.5 text-xs text-slate-700 font-medium">
                ${(plan.features || []).map(f => `
                  <li><i class="fa-solid fa-check ${isVIP ? 'text-amber-600' : 'text-blue-600'} mr-2"></i>${ServeHubDB.escapeHTML(f)}</li>
                `).join('')}
              </ul>
            </div>
            <button onclick="App.upgradeProPlan('${plan.id}')" class="mt-6 w-full py-3 rounded-xl ${isVIP ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'} text-xs font-extrabold transition">
              Subscribe to ${ServeHubDB.escapeHTML(plan.name)} ${isVIP ? '👑' : ''}
            </button>
          </div>
        `;
      }).join('');
    }

    const manualSelect = document.getElementById('manual-plan-tier');
    if (manualSelect && document.activeElement !== manualSelect) {
      manualSelect.innerHTML = plans.map(plan => `
        <option value="${plan.id}">${ServeHubDB.escapeHTML(plan.name)} — ${ServeHubDB.formatCurrency(plan.price)} (${plan.durationDays} Days)</option>
      `).join('');
    }

    },

    async saveProProfileSettings(e) {
        e.preventDefault();
        const activePro = ServeHubDB.getActivePro();
        if (!activePro) return;

        const state = ServeHubDB.getState();
        const pro = state.professionals.find(p => p.id === activePro.id);
        if (!pro) return;

        pro.businessName = document.getElementById('edit-pro-business').value.trim();
        pro.name = document.getElementById('edit-pro-name').value.trim();
        pro.location = document.getElementById('edit-pro-location').value.trim();
        pro.phone = document.getElementById('edit-pro-phone').value.trim();
        const emailInput = document.getElementById('edit-pro-email');
        if (emailInput) pro.email = emailInput.value.trim();
        pro.baseRate = Number(document.getElementById('edit-pro-rate').value || 10000);
        pro.bio = document.getElementById('edit-pro-bio').value.trim();

        const newPass = document.getElementById('edit-pro-password').value.trim();
        if (newPass.length >= 6) {
            pro.password = newPass;
        }

        await ServeHubDB.saveState(state);
        this.renderAll();
        this.notify('Business profile settings updated!');
    },

    async toggleProAvailability() {
        const activePro = ServeHubDB.getActivePro();
        if (!activePro) return;
        const state = ServeHubDB.getState();
        const pro = state.professionals.find(p => p.id === activePro.id);
        if (pro) {
            pro.available = !pro.available;
            await ServeHubDB.saveState(state);
            this.renderAll();
            this.notify(`Status updated to ${pro.available ? 'Available Now' : 'Busy'}`);
        }
    },

    async updateBookingStatusByPro(bookingId, newStatus) {
        const state = ServeHubDB.getState();
        const booking = state.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        booking.status = newStatus;
        await ServeHubDB.saveState(state);
        this.renderProPortalState();
        this.notify(`Booking ${bookingId} marked as ${newStatus}. Notifying client...`);

        if (booking.customerEmail) {
            await this.dispatchEmailNotification(
                booking.customerEmail,
                `🔔 Job Status Update [${booking.id}]: ${newStatus}`,
                {
                    Booking_Reference: booking.id,
                    New_Job_Status: newStatus,
                    Professional: booking.proName,
                    Professional_Contact: booking.proPhone,
                    Service: booking.serviceTitle,
                    Scheduled_Date: `${booking.preferredDate} (${booking.preferredTime})`,
                    Estimated_Amount: ServeHubDB.formatCurrency(booking.amount)
                }
            );
        }
    },

    async addServiceFromDashboard(e) {
        e.preventDefault();
        const activePro = ServeHubDB.getActivePro();
        if (!activePro) return;

        const title = document.getElementById('dash-new-srv-title').value.trim();
        const price = Number(document.getElementById('dash-new-srv-price').value);

        const state = ServeHubDB.getState();
        const pro = state.professionals.find(p => p.id === activePro.id);
        if (pro) {
            if (!Array.isArray(pro.services)) pro.services = [];
            pro.services.push({ id: 'srv_' + Date.now(), title, price });
            await ServeHubDB.saveState(state);
            e.target.reset();
            this.renderAll();
            this.notify('New service added to your showroom!');
        }
    },

    async deleteProService(srvId) {
        const activePro = ServeHubDB.getActivePro();
        if (!activePro) return;
        const state = ServeHubDB.getState();
        const pro = state.professionals.find(p => p.id === activePro.id);
        if (pro) {
            pro.services = (pro.services || []).filter(s => s.id !== srvId);
            await ServeHubDB.saveState(state);
            this.renderAll();
            this.notify('Service removed.');
        }
    },

    /* ========================================================================
       9. TOAST NOTIFICATIONS
       ======================================================================== */
    notify(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        const bg = type === 'error' ? 'bg-rose-600' : 'bg-slate-900';
        toast.className = `${bg} text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2.5 animate-fade-in`;
        toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check text-emerald-400'}"></i><span>${ServeHubDB.escapeHTML(message)}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    },

    /**
     * Launch Paystack Inline Checkout for Profile Boosting & Subscriptions
     */
  upgradeProPlan(planId) {
    const activePro = ServeHubDB.getActivePro();
    if (!activePro) return;

    if (typeof PaystackPop === 'undefined') {
      this.notify('Paystack SDK failed to load.', 'error');
      return;
    }

    const state = ServeHubDB.getState();
    const settings = state.settings || {};
    const plans = this.getSubscriptionPlans(state);
    const plan = plans.find(p => p.id === planId) || plans[0];
    if (!plan) return;

    const publicKey = (settings.paystackPublicKey || '').trim();
    if (!publicKey || publicKey.includes('YOUR_PAYSTACK')) {
      this.notify('Paystack Public Key not set in Admin Portal. Please use Direct Bank Transfer below.', 'error');
      return;
    }

    const handler = PaystackPop.setup({
      key: publicKey,
      email: activePro.email || settings.notifyEmail || 'idrisabubakry@gmail.com',
      amount: Number(plan.price) * 100,
      currency: 'NGN',
      ref: 'SHB_SUB_' + Math.floor(100000 + Math.random() * 900000),
      callback: function(response) {
        App.completePaystackUpgrade(activePro.id, plan.id, response.reference);
      },
      onClose: function() {
        App.notify('Payment window closed.', 'error');
      }
    });

    handler.openIframe();
  },

  async completePaystackUpgrade(proId, planId, reference) {
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === proId);
    const plan = this.getSubscriptionPlans(state).find(p => p.id === planId);
    if (!pro || !plan) return;

    pro.planId = plan.id;
    pro.planName = plan.name;
    pro.planTier = plan.tierType;
    pro.planWeight = plan.tierType === 'featured' ? 3 : 2;
    pro.verified = true;
    pro.planExpiry = new Date(Date.now() + Number(plan.durationDays) * 86400000).toISOString();
    pro.paymentRef = reference;

    await ServeHubDB.saveState(state, true);
    this.renderAll();
    this.notify(`Activated ${plan.name}! Ref: ${reference}`);
  },

  async submitManualPaymentReceipt(e) {
    if (e && e.preventDefault) e.preventDefault();

    const activePro = ServeHubDB.getActivePro();
    if (!activePro) return;

    const fileInput = document.getElementById('manual-receipt-file');
    const planSelect = document.getElementById('manual-plan-tier');
    const refInput = document.getElementById('manual-txn-ref');

    const file = fileInput?.files?.[0];
    if (!file) {
      this.notify('Please select a receipt image to upload.', 'error');
      return;
    }

    try {
      const receiptBase64 = await ServeHubDB.compressImage(file, 450, 0.7);
      const state = ServeHubDB.getState();
      const pro = state.professionals.find(p => p.id === activePro.id);
      const plan = this.getSubscriptionPlans(state).find(p => p.id === planSelect?.value) || this.getSubscriptionPlans(state)[0];

      if (!pro || !plan) return;

      pro.pendingSubscription = {
        planId: plan.id,
        planName: plan.name,
        planTier: plan.tierType,
        durationDays: Number(plan.durationDays || 30),
        price: Number(plan.price || 5000),
        txnRef: String(refInput?.value || '').trim() || ('TRF-' + Date.now()),
        receiptImage: receiptBase64 || '',
        submittedAt: new Date().toLocaleString(),
        status: 'pending_approval'
      };

      await ServeHubDB.saveState(state, true);
      e.target.reset();
      this.renderAll();
      this.notify(`Receipt submitted for ${plan.name}! Awaiting Admin approval.`);
    } catch (err) {
      console.error('Manual Receipt Submission Error:', err);
      this.notify('Error submitting receipt.', 'error');
    }
  },

  async completePaystackUpgrade(proId, planType, durationDays, reference) {
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === proId);
    if (!pro) return;

    pro.planTier = planType;
    pro.planWeight = planType === 'featured' ? 3 : 2;
    pro.verified = true;
    pro.planExpiry = new Date(Date.now() + durationDays * 86400000).toISOString();
    pro.paymentRef = reference;

    await ServeHubDB.saveState(state, true);
    this.renderAll();
    this.notify(`Subscription activated! Ref: ${reference}`);
  },


  async submitManualPaymentReceipt(e) {
    if (e && e.preventDefault) e.preventDefault();

    const activePro = ServeHubDB.getActivePro();
    if (!activePro) {
      this.notify('Session expired. Please log in again.', 'error');
      return;
    }

    const fileInput = document.getElementById('manual-receipt-file');
    const planSelect = document.getElementById('manual-plan-tier');
    const refInput = document.getElementById('manual-txn-ref');

    if (!fileInput || !planSelect || !refInput) {
      this.notify('Form inputs missing in index.html (#manual-receipt-file, #manual-plan-tier, #manual-txn-ref).', 'error');
      return;
    }

    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      this.notify('Please select a receipt image to upload.', 'error');
      return;
    }

    try {
      // Compress to max 450px / 0.7 quality so Firestore never rejects the payload size
      const receiptBase64 = await ServeHubDB.compressImage(file, 450, 0.7);
      const state = ServeHubDB.getState();
      const pro = state.professionals.find(p => p.id === activePro.id);

      if (!pro) {
        this.notify('Professional record not found.', 'error');
        return;
      }

      pro.pendingSubscription = {
        planTier: String(planSelect.value || 'pro'),
        txnRef: String(refInput.value || '').trim() || ('TRF-' + Date.now()),
        receiptImage: receiptBase64 || '',
        submittedAt: new Date().toLocaleString(),
        status: 'pending_approval'
      };

      await ServeHubDB.saveState(state, true);
      e.target.reset();
      this.renderAll();
      this.notify('Receipt submitted! Awaiting Admin approval.');
    } catch (err) {
      console.error('Manual Receipt Submission Error:', err);
      this.notify('Error submitting receipt: ' + (err.message || 'Check console'), 'error');
    }
  },

getSubscriptionPlans(state) {
    const plans = state.settings?.subscriptionPlans;
    if (Array.isArray(plans) && plans.length > 0) return plans;
    return [
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
  },

};

// Expose App globally so inline onclick="App.*" attributes always work
window.App = App;

document.addEventListener('DOMContentLoaded', () => App.init());