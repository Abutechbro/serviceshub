/**
 * ============================================================================
 * SERVEHUB PRO - FRONTEND & PRO WORKSPACE CONTROLLER (js/app.js)
 * Enforces strict role-based UI isolation:
 * - Guest Mode: Shows Find a Pro, Track Booking, Pro Login/Register & Public Footer
 * - Logged-In Pro Mode: Hides all customer/guest navigation & locks UI into
 *   the dedicated Professional Workspace (Bookings, Services, Business Settings)
 * ============================================================================
 */

const App = {
  activeCategory: 'All',
  activeTab: 'marketplace',
  activeProWorkspaceTab: 'bookings',

  /* ========================================================================
     SECTION 1: INITIALIZATION & REAL-TIME SYNC
     ======================================================================== */
  async init() {
    const cloud = ServeHubDB.getCloudConfig();
    if (cloud.binId && cloud.apiKey) {
      await ServeHubDB.pullFromCloud();
    }

    window.addEventListener('storage', () => {
      this.renderAll();
    });

    this.renderAll();
  },

  renderAll() {
    this.syncRoleNavigationUI();
    this.renderCategories();
    this.renderMarketplace();
    this.populateCategorySelect();
    this.renderProPortalState();
  },

  /* ========================================================================
     SECTION 2: ROLE-BASED NAVIGATION ISOLATION (GUEST vs LOGGED-IN PRO)
     ======================================================================== */
  syncRoleNavigationUI() {
    const activePro = ServeHubDB.getActivePro();
    const isProLoggedIn = Boolean(activePro);

    // Public-only elements to hide when a Professional is logged in
    const publicAnnouncement = document.getElementById('public-announcement-bar');
    const publicDesktopNav = document.getElementById('public-desktop-nav');
    const publicHeaderActions = document.getElementById('public-header-actions');
    const publicMobileNav = document.getElementById('public-mobile-nav');
    const publicFooter = document.getElementById('public-footer');

    // Pro-only workspace elements to show when a Professional is logged in
    const proDesktopNav = document.getElementById('pro-desktop-nav');
    const proHeaderActions = document.getElementById('pro-header-actions');
    const proMobileNav = document.getElementById('pro-mobile-nav');
    const proWorkspaceFooter = document.getElementById('pro-workspace-footer');
    const brandSubtitle = document.getElementById('brand-subtitle-badge');

    if (isProLoggedIn) {
      // Hide all Public / Customer navigation & marketing sections
      publicAnnouncement?.classList.add('hidden');
      publicDesktopNav?.classList.add('hidden');
      publicDesktopNav?.classList.remove('md:flex');
      publicHeaderActions?.classList.add('hidden');
      publicMobileNav?.classList.add('hidden');
      publicMobileNav?.classList.remove('flex');
      publicFooter?.classList.add('hidden');

      // Show Dedicated Pro Workspace navigation & actions
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

      // Force view to the Pro Portal Workspace & hide customer views
      document.getElementById('view-marketplace')?.classList.add('hidden');
      document.getElementById('view-tracker')?.classList.add('hidden');
      document.getElementById('view-pro-portal')?.classList.remove('hidden');
    } else {
      // Restore Public Guest Navigation
      publicAnnouncement?.classList.remove('hidden');
      publicDesktopNav?.classList.remove('hidden');
      publicDesktopNav?.classList.add('md:flex');
      publicHeaderActions?.classList.remove('hidden');
      publicMobileNav?.classList.remove('hidden');
      publicMobileNav?.classList.add('flex');
      publicFooter?.classList.remove('hidden');

      // Hide Pro Workspace Navigation
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
    }
  },

  handleLogoClick() {
    if (ServeHubDB.getActivePro()) {
      this.switchProWorkspaceTab('bookings');
    } else {
      this.switchTab('marketplace');
    }
  },

  /* ========================================================================
     SECTION 3: PUBLIC VIEW / TAB NAVIGATION (GUEST MODE ONLY)
     ======================================================================== */
  switchTab(tabId) {
    // Prevent switching to public tabs while logged into Pro Workspace
    if (ServeHubDB.getActivePro()) {
      this.syncRoleNavigationUI();
      return;
    }

    this.activeTab = tabId;
    const views = ['marketplace', 'tracker', 'pro-portal'];

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

    if (tabId === 'pro-portal') {
      this.renderProPortalState();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* ========================================================================
     SECTION 4: PRO WORKSPACE INTERNAL TAB NAVIGATION (LOGGED-IN PRO MODE)
     ======================================================================== */
  switchProWorkspaceTab(subTab) {
    this.activeProWorkspaceTab = subTab;
    const tabs = ['bookings', 'services', 'profile'];

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
    if (activePro) {
      this.openShowroom(activePro.id);
    }
  },

  /* ========================================================================
     SECTION 5: CUSTOMER MARKETPLACE & FILTERING
     ======================================================================== */
  renderCategories() {
    const state = ServeHubDB.getState();
    const container = document.getElementById('category-pills-container');
    if (!container) return;

    const totalPros = state.professionals.length;
    let html = `
      <button onclick="App.selectCategory('All')" class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition ${
        this.activeCategory === 'All'
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
          : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
      }">
        <i class="fa-solid fa-border-all"></i> All Services
        <span class="px-2 py-0.5 rounded-full text-[10px] ${
          this.activeCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
        }">${totalPros}</span>
      </button>
    `;

    state.categories.forEach(cat => {
      const active = this.activeCategory === cat.name;
      html += `
        <button onclick="App.selectCategory('${ServeHubDB.escapeHTML(cat.name)}')" class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition ${
          active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
            : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
        }">
          <i class="fa-solid ${ServeHubDB.escapeHTML(cat.icon)}"></i>
          <span>${ServeHubDB.escapeHTML(cat.name)}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] ${
            active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
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
    document.getElementById('search-keyword').value = '';
    document.getElementById('search-location').value = '';
    document.getElementById('filter-verified').checked = false;
    document.getElementById('filter-available').checked = false;
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

      return `
        <article class="pro-card bg-white rounded-3xl border border-slate-200/90 overflow-hidden flex flex-col justify-between">
          <div class="p-6">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3.5">
                <img src="${ServeHubDB.escapeHTML(pro.avatar)}" alt="${ServeHubDB.escapeHTML(pro.businessName)}" class="w-14 h-14 rounded-2xl object-cover border border-slate-200" />
                <div>
                  <span class="inline-block text-[11px] font-extrabold uppercase tracking-wider text-blue-600">${ServeHubDB.escapeHTML(pro.category)}</span>
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

            <div class="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div>
                <span class="block text-xs font-extrabold text-slate-900"><i class="fa-solid fa-star text-amber-400 mr-1"></i>${rating}</span>
                <span class="text-[10px] text-slate-400 font-semibold">${(pro.reviews || []).length} reviews</span>
              </div>
              <div class="border-x border-slate-200/70">
                <span class="block text-xs font-extrabold text-slate-900">${pro.completedJobs}</span>
                <span class="text-[10px] text-slate-400 font-semibold">Jobs Done</span>
              </div>
              <div>
                <span class="block text-xs font-extrabold text-blue-600">${ServeHubDB.formatCurrency(pro.baseRate)}</span>
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

          <div class="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
            <button onclick="App.openShowroom('${pro.id}')" class="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs transition flex items-center justify-center gap-2">
              <span>View Showroom & Book Now</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </article>
      `;
    }).join('');
  },

  /* ========================================================================
     SECTION 6: PROFESSIONAL SHOWROOM MODAL & COST ESTIMATOR
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
            <p class="text-xs text-slate-500 mt-0.5">Select a service below for an instant estimate and booking reference.</p>

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

              <div>
                <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Your Phone / WhatsApp *</label>
                <input id="book-client-phone" type="tel" required placeholder="e.g. 08031234567" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white" />
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
                Confirm & Generate Booking ID
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

  submitReview(e, proId) {
    e.preventDefault();
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === proId);
    if (!pro) return;

    pro.reviews.unshift({
      id: 'rev_' + Date.now(),
      client: document.getElementById('rev-client-name').value.trim(),
      rating: Number(document.getElementById('rev-rating').value),
      date: new Date().toISOString().split('T')[0],
      comment: document.getElementById('rev-comment').value.trim()
    });

    ServeHubDB.saveState(state);
    this.openShowroom(proId);
    this.renderMarketplace();
    this.notify('Review posted! Thank you for your feedback.');
  },

  /* ========================================================================
     SECTION 7: BOOKING CREATION, RECEIPT & LIVE TRACKER
     ======================================================================== */
  submitBooking(e, proId) {
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
      proCategory: pro.category,
      customerName: document.getElementById('book-client-name').value.trim(),
      customerPhone: document.getElementById('book-client-phone').value.trim(),
      customerAddress: document.getElementById('book-client-address').value.trim(),
      serviceTitle: srvSelect.value,
      amount: basePrice + surcharge,
      preferredDate: document.getElementById('book-date').value,
      preferredTime: document.getElementById('book-time').value,
      urgency: urgSelect.value,
      notes: document.getElementById('book-notes').value.trim() || 'None',
      status: 'Pending',
      createdAt: new Date().toLocaleString()
    };

    state.bookings.unshift(newBooking);
    ServeHubDB.saveState(state);

    this.closeShowroom();
    this.showBookingReceipt(newBooking);
    this.notify(`Booking ${newBooking.id} confirmed!`);
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
        <p class="text-xs text-slate-500 mt-1">Save your reference ID to track your job progress in real time.</p>
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
    if (!query) return;

    const state = ServeHubDB.getState();
    const matches = state.bookings.filter(
      b => b.id.toLowerCase() === query || b.customerPhone.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      box.innerHTML = `
        <div class="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center">
          <p class="text-sm font-bold text-rose-700">No Booking Found for "${ServeHubDB.escapeHTML(query)}"</p>
          <p class="text-xs text-rose-500 mt-1">Check your Reference ID (e.g., SHB-8492) or phone number and try again.</p>
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
     SECTION 8: PRO AUTHENTICATION & ISOLATED PRO WORKSPACE RENDERING
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
      verified: false,
      available: true,
      yearsExp: Number(document.getElementById('reg-exp').value || 3),
      completedJobs: 0,
      baseRate: Number(document.getElementById('reg-rate').value || 10000),
      avatar: avatarData,
      bio: document.getElementById('reg-bio').value.trim(),
      badges: ['Registered Pro'],
      services,
      portfolio: [],
      reviews: []
    };

    state.professionals.unshift(newPro);
    ServeHubDB.saveState(state);
    ServeHubDB.authenticatePro(username, password);

    e.target.reset();
    this.renderAll();
    this.switchProWorkspaceTab('bookings');
    this.notify('Account created! Welcome to your Pro Workspace.');
  },

  renderProPortalState() {
    const activePro = ServeHubDB.getActivePro();
    const authGateway = document.getElementById('pro-auth-gateway');
    const dashView = document.getElementById('pro-dashboard-view');

    if (!activePro) {
      authGateway?.classList.remove('hidden');
      dashView?.classList.add('hidden');
      return;
    }

    authGateway?.classList.add('hidden');
    dashView?.classList.remove('hidden');

    // Populate Pro Workspace Identity
    document.getElementById('dash-pro-avatar').src = activePro.avatar;
    document.getElementById('dash-pro-business').textContent = activePro.businessName;
    document.getElementById('dash-pro-meta').textContent = `@${activePro.username} • ${activePro.name} • ${activePro.category} (${activePro.location})`;
    document.getElementById('dash-pro-verified-badge').innerHTML = activePro.verified
      ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300"><i class="fa-solid fa-circle-check mr-1"></i>Verified Pro</span>'
      : '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300">Pending Verification</span>';

    // Top Header Availability Toggle Button
    const headerAvailBtn = document.getElementById('header-availability-btn');
    if (headerAvailBtn) {
      headerAvailBtn.className = activePro.available
        ? 'px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 transition'
        : 'px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 transition';
      headerAvailBtn.innerHTML = activePro.available
        ? '<span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>Available'
        : '<span class="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>Busy';
    }

    // Populate KPIs & Bookings
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
            <p class="text-xs text-slate-600 mt-0.5">Client: <strong>${ServeHubDB.escapeHTML(b.customerName)}</strong> (${ServeHubDB.escapeHTML(b.customerPhone)})</p>
            <p class="text-xs text-slate-500"><i class="fa-solid fa-location-dot mr-1"></i>${ServeHubDB.escapeHTML(b.customerAddress)} &bull; ${ServeHubDB.escapeHTML(b.preferredDate)}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <select onchange="App.updateBookingStatusByPro('${b.id}', this.value)" class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white">
              ${['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map(st => `
                <option value="${st}" ${b.status === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
            <a href="https://wa.me/${b.customerPhone.replace(/\D/g, '')}" target="_blank" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
              <i class="fa-brands fa-whatsapp"></i> Chat Client
            </a>
          </div>
        </div>
      `).join('');
    }

    // Populate Pro Services List
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

    // Populate Business Settings Form
    document.getElementById('edit-pro-business').value = activePro.businessName || '';
    document.getElementById('edit-pro-name').value = activePro.name || '';
    document.getElementById('edit-pro-location').value = activePro.location || '';
    document.getElementById('edit-pro-phone').value = activePro.phone || '';
    document.getElementById('edit-pro-rate').value = activePro.baseRate || 10000;
    document.getElementById('edit-pro-bio').value = activePro.bio || '';
    document.getElementById('edit-pro-password').value = '';
  },

  saveProProfileSettings(e) {
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
    pro.baseRate = Number(document.getElementById('edit-pro-rate').value || 10000);
    pro.bio = document.getElementById('edit-pro-bio').value.trim();

    const newPass = document.getElementById('edit-pro-password').value.trim();
    if (newPass.length >= 6) {
      pro.password = newPass;
    }

    ServeHubDB.saveState(state);
    this.renderAll();
    this.notify('Business profile settings updated!');
  },

  toggleProAvailability() {
    const activePro = ServeHubDB.getActivePro();
    if (!activePro) return;
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === activePro.id);
    if (pro) {
      pro.available = !pro.available;
      ServeHubDB.saveState(state);
      this.renderAll();
      this.notify(`Status updated to ${pro.available ? 'Available Now' : 'Busy'}`);
    }
  },

  updateBookingStatusByPro(bookingId, newStatus) {
    const state = ServeHubDB.getState();
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = newStatus;
      ServeHubDB.saveState(state);
      this.renderProPortalState();
      this.notify(`Booking ${bookingId} marked as ${newStatus}`);
    }
  },

  addServiceFromDashboard(e) {
    e.preventDefault();
    const activePro = ServeHubDB.getActivePro();
    if (!activePro) return;

    const title = document.getElementById('dash-new-srv-title').value.trim();
    const price = Number(document.getElementById('dash-new-srv-price').value);

    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === activePro.id);
    if (pro) {
      pro.services.push({ id: 'srv_' + Date.now(), title, price });
      ServeHubDB.saveState(state);
      e.target.reset();
      this.renderAll();
      this.notify('New service added to your showroom!');
    }
  },

  deleteProService(srvId) {
    const activePro = ServeHubDB.getActivePro();
    if (!activePro) return;
    const state = ServeHubDB.getState();
    const pro = state.professionals.find(p => p.id === activePro.id);
    if (pro) {
      pro.services = pro.services.filter(s => s.id !== srvId);
      ServeHubDB.saveState(state);
      this.renderAll();
      this.notify('Service removed.');
    }
  },

  /* ========================================================================
     SECTION 9: TOAST NOTIFICATIONS
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
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());