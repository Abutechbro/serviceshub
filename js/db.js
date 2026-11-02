/**
 * ============================================================================
 * SERVEHUB PRO - SCALABLE FIREBASE FIRESTORE ENGINE (js/db.js)
 * Architecture:
 * - Multi-Collection Firestore Storage ('professionals', 'bookings', 'platform/meta')
 * - Bypasses 1MB single-file limits so thousands of pros & bookings can scale
 * - Real-time WebSockets (onSnapshot) sync Phone A, Phone B & Admin instantly
 * ============================================================================
 */

/* ==========================================================================
   1. PASTE YOUR FIREBASE CONFIGURATION HERE BEFORE PUSHING TO GITHUB
   ========================================================================== */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6tIyylJqIZ5_SPkBojelARLqRL-q6tyQ",
  authDomain: "servehub-d8739.firebaseapp.com",
  databaseURL: "https://servehub-d8739-default-rtdb.firebaseio.com",
  projectId: "servehub-d8739",
  storageBucket: "servehub-d8739.firebasestorage.app",
  messagingSenderId: "282027174664",
  appId: "1:282027174664:web:66459fa33d995348151abd",
  measurementId: "G-JSC2Z393D1"
};

const DB_STORAGE_KEY = 'SERVEHUB_PRO_PRODUCTION_V3';
const PRO_SESSION_KEY = 'SERVEHUB_PRO_ACTIVE_SESSION';
const ADMIN_SESSION_KEY = 'SERVEHUB_ADMIN_ACTIVE_SESSION';

/* ==========================================================================
   2. INITIAL SEED DATA (Auto-uploads to Firestore on very first run)
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
    { id: 'cat_elec', name: 'Electrician', icon: 'fa-bolt', count: 1 },
    { id: 'cat_plumb', name: 'Plumber', icon: 'fa-faucet-drip', count: 1 },
    { id: 'cat_hvac', name: 'AC & Cooling', icon: 'fa-snowflake', count: 1 },
    { id: 'cat_solar', name: 'Solar & Inverter', icon: 'fa-solar-panel', count: 1 },
    { id: 'cat_clean', name: 'Home Cleaning', icon: 'fa-broom', count: 0 },
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
      createdAtMs: 1700000004000,
      avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
      bio: 'COREN-certified residential and commercial electrical contractor specializing in full-house conduiting, distribution board upgrades, earth surge protection, and smart lighting automation.',
      badges: ['COREN Certified', '24/7 Emergency', 'Insured Work'],
      services: [
        { id: 's1', title: 'Full Fault Diagnostics & Earthing Check', price: 15000 },
        { id: 's2', title: 'Distribution Board / Breaker Upgrade', price: 35000 },
        { id: 's3', title: 'Chandelier & Smart Lighting Installation', price: 20000 },
        { id: 's4', title: 'Generator Automatic Changeover Switch', price: 28000 }
      ],
      portfolio: [],
      reviews: [
        { id: 'r1', client: 'Chinedu O.', rating: 5, date: '2026-10-14', comment: 'Fixed a dangerous burning breaker in 45 minutes. Very neat work.' }
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
      createdAtMs: 1700000003000,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Clean energy specialist delivering hybrid lithium inverter installations, solar roof array mounting, and load audit consulting for homes and offices.',
      badges: ['Lithium Specialist', '2-Yr Workmanship Warranty'],
      services: [
        { id: 's5', title: 'Inverter System Diagnostics & Maintenance', price: 25000 },
        { id: 's6', title: '5kVA - 10kVA Hybrid Solar Installation (Labor)', price: 120000 }
      ],
      portfolio: [],
      reviews: []
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
      createdAtMs: 1700000002000,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      bio: 'Modern concealed PPR piping, borehole water treatment plant servicing, pressure pump installation, and non-destructive leak detection.',
      badges: ['Leak Detection Pro', 'Same-Day Dispatch'],
      services: [
        { id: 's8', title: 'Concealed Pipe Leak Detection & Repair', price: 18000 },
        { id: 's9', title: 'Water Heater & Pressure Pump Installation', price: 22000 }
      ],
      portfolio: [],
      reviews: []
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
      createdAtMs: 1700000001000,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      bio: 'Split, cassette, and standing inverter AC installation, R410a/R32 eco-gas recharging, PCB board repair, and chemical pressure coil washing.',
      badges: ['HVAC Certified', 'Gas Leak Warranty'],
      services: [
        { id: 's11', title: 'Full Chemical AC Servicing & Coil Wash', price: 10000 },
        { id: 's12', title: 'Split AC Mounting & Copper Piping', price: 20000 }
      ],
      portfolio: [],
      reviews: []
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
      createdAt: '2026-11-01 14:30',
      createdAtMs: 1700000005000
    }
  ]
};

/* ==========================================================================
   3. INTERNAL STATE & FIREBASE RUNTIME HOLDERS
   ========================================================================== */
