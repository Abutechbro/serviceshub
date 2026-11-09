/**
 * ============================================================================
 * SERVEHUB PRO - SCALABLE FIREBASE FIRESTORE & EMAIL ENGINE (js/db.js)
 * Features:
 * - Multi-Collection Firestore Storage ('professionals', 'bookings', 'platform/meta')
 * - Real-time WebSockets (onSnapshot) across all devices
 * - Persistent localStorage Admin & Pro sessions (prevents login loops)
 * - FormSubmit AJAX Email Dispatcher (sendEmailAlert)
 * - Global window.ServeHubDB binding (works with or without type="module")
 * ============================================================================
 */

/* ==========================================================================
   1. PASTE YOUR FIREBASE CONFIGURATION HERE BEFORE PUSHING TO GITHUB
   ========================================================================== */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD6tIyylJqIZ5_SPkBojelARLqRL-q6tyQ",
  authDomain: "servehub-d8739.firebaseapp.com",
  databaseURL: "https://servehub-d8739-default-rtdb.firebaseio.com",
  projectId: "servehub-d8739",
  storageBucket: "servehub-d8739.firebasestorage.app",
  messagingSenderId: "282027174664",
  appId: "1:282027174664:web:66459fa33d995348151abd",
  measurementId: "G-JSC2Z393D1"
};

