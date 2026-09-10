/* ============================================================
   TRAINSYNC – INDIAN RAILWAYS IMS
   Main Application Script – v2.0
   ============================================================ */

'use strict';

// ─────────────────────────────────────────────────────────────
// APP STATE
// ─────────────────────────────────────────────────────────────
const APP = {
  currentUser: null,
  selectedRole: null,
  currentTab: 'map',
  mapState: {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0, dragStartY: 0,
    lastOffsetX: 0, lastOffsetY: 0,
    hoveredStation: null,
    hoveredTrack: null,
    activeZone: 'ALL',
    deviationRouteTrackIds: [],   // highlighted deviation path
    deviationTargetStation: null,
    congestionMode: true,         // Google Maps style traffic & sensor layer
    selectedTrackForPopup: null,
  },
};

// ─────────────────────────────────────────────────────────────
// SPLASH SCREEN
// ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  initSplash();

  // Start clock
  updateClock();
  setInterval(updateClock, 1000);
});

const SPLASH_STATUSES = [
  'Connecting to railway network…',
  'Loading track database…',
  'Authenticating secure channel…',
  'Fetching live train positions…',
  'Building route graph…',
  'Initialising deviation engine…',
  'Portal ready.',
];

function initSplash() {
  buildSleepers();

  const fill = document.getElementById('splash-progress-fill');
  const pctEl = document.getElementById('splash-pct');
  const statusEl = document.getElementById('splash-status-text');

  let pct = 0;
  let statusIdx = 0;
  const statusInterval = setInterval(() => {
    statusIdx = Math.min(statusIdx + 1, SPLASH_STATUSES.length - 1);
    if (statusEl) statusEl.textContent = SPLASH_STATUSES[statusIdx];
  }, 280);

  const progressInterval = setInterval(() => {
    const increment = pct < 60 ? 5 : pct < 85 ? 3 : 2;
    pct = Math.min(pct + increment, 100);
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    if (pct >= 100) {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      setTimeout(hideSplash, 350);
    }
  }, 30);
}

function buildSleepers() {
  const row = document.getElementById('splash-sleepers');
  if (!row) return;
  const count = Math.ceil(window.innerWidth / 26) + 4;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'splash-sleeper';
    s.style.animationDelay = (i * 0.03) + 's';
    row.appendChild(s);
  }
}

function hideSplash() {
  const splash = document.getElementById('splash-screen');
  const loginPage = document.getElementById('login-page');
  splash.classList.add('fade-out');
  setTimeout(() => {
    splash.classList.add('hidden');
    loginPage.classList.remove('hidden');
  }, 800);
}

// ─────────────────────────────────────────────────────────────
// CLOCK
// ─────────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('nav-datetime');
  if (!el) return;
  const now = new Date();
  const opts = { day: '2-digit', month: 'short', year: 'numeric' };
  el.innerHTML = `${now.toLocaleDateString('en-IN', opts)}<br>${now.toLocaleTimeString('en-IN', { hour12: false })} IST`;
}

// ─────────────────────────────────────────────────────────────
// HAMBURGER MENU
// ─────────────────────────────────────────────────────────────
function toggleHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('hamburger-menu');
  const isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
}

document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.hamburger-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    document.getElementById('hamburger-menu')?.classList.remove('open');
    document.getElementById('hamburger-btn')?.classList.remove('open');
  }
});

// ─────────────────────────────────────────────────────────────
// ROLE SELECTION
// ─────────────────────────────────────────────────────────────
const ROLE_META = {
  station_master: {
    title: 'Station Master Login',
    subtitle: 'Enter your SM badge number and password',
    hint: 'Badge format: XX-SM-000 (e.g. NR-SM-001)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`,
  },
  repair_engineer: {
    title: 'Repair Engineer Login',
    subtitle: 'Enter your RE badge number and password',
    hint: 'Badge format: XX-RE-000 (e.g. NR-RE-001)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  },
  loco_pilot: {
    title: 'Loco Pilot Login',
    subtitle: 'Enter your LP badge number and password',
    hint: 'Badge format: XX-LP-000 (e.g. NR-LP-001)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="11" width="20" height="8" rx="2"/><path d="M4 11V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><path d="M9 19h6"/></svg>`,
  },
};

function selectRole(role) {
  APP.selectedRole = role;
  const meta = ROLE_META[role];

  document.getElementById('login-form-title').textContent = meta.title;
  document.getElementById('login-form-subtitle').textContent = meta.subtitle;
  document.getElementById('login-form-role-icon').innerHTML = meta.icon;

  const hint = document.getElementById('login-hint');
  hint.textContent = meta.hint;
  hint.classList.add('visible');

  const users = RAILWAY_DATABASE.users.filter(u => u.role === role);
  const credsList = document.getElementById('demo-creds-list');
  credsList.innerHTML = users.slice(0, 3).map(u => `
    <div class="demo-cred-item">
      <span class="cred-badge">${u.badge}</span>
      <span class="cred-pass">${u.password}</span>
      <button class="use-cred-btn" onclick="fillCreds('${u.badge}','${u.password}')">Use</button>
    </div>
  `).join('');

  document.getElementById('employee-id').value = '';
  document.getElementById('password').value = '';
  document.getElementById('login-error').classList.add('hidden');

  document.getElementById('role-selection-panel').classList.add('hidden');
  document.getElementById('login-form-panel').classList.remove('hidden');
}

function backToRoles() {
  document.getElementById('login-form-panel').classList.add('hidden');
  document.getElementById('role-selection-panel').classList.remove('hidden');
  APP.selectedRole = null;
}

function fillCreds(badge, pass) {
  document.getElementById('employee-id').value = badge;
  document.getElementById('password').value = pass;
}

function togglePasswordVisibility() {
  const input = document.getElementById('password');
  const icon = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    input.type = 'password';
    icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
}

// ─────────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────────
function handleLogin(event) {
  event.preventDefault();
  const badge = document.getElementById('employee-id').value.trim().toUpperCase();
  const pass = document.getElementById('password').value;
  const errEl = document.getElementById('login-error');
  const errMsg = document.getElementById('login-error-msg');

  const user = RAILWAY_DATABASE.users.find(
    u => u.badge.toUpperCase() === badge && u.password === pass && u.role === APP.selectedRole
  );

  if (!user) {
    errEl.classList.remove('hidden');
    errMsg.textContent = 'Invalid badge number or password. Please try again.';
    document.getElementById('employee-id').style.borderColor = 'var(--blocked)';
    document.getElementById('password').style.borderColor = 'var(--blocked)';
    setTimeout(() => {
      document.getElementById('employee-id').style.borderColor = '';
      document.getElementById('password').style.borderColor = '';
    }, 2000);
    return;
  }

  APP.currentUser = user;
  errEl.classList.add('hidden');

  const btn = document.getElementById('login-submit-btn');
  btn.innerHTML = '<span>Authenticating…</span>';
  btn.disabled = true;

  setTimeout(() => { showDashboard(user); }, 1200);
}

function logout() {
  if (!confirm('Are you sure you want to log out?')) return;
  APP.currentUser = null;
  APP.selectedRole = null;
  document.getElementById('dashboard-page').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('role-selection-panel').classList.remove('hidden');
  document.getElementById('login-form-panel').classList.add('hidden');
  const btn = document.getElementById('login-submit-btn');
  btn.innerHTML = '<span>Access Portal</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="9 18 15 12 9 6"/></svg>';
  btn.disabled = false;
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD SETUP
// ─────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  station_master: 'Station Master',
  repair_engineer: 'Repair Engineer',
  loco_pilot: 'Loco Pilot',
};

function showDashboard(user) {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('dashboard-page').classList.remove('hidden');

  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('nav-user-avatar').textContent = initials;
  document.getElementById('nav-user-name').textContent = user.name;
  document.getElementById('nav-user-role').textContent = ROLE_LABELS[user.role];
  document.getElementById('nav-zone-label').textContent =
    user.zone ? `Zone: ${user.zone}` : (user.station ? `Station: ${user.station}` : 'All Zones');

  setupTicker();
  renderTracksGrid();
  renderAlerts();
  renderTrains();
  setTimeout(() => initMap(), 100);

  const criticalCount = RAILWAY_DATABASE.alerts.filter(a => a.type === 'critical').length;
  document.getElementById('alert-count-badge').textContent = criticalCount;

  const total = RAILWAY_DATABASE.tracks.length;
  const operational = RAILWAY_DATABASE.tracks.filter(t => t.status === 'operational').length;
  const blocked = total - operational;
  const stations = RAILWAY_DATABASE.stations.length;
  const trainsAffected = RAILWAY_DATABASE.trains.filter(t => t.status === 'halted' || t.status === 'delayed').length;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('nsb-operational', operational); setEl('nsb-blocked', blocked);
  setEl('nsb-trains-blocked', trainsAffected); setEl('nsb-total', total); setEl('nsb-stations', stations);
  setEl('ns-total-tracks', total); setEl('ns-operational', operational);
  setEl('ns-blocked', blocked); setEl('ns-stations', stations);

  const now = new Date();
  setEl('nsb-updated', 'Updated: ' + now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');

  // Role-based visibility
  const smOnly = document.querySelectorAll('.sm-only');
  const reOnly = document.querySelectorAll('.re-only');
  const lpOnly = document.querySelectorAll('.lp-only');
  const trainTab = document.getElementById('tab-trains');
  const trackTab = document.getElementById('tab-tracks');
  const hw = document.querySelector('.hamburger-wrapper');

  // Reset visibility
  smOnly.forEach(el => el.classList.add('hidden'));
  reOnly.forEach(el => el.classList.add('hidden'));
  lpOnly.forEach(el => el.classList.add('hidden'));

  if (user.role === 'loco_pilot') {
    if (hw) hw.style.display = '';
    lpOnly.forEach(el => el.classList.remove('hidden'));
    if (trainTab) trainTab.classList.add('hidden');
    if (trackTab) trackTab.classList.add('hidden');
    renderMyRoute();
  } else if (user.role === 'station_master') {
    if (hw) hw.style.display = '';
    smOnly.forEach(el => el.classList.remove('hidden'));
    if (trainTab) trainTab.classList.remove('hidden');
    if (trackTab) trackTab.classList.remove('hidden');
  } else if (user.role === 'repair_engineer') {
    if (hw) hw.style.display = '';
    reOnly.forEach(el => el.classList.remove('hidden'));
    if (trainTab) trainTab.classList.add('hidden');
    if (trackTab) trackTab.classList.add('hidden');
  }

  initQuerySystem();

  // Check if LP has a pending deviation
  if (user.role === 'loco_pilot') {
    checkLPDeviation();
  }
}

// ─────────────────────────────────────────────────────────────
// ALERT TICKER
// ─────────────────────────────────────────────────────────────
function setupTicker() {
  const ticker = document.getElementById('ticker-content');
  const msgs = RAILWAY_DATABASE.alerts.map(a => {
    const icon = a.type === 'critical' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵';
    return `${icon} ${a.message}`;
  });
  ticker.textContent = msgs.join('   ⬥   ');
}

// ─────────────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.hm-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  const tabEl = document.getElementById(`tab-${tab}`);
  if (tabEl) tabEl.classList.add('active');
  const panelEl = document.getElementById(`panel-${tab}`);
  if (panelEl) panelEl.classList.add('active');
  APP.currentTab = tab;

  document.getElementById('hamburger-menu')?.classList.remove('open');
  document.getElementById('hamburger-btn')?.classList.remove('open');

  if (tab === 'map') setTimeout(() => initMap(), 50);
  if (tab === 'tracks') renderTracksGrid();
  if (tab === 'trains') renderTrains();
  if (tab === 'schedules') renderSchedulesTab();
  if (tab === 'my-queries') renderMyQueries();
  if (tab === 'repair-jobs') renderRepairJobs();
  if (tab === 'my-route') renderMyRoute();
  if (tab === 'block-planning') initBlockPlanning();
}

// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// INTERACTIVE RAILWAY MAP – GOOGLE MAPS STYLE
// ═══════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────
let canvas, ctx, animFrame;
let stationLookup = {};
let trackHitboxes = [];
let sensorHitboxes = [];
let repairHitboxes = [];

// ============================================================
// VIRTUAL SENSOR NETWORK (VSN) & TRACK REPAIRS STORE
// ============================================================
const STORAGE_KEY_REPAIRS = 'trainsync_repairs_v2';

const DEFAULT_REPAIRS = [
  {
    id: 'REP-001',
    trackId: 'TRK005',
    km: 18.5,
    type: 'Deep Screening & Ballast Tamping',
    tsr: 30,
    vibration: 3.8,
    temp: 46.2,
    defect: 9.4,
    crew: 'Northern Railway Track Gang #4',
    hours: 6,
    notes: 'Ballast consolidation & tamping between Km 18 and 20. TSR 30 km/h in force.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'REP-002',
    trackId: 'TRK001',
    km: 1.2,
    type: 'Rail Fracture & Weld Replacement',
    tsr: 0,
    vibration: 5.4,
    temp: 52.1,
    defect: 15.8,
    crew: 'SSE P-Way Emergency Flying Squad',
    hours: 4,
    notes: 'Micro-fracture detected by ultrasonic USFD trolley on Down Track ML. Full track block.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'REP-003',
    trackId: 'TRK017',
    km: 12.0,
    type: 'Overhead Equipment (OHE) Mast Repair',
    tsr: 45,
    vibration: 2.9,
    temp: 44.0,
    defect: 6.2,
    crew: 'TRD Section Maintenance Unit #2',
    hours: 3,
    notes: 'Cantilever dropper adjustment & contact wire tensioning.',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

function loadRepairs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPAIRS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REPAIRS, JSON.stringify(DEFAULT_REPAIRS));
      return [...DEFAULT_REPAIRS];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [...DEFAULT_REPAIRS];
  }
}

function saveRepairs(repairs) {
  try {
    localStorage.setItem(STORAGE_KEY_REPAIRS, JSON.stringify(repairs));
  } catch (e) {}
}

function getTrackRepairs(trackId) {
  return loadRepairs().filter(r => r.trackId === trackId && r.status === 'active');
}

// ============================================================
// VIRTUAL SENSOR NETWORK (VSN) – DATA & AI ANOMALY ENGINE
// ============================================================

const STORAGE_KEY_VSN = 'trainsync_vsn_telemetry';