let memoryState = null;
let firestoreDb = null;
let fsModules = null;
let isFirebaseConnected = false;
let uiUpdateCallback = null;

// Snapshots of cloud records for surgical diffing (only writes changed docs)
const cloudRecordHashes = {
  pros: new Map(),
  bookings: new Map(),
  meta: ''
};

const ServeHubDB = {
  /**
   * Check if Firebase Config has been filled in
   */
  isConfigured() {
    return Boolean(
      FIREBASE_CONFIG.apiKey &&
      !FIREBASE_CONFIG.apiKey.includes('PASTE_YOUR') &&
      FIREBASE_CONFIG.projectId &&
      !FIREBASE_CONFIG.projectId.includes('PASTE_YOUR')
    );
  },

  /**
   * Initialize Real-Time Firestore Listeners across 'professionals', 'bookings', and 'platform/meta'
   */
  async initRealtimeSync(onUpdate) {
    if (typeof onUpdate === 'function') {
      uiUpdateCallback = onUpdate;
    }

    // Load initial local cache immediately for fast first paint
    this.getState();

    if (!this.isConfigured()) {
      console.warn('Firebase is not configured yet in js/db.js. Using local browser storage.');
      return { ok: false, reason: 'Firebase config not set in js/db.js' };
    }

    try {
      if (!firestoreDb) {
        const [{ initializeApp }, firestore] = await Promise.all([
          import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
          import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
        ]);

        const app = initializeApp(FIREBASE_CONFIG);
        firestoreDb = firestore.getFirestore(app);
        fsModules = firestore;

        // Check if database is brand new; if so, seed initial collections
        const metaRef = fsModules.doc(firestoreDb, 'platform', 'meta');
        const metaSnap = await fsModules.getDoc(metaRef);

        if (!metaSnap.exists()) {
          await this.seedFirestore(INITIAL_SEED_STATE);
        }

        // Attach real-time listener 1: Platform Settings & Categories
        fsModules.onSnapshot(metaRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            memoryState.settings = data.settings || memoryState.settings;
            memoryState.categories = data.categories || memoryState.categories;
            cloudRecordHashes.meta = JSON.stringify({
              settings: memoryState.settings,
              categories: memoryState.categories
            });
            this.recalculateCategoryCounts();
            this.triggerUIRefresh();
          }
        });

        // Attach real-time listener 2: Professionals Collection
        const prosCol = fsModules.collection(firestoreDb, 'professionals');
        fsModules.onSnapshot(prosCol, (snap) => {
          const list = [];
          cloudRecordHashes.pros.clear();
          snap.forEach((docSnap) => {
            const pro = docSnap.data();
            list.push(pro);
            cloudRecordHashes.pros.set(pro.id, JSON.stringify(pro));
          });
          list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          memoryState.professionals = list;
          this.recalculateCategoryCounts();
          this.triggerUIRefresh();
        });

        // Attach real-time listener 3: Bookings Collection
        const bookingsCol = fsModules.collection(firestoreDb, 'bookings');
        fsModules.onSnapshot(bookingsCol, (snap) => {
          const list = [];
          cloudRecordHashes.bookings.clear();
          snap.forEach((docSnap) => {
            const b = docSnap.data();
            list.push(b);
            cloudRecordHashes.bookings.set(b.id, JSON.stringify(b));
          });
          list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          memoryState.bookings = list;
          this.triggerUIRefresh();
        });

        isFirebaseConnected = true;
      }
      return { ok: true, state: memoryState };
    } catch (err) {
      console.error('Firebase Realtime Sync Error:', err);
      return { ok: false, reason: err.message };
    }
  },

  /**
   * Seed an empty Firestore database with initial collections
   */
  async seedFirestore(seedState) {
    if (!firestoreDb || !fsModules) return;
    const batch = fsModules.writeBatch(firestoreDb);

    const metaRef = fsModules.doc(firestoreDb, 'platform', 'meta');
    const metaPayload = {
      settings: seedState.settings,
      categories: seedState.categories
    };
    batch.set(metaRef, metaPayload);
    cloudRecordHashes.meta = JSON.stringify(metaPayload);

    seedState.professionals.forEach((pro, idx) => {
      if (!pro.createdAtMs) pro.createdAtMs = Date.now() - idx * 1000;
      const proRef = fsModules.doc(firestoreDb, 'professionals', pro.id);
      batch.set(proRef, pro);
      cloudRecordHashes.pros.set(pro.id, JSON.stringify(pro));
    });

    seedState.bookings.forEach((b, idx) => {
      if (!b.createdAtMs) b.createdAtMs = Date.now() - idx * 1000;
      const bRef = fsModules.doc(firestoreDb, 'bookings', b.id);
      batch.set(bRef, b);
      cloudRecordHashes.bookings.set(b.id, JSON.stringify(b));
    });

    await batch.commit();
  },

  recalculateCategoryCounts() {
    if (!memoryState || !memoryState.categories) return;
    memoryState.categories.forEach(cat => {
      cat.count = (memoryState.professionals || []).filter(p => p.category === cat.name).length;
    });
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(memoryState));
    } catch {}
  },

  triggerUIRefresh() {
    if (typeof uiUpdateCallback === 'function') {
      uiUpdateCallback(memoryState);
    }
  },

  /**
   * Synchronous State Getter (Used by App and AdminApp)
   */
  getState() {
    if (memoryState) return memoryState;
    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        memoryState = JSON.parse(raw);
        return memoryState;
      }
    } catch {}
    memoryState = JSON.parse(JSON.stringify(INITIAL_SEED_STATE));
    return memoryState;
  },

  /**
   * Surgical Multi-Collection State Saver:
   * Updates memory + LocalStorage immediately and writes ONLY changed/added/deleted
   * documents to Firebase Firestore via writeBatch.
   */
  async saveState(newState, syncCloud = true) {
    newState.categories.forEach(cat => {
      cat.count = newState.professionals.filter(p => p.category === cat.name).length;
    });

    memoryState = newState;
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(newState));
    } catch {}

    if (syncCloud && firestoreDb && fsModules) {
      await this.pushToCloud(newState);
    }
  },

  async pushToCloud(stateData = null) {
    if (!firestoreDb || !fsModules) {
      return { ok: false, reason: 'Firebase not initialized' };
    }

    const state = stateData || memoryState;
    try {
      const batch = fsModules.writeBatch(firestoreDb);
      let opsCount = 0;

      // 1. Sync Platform Meta (Settings & Categories)
      const metaPayload = {
        settings: state.settings,
        categories: state.categories
      };
      const metaStr = JSON.stringify(metaPayload);
      if (metaStr !== cloudRecordHashes.meta) {
        batch.set(fsModules.doc(firestoreDb, 'platform', 'meta'), metaPayload);
        cloudRecordHashes.meta = metaStr;
        opsCount++;
      }

      // 2. Sync Professionals (Upsert new/modified, Delete removed)
      const currentProIds = new Set();
      state.professionals.forEach(pro => {
        if (!pro.createdAtMs) pro.createdAtMs = Date.now();
        currentProIds.add(pro.id);
        const proStr = JSON.stringify(pro);
        if (cloudRecordHashes.pros.get(pro.id) !== proStr) {
          batch.set(fsModules.doc(firestoreDb, 'professionals', pro.id), pro);
          cloudRecordHashes.pros.set(pro.id, proStr);
          opsCount++;
        }
      });

      for (const existingProId of cloudRecordHashes.pros.keys()) {
        if (!currentProIds.has(existingProId)) {
          batch.delete(fsModules.doc(firestoreDb, 'professionals', existingProId));
          cloudRecordHashes.pros.delete(existingProId);
          opsCount++;
        }
      }

      // 3. Sync Bookings (Upsert new/modified, Delete removed)
      const currentBookingIds = new Set();
      state.bookings.forEach(b => {
        if (!b.createdAtMs) b.createdAtMs = Date.now();
        currentBookingIds.add(b.id);
        const bStr = JSON.stringify(b);
        if (cloudRecordHashes.bookings.get(b.id) !== bStr) {
          batch.set(fsModules.doc(firestoreDb, 'bookings', b.id), b);
          cloudRecordHashes.bookings.set(b.id, bStr);
          opsCount++;
        }
      });

      for (const existingBookingId of cloudRecordHashes.bookings.keys()) {
        if (!currentBookingIds.has(existingBookingId)) {
          batch.delete(fsModules.doc(firestoreDb, 'bookings', existingBookingId));
          cloudRecordHashes.bookings.delete(existingBookingId);
          opsCount++;
        }
      }

      if (opsCount > 0) {
        await batch.commit();
      }
      return { ok: true, opsCount };
    } catch (err) {
      console.error('Firestore Batch Write Error:', err);
      return { ok: false, reason: err.message };
    }
  },

  async pullFromCloud() {
    return await this.initRealtimeSync();
  },

  getCloudConfig() {
    return {
      binId: this.isConfigured() ? FIREBASE_CONFIG.projectId : '',
      apiKey: this.isConfigured() ? 'FIREBASE_FIRESTORE_ACTIVE' : ''
    };
  },

  saveCloudConfig() {
    // Managed via FIREBASE_CONFIG in js/db.js
  },

  async resetToFactory() {
    const fresh = JSON.parse(JSON.stringify(INITIAL_SEED_STATE));
    await this.saveState(fresh, true);
    return fresh;
  },

  /* ========================================================================
     AUTHENTICATION & UTILITIES
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

 authenticateAdmin(username, password) {
    const state = this.getState();
    const settings = state.settings || { adminUsername: 'admin', adminPassword: 'admin123' };
    
    if (
      (username || '').trim().toLowerCase() === (settings.adminUsername || 'admin').toLowerCase() &&
      (password || '').trim() === (settings.adminPassword || 'admin123')
    ) {
      // Use localStorage instead of sessionStorage so it persists reliably
      localStorage.setItem('SERVEHUB_ADMIN_ACTIVE_SESSION', 'ACTIVE');
      return true;
    }
    return false;
  },

  isAdminLoggedIn() {
    return localStorage.setItem ? localStorage.getItem('SERVEHUB_ADMIN_ACTIVE_SESSION') === 'ACTIVE' : false;
  },

  logoutAdmin() {
    localStorage.removeItem('SERVEHUB_ADMIN_ACTIVE_SESSION');
  },

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
// Expose database engine globally for module-to-module communication
window.ServeHubDB = ServeHubDB;