// 1. Place near the top of js/db.js
const EMAILJS_CONFIG = {
  serviceId: "service_vx1u60g",   // Replace with your EmailJS Service ID
  templateId: "template_yglhay6", // Replace with your EmailJS Template ID
  publicKey: "Zoj5D4JlRLNAzR6jG"    // Replace with your EmailJS Public Key
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
    notifyEmail: 'idrisabubakry@gmail.com',
    paystackPublicKey: 'pk_test_YOUR_PAYSTACK_PUBLIC_KEY',
    bankName: 'Guaranty Trust Bank (GTB)',
    bankAccountNumber: '0123456789',
    bankAccountName: 'ServeHub Pro Technologies',
    subscriptionPlans: [
      {
        id: 'plan_pro_monthly',
        name: 'Verified Pro Plan',
        badge: 'Verified Badge',
        price: 5000,
        durationDays: 30,
        tierType: 'pro',
        popular: false,
        features: [
          'Official Verified Blue Badge',
          'Ranked above all Free tier pros',
          'Up to 10 itemized services'
        ]
      },
      {
        id: 'plan_vip_monthly',
        name: 'Featured VIP Plan',
        badge: 'Top Boost',
        price: 12000,
        durationDays: 30,
        tierType: 'featured',
        popular: true,
        features: [
          'Pinned to Row 1 of search results',
          'Gold Featured Badge & Highlighted Card',
          'Direct WhatsApp button on main card'
        ]
      }
    ]
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
      email: 'idrisabubakry@gmail.com',
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
      email: 'idrisabubakry@gmail.com',
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
      email: 'idrisabubakry@gmail.com',
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
      email: 'idrisabubakry@gmail.com',
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
      proEmail: 'idrisabubakry@gmail.com',
      proCategory: 'Electrician',
      customerName: 'David Adeleke',
      customerPhone: '2348030001111',
      customerEmail: 'idrisabubakry@gmail.com',
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
      FIREBASE_CONFIG &&
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

        // Real-time listener 1: Platform Settings & Categories
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

        // Real-time listener 2: Professionals Collection
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

        // Real-time listener 3: Bookings Collection
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
   * Synchronous State Getter
   */
  getState() {
    if (memoryState) return memoryState;
    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        memoryState = JSON.parse(raw);
        if (!memoryState.settings) memoryState.settings = INITIAL_SEED_STATE.settings;
        return memoryState;
      }
    } catch {}
    memoryState = JSON.parse(JSON.stringify(INITIAL_SEED_STATE));
    return memoryState;
  },

  /**
   * Surgical Multi-Collection State Saver
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

 /**
   * Dispatch real-time email notifications via EmailJS SDK
   */
  async sendEmailAlert(toEmail, subject, payloadData) {
    if (!toEmail || !toEmail.includes('@')) {
      return { ok: false, reason: 'Invalid recipient email' };
    }

    try {
      // Ensure EmailJS SDK is loaded in the browser
      if (typeof emailjs === 'undefined') {
        console.warn('EmailJS SDK not loaded');
        return { ok: false, reason: 'EmailJS SDK missing' };
      }

      const response = await emailjs.send(
        'service_rsrcs1n',   // Replace with your EmailJS Service ID
        'template_5i9td2v',  // Replace with your EmailJS Template ID
        {
          to_email: toEmail.trim(),
          subject: subject,
          booking_id: payloadData.Booking_Reference || payloadData.Booking_ID || 'N/A',
          service_title: payloadData.Service_Requested || payloadData.Service_Booked || payloadData.Service || 'N/A',
          client_name: payloadData.Client_Name || 'N/A',
          client_phone: payloadData.Client_Phone || payloadData.Professional_Phone || 'N/A',
          client_email: payloadData.Client_Email || toEmail,
          service_address: payloadData.Service_Address || 'N/A',
          preferred_schedule: payloadData.Preferred_Schedule || payloadData.Scheduled_Visit || payloadData.Schedule || 'N/A',
          amount: payloadData.Estimated_Amount || payloadData.Estimated_Total || payloadData.Total_Estimate || 'N/A',
          status_or_notes: payloadData.Job_Notes || payloadData.New_Job_Status || payloadData.Updated_Status || 'Confirmed'
        }
      );

      return { ok: response.status === 200 };
    } catch (err) {
      console.warn('EmailJS Dispatch Error:', err);
      return { ok: false, reason: err.text || err.message };
    }
  },

  /* ========================================================================
     5. AUTHENTICATION & PERSISTENT SESSIONS
     Uses localStorage so sessions never drop or loop on page reloads
     ======================================================================== */
  authenticatePro(username, password) {
    const state = this.getState();
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const pro = state.professionals.find(
      p => (p.username || '').toLowerCase() === cleanUser && p.password === cleanPass
    );

    if (pro) {
      localStorage.setItem(PRO_SESSION_KEY, pro.id);
      return { ok: true, pro };
    }
    return { ok: false, error: 'Invalid username or password.' };
  },

  getActivePro() {
    const proId = localStorage.getItem(PRO_SESSION_KEY);
    if (!proId) return null;
    const state = this.getState();
    return state.professionals.find(p => p.id === proId) || null;
  },

  logoutPro() {
    localStorage.removeItem(PRO_SESSION_KEY);
  },

  authenticateAdmin(username, password) {
    const state = this.getState();
    const settings = state.settings || { adminUsername: 'admin', adminPassword: 'admin123' };

    if (
      (username || '').trim().toLowerCase() === (settings.adminUsername || 'admin').toLowerCase() &&
      (password || '').trim() === (settings.adminPassword || 'admin123')
    ) {
      localStorage.setItem(ADMIN_SESSION_KEY, 'ACTIVE');
      return true;
    }
    return false;
  },

  isAdminLoggedIn() {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'ACTIVE';
  },

  logoutAdmin() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  },

  /* ========================================================================
     6. SHARED UTILITIES & IMAGE COMPRESSION
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
  },


  async sendEmailAlert(toEmail, subject, payloadData = {}) {
    if (!toEmail || !toEmail.includes('@')) return { ok: false };

    const entries = Object.entries(payloadData);
    const htmlRows = entries.map(([key, val], idx) => {
      const label = key.replace(/_/g, ' ');
      const rawVal = String(val ?? '');
      const isLast = idx === entries.length - 1;
      const isHighlight = /amount|total|price|reference/i.test(label);
      const isStatus = /status/i.test(label);

      let valueHTML = this.escapeHTML(rawVal);
      if (isStatus) {
        const isPositive = /completed|confirmed|active|approved/i.test(rawVal);
        const isCancelled = /cancelled|rejected/i.test(rawVal);
        const bg = isPositive ? '#dcfce7' : isCancelled ? '#ffe4e6' : '#dbeafe';
        const fg = isPositive ? '#166534' : isCancelled ? '#9f1239' : '#1e40af';
        valueHTML = `<span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;background-color:${bg};color:${fg};">${this.escapeHTML(rawVal)}</span>`;
      }

      return `
        <tr>
          <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#64748b;border-bottom:${isLast ? 'none' : '1px solid #e2e8f0'};width:42%;">
            ${this.escapeHTML(label)}
          </td>
          <td style="padding:12px 16px;font-size:13px;font-weight:${isHighlight ? '800' : '600'};color:${isHighlight ? '#2563eb' : '#0f172a'};text-align:right;border-bottom:${isLast ? 'none' : '1px solid #e2e8f0'};">
            ${valueHTML}
          </td>
        </tr>
      `;
    }).join('');

    const hasEmailJSKeys =
      EMAILJS_CONFIG.serviceId &&
      !EMAILJS_CONFIG.serviceId.includes('YOUR_') &&
      EMAILJS_CONFIG.templateId &&
      !EMAILJS_CONFIG.templateId.includes('YOUR_') &&
      EMAILJS_CONFIG.publicKey &&
      !EMAILJS_CONFIG.publicKey.includes('YOUR_');

    // 1. Dispatch via EmailJS REST API (works on both index.html and admin.html without extra SDK configuration)
    if (hasEmailJSKeys) {
      try {
        const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: EMAILJS_CONFIG.serviceId.trim(),
            template_id: EMAILJS_CONFIG.templateId.trim(),
            user_id: EMAILJS_CONFIG.publicKey.trim(),
            template_params: {
              to_email: toEmail.trim(),
              subject: subject,
              html_rows: htmlRows,
              app_url: window.location.origin
            }
          })
        });
        if (res.ok) return { ok: true, provider: 'emailjs' };
      } catch (err) {
        console.warn('EmailJS dispatch error, falling back to FormSubmit:', err);
      }
    }

    // 2. Fallback to FormSubmit styled 'box' template
    try {
      const cleanPayload = {};
      entries.forEach(([k, v]) => {
        cleanPayload[k.replace(/_/g, ' ')] = v;
      });

      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail.trim())}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: subject,
          _template: 'box',
          _captcha: 'false',
          Platform: 'ServeHub Pro Marketplace',
          ...cleanPayload
        })
      });
      return { ok: response.ok, provider: 'formsubmit' };
    } catch (err) {
      console.warn('Email Dispatch Warning:', err);
      return { ok: false };
    }
  },
};

// Expose ServeHubDB globally so App and AdminApp always have access
window.ServeHubDB = ServeHubDB;