function initVsnStore() {
  const existing = localStorage.getItem(STORAGE_KEY_VSN);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  const vsnList = [];

  // 1. Mandatory Demonstration Node: VSN-024 on TRK009 at KM 18.5
  // Gurugram Railway Station (GGN) → Garhi Harsaru Junction (GHH)
  const trk009 = RAILWAY_DATABASE.tracks.find(t => t.id === 'TRK009');
  const trk009Dist = trk009?.distance || 25;
  vsnList.push({
    vsn_id: 'VSN-024',
    track_id: 'TRK009',
    km_position: 18.5,
    t: Math.min(0.85, 18.5 / trk009Dist),
    train_speed: 80.0,
    track_occupancy: 0,
    track_condition: 'GOOD',
    vibration_level: 'NORMAL',
    vibration_val: 1.8,
    signal_status: 'GREEN',
    timestamp: new Date().toISOString(),
    anomaly_score: 8.0,
    blockage_probability: 8.0,
    status: 'NORMAL',
    isSimulatedFault: false
  });

  // 2. Baseline VSN nodes along other rail tracks
  RAILWAY_DATABASE.tracks.forEach(track => {
    if (track.id === 'TRK009') return;
    const dist = track.distance || 40;
    const hash = (track.id.charCodeAt(0) * 19 + (track.id.charCodeAt(track.id.length - 1) || 0) * 29) % 100;
    const baseKm = Math.round(dist * 0.45 * 10) / 10;
    const vsnNum = String(10 + (hash % 85)).padStart(3, '0');

    vsnList.push({
      vsn_id: `VSN-${vsnNum}`,
      track_id: track.id,
      km_position: baseKm,
      t: 0.45,
      train_speed: 80.0,
      track_occupancy: 0,
      track_condition: 'GOOD',
      vibration_level: 'NORMAL',
      vibration_val: Math.round((1.6 + (hash % 10) / 10) * 10) / 10,
      signal_status: 'GREEN',
      timestamp: new Date().toISOString(),
      anomaly_score: 6.0 + (hash % 5),
      blockage_probability: 7.0 + (hash % 5),
      status: 'NORMAL',
      isSimulatedFault: false
    });
  });

  saveVsns(vsnList);
  return vsnList;
}

function loadVsns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VSN);
    if (!raw) return initVsnStore();
    return JSON.parse(raw);
  } catch (e) {
    return initVsnStore();
  }
}

function saveVsns(vsns) {
  try {
    localStorage.setItem(STORAGE_KEY_VSN, JSON.stringify(vsns));
  } catch (e) {}
}

function getTrackSensors(track) {
  const all = loadVsns();
  const trackVsns = all.filter(v => v.track_id === track.id);
  if (trackVsns.length > 0) return trackVsns;
  // Fallback default node if none exists
  return [{
    vsn_id: `VSN-${track.id}`,
    track_id: track.id,
    km_position: Math.round((track.distance || 30) * 0.45 * 10) / 10,
    t: 0.45,
    train_speed: 80.0,
    track_occupancy: 0,
    track_condition: 'GOOD',
    vibration_level: 'NORMAL',
    vibration_val: 1.8,
    signal_status: 'GREEN',
    timestamp: new Date().toISOString(),
    anomaly_score: 8.0,
    blockage_probability: 8.0,
    status: 'NORMAL',
    isSimulatedFault: false
  }];
}

// Transparent explainable AI anomaly detection engine
function calculateVsnAnomaly(vsn) {
  const speed = Number(vsn.train_speed ?? 80);
  const occupancy = Number(vsn.track_occupancy ?? 0);
  const condition = String(vsn.track_condition || 'GOOD').toUpperCase();
  const vibration = String(vsn.vibration_level || 'NORMAL').toUpperCase();
  const signal = String(vsn.signal_status || 'GREEN').toUpperCase();

  let score = 0;
  const reasons = [];

  // Factor 1: Train speed anomaly (weight 25%)
  if (speed === 0 && occupancy === 1) {
    score += 25;
    reasons.push('Prolonged zero train speed (0 km/h) with active track occupancy');
  } else if (speed > 0 && speed < 30) {
    score += 12;
    reasons.push('Severe speed restriction / train crawling under 30 km/h');
  }

  // Factor 2: Track occupancy mismatch (weight 20%)
  if (occupancy === 1) {
    score += 15;
    reasons.push('Track section occupancy detected (block segment active)');
  }

  // Factor 3: Track physical condition (weight 25%)
  if (condition === 'CRITICAL') {
    score += 25;
    reasons.push('Critical track structural defect / geometry deviation');
  } else if (condition === 'WARNING') {
    score += 12;
    reasons.push('Track condition degraded to warning threshold');
  }

  // Factor 4: Dynamic rail vibration (weight 15%)
  if (vibration === 'HIGH' || vibration === 'SEVERE') {
    score += 15;
    reasons.push('Abnormal rail dynamic oscillation & acoustic vibration');
  } else if (vibration === 'ELEVATED') {
    score += 8;
    reasons.push('Elevated sleeper/ballast vibration levels');
  }

  // Factor 5: Interlocking signal aspect (weight 15%)
  if (signal === 'RED') {
    score += 15;
    reasons.push('Red interlocking signal aspect active / route locked');
  } else if (signal === 'YELLOW' || signal === 'CAUTION') {
    score += 7;
    reasons.push('Cautionary yellow signal aspect');
  }

  const anomalyScore = Math.min(100, Math.max(5, Math.round(score * 10) / 10));
  const blockageProb = Math.min(99, Math.max(5, Math.round(anomalyScore * 1.04 * 10) / 10));

  let status = 'NORMAL';
  let assessment = 'LOW PROBABILITY OF BLOCKAGE (NORMAL)';
  if (blockageProb >= 85) {
    status = 'BLOCKED';
    assessment = 'HIGH PROBABILITY OF BLOCKAGE';
  } else if (blockageProb >= 70) {
    status = 'HIGH RISK';
    assessment = 'ELEVATED RISK OF BLOCKAGE';
  } else if (blockageProb >= 40) {
    status = 'CAUTION';
    assessment = 'MODERATE RISK - CAUTION ADVISED';
  }

  if (reasons.length === 0) {
    reasons.push('All telemetry parameters operating within safe limits');
  }

  return {
    anomalyScore,
    blockageProbability: blockageProb,
    status,
    assessment,
    reasons
  };
}

// Control points for bezier curves on key long routes
const TRACK_CURVES = {
  'T011': { cpx: 170, cpy: 340 },
  'T010': { cpx: 230, cpy: 260 },
  'T019': { cpx: 550, cpy: 240 },
  'T020': { cpx: 560, cpy: 310 },
  'T007': { cpx: 350, cpy: 460 },
  'T022': { cpx: 470, cpy: 430 },
  'T043': { cpx: 600, cpy: 210 },
  'T055': { cpx: 285, cpy: 570 },
  'T057': { cpx: 360, cpy: 510 },
  'T054': { cpx: 310, cpy: 520 },
  'T044': { cpx: 630, cpy: 180 },
  'T050': { cpx: 360, cpy: 455 },
};

function initMap() {
  canvas = document.getElementById('railway-map');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  stationLookup = {};
  RAILWAY_DATABASE.stations.forEach(s => {
    stationLookup[s.id] = s;
    if (s.code) stationLookup[s.code] = s;
    if (s.name) stationLookup[s.name] = s;
  });

  initVsnStore();
  resizeCanvas();
  attachMapEvents();

  cancelAnimationFrame(animFrame);
  function loop() {
    drawMap();
    animFrame = requestAnimationFrame(loop);
  }
  loop();
}

function resizeCanvas() {
  const container = document.getElementById('map-container');
  if (!container) return;
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight - 40;
}

// ─── DRAW MAP – Google Maps Style ──────────────────────────
function drawMap() {
  if (!canvas || !ctx) return;
  // 1. Fill entire screen canvas with Google Maps light terrain color first
  ctx.fillStyle = '#f1eee8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(APP.mapState.offsetX, APP.mapState.offsetY);
  ctx.scale(APP.mapState.scale, APP.mapState.scale);

  // 1. Draw terrain background (parks, roads, urban fabric)
  drawTerrain();

  // 2. Draw water bodies (Yamuna River, Hindon)
  drawWaterBodies();

  // 3. Draw regional division boundary
  drawIndiaOutline();

  // 4. Draw the rail network (Google Maps traffic style)
  trackHitboxes = [];
  sensorHitboxes = [];
  repairHitboxes = [];
  const zone = APP.mapState.activeZone;

  RAILWAY_DATABASE.tracks.forEach(track => {
    const from = stationLookup[track.from];
    const to = stationLookup[track.to];
    if (!from || !to) return;
    if (zone !== 'ALL' && from.zone !== zone && to.zone !== zone) return;
    const isHovered = APP.mapState.hoveredTrack === track.id;
    drawRailTrack(from, to, track, isHovered);
  });

  // 5. Draw stations (Google Maps transit pins & pills)
  RAILWAY_DATABASE.stations.forEach(station => {
    if (zone !== 'ALL' && station.zone !== zone) return;
    const isHovered = APP.mapState.hoveredStation === station.id;
    drawStation(station, isHovered);
  });

  ctx.restore();
}

