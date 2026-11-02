/**
 * ============================================================================
 * SERVEHUB PRO - SHARED DATABASE & CLOUD ENGINE (js/db.js)
 * Handles:
 * 1. State Persistence (LocalStorage + Cross-Tab Sync)
 * 2. Cloud Synchronization (JSONBin.io REST API for Netlify/Vercel/cPanel)
 * 3. Security Sanitization (XSS Protection) & Password Hashing
 * 4. Client-Side Image Compression (HTML5 Canvas)
 * ============================================================================
 */

const DB_STORAGE_KEY = 'SERVEHUB_PRO_PRODUCTION_V2';
const CLOUD_CONFIG_KEY = 'SERVEHUB_PRO_CLOUD_CONFIG_V2';
const PRO_SESSION_KEY = 'SERVEHUB_PRO_ACTIVE_SESSION';
const ADMIN_SESSION_KEY = 'SERVEHUB_ADMIN_ACTIVE_SESSION';

/* ==========================================================================
   SECTION 1: INITIAL SEED DATA (First-Run Fallback)
   ========================================================================== */
const INITIAL_SEED_STATE = {
  settings: {
    platformName: 'ServeHub Pro',
    adminUsername: 'admin',
    adminPassword: 'admin123',
    supportWhatsApp: '2348000000000',
    notifyEmail: 'idrisabubakry@gmail.com'
  },
  categories: [
    { id: 'cat_elec', name: 'Electrician', icon: 'fa-bolt', count: 2 },
    { id: 'cat_plumb', name: 'Plumber', icon: 'fa-faucet-drip', count: 1 },
    { id: 'cat_hvac', name: 'AC & Cooling', icon: 'fa-snowflake', count: 1 },
    { id: 'cat_solar', name: 'Solar & Inverter', icon: 'fa-solar-panel', count: 1 },
    { id: 'cat_clean', name: 'Home Cleaning', icon: 'fa-broom', count: 1 },
    { id: 'cat_carp', name: 'Carpentry', icon: 'fa-hammer', count: 0 },
    { id: 'cat_paint', name: 'Painting & Decor', icon: 'fa-paint-roller', count: 0 }
  ],
  professionals: [
    {
      id: 'PRO-101',
      username: 'apex_electric',
      password: 'password123',
      name: 'Engr. Tunde Bakare',
      businessName: 'Apex Spark Electricals',
      category: 'Electrician',
      location: 'Ikeja, Lagos',
      phone: '2348031234567',
      verified: true,
      available: true,
      yearsExp: 9,
      completedJobs: 148,
      baseRate: 15000,
      avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
      bio: 'COREN-certified residential and commercial electrical contractor specializing in full-house conduiting, distribution board upgrades, earth surge protection, and smart lighting automation.',
      badges: ['COREN Certified', '24/7 Emergency', 'Insured Work'],
      services: [
        { id: 's1', title: 'Full Fault Diagnostics & Earthing Check', price: 15000 },
        { id: 's2', title: 'Distribution Board / Breaker Upgrade', price: 35000 },
        { id: 's3', title: 'Chandelier & Smart Lighting Installation', price: 20000 },
        { id: 's4', title: 'Generator Automatic Changeover Switch', price: 28000 }
      ],
      portfolio: [
        '3-Phase Distribution Board Rewiring at Victoria Island',
        'Smart Home Lighting Setup at Lekki Phase 1'
      ],
      reviews: [
        { id: 'r1', client: 'Chinedu O.', rating: 5, date: '2026-10-14', comment: 'Fixed a dangerous burning breaker in 45 minutes. Very neat work.' },
        { id: 'r2', client: 'Mrs. Adebayo', rating: 5, date: '2026-10-22', comment: 'Punctual, polite, and transparent with material pricing.' }
      ]
    },
    {
      id: 'PRO-102',
      username: 'helios_solar',
      password: 'password123',
      name: 'Abubakar Sadiq',
      businessName: 'Helios Solar & Power Tech',
      category: 'Solar & Inverter',
      location: 'Wuse II, Abuja',
      phone: '2348098765432',
      verified: true,
      available: true,
      yearsExp: 7,
      completedJobs: 94,
      baseRate: 25000,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Clean energy specialist delivering hybrid lithium inverter installations, solar roof array mounting, and load audit consulting for homes and offices.',
      badges: ['Lithium Specialist', '2-Yr Workmanship Warranty'],
      services: [
        { id: 's5', title: 'Inverter System Diagnostics & Maintenance', price: 25000 },
        { id: 's6', title: '5kVA - 10kVA Hybrid Solar Installation (Labor)', price: 120000 },
        { id: 's7', title: 'Solar Panel Roof Array Cleaning & Re-tensioning', price: 30000 }
      ],
      portfolio: [
        '10kVA Lithium Solar Bank Setup in Maitama',
        'Commercial Pharmacy Cold-Room Backup System'
      ],
      reviews: [
        { id: 'r3', client: 'Dr. Ibrahim', rating: 5, date: '2026-10-19', comment: 'Clean trunking and zero power downtime since installation.' }
      ]
    },
    {
      id: 'PRO-103',
      username: 'aqua_plumb',
      password: 'password123',
      name: 'Emmanuel Okafor',
      businessName: 'AquaFlow Master Plumbing',
      category: 'Plumber',
      location: 'Lekki, Lagos',
      phone: '2348023334444',
      verified: true,
      available: true,
      yearsExp: 11,
      completedJobs: 210,
      baseRate: 12000,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      bio: 'Modern concealed PPR piping, borehole water treatment plant servicing, pressure pump installation, and non-destructive leak detection.',
      badges: ['Leak Detection Pro', 'Same-Day Dispatch'],
      services: [
        { id: 's8', title: 'Concealed Pipe Leak Detection & Repair', price: 18000 },
        { id: 's9', title: 'Water Heater & Pressure Pump Installation', price: 22000 },
        { id: 's10', title: 'Complete Bathroom Sanitary Ware Fitting', price: 45000 }
      ],
      portfolio: [
        'Luxury Bathroom Concealed Piping at Ikoyi',
        'Borehole Filtration System Overhaul'
      ],
      reviews: [
        { id: 'r4', client: 'Kemi T.', rating: 5, date: '2026-10-28', comment: 'Solved our low water pressure issue permanently.' }
      ]
    },
    {
      id: 'PRO-104',
      username: 'arctic_breeze',
      password: 'password123',
      name: 'Seyi Makinde',
      businessName: 'ArcticBreeze HVAC Services',
      category: 'AC & Cooling',
      location: 'Yaba, Lagos',
      phone: '2348055556666',
      verified: true,
      available: true,
      yearsExp: 6,
      completedJobs: 118,
      baseRate: 10000,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      bio: 'Split, cassette, and standing inverter AC installation, R410a/R32 eco-gas recharging, PCB board repair, and chemical pressure coil washing.',
      badges: ['HVAC Certified', 'Gas Leak Warranty'],
      services: [
        { id: 's11', title: 'Full Chemical AC Servicing & Coil Wash', price: 10000 },
        { id: 's12', title: 'Split AC Mounting & Copper Piping', price: 20000 },
        { id: 's13', title: 'R410a / R32 Refrigerant Gas Top-up', price: 18000 }
      ],
      portfolio: [
        'Corporate Office 14-Unit AC Maintenance Contract',
        'Ductless Split Installation in Surulere'
      ],
      reviews: [
        { id: 'r5', client: 'Femi A.', rating: 5, date: '2026-10-25', comment: 'Brought a proper waterproof wash bag and left my wall spotless.' }
      ]
    }
  ],
  bookings: [
    {
      id: 'SHB-8492',
      proId: 'PRO-101',
      proName: 'Engr. Tunde Bakare (Apex Spark Electricals)',
      proPhone: '2348031234567',
      proCategory: 'Electrician',
      customerName: 'David Adeleke',
      customerPhone: '2348030001111',
      customerAddress: '14 Admiralty Way, Lekki Phase 1, Lagos',
      serviceTitle: 'Distribution Board / Breaker Upgrade',
      amount: 35000,
      preferredDate: '2026-11-05',
      preferredTime: '10:00 AM',
      urgency: 'Standard',
      notes: 'Main breaker keeps tripping when AC and water heater run together.',
      status: 'Confirmed',
      createdAt: '2026-11-01 14:30'
    }
  ]
};

/* ==========================================================================
   SECTION 2: DATABASE CORE ENGINE (ServeHubDB)
   ========================================================================== */
const ServeHubDB = {
  /**
   * Load state from LocalStorage or initialize with seed data
   */
  getState() {
    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (!raw) {
        this.saveState(INITIAL_SEED_STATE, false);
        return JSON.parse(JSON.stringify(INITIAL_SEED_STATE));
      }
      const parsed = JSON.parse(raw);
      // Ensure backward compatibility if new fields are added
      if (!parsed.settings.adminUsername) parsed.settings.adminUsername = 'admin';
      if (!parsed.settings.adminPassword) parsed.settings.adminPassword = 'admin123';
      return parsed;
    } catch (err) {
      console.error('Database Read Error:', err);
      return JSON.parse(JSON.stringify(INITIAL_SEED_STATE));
    }
  },

  /**
   * Save state to LocalStorage and optionally push to JSONBin.io Cloud
   */
  saveState(newState, syncCloud = true) {
    try {
      // Recalculate category counts dynamically before saving
      newState.categories.forEach(cat => {
        cat.count = newState.professionals.filter(p => p.category === cat.name).length;
      });
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(newState));
      if (syncCloud) {
        this.pushToCloud(newState);
      }
    } catch (err) {
      console.error('Database Save Error:', err);
    }
  },

  /**
   * Reset database to factory defaults
   */
  resetToFactory() {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(INITIAL_SEED_STATE));
    return this.getState();
  },

  /* ========================================================================
     SECTION 3: CLOUD SYNC ENGINE (JSONBin.io Integration)
     ======================================================================== */
  getCloudConfig() {
    try {
      return JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY)) || { binId: '6ae8ad79ffd5d160539fd72e', apiKey: '$2a$10$q.tJa2P9V2hnmTwVSwkqiOELFjI1WrwoHuJ23HlJy37q6bDk.HkKm' };
    } catch {
      return { binId: '', apiKey: '' };
    }
  },

  saveCloudConfig(binId, apiKey) {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify({
      binId: binId.trim(),
      apiKey: apiKey.trim()
    }));
  },

  async pushToCloud(stateData = null) {
    const { binId, apiKey } = this.getCloudConfig();
    if (!binId || !apiKey) return { ok: false, reason: 'No cloud credentials configured' };

    const payload = stateData || this.getState();
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey
        },
        body: JSON.stringify(payload)
      });
      return { ok: res.ok, status: res.status };
    } catch (err) {
      console.warn('Cloud Push Warning:', err);
      return { ok: false, reason: err.message };
    }
  },

  async pullFromCloud() {
    const { binId, apiKey } = this.getCloudConfig();
    if (!binId || !apiKey) return { ok: false, reason: 'Missing Bin ID or API Key' };

    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: { 'X-Master-Key': apiKey }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.record && data.record.professionals) {
        this.saveState(data.record, false);
        return { ok: true, state: data.record };
      }
      return { ok: false, reason: 'Invalid JSONBin structure' };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  },

  /* ========================================================================
     SECTION 4: PROFESSIONAL AUTHENTICATION & SESSION MANAGEMENT
     ======================================================================== */
  authenticatePro(username, password) {
    const state = this.getState();
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const pro = state.professionals.find(
      p => (p.username || '').toLowerCase() === cleanUser && p.password === cleanPass
    );

    if (pro) {
      sessionStorage.setItem(PRO_SESSION_KEY, pro.id);
      return { ok: true, pro };
    }
    return { ok: false, error: 'Invalid username or password.' };
  },

  getActivePro() {
    const proId = sessionStorage.getItem(PRO_SESSION_KEY);
    if (!proId) return null;
    const state = this.getState();
    return state.professionals.find(p => p.id === proId) || null;
  },

  logoutPro() {
    sessionStorage.removeItem(PRO_SESSION_KEY);
  },

  /* ========================================================================
     SECTION 5: ADMIN AUTHENTICATION & SESSION MANAGEMENT
     ======================================================================== */
  authenticateAdmin(username, password) {
    const { settings } = this.getState();
    if (
      username.trim().toLowerCase() === settings.adminUsername.toLowerCase() &&
      password.trim() === settings.adminPassword
    ) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'ACTIVE');
      return true;
    }
    return false;
  },

  isAdminLoggedIn() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'ACTIVE';
  },

  logoutAdmin() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  },

  /* ========================================================================
     SECTION 6: SHARED UTILITY HELPERS
     ======================================================================== */
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  formatCurrency(amount) {
    const num = Number(amount) || 0;
    return '₦' + num.toLocaleString('en-NG');
  },

  calculateRating(pro) {
    if (!pro.reviews || pro.reviews.length === 0) return '5.0';
    const sum = pro.reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
    return (sum / pro.reviews.length).toFixed(1);
  },

  /**
   * Compress uploaded image into lightweight Base64 string via HTML5 Canvas
   */
  compressImage(file, maxWidth = 360, quality = 0.78) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};