// ─── Terrain (Realistic Google Maps Light Style) ──────────────
function drawTerrain() {
  // Infinite light background fallback
  ctx.fillStyle = '#f1eee8';
  ctx.fillRect(-4000, -4000, 8000, 8000);

  // 1. Delhi Urban Built-up Area Footprint (Warm subtle grey-beige)
  ctx.save();
  const urbanGrad = ctx.createRadialGradient(380, 220, 30, 380, 220, 280);
  urbanGrad.addColorStop(0, '#e5e2d8');
  urbanGrad.addColorStop(0.7, '#ece9e2');
  urbanGrad.addColorStop(1, '#f1eee8');
  ctx.fillStyle = urbanGrad;
  ctx.beginPath();
  ctx.arc(380, 220, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Realistic Google Maps Parks & Green Spaces (#d2e8d4)
  ctx.save();
  ctx.fillStyle = '#d2e8d4';
  ctx.strokeStyle = '#bddcb8';
  ctx.lineWidth = 1;

  // Central Ridge Reserve Forest (West/Central Delhi)
  ctx.beginPath();
  ctx.moveTo(270, 170);
  ctx.bezierCurveTo(240, 200, 250, 270, 285, 290);
  ctx.bezierCurveTo(315, 310, 335, 260, 325, 220);
  ctx.bezierCurveTo(315, 180, 290, 160, 270, 170);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Southern Ridge / Sanjay Van
  ctx.beginPath();
  ctx.moveTo(330, 340);
  ctx.bezierCurveTo(305, 380, 315, 450, 360, 440);
  ctx.bezierCurveTo(390, 430, 380, 370, 360, 350);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Yamuna Biodiversity Park (North Delhi along river)
  ctx.beginPath();
  ctx.moveTo(370, 20);
  ctx.bezierCurveTo(355, 60, 365, 110, 392, 100);
  ctx.bezierCurveTo(408, 70, 398, 30, 380, 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Okhla Bird Sanctuary (South Delhi along river)
  ctx.beginPath();
  ctx.moveTo(430, 470);
  ctx.bezierCurveTo(415, 510, 435, 550, 470, 540);
  ctx.bezierCurveTo(480, 500, 460, 470, 440, 470);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle natural park labels
  ctx.font = '500 10px Inter, sans-serif';
  ctx.fillStyle = '#4c7853';
  ctx.fillText('Central Ridge Forest', 245, 225);
  ctx.fillText('Yamuna Biodiversity Park', 320, 65);
  ctx.restore();

  // 3. Realistic Google Maps Arterial Road & Highway Network
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Secondary city grid roads (clean white street grid)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  for (let x = -300; x < 1300; x += 110) {
    ctx.beginPath(); ctx.moveTo(x, -300); ctx.lineTo(x, 1000); ctx.stroke();
  }
  for (let y = -300; y < 1000; y += 110) {
    ctx.beginPath(); ctx.moveTo(-300, y); ctx.lineTo(1300, y); ctx.stroke();
  }

  // Major Highways & Ring Roads (Google Maps signature highway yellow #fde293)
  ctx.strokeStyle = '#f5c66e';
  ctx.lineWidth = 6;
  drawHighwaysPath(ctx);

  ctx.strokeStyle = '#fde293';
  ctx.lineWidth = 4.5;
  drawHighwaysPath(ctx);

  // Highway labels
  ctx.font = '600 9px Inter, sans-serif';
  ctx.fillStyle = '#9e6d08';
  ctx.fillText('NH 44 (GT Road)', 190, 95);
  ctx.fillText('Delhi Ring Road', 440, 205);
  ctx.fillText('NH 48 (Jaipur Hwy)', 220, 465);
  ctx.restore();
}

function drawHighwaysPath(c) {
  // Ring Road Loop
  c.beginPath();
  c.ellipse(380, 230, 160, 130, 0, 0, Math.PI * 2);
  c.stroke();

  // NH 44 (North-South arterial)
  c.beginPath();
  c.moveTo(220, -50);
  c.lineTo(350, 190);
  c.stroke();

  // NH 48 (South-West to Gurugram)
  c.beginPath();
  c.moveTo(340, 250);
  c.lineTo(150, 490);
  c.stroke();

  // NH 9 (East towards Ghaziabad)
  c.beginPath();
  c.moveTo(420, 210);
  c.lineTo(680, 260);
  c.stroke();

  // Mathura Road (South-East towards Faridabad)
  c.beginPath();
  c.moveTo(410, 280);
  c.lineTo(470, 560);
  c.stroke();
}

function drawWaterBodies() {
  // Yamuna River flowing through Delhi (Google Maps signature blue #aadaff)
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Riverbed bank outline
  ctx.strokeStyle = '#93c7f5';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(395, -50);
  ctx.quadraticCurveTo(385, 90, 390, 170);
  ctx.quadraticCurveTo(395, 210, 412, 255);
  ctx.quadraticCurveTo(422, 310, 432, 400);
  ctx.quadraticCurveTo(442, 480, 465, 680);
  ctx.stroke();

  // River water fill
  ctx.strokeStyle = '#aadaff';
  ctx.lineWidth = 18;
  ctx.stroke();

  // River label (Google Maps soft blue italic)
  ctx.font = 'italic 12px Inter, sans-serif';
  ctx.fillStyle = '#2d6ea3';
  ctx.fillText('Yamuna River', 440, 350);

  // Hindon River (East tributary)
  ctx.strokeStyle = '#bce2fc';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(610, 20);
  ctx.quadraticCurveTo(590, 160, 560, 310);
  ctx.stroke();

  ctx.font = 'italic 10px Inter, sans-serif';
  ctx.fillStyle = '#4a82af';
  ctx.fillText('Hindon River', 570, 180);

  ctx.restore();
}

function drawIndiaOutline() {
  // Regional Division Rail Corridor watermark (clean official, subtle)
  ctx.save();
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.roundRect(40, 30, 780, 580, 8);
  ctx.stroke();
  ctx.setLineDash([]);

  // Division Tag (Google Maps clean secondary label)
  ctx.font = '500 11px Inter, sans-serif';
  ctx.fillStyle = '#5f6368';
  ctx.fillText('Northern Railway • Delhi Division Rail Corridor', 55, 48);
  ctx.restore();
}

// Helper: Parametric coordinate along track bezier or straight line
function getTrackPointAtT(t, x1, y1, x2, y2, cpx, cpy, isBezier) {
  if (isBezier) {
    const mt = 1 - t;
    return {
      x: mt * mt * x1 + 2 * mt * t * cpx + t * t * x2,
      y: mt * mt * y1 + 2 * mt * t * cpy + t * t * y2
    };
  }
  return {
    x: x1 + (x2 - x1) * t,
    y: y1 + (y2 - y1) * t
  };
}

// ─── Draw Railway Track (Realistic Google Maps Traffic Flow) ──
function drawRailTrack(from, to, track, isHovered) {
  const displayStatus = getTrackDisplayStatus(track);
  const isBlocked = displayStatus === 'blocked';
  const isCompleted = displayStatus === 'completed';
  const isDeviated = APP.mapState.deviationRouteTrackIds.includes(track.id);

  const x1 = from.x, y1 = from.y, x2 = to.x, y2 = to.y;
  trackHitboxes.push({ track, x1, y1, x2, y2 });

  const curve = TRACK_CURVES[track.id];
  const cpx = curve ? curve.cpx : (x1 + x2) / 2;
  const cpy = curve ? curve.cpy : (y1 + y2) / 2;
  const isBezier = !!curve;

  const repairs = getTrackRepairs(track.id);
  const hasSevereRepair = repairs.some(r => r.tsr === 0);
  const hasCautionRepair = repairs.some(r => r.tsr > 0 && r.tsr <= 50);

  ctx.save();

  // 1. Google Maps Transit Bed (Crisp white base with subtle outline)
  ctx.beginPath();
  tracePath(ctx, x1, y1, x2, y2, cpx, cpy, isBezier);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = isHovered ? 9 : 7.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.strokeStyle = '#c4bfb6';
  ctx.lineWidth = isHovered ? 8 : 6.5;
  ctx.stroke();

  // 2. Traffic Flow Line (Google Maps Traffic Scheme)
  // Green: Normal operational (Clear 130 km/h) -> #1e8e3e
  // Red: Blocked / Active repair (0 km/h) -> #d93025
  // Amber: Caution / TSR -> #f9ab00
  // Blue: Diverted route -> #1a73e8
  let trafficColor;
  if (isBlocked || hasSevereRepair) {
    trafficColor = isHovered ? '#b31412' : '#d93025';
  } else if (isDeviated) {
    trafficColor = '#1a73e8';
  } else if (hasCautionRepair) {
    trafficColor = isHovered ? '#d97706' : '#f9ab00';
  } else if (isCompleted) {
    trafficColor = '#1a73e8';
  } else {
    trafficColor = isHovered ? '#137333' : '#1e8e3e';
  }

  // Active traffic stroke
  ctx.beginPath();
  tracePath(ctx, x1, y1, x2, y2, cpx, cpy, isBezier);
  ctx.strokeStyle = trafficColor;
  ctx.lineWidth = isHovered ? 5.5 : 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 3. Subtle railroad cross ties / sleepers (clean Google Maps transit style)
  if (!isBlocked && !hasSevereRepair && APP.mapState.scale > 0.9) {
    drawCleanRailSleepers(x1, y1, x2, y2, cpx, cpy, isBezier);
  }

  // 4. Blocked Track Closed Hatching Pattern (White dashes inside red line)
  if (isBlocked || hasSevereRepair) {
    ctx.beginPath();
    tracePath(ctx, x1, y1, x2, y2, cpx, cpy, isBezier);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 5. Deviation animated arrows
  if (isDeviated) drawDeviationArrows(x1, y1, x2, y2, cpx, cpy, isBezier);

  // 6. Blocked incident icon (if no explicit repair pin)
  if (isBlocked && repairs.length === 0) drawBlockedIndicator(x1, y1, x2, y2);

  // 7. Completed checkmark
  if (isCompleted) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ctx.fillStyle = '#1a73e8';
    ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = 'bold 7px Inter';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✓', mx, my);
  }

  ctx.restore();

  // ─── Virtual Sensor Nodes & Repair Worksite Markers ────────
  if (APP.mapState.congestionMode) {
    // 1. Virtual Sensors (Google Maps clean software-defined sensor node)
    const sensors = getTrackSensors(track);
    sensors.forEach(s => {
      const pt = getTrackPointAtT(s.t, x1, y1, x2, y2, cpx, cpy, isBezier);
      sensorHitboxes.push({ sensor: s, x: pt.x, y: pt.y, radius: 9, track });

      const isFault = s.status === 'BLOCKED' || s.isSimulatedFault || (s.blockage_probability >= 85);
      const isCaution = s.status === 'CAUTION' || s.status === 'HIGH RISK' || (s.blockage_probability >= 40);
      const sensorColor = isFault ? '#d93025' : isCaution ? '#f9ab00' : '#1a73e8';

      ctx.save();
      // Outer pulse ring if fault
      if (isFault) {
        const pulse = 8 + Math.sin(Date.now() / 250) * 2.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(217, 48, 37, 0.2)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isFault ? 5.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = sensorColor;
      ctx.lineWidth = isFault ? 2.2 : 1.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isFault ? 2.8 : 2, 0, Math.PI * 2);
      ctx.fillStyle = sensorColor;
      ctx.fill();

      // VSN Tag Label
      if (APP.mapState.scale >= 1.05 || isFault) {
        ctx.fillStyle = isFault ? '#d93025' : '#3c4043';
        ctx.font = `${isFault ? '700' : '600'} 9px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(s.vsn_id || `VSN ${s.km_position}k`, pt.x, pt.y - 8);
      }
      ctx.restore();
    });

    // 2. Active Repairs (Google Maps exact KM Incident Pin)
    repairs.forEach(r => {
      const t = Math.max(0.08, Math.min(0.92, (r.km || 10) / (track.distance || 50)));
      const pt = getTrackPointAtT(t, x1, y1, x2, y2, cpx, cpy, isBezier);
      repairHitboxes.push({ repair: r, x: pt.x, y: pt.y, radius: 14, track });

      ctx.save();
      // Google Maps Incident Badge (Circle with hazard icon)
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = r.tsr === 0 ? '#d93025' : '#f9ab00';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.tsr === 0 ? '⛔' : '⚠', pt.x, pt.y);

      // KM Badge Pill (Clean Google Maps white tag)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(pt.x - 22, pt.y + 10, 44, 14, 3);
      ctx.fill();
      ctx.strokeStyle = r.tsr === 0 ? '#d93025' : '#f9ab00';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#202124';
      ctx.font = '700 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`KM ${r.km}`, pt.x, pt.y + 17);
      ctx.restore();
    });
  }
}

function tracePath(ctx, x1, y1, x2, y2, cpx, cpy, isBezier) {
  ctx.moveTo(x1, y1);
  if (isBezier) ctx.quadraticCurveTo(cpx, cpy, x2, y2);
  else ctx.lineTo(x2, y2);
}

function drawCleanRailSleepers(x1, y1, x2, y2, cpx, cpy, isBezier) {
  const steps = 24;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.3;

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const pt = getTrackPointAtT(t, x1, y1, x2, y2, cpx, cpy, isBezier);
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len * 2.8, ny = dx / len * 2.8;

    ctx.beginPath();
    ctx.moveTo(pt.x + nx, pt.y + ny);
    ctx.lineTo(pt.x - nx, pt.y - ny);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDeviationArrows(x1, y1, x2, y2, cpx, cpy, isBezier) {
  const t = ((Date.now() % 2000) / 2000);
  let mx, my;
  if (isBezier) {
    mx = (1-t)*(1-t)*x1 + 2*(1-t)*t*cpx + t*t*x2;
    my = (1-t)*(1-t)*y1 + 2*(1-t)*t*cpy + t*t*y2;
  } else {
    mx = x1 + (x2-x1)*t; my = y1 + (y2-y1)*t;
  }

  const dx = x2-x1, dy = y2-y1;
  const angle = Math.atan2(dy, dx);
  const alpha = Math.sin(t * Math.PI * 2) * 0.4 + 0.6;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#1a73e8';
  ctx.translate(mx, my);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(6, 0); ctx.lineTo(-4, 4.5); ctx.lineTo(-4, -4.5);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawBlockedIndicator(x1, y1, x2, y2) {
  const mx = (x1+x2)/2, my = (y1+y2)/2;

  ctx.save();
  ctx.fillStyle = '#d93025';
  ctx.beginPath(); ctx.arc(mx, my, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('✕', mx, my);
  ctx.restore();
}

// ─── Draw Station – Realistic Google Maps Transit Station Markers ──
function drawStation(station, isHovered) {
  const { x, y, type, id, name } = station;
  const isTerminal = type === 'terminal';
  const isJunction = type === 'junction';

  ctx.save();

  if (isTerminal) {
    // Google Maps Transit Hub landmark pin (white circle with blue border)
    const r = isHovered ? 11 : 9.5;
    ctx.shadowColor = 'rgba(60, 64, 67, 0.25)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#1a73e8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Center IR blue core
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#1a73e8';
    ctx.fill();

  } else if (isJunction) {
    // Google Maps Junction (crisp white circle with slate border)
    const r = isHovered ? 7.5 : 6;
    ctx.shadowColor = 'rgba(60, 64, 67, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = isHovered ? '#1a73e8' : '#3c4043';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#3c4043';
    ctx.fill();

  } else {
    // Regular station stop
    const r = isHovered ? 5.5 : 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#5f6368';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // Station Label (Google Maps clean white pill label)
  const showLabel = APP.mapState.scale > 0.65 || isTerminal || isHovered;
  if (showLabel) {
    const fontSize = isTerminal
      ? Math.max(10, Math.min(13, 11 * APP.mapState.scale))
      : Math.max(9, Math.min(11, 9.5 * APP.mapState.scale));

    ctx.font = `${isTerminal ? '600' : '500'} ${fontSize}px 'Inter', -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const labelY = y + (isTerminal ? 11 : 8);
    const displayName = (APP.mapState.scale > 1.1 || isHovered) ? name : (station.code || id);
    const textWidth = ctx.measureText(displayName).width;

    // Google Maps Label Pill: clean white pill, subtle grey border, soft shadow
    const padX = 6, padY = 2.5;
    ctx.save();
    ctx.shadowColor = 'rgba(60, 64, 67, 0.15)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.beginPath();
    ctx.roundRect(x - textWidth/2 - padX, labelY - 1, textWidth + padX*2, fontSize + padY*2, 4);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#dadce0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = isTerminal ? '#1a73e8' : '#202124';
    ctx.fillText(displayName, x, labelY + padY - 1);
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// MAP EVENTS
// ─────────────────────────────────────────────────────────────
function attachMapEvents() {
  canvas.removeEventListener('mousedown', onMouseDown);
  canvas.removeEventListener('mousemove', onMouseMove);
  canvas.removeEventListener('mouseup', onMouseUp);
  canvas.removeEventListener('wheel', onWheel);
  canvas.removeEventListener('click', onCanvasClick);
  canvas.removeEventListener('mouseleave', onMouseLeave);

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mouseleave', onMouseLeave);
}

function getWorldCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const wx = (cx - APP.mapState.offsetX) / APP.mapState.scale;
  const wy = (cy - APP.mapState.offsetY) / APP.mapState.scale;
  return { cx, cy, wx, wy };
}

function onMouseDown(e) {
  APP.mapState.isDragging = true;
  APP.mapState.dragStartX = e.clientX;
  APP.mapState.dragStartY = e.clientY;
  APP.mapState.lastOffsetX = APP.mapState.offsetX;
  APP.mapState.lastOffsetY = APP.mapState.offsetY;
}

function onMouseMove(e) {
  const { wx, wy } = getWorldCoords(e);

  if (APP.mapState.isDragging) {
    APP.mapState.offsetX = APP.mapState.lastOffsetX + (e.clientX - APP.mapState.dragStartX);
    APP.mapState.offsetY = APP.mapState.lastOffsetY + (e.clientY - APP.mapState.dragStartY);
    canvas.style.cursor = 'grabbing';
    return;
  }

  let hoveredS = null, hoveredT = null, hoveredR = null, hoveredSensor = null;

  // Check repair beacons
  for (const rh of repairHitboxes) {
    if (Math.hypot(wx - rh.x, wy - rh.y) < rh.radius) {
      hoveredR = rh; break;
    }
  }

  // Check virtual sensors
  if (!hoveredR) {
    for (const sh of sensorHitboxes) {
      if (Math.hypot(wx - sh.x, wy - sh.y) < sh.radius) {
        hoveredSensor = sh; break;
      }
    }
  }

  if (!hoveredR && !hoveredSensor) {
    for (const s of RAILWAY_DATABASE.stations) {
      const dx = wx - s.x, dy = wy - s.y;
      const r = (s.type === 'terminal' ? 14 : 9);
      if (Math.sqrt(dx*dx + dy*dy) < r) { hoveredS = s.id; break; }
    }
  }

  if (!hoveredR && !hoveredSensor && !hoveredS) {
    for (const h of trackHitboxes) {
      if (pointNearLine(wx, wy, h.x1, h.y1, h.x2, h.y2, 6)) {
        hoveredT = h.track.id; break;
      }
    }
  }

  APP.mapState.hoveredStation = hoveredS;
  APP.mapState.hoveredTrack = hoveredT;
  canvas.style.cursor = (hoveredS || hoveredT || hoveredR || hoveredSensor) ? 'pointer' : 'grab';
}

function onMouseUp() { APP.mapState.isDragging = false; canvas.style.cursor = 'grab'; }

function onMouseLeave() {
  APP.mapState.isDragging = false;
  APP.mapState.hoveredStation = null;
  APP.mapState.hoveredTrack = null;
}

function onWheel(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
  const newScale = Math.max(0.3, Math.min(5, APP.mapState.scale * zoomFactor));
  APP.mapState.offsetX = cx - (cx - APP.mapState.offsetX) * (newScale / APP.mapState.scale);
  APP.mapState.offsetY = cy - (cy - APP.mapState.offsetY) * (newScale / APP.mapState.scale);
  APP.mapState.scale = newScale;
}

function onCanvasClick(e) {
  const { cx, cy, wx, wy } = getWorldCoords(e);

  // 1. Check Active Repairs
  for (const rh of repairHitboxes) {
    if (Math.hypot(wx - rh.x, wy - rh.y) < rh.radius * 1.6) {
      showRepairTelemetryPopup(rh.repair, rh.track, cx, cy);
      return;
    }
  }

  // 2. Check Virtual Sensors
  for (const sh of sensorHitboxes) {
    if (Math.hypot(wx - sh.x, wy - sh.y) < sh.radius * 1.6) {
      showSensorTelemetryPopup(sh.sensor, sh.track, cx, cy);
      return;
    }
  }

  // 3. Check Stations
  for (const station of RAILWAY_DATABASE.stations) {
    const dx = wx - station.x, dy = wy - station.y;
    const r = station.type === 'terminal' ? 16 : 10;
    if (Math.sqrt(dx*dx + dy*dy) < r) {
      showStationPopup(station, cx, cy); return;
    }
  }

  // 4. Check Tracks
  for (const h of trackHitboxes) {
    if (pointNearLine(wx, wy, h.x1, h.y1, h.x2, h.y2, 8)) {
      showTrackPopup(h.track, cx, cy); return;
    }
  }

  closePopup(); closeTrackPopup(); closeSensorPopup();
}

function pointNearLine(px, py, x1, y1, x2, y2, threshold) {
  const dx = x2-x1, dy = y2-y1;
  const len2 = dx*dx + dy*dy;
  if (len2 === 0) return Math.hypot(px-x1, py-y1) < threshold;
  const t = Math.max(0, Math.min(1, ((px-x1)*dx + (py-y1)*dy) / len2));
  return Math.hypot(px - (x1 + t*dx), py - (y1 + t*dy)) < threshold;
}

// ─────────────────────────────────────────────────────────────
// STATION POPUP
// ─────────────────────────────────────────────────────────────
function showStationPopup(station, cx, cy) {
  closeTrackPopup();
  const popup = document.getElementById('station-popup');
  document.getElementById('popup-code').textContent = station.id;
  document.getElementById('popup-name').textContent = station.name;
  document.getElementById('popup-zone').textContent = `Zone: ${station.zone}`;
  document.getElementById('popup-type').textContent = station.type.charAt(0).toUpperCase() + station.type.slice(1);

  const connected = RAILWAY_DATABASE.tracks.filter(t => t.from === station.id || t.to === station.id);
  const tracksHtml = connected.slice(0, 5).map(t => {
    const other = t.from === station.id ? stationLookup[t.to] : stationLookup[t.from];
    const name = other ? other.id : '?';
    const cls = t.status === 'blocked' ? 'blocked' : 'operational';
    return `<div class="popup-track-row">
      <span>→ ${name} (${t.distance} km)</span>
      <span class="track-status-badge ${cls}">${t.status === 'blocked' ? '🔴 Blocked' : '🟢 OK'}</span>
    </div>`;
  }).join('');
  document.getElementById('popup-tracks').innerHTML = tracksHtml || '<div class="popup-track-row">No track data</div>';

  positionPopup(popup, cx, cy);
  popup.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────
// TRACK POPUP
// ─────────────────────────────────────────────────────────────
function showTrackPopup(track, cx, cy) {
  closePopup();
  closeSensorPopup();
  APP.mapState.selectedTrackForPopup = track;
  const popup = document.getElementById('track-popup');
  const from = stationLookup[track.from];
  const to = stationLookup[track.to];

  const displayStatus = getTrackDisplayStatus(track);
  const isBlocked = displayStatus === 'blocked';
  const icon = isBlocked ? '🔴' : '🟢';
  document.getElementById('track-popup-icon').textContent = icon;
  document.getElementById('track-popup-route').textContent = `${from?.name || track.from} → ${to?.name || track.to}`;
  document.getElementById('track-popup-dist').textContent = `Total Length: ${track.distance} km`;

  const statusEl = document.getElementById('track-popup-status');
  statusEl.textContent = isBlocked ? '⛔ Blocked / Repair' : '✅ Operational';
  statusEl.className = 'track-status-badge ' + (isBlocked ? 'blocked' : 'operational');

  const reasonEl = document.getElementById('track-popup-reason');
  if (track.reason) { reasonEl.textContent = '⚠ ' + track.reason; reasonEl.classList.remove('hidden'); }
  else { reasonEl.classList.add('hidden'); }

  // Virtual Sensors Telemetry Snapshot
  const sensors = getTrackSensors(track);
  const avgVib = (sensors.reduce((acc, s) => acc + s.vibration, 0) / sensors.length).toFixed(1);
  const avgTemp = (sensors.reduce((acc, s) => acc + s.temp, 0) / sensors.length).toFixed(1);
  const healthScore = Math.round(sensors.reduce((acc, s) => acc + s.health, 0) / sensors.length);

  const sensorsEl = document.getElementById('track-popup-sensors');
  if (sensorsEl) {
    sensorsEl.innerHTML = `
      <div class="tp-sensor-chip">
        <span class="tp-sensor-val ${avgVib > 4.0 ? 'danger' : avgVib > 2.5 ? 'warn' : ''}">${avgVib} g</span>
        <span class="tp-sensor-lbl">Oscillation</span>
      </div>
      <div class="tp-sensor-chip">
        <span class="tp-sensor-val ${avgTemp > 50 ? 'danger' : avgTemp > 42 ? 'warn' : ''}">${avgTemp}°C</span>
        <span class="tp-sensor-lbl">Rail Temp</span>
      </div>
      <div class="tp-sensor-chip">
        <span class="tp-sensor-val ${healthScore < 60 ? 'danger' : healthScore < 80 ? 'warn' : ''}">${healthScore}%</span>
        <span class="tp-sensor-lbl">VSN Health</span>
      </div>
    `;
  }

  // Active Repairs on this track corridor
  const repairs = getTrackRepairs(track.id);
  const repairsEl = document.getElementById('track-popup-repairs');
  if (repairsEl) {
    if (repairs.length > 0) {
      repairsEl.innerHTML = `
        <div style="font-size:11px;font-weight:700;color:#dc2626;margin:4px 0;">📍 Active Worksites on this Corridor (${repairs.length}):</div>
        ` + repairs.map(r => `
          <div class="tp-repair-card">
            <div class="tpr-hdr">
              <span>${r.type}</span>
              <span class="tpr-km">KM ${r.km}</span>
            </div>
            <div class="tpr-desc">${r.notes || 'Maintenance gang deployed'} (TSR: ${r.tsr} km/h)</div>
            <div class="tpr-foot">
              <span>Crew: ${r.crew || 'P-Way Gang'}</span>
              <button class="tpr-clear-btn" onclick="clearRepair('${r.id}')">✓ Clear</button>
            </div>
          </div>
        `).join('');
    } else {
      repairsEl.innerHTML = `
        <div style="font-size:11px;color:#059669;background:rgba(16,185,129,0.08);padding:6px;border-radius:6px;border:1px solid rgba(16,185,129,0.2);margin:4px 0;">
          🟢 All clear along this ${track.distance} km corridor. Normal line speed.
        </div>
      `;
    }
  }

  // SM-only deviate button
  const deviateArea = document.getElementById('track-popup-deviate-area');
  if (deviateArea) {
    if (isBlocked && APP.currentUser?.role === 'station_master') {
      deviateArea.innerHTML = `
        <button class="deviate-train-btn" onclick="openDeviationModal('${track.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
          Issue Deviation Order
        </button>`;
    } else {
      deviateArea.innerHTML = '';
    }
  }

  positionPopup(popup, cx, cy);
  popup.classList.remove('hidden');
}

function handleTrackPopupQuery() {
  const track = APP.mapState.selectedTrackForPopup;
  closeTrackPopup();
  if (track) openQueryModal(track.id);
  else openQueryModal();
}

function handleTrackPopupRepair() {
  const track = APP.mapState.selectedTrackForPopup;
  closeTrackPopup();
  if (track) openAddRepairModal(track.id);
  else openAddRepairModal();
}

function showSensorTelemetryPopup(sensor, track, cx, cy) {
  closePopup(); closeTrackPopup();
  const vsnId = sensor.vsn_id || sensor.id;
  APP.mapState.selectedVsnId = vsnId;

  const vsns = loadVsns();
  const vsn = vsns.find(v => v.vsn_id === vsnId) || sensor;
  const analysis = calculateVsnAnomaly(vsn);

  const popup = document.getElementById('sensor-telemetry-popup');
  const badge = document.getElementById('sensor-popup-badge');
  badge.textContent = `📡 VIRTUAL SENSOR NODE: ${vsnId}`;
  badge.className = 'sensor-popup-badge';

  const body = document.getElementById('sensor-popup-body');
  const from = stationLookup[track.from]?.name || track.from;
  const to = stationLookup[track.to]?.name || track.to;

  const isBlocked = analysis.status === 'BLOCKED';
  const isCaution = analysis.status === 'CAUTION' || analysis.status === 'HIGH RISK';

  const statusPill = isBlocked
    ? '<span style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;">🔴 BLOCKED</span>'
    : isCaution
    ? '<span style="background:#fef3c7;color:#b45309;border:1px solid #fcd34d;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;">🟡 CAUTION</span>'
    : '<span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;">🟢 NORMAL</span>';

  const probColor = isBlocked ? '#d93025' : isCaution ? '#f9ab00' : '#1e8e3e';

  body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <div style="font-size:15px;font-weight:700;color:#202124;">${vsnId}</div>
      ${statusPill}
    </div>

    <div style="font-size:11px;color:#5f6368;margin-bottom:10px;line-height:1.4;">
      Track: <strong>${track.id}</strong> (${from} → ${to})<br>
      Location: <strong>KM ${vsn.km_position || sensor.km}</strong> of ${track.distance} km corridor
    </div>

    <!-- Live Telemetry Grid -->
    <div class="sensor-hud-grid" style="grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px;">
      <div class="shg-item">
        <span class="shg-val" style="color:${vsn.train_speed === 0 ? '#d93025' : '#1e8e3e'};">${vsn.train_speed ?? 80} km/h</span>
        <span class="shg-lbl">Train Speed</span>
      </div>
      <div class="shg-item">
        <span class="shg-val" style="color:${vsn.track_occupancy ? '#d93025' : '#1e8e3e'};">${vsn.track_occupancy ? 'Detected' : 'Clear'}</span>
        <span class="shg-lbl">Occupancy</span>
      </div>
      <div class="shg-item">
        <span class="shg-val" style="color:${vsn.track_condition === 'CRITICAL' ? '#d93025' : vsn.track_condition === 'WARNING' ? '#f9ab00' : '#1e8e3e'};">${vsn.track_condition || 'GOOD'}</span>
        <span class="shg-lbl">Track Cond.</span>
      </div>
      <div class="shg-item">
        <span class="shg-val" style="color:${vsn.vibration_level === 'HIGH' ? '#d93025' : '#1e8e3e'};">${vsn.vibration_level || 'NORMAL'}</span>
        <span class="shg-lbl">Vibration</span>
      </div>
      <div class="shg-item">
        <span class="shg-val" style="color:${vsn.signal_status === 'RED' ? '#d93025' : vsn.signal_status === 'YELLOW' ? '#f9ab00' : '#1e8e3e'};">${vsn.signal_status || 'GREEN'}</span>
        <span class="shg-lbl">Signal</span>
      </div>
      <div class="shg-item">
        <span class="shg-val" style="color:#1a73e8;">${vsn.vibration_val || 1.8} g</span>
        <span class="shg-lbl">Dynamic Osc.</span>
      </div>
    </div>

    <!-- AI Anomaly Detection & Blockage Probability -->
    <div style="background:#f8f9fa;border:1px solid #dadce0;border-radius:8px;padding:10px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:600;margin-bottom:4px;">
        <span style="color:#5f6368;">Anomaly Score:</span>
        <span style="color:${probColor};">${analysis.anomalyScore}%</span>
      </div>
      <div style="height:6px;background:#e8eaed;border-radius:3px;overflow:hidden;margin-bottom:8px;">
        <div style="height:100%;width:${analysis.anomalyScore}%;background:${probColor};border-radius:3px;"></div>
      </div>

      <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:600;margin-bottom:4px;">
        <span style="color:#5f6368;">Blockage Probability:</span>
        <span style="color:${probColor}; font-weight:700;">${analysis.blockageProbability}%</span>
      </div>
      <div style="height:6px;background:#e8eaed;border-radius:3px;overflow:hidden;margin-bottom:8px;">
        <div style="height:100%;width:${analysis.blockageProbability}%;background:${probColor};border-radius:3px;"></div>
      </div>

      <div style="font-size:11px;font-weight:700;color:${probColor};margin-top:6px;padding:4px 6px;background:#ffffff;border-radius:4px;border:1px solid #e8eaed;">
        AI Assessment: ${analysis.assessment}
      </div>

      <div style="margin-top:6px;">
        <span style="font-size:10px;font-weight:700;color:#5f6368;text-transform:uppercase;letter-spacing:0.5px;">Reasons:</span>
        <ul style="margin:4px 0 0 16px;padding:0;font-size:10.5px;color:#3c4043;line-height:1.4;">
          ${analysis.reasons.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- Actions -->
    <div class="sensor-hud-actions" style="display:flex;gap:6px;flex-wrap:wrap;">
      ${isBlocked
        ? `<button class="sensor-hud-btn" onclick="restoreSingleVsn('${vsnId}');" style="background:#ffffff;color:#1e8e3e;border:1px solid #b7eb8f;font-weight:600;padding:6px 10px;">
             🔄 Restore Normal
           </button>
           <button class="sensor-hud-btn" onclick="showVsnAlternativeRoute('${track.id}');" style="background:#1a73e8;color:#ffffff;border:none;font-weight:600;padding:6px 10px;">
             🗺 View Alternative Route
           </button>`
        : `<button class="sensor-hud-btn" onclick="simulateVsnFault('${vsnId}');" style="background:#fff1f0;color:#d93025;border:1px solid #ffa39e;font-weight:600;padding:6px 10px;">
             ⚡ Simulate Fault
           </button>
           <button class="sensor-hud-btn" onclick="openQueryModal('${track.id}');" style="background:#ffffff;color:#1a73e8;border:1px solid #dadce0;padding:6px 10px;">
             📝 Raise Query
           </button>`
      }
    </div>

    <div style="font-size:9.5px;color:#80868b;text-align:center;margin-top:8px;font-style:italic;">
      Virtual Sensor Network — Simulated Prototype Data
    </div>
  `;

  positionPopup(popup, cx, cy);
  popup.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────
// VSN SIMULATION & BLOCKAGE DISPATCH CONTROLS
// ─────────────────────────────────────────────────────────────

function simulateVsnFault(vsnId = 'VSN-024') {
  const vsns = loadVsns();
  const vsn = vsns.find(v => v.vsn_id === vsnId) || vsns[0];
  if (!vsn) return;

  // 1. Inject abnormal critical telemetry
  vsn.train_speed = 0.0;
  vsn.track_occupancy = 1;
  vsn.track_condition = 'CRITICAL';
  vsn.vibration_level = 'HIGH';
  vsn.vibration_val = 4.8;
  vsn.signal_status = 'RED';
  vsn.isSimulatedFault = true;
  vsn.timestamp = new Date().toISOString();

  const analysis = calculateVsnAnomaly(vsn);
  vsn.anomaly_score = 91.0;
  vsn.blockage_probability = 94.0;
  vsn.status = 'BLOCKED';
  vsn.ai_assessment = analysis.assessment;
  vsn.reasons = analysis.reasons;

  saveVsns(vsns);

  // 2. Mark corresponding track as BLOCKED in RAILWAY_DATABASE
  const track = RAILWAY_DATABASE.tracks.find(t => t.id === vsn.track_id);
  const from = stationLookup[track?.from]?.name || track?.from || '?';
  const to = stationLookup[track?.to]?.name || track?.to || '?';

  if (track) {
    track.status = 'blocked';
    track.reason = `VSN AI Anomaly: High Blockage Probability (94%) detected by ${vsn.vsn_id} at KM ${vsn.km_position} (${vsn.reasons.slice(0, 2).join(', ')})`;
  }

  // 3. Generate Critical Alert in Alerts system
  const alertId = 'ALT-' + vsn.vsn_id;
  RAILWAY_DATABASE.alerts = RAILWAY_DATABASE.alerts.filter(a => a.id !== alertId);
  RAILWAY_DATABASE.alerts.unshift({
    id: alertId,
    track: vsn.track_id,
    type: 'critical',
    time: new Date().toISOString(),
    message: `🔴 TRACK BLOCKAGE DETECTED: Track ${vsn.track_id} (${from} → ${to} @ KM ${vsn.km_position}) flagged by ${vsn.vsn_id} with 94% blockage probability. Reasons: Critical track condition + abnormal vibration + zero train speed.`
  });

  // 4. Alternative Route Calculation
  let affectedTrain = RAILWAY_DATABASE.trains.find(t => t.currentSection === vsn.track_id);
  if (!affectedTrain) {
    affectedTrain = RAILWAY_DATABASE.trains.find(t => t.id === '12004') || RAILWAY_DATABASE.trains[0];
  }

  let altRoute = null;
  if (affectedTrain && track) {
    altRoute = findAlternativeRoute(track.id, affectedTrain.id);
    if (altRoute) {
      APP.mapState.deviationRouteTrackIds = altRoute.trackPath;
      showDeviationOverlay({
        trainId: affectedTrain.id,
        alternateRoute: altRoute.stationPath,
        totalDistance: altRoute.totalDistance,
        issuedByName: `VSN Autonomous AI (${vsn.vsn_id})`
      });
    }
  }

  // 5. Update UI displays
  updateNetworkStatusBar();
  initAlertTicker();
  renderAlertsList();
  renderTracksGrid();

  // If popup is currently open, re-render it
  const popup = document.getElementById('sensor-telemetry-popup');
  if (popup && !popup.classList.contains('hidden') && APP.mapState.selectedVsnId === vsn.vsn_id) {
    showSensorTelemetryPopup(vsn, track, popup.offsetLeft, popup.offsetTop);
  }

  showToast(`🔴 VSN Blockage Triggered on ${track?.id || vsn.track_id} (${vsn.vsn_id}). Track marked BLOCKED. Alternative route displayed in BLUE.`, 'error');

  // Notify backend if reachable
  try {
    fetch('/api/vsn/simulate-fault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vsn_id: vsn.vsn_id, severity: 'CRITICAL' })
    }).catch(() => {});
  } catch (e) {}
}

function resetVsnSimulation() {
  const vsns = loadVsns();
  vsns.forEach(v => {
    v.train_speed = 80.0;
    v.track_occupancy = 0;
    v.track_condition = 'GOOD';
    v.vibration_level = 'NORMAL';
    v.vibration_val = 1.8;
    v.signal_status = 'GREEN';
    v.anomaly_score = 8.0;
    v.blockage_probability = 8.0;
    v.status = 'NORMAL';
    v.isSimulatedFault = false;
    v.timestamp = new Date().toISOString();
  });
  saveVsns(vsns);

  // Restore tracks blocked by VSN faults
  RAILWAY_DATABASE.tracks.forEach(t => {
    if (t.reason && t.reason.includes('VSN AI Anomaly')) {
      t.status = 'operational';
      t.reason = null;
    }
  });

  // Clear VSN alert
  RAILWAY_DATABASE.alerts = RAILWAY_DATABASE.alerts.filter(a => !a.id.startsWith('ALT-VSN'));

  // Clear deviation route from map
  clearDeviationOverlay();

  // Update UI
  updateNetworkStatusBar();
  initAlertTicker();
  renderAlertsList();
  renderTracksGrid();
  closeSensorPopup();

  showToast(`🔄 VSN Simulation Reset: All virtual sensors returned to normal. Tracks restored.`, 'info');

  // Notify backend if reachable
  try {
    fetch('/api/vsn/reset', { method: 'POST' }).catch(() => {});
  } catch (e) {}
}

function restoreSingleVsn(vsnId) {
  const vsns = loadVsns();
  const vsn = vsns.find(v => v.vsn_id === vsnId);
  if (!vsn) return;

  vsn.train_speed = 80.0;
  vsn.track_occupancy = 0;
  vsn.track_condition = 'GOOD';
  vsn.vibration_level = 'NORMAL';
  vsn.vibration_val = 1.8;
  vsn.signal_status = 'GREEN';
  vsn.anomaly_score = 8.0;
  vsn.blockage_probability = 8.0;
  vsn.status = 'NORMAL';
  vsn.isSimulatedFault = false;
  vsn.timestamp = new Date().toISOString();

  saveVsns(vsns);

  const track = RAILWAY_DATABASE.tracks.find(t => t.id === vsn.track_id);
  if (track && track.reason && track.reason.includes(vsnId)) {
    track.status = 'operational';
    track.reason = null;
  }

  RAILWAY_DATABASE.alerts = RAILWAY_DATABASE.alerts.filter(a => a.id !== ('ALT-' + vsnId));

  updateNetworkStatusBar();
  initAlertTicker();
  renderAlertsList();
  renderTracksGrid();

  if (track) {
    showSensorTelemetryPopup(vsn, track, 400, 300);
  }
  showToast(`✅ ${vsnId} restored to normal safe operations.`, 'info');
}

function showVsnAlternativeRoute(trackId) {
  closeSensorPopup();
  let affectedTrain = RAILWAY_DATABASE.trains.find(t => t.currentSection === trackId);
  if (!affectedTrain) {
    affectedTrain = RAILWAY_DATABASE.trains.find(t => t.id === '12004') || RAILWAY_DATABASE.trains[0];
  }
  if (!affectedTrain) return;

  const result = findAlternativeRoute(trackId, affectedTrain.id);
  if (result) {
    APP.mapState.deviationRouteTrackIds = result.trackPath;
    showDeviationOverlay({
      trainId: affectedTrain.id,
      alternateRoute: result.stationPath,
      totalDistance: result.totalDistance,
      issuedByName: 'VSN Autonomous AI Detection'
    });
    showToast(`🗺 Alternative route displayed in BLUE for Train ${affectedTrain.id}`, 'info');
  } else {
    openDeviationModal(trackId);
  }
}

function showRepairTelemetryPopup(repair, track, cx, cy) {
  closePopup(); closeTrackPopup();
  const popup = document.getElementById('sensor-telemetry-popup');
  const badge = document.getElementById('sensor-popup-badge');
  badge.textContent = `⚠ ACTIVE WORKSITE: ${repair.id}`;
  badge.className = 'sensor-popup-badge repair-site';

  const body = document.getElementById('sensor-popup-body');
  const from = stationLookup[track.from]?.name || track.from;
  const to = stationLookup[track.to]?.name || track.to;

  body.innerHTML = `
    <div class="sensor-hud-title">${repair.type}</div>
    <div class="sensor-hud-sub">${track.id}: ${from} → ${to} @ <strong>KM ${repair.km}</strong> (Chainage)</div>
    <div class="sensor-hud-grid">
      <div class="shg-item">
        <span class="shg-val" style="color:#ef4444;">${repair.tsr} km/h</span>
        <span class="shg-lbl">TSR Speed</span>
      </div>
      <div class="shg-item">
        <span class="shg-val">${repair.vibration || 4.8} g</span>
        <span class="shg-lbl">Vibration</span>
      </div>
      <div class="shg-item">
        <span class="shg-val">${repair.temp || 46}°C</span>
        <span class="shg-lbl">Rail Temp</span>
      </div>
    </div>
    <div class="sensor-hud-tsr" style="background:rgba(220,38,38,0.15);border-color:rgba(220,38,38,0.3);color:#fca5a5;">
      🛠 Worksite: ${repair.notes || 'Track repair underway'} • Assigned: ${repair.crew || 'P-Way Gang'}
    </div>
    <div class="sensor-hud-actions">
      <button class="sensor-hud-btn primary" onclick="closeSensorPopup(); openQueryModal('${track.id}');">
        ⚡ Raise Incident Query
      </button>
      <button class="sensor-hud-btn" style="background:#059669;color:white;" onclick="clearRepair('${repair.id}'); closeSensorPopup();">
        ✅ Clear &amp; Restore Speed
      </button>
    </div>
  `;

  positionPopup(popup, cx, cy);
  popup.classList.remove('hidden');
}

function closeSensorPopup() {
  const popup = document.getElementById('sensor-telemetry-popup');
  if (popup) popup.classList.add('hidden');
}

// ─── ADD REPAIR MODAL HANDLERS ───────────────────────────────
function openAddRepairModal(preselectedTrackId, defaultKm) {
  const sel = document.getElementById('rf-track');
  if (!sel) return;
  const allTracks = [...RAILWAY_DATABASE.tracks].sort((a, b) => a.id.localeCompare(b.id));
  sel.innerHTML = '<option value="">-- Choose Track Corridor --</option>' +
    allTracks.map(t => {
      const from = stationLookup[t.from]?.name || t.from;
      const to = stationLookup[t.to]?.name || t.to;
      return `<option value="${t.id}" ${t.id === preselectedTrackId ? 'selected' : ''}>${t.id}: ${from} → ${to} (${t.distance} km)</option>`;
    }).join('');

  if (preselectedTrackId) sel.value = preselectedTrackId;
  else if (!sel.value && allTracks.length > 0) sel.value = allTracks[0].id;

  onRepairTrackSelectChange();

  if (defaultKm !== undefined) {
    syncKmInput(defaultKm);
    syncKmSlider(defaultKm);
  }

  document.getElementById('repair-modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeAddRepairModal(e) {
  if (e && e.target !== document.getElementById('repair-modal-overlay')) return;
  document.getElementById('repair-modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function onRepairTrackSelectChange() {
  const trackId = document.getElementById('rf-track').value;
  const track = RAILWAY_DATABASE.tracks.find(t => t.id === trackId);
  const totalLen = track ? track.distance : 100;
  const totalEl = document.getElementById('rf-total-len');
  if (totalEl) totalEl.value = `${totalLen} km`;

  const slider = document.getElementById('rf-km-slider');
  if (slider) {
    slider.max = totalLen;
    const def = (totalLen * 0.4).toFixed(1);
    slider.value = def;
    syncKmInput(def);
  }
}

function syncKmInput(val) {
  const num = parseFloat(val) || 0;
  const numberInput = document.getElementById('rf-km-number');
  const badge = document.getElementById('rf-km-badge');
  if (numberInput) numberInput.value = num;
  if (badge) badge.textContent = `KM ${num.toFixed(1)}`;
}

function syncKmSlider(val) {
  const num = parseFloat(val) || 0;
  const slider = document.getElementById('rf-km-slider');
  const badge = document.getElementById('rf-km-badge');
  if (slider) slider.value = num;
  if (badge) badge.textContent = `KM ${num.toFixed(1)}`;
}

function submitAddRepair(event) {
  event.preventDefault();
  const trackId = document.getElementById('rf-track').value;
  const km = parseFloat(document.getElementById('rf-km-number').value) || 10;
  const type = document.getElementById('rf-type').value;
  const tsr = parseInt(document.getElementById('rf-tsr').value) || 0;
  const vibration = parseFloat(document.getElementById('rf-vibration').value) || 4.5;
  const temp = parseFloat(document.getElementById('rf-temp').value) || 48;
  const defect = parseFloat(document.getElementById('rf-defect').value) || 12;
  const crew = document.getElementById('rf-crew').value || 'P-Way Gang';
  const hours = parseInt(document.getElementById('rf-hours').value) || 4;
  const notes = document.getElementById('rf-notes').value.trim();

  const repairs = loadRepairs();
  const newRepair = {
    id: 'REP-' + Date.now().toString().slice(-5),
    trackId,
    km,
    type,
    tsr,
    vibration,
    temp,
    defect,
    crew,
    hours,
    notes,
    createdAt: new Date().toISOString(),
    status: 'active'
  };
  repairs.push(newRepair);
  saveRepairs(repairs);

  // If 0 km/h block, reflect on track status
  const track = RAILWAY_DATABASE.tracks.find(t => t.id === trackId);
  if (track && tsr === 0) {
    track.status = 'blocked';
    track.reason = `${type} at KM ${km}`;
  }

  closeAddRepairModal();
  showToast(`📍 Worksite pinned at KM ${km} on ${trackId}! Traffic congestion updated.`, 'success');

  // Trigger alert in network alerts
  RAILWAY_DATABASE.alerts.unshift({
    id: 'ALT-' + Date.now().toString().slice(-4),
    track: trackId,
    type: tsr === 0 ? 'critical' : 'warning',
    time: new Date().toISOString(),
    message: `${type} detected at KM ${km}. Speed restriction ${tsr} km/h imposed by ${crew}.`,
    zone: stationLookup[track?.from]?.zone || 'NR'
  });

  if (APP.currentTab === 'tracks') renderTracksGrid();
  if (APP.currentTab === 'alerts') renderAlerts();
  updateNetworkStats();
}

function clearRepair(repairId) {
  let repairs = loadRepairs();
  const target = repairs.find(r => r.id === repairId);
  repairs = repairs.filter(r => r.id !== repairId);
  saveRepairs(repairs);

  if (target) {
    const remaining = repairs.filter(r => r.trackId === target.trackId);
    if (remaining.length === 0) {
      const track = RAILWAY_DATABASE.tracks.find(t => t.id === target.trackId);
      if (track && track.status === 'blocked') {
        track.status = 'operational';
        track.reason = '';
      }
    }
    showToast(`✅ Worksite cleared! Normal line speed restored at KM ${target.km}.`, 'success');
  }

  closeTrackPopup();
  closeSensorPopup();
  if (APP.currentTab === 'tracks') renderTracksGrid();
  updateNetworkStats();
}

function toggleCongestionMode() {
  APP.mapState.congestionMode = !APP.mapState.congestionMode;
  const btn = document.getElementById('btn-toggle-congestion');
  if (btn) {
    if (APP.mapState.congestionMode) {
      btn.classList.add('active');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        🚦 Traffic Congestion &amp; Sensors
      `;
      showToast('🚦 Google Maps Traffic Congestion & Virtual Sensors: ACTIVE', 'info');
    } else {
      btn.classList.remove('active');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        🚦 Standard Track View
      `;
      showToast('Standard Railway Map View Active', 'info');
    }
  }
}

function positionPopup(popup, cx, cy) {
  popup.style.display = 'block';
  const mc = document.getElementById('map-container');
  const cw = mc.offsetWidth, ch = mc.offsetHeight;
  let left = cx + 20, top = cy - 20;
  if (left + 300 > cw) left = cx - 310;
  if (top + 220 > ch) top = cy - 210;
  if (top < 50) top = 50;
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
}

function closePopup() { document.getElementById('station-popup').classList.add('hidden'); }
function closeTrackPopup() { document.getElementById('track-popup').classList.add('hidden'); }

// ─────────────────────────────────────────────────────────────
// MAP CONTROLS
// ─────────────────────────────────────────────────────────────
function zoomIn()   { APP.mapState.scale = Math.min(5, APP.mapState.scale * 1.2); }
function zoomOut()  { APP.mapState.scale = Math.max(0.3, APP.mapState.scale / 1.2); }
function resetView() { APP.mapState.scale = 1; APP.mapState.offsetX = 0; APP.mapState.offsetY = 0; }

window.addEventListener('resize', () => { if (canvas) resizeCanvas(); });

// ─────────────────────────────────────────────────────────────
// TRACK STATUS TAB
// ─────────────────────────────────────────────────────────────
const STATUS_LABELS_SHORT = {
  pending: 'Pending', accepted: 'Accepted',
  in_progress: 'In Progress', completed: 'Done'
};

function renderTracksGrid() {
  const grid = document.getElementById('tracks-grid');
  if (!grid) return;
  const isSM = APP.currentUser?.role === 'station_master';
  const queries = loadQueries();

  grid.innerHTML = RAILWAY_DATABASE.tracks.map(track => {
    const from = stationLookup[track.from];
    const to = stationLookup[track.to];
    const isBlocked = track.status === 'blocked';
    const isCompleted = getCompletedTracks().includes(track.id);
    const existingQuery = queries.find(q => q.trackId === track.id && q.status !== 'completed');

    const statusClass = isCompleted ? 'operational' : (isBlocked ? 'blocked' : 'operational');
    const statusLabel = isCompleted ? '✅ Repaired' : (isBlocked ? '⛔ Blocked' : '✅ Operational');

    const trackRepairs = getTrackRepairs(track.id);
    const repairBadge = trackRepairs.length > 0 ? `
      <div style="font-size:11px;color:#dc2626;background:rgba(220,38,38,0.08);padding:5px 8px;border-radius:6px;margin-top:6px;border:1px solid rgba(220,38,38,0.25);display:flex;justify-content:space-between;align-items:center;">
        <span>⚠ ${trackRepairs.length} Worksite(s) Active</span>
        <span style="font-weight:700;">${trackRepairs.map(r => 'KM ' + r.km).join(', ')}</span>
      </div>` : '';

    const raiseBtn = `
      <button class="raise-query-btn" onclick="openQueryModal('${track.id}')" title="Raise dynamic incident or repair query on this corridor">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        ${existingQuery ? '📋 Query Active (' + (STATUS_LABELS_SHORT[existingQuery.status] || existingQuery.status) + ')' : '⚡ Raise Query / Report'}
      </button>`;

    const addRepairBtn = `
      <button class="raise-query-btn" style="background:linear-gradient(135deg,#c2410c,#ea580c);margin-top:6px;" onclick="openAddRepairModal('${track.id}')" title="Pinpoint repair worksite on this corridor">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        📍 Add Repair Spot (KM)
      </button>`;

    const deviateBtn = (isSM && isBlocked && !isCompleted) ? `
      <button class="raise-query-btn" style="background:linear-gradient(135deg,#7c2d12,#9a3412);margin-top:6px" onclick="openDeviationModal('${track.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        Issue Deviation Order
      </button>` : '';

    return `
      <div class="track-card ${isBlocked && !isCompleted ? 'blocked' : ''}" data-track-id="${track.id}"
           data-from="${(from?.name || track.from).toLowerCase()}"
           data-to="${(to?.name || track.to).toLowerCase()}"
           data-status="${isCompleted ? 'operational' : track.status}">
        <div class="track-card-header">
          <span class="track-card-id">${track.id}</span>
          <span class="track-status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="track-card-route">${from?.name || track.from} → ${to?.name || track.to}</div>
        <div class="track-card-meta">
          <span>📏 ${track.distance} km</span>
          <span>🚄 ${track.type.charAt(0).toUpperCase() + track.type.slice(1)}</span>
          <span>🗺 ${from?.zone || '?'}</span>
        </div>
        ${track.reason && !isCompleted ? `<div class="track-card-reason">⚠ ${track.reason}</div>` : ''}
        ${repairBadge}
        <div style="margin-top:8px;">
          ${raiseBtn}
          ${addRepairBtn}
          ${deviateBtn}
        </div>
      </div>`;
  }).join('');
}

function filterTracks() {
  const query = document.getElementById('track-search').value.toLowerCase();
  const status = document.getElementById('track-status-filter').value;
  document.querySelectorAll('.track-card').forEach(card => {
    const matchQuery = !query || card.dataset.from.includes(query) || card.dataset.to.includes(query);
    const matchStatus = status === 'all' || card.dataset.status === status;
    card.style.display = (matchQuery && matchStatus) ? '' : 'none';
  });
}

// ─────────────────────────────────────────────────────────────
// ALERTS TAB
// ─────────────────────────────────────────────────────────────
const ALERT_ICONS = {
  critical: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  warning:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  info:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

function renderAlerts() {
  const list = document.getElementById('alerts-list');
  const ALERT_TITLES = { critical: 'Critical Incident', warning: 'Advisory Warning', info: 'Information' };
  list.innerHTML = RAILWAY_DATABASE.alerts.map(alert => {
    const track = alert.track ? RAILWAY_DATABASE.tracks.find(t => t.id === alert.track) : null;
    const from = track ? (stationLookup[track.from]?.name || track.from) : '';
    const to   = track ? (stationLookup[track.to]?.name   || track.to)   : '';
    const date = new Date(alert.time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="alert-card ${alert.type}" data-type="${alert.type}">
        <div class="alert-icon ${alert.type}">${ALERT_ICONS[alert.type]}</div>
        <div class="alert-body">
          <h4>${ALERT_TITLES[alert.type]}${track ? ` – ${from} → ${to}` : ''}</h4>
          <p>${alert.message}</p>
          <div class="alert-footer">
            <span class="alert-time">🕐 ${date}</span>
            <span class="alert-zone">${alert.zone}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

function filterAlerts() {
  const type = document.getElementById('alert-type-filter').value;
  document.querySelectorAll('.alert-card').forEach(card => {
    card.style.display = (type === 'all' || card.dataset.type === type) ? '' : 'none';
  });
}

// ─────────────────────────────────────────────────────────────
// TRAINS TAB
// ─────────────────────────────────────────────────────────────
function renderTrains() {
  const grid = document.getElementById('trains-grid');
  const STATUS_LABELS = { on_time: '✅ On Time', delayed: '⚠ Delayed', halted: '⛔ Halted' };

  grid.innerHTML = RAILWAY_DATABASE.trains.map(train => {
    const from = stationLookup[train.from]?.name || train.from;
    const to   = stationLookup[train.to]?.name   || train.to;
    const track = RAILWAY_DATABASE.tracks.find(t => t.id === train.currentSection);
    const sec = track ? `${stationLookup[track.from]?.id}–${stationLookup[track.to]?.id}` : '–';
    return `
      <div class="train-card">
        <div class="train-card-header">
          <span class="train-number">TRAIN # ${train.id}</span>
          <span class="train-status-badge ${train.status}">${STATUS_LABELS[train.status]}</span>
        </div>
        <div class="train-name">${train.name}</div>
        <div class="train-route">
          <strong>${from}</strong>
          <span class="train-route-arrow">→</span>
          <strong>${to}</strong>
        </div>
        <div class="train-meta">
          <div class="train-meta-item"><span class="train-meta-label">Speed</span><span class="train-meta-val">${train.speed || 0} km/h</span></div>
          <div class="train-meta-item"><span class="train-meta-label">Section</span><span class="train-meta-val">${sec}</span></div>
          ${train.delay ? `<div class="train-meta-item"><span class="train-meta-label">Delay</span><span class="train-meta-val" style="color:var(--warning)">${train.delay} min</span></div>` : ''}
          ${train.reason ? `<div class="train-meta-item" style="grid-column:span 2"><span class="train-meta-label">Reason</span><span class="train-meta-val" style="font-size:12px;color:var(--blocked)">${train.reason}</span></div>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// SCHEDULES & DATABASE EXPLORER
// ─────────────────────────────────────────────────────────────
let currentDbSubView = 'schedules';
let selectedScheduleTrain = 'ALL';

function switchDbSubView(view) {
  currentDbSubView = view;
  document.querySelectorAll('.db-view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `dbvb-${view}`);
  });
  renderSchedulesTab();
}

function renderSchedulesTab() {
  const container = document.getElementById('schedules-content');
  if (!container) return;

  if (currentDbSubView === 'schedules') {
    renderSchedulesView(container);
  } else if (currentDbSubView === 'blocks') {
    renderConstructionBlocksView(container);
  } else if (currentDbSubView === 'decisions') {
    renderTrafficDecisionsView(container);
  } else if (currentDbSubView === 'status') {
    renderDatabaseStatusView(container);
  }
}

function renderSchedulesView(container) {
  const trains = RAILWAY_DATABASE.trains;
  const filtered = selectedScheduleTrain === 'ALL'
    ? RAILWAY_DATABASE.schedules
    : RAILWAY_DATABASE.schedules.filter(s => s.train_number === selectedScheduleTrain);

  container.innerHTML = `
    <div class="data-table-card">
      <div class="data-table-header">
        <div>
          <h3>Train Timetable & Stoppages</h3>
          <span style="font-size:12px;color:var(--gray-400);">Displaying official timetables, platform assignments, and halt durations</span>
        </div>
        <div>
          <select class="filter-select" id="schedule-train-select" onchange="filterScheduleByTrain(this.value)">
            <option value="ALL" ${selectedScheduleTrain === 'ALL' ? 'selected' : ''}>All Trains (${trains.length})</option>
            ${trains.map(t => `<option value="${t.id}" ${selectedScheduleTrain === t.id ? 'selected' : ''}>${t.id} – ${t.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="data-table-wrapper">
        <table class="ir-table">
          <thead>
            <tr>
              <th>Train #</th>
              <th>Train Name</th>
              <th>Stop #</th>
              <th>Station</th>
              <th>Arr. Time</th>
              <th>Dep. Time</th>
              <th>Halt</th>
              <th>Platform</th>
              <th>Distance</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(s => {
              const tr = RAILWAY_DATABASE.trains.find(t => t.id === s.train_number);
              return `
                <tr>
                  <td><strong style="color:var(--blue-700);">${s.train_number}</strong></td>
                  <td>${tr ? tr.name : '–'}</td>
                  <td><span class="badge" style="background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:12px;font-weight:700;font-size:11px;">#${s.stop_no}</span></td>
                  <td><strong>${s.station_name}</strong> <span style="color:var(--gray-400);font-size:11px;">(${s.station_id})</span></td>
                  <td style="font-family:monospace;font-weight:600;">${s.arrival}</td>
                  <td style="font-family:monospace;font-weight:600;">${s.departure}</td>
                  <td>${s.halt_min > 0 ? `<span style="color:#d97706;font-weight:600;">${s.halt_min} min</span>` : '<span style="color:var(--gray-400);">Source/Dest</span>'}</td>
                  <td><strong style="color:var(--blue-600);background:var(--blue-50);padding:2px 8px;border-radius:4px;">PF ${s.platform}</strong></td>
                  <td>${s.distance_km} km</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function filterScheduleByTrain(val) {
  selectedScheduleTrain = val;
  renderSchedulesTab();
}

function renderConstructionBlocksView(container) {
  const blocks = RAILWAY_DATABASE.construction_blocks || [];
  container.innerHTML = `
    <div class="data-table-card">
      <div class="data-table-header">
        <div>
          <h3>Active Construction & Maintenance Blocks</h3>
          <span style="font-size:12px;color:var(--gray-400);">Direct feed from Railway System backend maintenance schedule</span>
        </div>
        <span class="ir-badge priority-high">${blocks.filter(b => b.status === 'ACTIVE').length} Active Blocks</span>
      </div>
      <div class="data-table-wrapper">
        <table class="ir-table">
          <thead>
            <tr>
              <th>Block ID</th>
              <th>Track Section</th>
              <th>Start Time</th>
              <th>Est. Completion</th>
              <th>Reason / Work Description</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${blocks.map(b => `
              <tr>
                <td><strong>#BLK-${b.block_id}</strong></td>
                <td><strong style="color:var(--blue-700);">${b.track_id}</strong> (${b.section})</td>
                <td style="font-size:12px;font-family:monospace;">${b.start_time}</td>
                <td style="font-size:12px;font-family:monospace;">${b.end_time}</td>
                <td style="max-width:280px;font-size:12px;">${b.reason}</td>
                <td><span class="ir-badge priority-${b.priority.toLowerCase()}">${b.priority}</span></td>
                <td><span class="ir-badge status-${b.status.toLowerCase()}">${b.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTrafficDecisionsView(container) {
  const decisions = RAILWAY_DATABASE.traffic_decisions || [];
  container.innerHTML = `
    <div class="data-table-card">
      <div class="data-table-header">
        <div>
          <h3>Traffic Rerouting & Optimization Decisions</h3>
          <span style="font-size:12px;color:var(--gray-400);">Autonomous decisions generated by deviation algorithm</span>
        </div>
        <span class="ir-badge decision-divert">${decisions.length} Decisions Logged</span>
      </div>
      <div class="data-table-wrapper">
        <table class="ir-table">
          <thead>
            <tr>
              <th>Decision ID</th>
              <th>Train</th>
              <th>Action</th>
              <th>Original Path</th>
              <th>Recommended Reroute</th>
              <th>Delay Impact</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${decisions.map(d => `
              <tr>
                <td><strong>#DEC-${d.decision_id}</strong></td>
                <td><strong>${d.train_number}</strong> <span style="color:var(--gray-500);font-size:11px;">${d.train_name}</span></td>
                <td><span class="ir-badge decision-${d.decision.toLowerCase()}">${d.decision}</span></td>
                <td style="font-size:12px;color:var(--gray-500);">${d.original_route}</td>
                <td style="font-size:12px;font-weight:600;color:var(--blue-700);">${d.recommended_route}</td>
                <td><span style="font-weight:700;color:${d.delay_minutes > 0 ? '#d97706' : '#059669'};">${d.delay_minutes > 0 ? '+' + d.delay_minutes + ' min' : 'On Schedule'}</span></td>
                <td style="font-size:12px;max-width:220px;">${d.reason}</td>
                <td><span class="ir-badge status-completed">${d.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDatabaseStatusView(container) {
  const db = RAILWAY_DATABASE.database_status;
  const tables = db.tables;

  container.innerHTML = `
    <div class="db-stats-grid">
      <div class="db-stat-card">
        <span class="db-stat-num">${tables.stations}</span>
        <span class="db-stat-label">Stations</span>
        <span class="db-stat-table">table: stations</span>
      </div>
      <div class="db-stat-card">
        <span class="db-stat-num">${tables.tracks}</span>
        <span class="db-stat-label">Railway Tracks</span>
        <span class="db-stat-table">table: tracks</span>
      </div>
      <div class="db-stat-card">
        <span class="db-stat-num">${tables.trains}</span>
        <span class="db-stat-label">Active Trains</span>
        <span class="db-stat-table">table: trains</span>
      </div>
      <div class="db-stat-card">
        <span class="db-stat-num">${tables.schedules}</span>
        <span class="db-stat-label">Schedules / Stops</span>
        <span class="db-stat-table">table: schedules</span>
      </div>
      <div class="db-stat-card">
        <span class="db-stat-num">${tables.construction_blocks}</span>
        <span class="db-stat-label">Construction Blocks</span>
        <span class="db-stat-table">table: construction_blocks</span>
      </div>
      <div class="db-stat-card">
        <span class="db-stat-num">${tables.traffic_decisions}</span>
        <span class="db-stat-label">Traffic Decisions</span>
        <span class="db-stat-table">table: traffic_decisions</span>
      </div>
    </div>

    <div class="data-table-card">
      <div class="data-table-header">
        <div>
          <h3>MySQL Schema & Static Synchronization Status</h3>
          <span style="font-size:12px;color:var(--gray-400);">Database: <code>${db.database}</code> • Status: <strong>${db.status}</strong></span>
        </div>
        <button class="filter-select" style="cursor:pointer;" onclick="exportDatabaseJson()">📥 Export JSON Data</button>
      </div>
      <div style="padding:20px;line-height:1.6;font-size:13px;color:var(--gray-600);">
        <p><strong>Architecture Note:</strong> When deployed to GitHub Pages (which is a static hosting environment without a continuous Python/MySQL daemon), the complete relational dataset from <code>app.py</code> and <code>database.xlsx</code> is bundled directly into the client runtime via <code>data/railway_network.js</code> and accessible via <code>window.RailwayAPI</code>.</p>
        <div style="margin-top:14px;background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;font-family:monospace;font-size:12px;">
          <div>✓ Stations: 88 records (NR, WR, SR, ER, SWR, CR, WCR, ECR, ECoR, NFR, NWR, NCR, KR)</div>
          <div>✓ Tracks: 90 tracks with bidirectional graph, max speeds, distances</div>
          <div>✓ Trains: 8 premium trains with live tracking & speed telemetry</div>
          <div>✓ Schedules: 36 stop timetables with platform assignments</div>
          <div>✓ Construction Blocks: 7 active and scheduled blocks</div>
          <div>✓ Traffic Decisions: 4 real-time reroutes with Dijkstra graph traversal</div>
        </div>
      </div>
    </div>
  `;
}

function exportDatabaseJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(RAILWAY_DATABASE, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", "railway_system_database.json");
  dlAnchor.click();
  showToast("Database JSON exported successfully!", "success");
}

// ─────────────────────────────────────────────────────────────
// QUERY / REPAIR SYSTEM
// ─────────────────────────────────────────────────────────────
const QUERY_STORE_KEY = 'ir_repair_queries';

function loadQueries() {
  try { return JSON.parse(localStorage.getItem(QUERY_STORE_KEY)) || []; } catch { return []; }
}

function saveQueries(queries) {
  localStorage.setItem(QUERY_STORE_KEY, JSON.stringify(queries));
}

function initQuerySystem() { updateQueryBadges(); }

function updateQueryBadges() {
  const queries = loadQueries();
  const user = APP.currentUser;
  if (!user) return;

  if (user.role === 'station_master') {
    const pending = queries.filter(q => q.raisedById === user.id && q.status !== 'completed').length;
    const badge = document.getElementById('query-count-badge');
    if (badge) { badge.textContent = pending; badge.classList.toggle('hidden', pending === 0); }
  }

  if (user.role === 'repair_engineer') {
    const open = queries.filter(q => q.status !== 'completed').length;
    const badge = document.getElementById('repair-jobs-badge');
    if (badge) { badge.textContent = open; badge.classList.toggle('hidden', open === 0); }
  }
}

function getCompletedTracks() {
  return loadQueries().filter(q => q.status === 'completed').map(q => q.trackId);
}

function getTrackDisplayStatus(track) {
  if (getCompletedTracks().includes(track.id)) return 'completed';
  return track.status;
}

// ─────────────────────────────────────────────────────────────
// QUERY MODAL
// ─────────────────────────────────────────────────────────────
function openQueryModal(preselectedTrackId) {
  const sel = document.getElementById('qf-track');
  if (!sel) return;
  const allTracks = [...RAILWAY_DATABASE.tracks].sort((a, b) => a.id.localeCompare(b.id));
  sel.innerHTML = '<option value="">-- Select Any Track Corridor --</option>' +
    allTracks.map(t => {
      const from = stationLookup[t.from]?.name || t.from;
      const to   = stationLookup[t.to]?.name   || t.to;
      const statusTag = t.status === 'blocked' ? ' [⛔ Blocked]' : ' [🟢 Operational]';
      return `<option value="${t.id}" ${t.id === preselectedTrackId ? 'selected' : ''}>${t.id}: ${from} → ${to} (${t.distance} km)${statusTag}</option>`;
    }).join('');

  if (preselectedTrackId) {
    sel.value = preselectedTrackId;
    const track = RAILWAY_DATABASE.tracks.find(t => t.id === preselectedTrackId);
    if (track?.reason) document.getElementById('qf-reason').value = track.reason;
  }

  document.getElementById('query-modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeQueryModal(e) {
  if (e && e.target !== document.getElementById('query-modal-overlay')) return;
  document.getElementById('query-modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  document.getElementById('query-form').reset();
}

function submitQuery(event) {
  event.preventDefault();
  const user = APP.currentUser || { id: 'SM001', name: 'Duty Station Master', role: 'station_master' };

  const trackId    = document.getElementById('qf-track').value;
  const damageType = document.getElementById('qf-damage-type').value;
  const reason     = document.getElementById('qf-reason').value.trim();
  const hours      = parseInt(document.getElementById('qf-hours').value) || 24;
  const priority   = document.getElementById('qf-priority').value;

  const track = RAILWAY_DATABASE.tracks.find(t => t.id === trackId);
  const from  = stationLookup[track?.from]?.name || track?.from || '?';
  const to    = stationLookup[track?.to]?.name   || track?.to   || '?';

  const queries = loadQueries();
  const qid = 'Q' + String(Date.now()).slice(-6);
  queries.push({
    id: qid,
    trackId, fromStation: from, toStation: to,
    damageType, reason, estimatedHours: hours, priority,
    raisedById: user.id, raisedByName: user.name,
    raisedAt: new Date().toISOString(),
    status: 'pending',
    assignedToId: null, assignedToName: null,
    acceptedAt: null, startedAt: null, completedAt: null,
  });
  saveQueries(queries);

  // If high priority or severe incident, dynamically mark track status
  if (track && (priority === 'high' || damageType === 'Rail Fracture' || damageType === 'Bridge Damage' || damageType === 'Track Subsidence')) {
    track.status = 'blocked';
    track.reason = `${damageType}: ${reason.slice(0, 70)}`;
  }

  // Add alert to active alerts list
  RAILWAY_DATABASE.alerts.unshift({
    id: 'ALT-' + Date.now().toString().slice(-4),
    track: trackId,
    type: priority === 'high' ? 'critical' : 'warning',
    time: new Date().toISOString(),
    message: `Incident Query #${qid} on ${trackId} (${from} → ${to}): ${damageType} - ${reason.slice(0, 80)}`,
    zone: stationLookup[track?.from]?.zone || 'NR'
  });

  closeQueryModal();
  showToast(`✅ Query #${qid} raised successfully for ${trackId} (${from} → ${to})!`, 'success');
  updateQueryBadges();
  if (APP.currentTab === 'tracks') renderTracksGrid();
  if (APP.currentTab === 'my-queries') renderMyQueries();
  if (APP.currentTab === 'alerts') renderAlerts();
  updateNetworkStats();
}

// ─────────────────────────────────────────────────────────────
// MY QUERIES TAB (Station Master)
// ─────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:     { label: '⏳ Pending',     cls: 'pending' },
  accepted:    { label: '✔ Accepted',    cls: 'accepted' },
  in_progress: { label: '🔧 In Progress', cls: 'in_progress' },
  completed:   { label: '✅ Completed',   cls: 'completed' },
};

const PRIORITY_META = {
  high:   { label: '🔴 High',   cls: 'priority-high' },
  medium: { label: '🟡 Medium', cls: 'priority-medium' },
  low:    { label: '🟢 Low',    cls: 'priority-low' },
};

function renderMyQueries() {
  const user = APP.currentUser;
  const filter = document.getElementById('query-filter')?.value || 'all';
  const queries = loadQueries().filter(q =>
    q.raisedById === user.id && (filter === 'all' || q.status === filter)
  ).reverse();

  const container = document.getElementById('my-queries-list');

  if (queries.length === 0) {
    container.innerHTML = emptyState('No queries yet', 'Go to Track Status and raise a repair query for any blocked track.');
    return;
  }

  container.innerHTML = queries.map(q => {
    const sm = STATUS_META[q.status] || STATUS_META.pending;
    const pm = PRIORITY_META[q.priority] || PRIORITY_META.medium;
    const raisedAt = new Date(q.raisedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const completedAt = q.completedAt ? new Date(q.completedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
    return `<div class="query-card">
      <div class="query-card-header"><span class="query-card-id">${q.id}</span><span class="query-status-badge ${sm.cls}">${sm.label}</span></div>
      <div class="query-card-body">
        <div class="query-track-route">${q.fromStation} → ${q.toStation}</div>
        <div class="query-card-meta">
          <span class="qmeta-tag">Track: ${q.trackId}</span>
          <span class="qmeta-tag">🔨 ${q.damageType}</span>
          <span class="qmeta-tag ${pm.cls}">${pm.label}</span>
          <span class="qmeta-tag">⏱ ${q.estimatedHours}h allocated</span>
        </div>
        <div class="query-reason-box">📝 ${q.reason}</div>
        ${q.status === 'completed' ? `<div class="job-completed-banner">✅ Repair Completed by ${q.assignedToName || 'Engineer'}${completedAt ? ' · ' + completedAt : ''}</div>` : ''}
        ${q.assignedToName && q.status !== 'completed' ? `<div style="margin-top:8px;font-size:12px;color:var(--gray-500)"><span class="re-name-tag">🔧 ${q.assignedToName}</span> assigned</div>` : ''}
      </div>
      <div class="query-card-footer"><div class="qf-info"><span>🕐 Raised: ${raisedAt}</span></div></div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// REPAIR JOBS TAB (Repair Engineer)
// ─────────────────────────────────────────────────────────────
function renderRepairJobs() {
  const user = APP.currentUser;
  const filter = document.getElementById('job-filter')?.value || 'all';
  const queries = loadQueries().filter(q => filter === 'all' || q.status === filter).reverse();
  const container = document.getElementById('repair-jobs-list');

  if (queries.length === 0) {
    container.innerHTML = emptyState('No jobs available', 'Repair queries raised by Station Masters will appear here.');
    return;
  }

  container.innerHTML = queries.map(q => {
    const sm = STATUS_META[q.status] || STATUS_META.pending;
    const pm = PRIORITY_META[q.priority] || PRIORITY_META.medium;
    const raisedAt = new Date(q.raisedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const isMyJob = q.assignedToId === user.id;
    const canAccept = q.status === 'pending';
    const canStart = q.status === 'accepted' && isMyJob;
    const canComplete = q.status === 'in_progress' && isMyJob;
    const isDone = q.status === 'completed';

    const actionBtns = isDone ? '' : `
      <div class="job-actions">
        <button class="job-btn job-btn-accept" ${!canAccept ? 'disabled' : ''} onclick="jobAction('${q.id}','accept')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
          Accept Job
        </button>
        <button class="job-btn job-btn-start" ${!canStart ? 'disabled' : ''} onclick="jobAction('${q.id}','start')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Job
        </button>
        <button class="job-btn job-btn-complete" ${!canComplete ? 'disabled' : ''} onclick="jobAction('${q.id}','complete')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Complete Job
        </button>
      </div>`;

    return `<div class="query-card">
      <div class="query-card-header"><span class="query-card-id">${q.id}</span><span class="query-status-badge ${sm.cls}">${sm.label}</span></div>
      <div class="query-card-body">
        <div class="query-track-route">${q.fromStation} → ${q.toStation}</div>
        <div class="query-card-meta">
          <span class="qmeta-tag">Track: ${q.trackId}</span>
          <span class="qmeta-tag">🔨 ${q.damageType}</span>
          <span class="qmeta-tag ${pm.cls}">${pm.label}</span>
          <span class="qmeta-tag">⏱ ${q.estimatedHours}h</span>
        </div>
        <div class="query-reason-box">📝 ${q.reason}</div>
        <div style="font-size:12px;color:var(--gray-500);margin-bottom:4px">Raised by: <strong>${q.raisedByName}</strong> &nbsp;·&nbsp; ${raisedAt}</div>
        ${isDone ? `<div class="job-completed-banner">✅ Job Completed · ${new Date(q.completedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>` : actionBtns}
      </div>
    </div>`;
  }).join('');
}

function jobAction(queryId, action) {
  const user = APP.currentUser;
  const queries = loadQueries();
  const q = queries.find(q => q.id === queryId);
  if (!q) return;

  if      (action === 'accept' && q.status === 'pending') {
    q.status = 'accepted'; q.assignedToId = user.id; q.assignedToName = user.name;
    q.acceptedAt = new Date().toISOString();
    showToast('✔ Job accepted! You are now assigned.', 'info');
  } else if (action === 'start' && q.status === 'accepted' && q.assignedToId === user.id) {
    q.status = 'in_progress'; q.startedAt = new Date().toISOString();
    showToast('🔧 Job started! Work in progress.', 'info');
  } else if (action === 'complete' && q.status === 'in_progress' && q.assignedToId === user.id) {
    q.status = 'completed'; q.completedAt = new Date().toISOString();
    showToast('✅ Job completed! Track marked as repaired.', 'success');
  } else {
    showToast('⚠ Action not allowed at this stage.', 'error'); return;
  }

  saveQueries(queries);
  updateQueryBadges();
  renderRepairJobs();
}

// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// REAL-TIME TRAIN DEVIATION SYSTEM
// Dijkstra's shortest path on the track graph
// ═══════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────
const DEVIATION_STORE_KEY = 'ir_deviations';

function loadDeviations() {
  try { return JSON.parse(localStorage.getItem(DEVIATION_STORE_KEY)) || []; } catch { return []; }
}

function saveDeviations(devs) {
  localStorage.setItem(DEVIATION_STORE_KEY, JSON.stringify(devs));
}

// Build adjacency graph from operational tracks (excluding blocked ones)
function buildGraph(excludeTrackId) {
  const graph = {};
  RAILWAY_DATABASE.stations.forEach(s => { graph[s.id] = []; });

  RAILWAY_DATABASE.tracks.forEach(track => {
    if (track.status === 'blocked' || track.id === excludeTrackId) return;
    const { from, to, distance, id } = track;
    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];
    graph[from].push({ node: to, distance, trackId: id });
    graph[to].push({ node: from, distance, trackId: id }); // bidirectional
  });

  return graph;
}

// Dijkstra's algorithm
function dijkstra(graph, startId, endId) {
  const dist = {};
  const prev = {};
  const prevTrack = {};
  const visited = new Set();
  const queue = [];

  Object.keys(graph).forEach(n => { dist[n] = Infinity; prev[n] = null; prevTrack[n] = null; });
  dist[startId] = 0;
  queue.push({ node: startId, d: 0 });

  while (queue.length) {
    // pick min
    queue.sort((a, b) => a.d - b.d);
    const { node: u } = queue.shift();
    if (visited.has(u)) continue;
    visited.add(u);

    if (u === endId) break;

    for (const edge of (graph[u] || [])) {
      const alt = dist[u] + edge.distance;
      if (alt < dist[edge.node]) {
        dist[edge.node] = alt;
        prev[edge.node] = u;
        prevTrack[edge.node] = edge.trackId;
        queue.push({ node: edge.node, d: alt });
      }
    }
  }

  if (dist[endId] === Infinity) return null;

  // Reconstruct path
  const stationPath = [];
  const trackPath = [];
  let cur = endId;
  while (cur) {
    stationPath.unshift(cur);
    if (prevTrack[cur]) trackPath.unshift(prevTrack[cur]);
    cur = prev[cur];
  }

  return { stationPath, trackPath, totalDistance: dist[endId] };
}

// Find alternative route for a train given a blocked track
function findAlternativeRoute(blockedTrackId, trainId) {
  const train = RAILWAY_DATABASE.trains.find(t => t.id === trainId);
  if (!train) return null;

  const blockedTrack = RAILWAY_DATABASE.tracks.find(t => t.id === blockedTrackId);
  if (!blockedTrack) return null;

  // Train's overall destination
  const destination = train.to;

  // Train's current position: either train.from or derive from currentSection
  const currentTrack = RAILWAY_DATABASE.tracks.find(t => t.id === train.currentSection);
  const currentStation = currentTrack ? currentTrack.from : train.from;

  // Build graph excluding the blocked track
  const graph = buildGraph(blockedTrackId);

  // Find shortest path from current station to destination
  const result = dijkstra(graph, currentStation, destination);
  return result;
}

// ─────────────────────────────────────────────────────────────
// DEVIATION MODAL (Station Master)
// ─────────────────────────────────────────────────────────────
let currentDeviationTrackId = null;

function openDeviationModal(blockedTrackId) {
  currentDeviationTrackId = blockedTrackId;
  closePopup(); closeTrackPopup();

  const track = RAILWAY_DATABASE.tracks.find(t => t.id === blockedTrackId);
  const from = stationLookup[track?.from]?.name || track?.from;
  const to   = stationLookup[track?.to]?.name   || track?.to;

  document.getElementById('dev-blocked-track').value = `${blockedTrackId}: ${from} → ${to}`;

  // Populate train select with trains affected by this blockage
  const sel = document.getElementById('dev-train-select');
  sel.innerHTML = '<option value="">-- Select Train --</option>' +
    RAILWAY_DATABASE.trains.map(t => {
      const tFrom = stationLookup[t.from]?.name || t.from;
      const tTo   = stationLookup[t.to]?.name   || t.to;
      return `<option value="${t.id}">${t.id} – ${t.name} (${tFrom} → ${tTo})</option>`;
    }).join('');

  // Reset preview
  document.getElementById('deviation-preview-body').innerHTML = '<div class="dp-placeholder">Select a train above to compute the alternative route</div>';
  document.getElementById('dev-message').value = '';
  document.getElementById('dev-submit-btn').disabled = true;

  document.getElementById('deviation-modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDeviationModal(e) {
  if (e && e.target !== document.getElementById('deviation-modal-overlay')) return;
  document.getElementById('deviation-modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  currentDeviationTrackId = null;
}

function previewDeviation() {
  const trainId = document.getElementById('dev-train-select').value;
  const previewBody = document.getElementById('deviation-preview-body');
  const submitBtn = document.getElementById('dev-submit-btn');

  if (!trainId || !currentDeviationTrackId) {
    previewBody.innerHTML = '<div class="dp-placeholder">Select a train above to compute the alternative route</div>';
    submitBtn.disabled = true;
    return;
  }

  const result = findAlternativeRoute(currentDeviationTrackId, trainId);

  if (!result) {
    previewBody.innerHTML = '<div class="dp-no-route">⛔ No alternative route found. All parallel routes are blocked.</div>';
    submitBtn.disabled = true;
    return;
  }

  const stationNames = result.stationPath.map(id => stationLookup[id]?.name || id);
  const hopsHtml = result.stationPath.map((id, i) => {
    const name = stationLookup[id]?.name || id;
    const isLast = i === result.stationPath.length - 1;
    return `<div class="dp-hop"><div class="dp-station">${id}</div>${!isLast ? '<div class="dp-arrow">→</div>' : ''}</div>`;
  }).join('');

  previewBody.innerHTML = `
    <div class="dp-route-found">
      <div class="dp-route-hops">${hopsHtml}</div>
      <div class="dp-stats">
        <div class="dp-stat"><div class="dp-stat-val">${result.stationPath.length - 1}</div><div class="dp-stat-label">Hops</div></div>
        <div class="dp-stat"><div class="dp-stat-val">${result.totalDistance}</div><div class="dp-stat-label">Distance (km)</div></div>
        <div class="dp-stat"><div class="dp-stat-val">${result.trackPath.length}</div><div class="dp-stat-label">Track Segments</div></div>
      </div>
    </div>`;

  // Auto-fill message
  const train = RAILWAY_DATABASE.trains.find(t => t.id === trainId);
  document.getElementById('dev-message').value =
    `Track ${currentDeviationTrackId} blocked. Proceed via alternate route: ${stationNames.join(' → ')}. Total extra distance: ${result.totalDistance} km.`;

  submitBtn.disabled = false;

  // Store route for map preview
  APP.mapState.deviationRouteTrackIds = result.trackPath;
}

function submitDeviation() {
  const trainId = document.getElementById('dev-train-select').value;
  const message = document.getElementById('dev-message').value.trim();

  if (!trainId || !currentDeviationTrackId) {
    showToast('⚠ Please select a train first.', 'error'); return;
  }

  const result = findAlternativeRoute(currentDeviationTrackId, trainId);
  if (!result) {
    showToast('⛔ No alternative route available.', 'error'); return;
  }

  const deviations = loadDeviations();
  const deviation = {
    id: 'DEV' + String(Date.now()).slice(-6),
    blockedTrackId: currentDeviationTrackId,
    trainId,
    alternateRoute: result.stationPath,
    alternateTrackIds: result.trackPath,
    totalDistance: result.totalDistance,
    message,
    issuedByName: APP.currentUser.name,
    issuedAt: new Date().toISOString(),
    acknowledgedAt: null,
    status: 'issued',
  };

  // Remove any previous deviation for this train
  const filtered = deviations.filter(d => d.trainId !== trainId);
  filtered.push(deviation);
  saveDeviations(filtered);

  // Highlight on map
  APP.mapState.deviationRouteTrackIds = result.trackPath;

  // Show deviation overlay info on map
  showDeviationOverlay(deviation);

  // Update LP deviation badge
  if (APP.currentUser.role === 'station_master') {
    showToast(`🟠 Deviation issued for Train ${trainId}. Loco Pilot has been notified.`, 'info');
  }

  closeDeviationModal();
}

function showDeviationOverlay(deviation) {
  const overlay = document.getElementById('deviation-overlay-info');
  const body = document.getElementById('doi-body');
  if (!overlay || !body) return;

  const stationNames = deviation.alternateRoute.map(id => {
    const s = stationLookup[id];
    return s ? `${s.id} (${s.name})` : id;
  });

  body.innerHTML = `
    <strong>Train ${deviation.trainId}</strong> – Alternative Route:<br>
    ${stationNames.join(' → ')}<br>
    <span style="color:#fde68a;font-size:11px">Total: ${deviation.totalDistance} km · Issued by ${deviation.issuedByName}</span>`;

  overlay.classList.remove('hidden');
}

function clearDeviationOverlay() {
  document.getElementById('deviation-overlay-info').classList.add('hidden');
  APP.mapState.deviationRouteTrackIds = [];
}

// ─────────────────────────────────────────────────────────────
// LOCO PILOT – MY ROUTE TAB
// ─────────────────────────────────────────────────────────────
function renderMyRoute() {
  const user = APP.currentUser;
  const container = document.getElementById('my-route-content');
  if (!container || !user || user.role !== 'loco_pilot') return;

  // Find train assigned to this pilot
  const train = RAILWAY_DATABASE.trains.find(t => t.id === user.train?.split(' ')[0]) ||
    RAILWAY_DATABASE.trains.find(t => {
      const badge = user.badge.toLowerCase();
      // Associate by pilot badge order: LP001 → first train, etc.
      const lpNum = parseInt(user.id.replace(/\D/g, ''), 10);
      return t.id === RAILWAY_DATABASE.trains[lpNum - 1]?.id;
    }) || RAILWAY_DATABASE.trains[0];

  const fromStation = stationLookup[train.from];
  const toStation   = stationLookup[train.to];
  const currentTrack = RAILWAY_DATABASE.tracks.find(t => t.id === train.currentSection);
  const currentSection = currentTrack ? `${stationLookup[currentTrack.from]?.id} – ${stationLookup[currentTrack.to]?.id}` : '–';

  // Check for active deviation
  const deviations = loadDeviations();
  const myDeviation = deviations.find(d => d.trainId === train.id && d.status === 'issued');

  let deviationHtml = '';
  if (myDeviation) {
    const stationNames = myDeviation.alternateRoute.map(id => stationLookup[id]?.name || id);
    const stepsHtml = myDeviation.alternateRoute.map((id, i) => {
      const name = stationLookup[id]?.name || id;
      return `<div class="dab-step"><div class="dab-step-num">${i + 1}</div><strong>${id}</strong> – ${name}</div>`;
    }).join('');

    // Highlight on map
    APP.mapState.deviationRouteTrackIds = myDeviation.alternateTrackIds;

    deviationHtml = `
      <div class="deviation-alert-banner">
        <div class="dab-header">
          <div class="dab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </div>
          <div>
            <div class="dab-title">⚠ DEVIATION ORDER ISSUED</div>
            <div class="dab-subtitle">New alternate route assigned for Train ${train.id} – ${train.name}</div>
          </div>
        </div>
        <div class="dab-route-info">
          <div class="dab-route-label">Alternate Route Stations</div>
          <div class="dab-route-steps">${stepsHtml}</div>
        </div>
        <div class="dab-message">📢 ${myDeviation.message}</div>
        <div class="dab-actions">
          <button class="dab-ack-btn" onclick="acknowledgeDeviation('${myDeviation.id}')">
            ✅ Acknowledge & Accept New Route
          </button>
          <button class="dab-view-map-btn" onclick="switchTab('map')">
            🗺 View on Map
          </button>
        </div>
      </div>`;
  }

  const statusColors = { on_time: '#10b981', delayed: '#f59e0b', halted: '#ef4444' };
  const statusLabels = { on_time: 'On Time', delayed: 'Delayed', halted: 'Halted' };

  container.innerHTML = `
    ${deviationHtml}
    <div class="lp-route-card">
      <h3>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="vertical-align:middle;margin-right:8px"><rect x="2" y="11" width="20" height="8" rx="2"/><path d="M4 11V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg>
        Train ${train.id} – ${train.name}
      </h3>

      <div class="lp-route-path">
        <div class="lp-station-chip terminal">🏁 ${fromStation?.id || train.from}</div>
        <div class="lp-route-arrow">→→→</div>
        <div class="lp-station-chip intermediate" style="background:rgba(249,115,22,0.1);border-color:rgba(249,115,22,0.3);color:#c2410c">
          📍 ${currentSection}
        </div>
        <div class="lp-route-arrow">→→→</div>
        <div class="lp-station-chip terminal">🎯 ${toStation?.id || train.to}</div>
      </div>

      <div class="lp-info-grid">
        <div class="lp-info-item">
          <div class="lp-info-label">Status</div>
          <div class="lp-info-val" style="color:${statusColors[train.status]}">${statusLabels[train.status]}</div>
        </div>
        <div class="lp-info-item">
          <div class="lp-info-label">Speed</div>
          <div class="lp-info-val">${train.speed || 0} km/h</div>
        </div>
        <div class="lp-info-item">
          <div class="lp-info-label">Current Section</div>
          <div class="lp-info-val" style="font-size:14px">${currentSection}</div>
        </div>
        ${train.delay ? `<div class="lp-info-item"><div class="lp-info-label">Delay</div><div class="lp-info-val" style="color:var(--warning)">${train.delay} min</div></div>` : ''}
        <div class="lp-info-item">
          <div class="lp-info-label">Assigned Pilot</div>
          <div class="lp-info-val" style="font-size:14px">${user.name}</div>
        </div>
        ${myDeviation ? `<div class="lp-info-item" style="background:rgba(249,115,22,0.1);border-color:rgba(249,115,22,0.3)">
          <div class="lp-info-label">Deviation</div>
          <div class="lp-info-val" style="color:#c2410c;font-size:13px">⚠ Active</div>
        </div>` : ''}
      </div>
    </div>`;

  // Update deviation badge
  const devBadge = document.getElementById('deviation-badge');
  if (devBadge) {
    devBadge.classList.toggle('hidden', !myDeviation);
  }
}

function acknowledgeDeviation(deviationId) {
  const devs = loadDeviations();
  const dev = devs.find(d => d.id === deviationId);
  if (!dev) return;

  dev.status = 'acknowledged';
  dev.acknowledgedAt = new Date().toISOString();
  saveDeviations(devs);

  showToast('✅ Deviation acknowledged. Proceed on the new route.', 'success');
  renderMyRoute();
}

function checkLPDeviation() {
  const user = APP.currentUser;
  if (!user || user.role !== 'loco_pilot') return;

  const train = RAILWAY_DATABASE.trains.find((_, i) => {
    const lpNum = parseInt(user.id.replace(/\D/g, ''), 10);
    return i === lpNum - 1;
  }) || RAILWAY_DATABASE.trains[0];

  const devs = loadDeviations();
  const active = devs.find(d => d.trainId === train.id && d.status === 'issued');

  const devBadge = document.getElementById('deviation-badge');
  if (devBadge) devBadge.classList.toggle('hidden', !active);

  if (active) {
    APP.mapState.deviationRouteTrackIds = active.alternateTrackIds;
    showToast('⚠ A deviation order has been issued for your train. Check My Route tab.', 'info');
  }
}

// ─────────────────────────────────────────────────────────────
// UTILITY: Empty State
// ─────────────────────────────────────────────────────────────
function emptyState(title, desc) {
  return `<div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="60" height="60"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    <h3>${title}</h3><p>${desc}</p></div>`;
}

// ─────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const old = document.getElementById('ir-toast');
  if (old) old.remove();

  const colors = {
    success: ['#065f46', '#d1fae5'],
    info:    ['#1040a0', '#dbeafe'],
    error:   ['#991b1b', '#fee2e2'],
  };
  const [textColor, bgColor] = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.id = 'ir-toast';
  toast.style.cssText = `
    position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:${bgColor}; color:${textColor};
    padding:12px 24px; border-radius:999px;
    font-size:13px; font-weight:700; font-family:Inter,sans-serif;
    box-shadow:0 8px 30px rgba(0,0,0,0.2);
    z-index:9999; white-space:nowrap;
    animation:toastIn .3s cubic-bezier(.34,1.56,.64,1);
  `;
  toast.textContent = message;

  const style = document.createElement('style');
  style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
