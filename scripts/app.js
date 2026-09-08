/* ============================================================
   TRAINSYN – INDIAN RAILWAYS IMS
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
  const canvas = document.getElementById('splash-particles');
  if (canvas) initSplashParticles(canvas);

  buildSleepers();
  startSmokeEffect();

  const fill = document.getElementById('splash-progress-fill');
  const pctEl = document.getElementById('splash-pct');
  const statusEl = document.getElementById('splash-status-text');

  let pct = 0;
  let statusIdx = 0;
  const statusInterval = setInterval(() => {
    statusIdx = Math.min(statusIdx + 1, SPLASH_STATUSES.length - 1);
    if (statusEl) statusEl.textContent = SPLASH_STATUSES[statusIdx];
  }, 420);

  const progressInterval = setInterval(() => {
    const increment = pct < 60 ? 3 : pct < 85 ? 1.5 : 0.8;
    pct = Math.min(pct + increment, 100);
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    if (pct >= 100) {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      setTimeout(hideSplash, 500);
    }
  }, 40);
}

function buildSleepers() {
  const row = document.getElementById('splash-sleepers');
  if (!row) return;
  const count = Math.ceil(window.innerWidth / 26) + 4;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'splash-sleeper';
    s.style.animationDelay = (i * 0.05) + 's';
    row.appendChild(s);
  }
}

function startSmokeEffect() {
  const container = document.getElementById('st-smoke');
  if (!container) return;
  setInterval(() => {
    const puff = document.createElement('div');
    puff.className = 'smoke-puff';
    puff.style.left = (Math.random() * 10 - 5) + 'px';
    container.appendChild(puff);
    setTimeout(() => puff.remove(), 1200);
  }, 200);
}

// Splash Particles (electric sparks near train wheels)
function initSplashParticles(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];

  function spawnParticle() {
    // Train position: roughly bottom 42% of screen height, moves from left to right
    const trainBottomY = window.innerHeight * 0.58;
    // only spawn during train animation (first 5s)
    particles.push({
      x: window.innerWidth * 0.3 + Math.random() * 100,
      y: trainBottomY,
      vx: (Math.random() - 0.5) * 3,
      vy: -(Math.random() * 3 + 1),
      life: 1,
      size: Math.random() * 3 + 1,
      hue: 200 + Math.random() * 40,
    });
  }

  let startTime = Date.now();
  const spawnHandle = setInterval(() => {
    if (Date.now() - startTime > 5000) { clearInterval(spawnHandle); return; }
    for (let i = 0; i < 3; i++) spawnParticle();
  }, 60);

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.08; // gravity
      p.life -= 0.025;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = `hsl(${p.hue}, 100%, 70%)`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(loop);
  }
  loop();
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
  if (tab === 'my-queries') renderMyQueries();
  if (tab === 'repair-jobs') renderRepairJobs();
  if (tab === 'my-route') renderMyRoute();
}

// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// INTERACTIVE RAILWAY MAP – GOOGLE MAPS STYLE
// ═══════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────
let canvas, ctx, animFrame;
let stationLookup = {};
let trackHitboxes = [];

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
  RAILWAY_DATABASE.stations.forEach(s => stationLookup[s.id] = s);

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
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(APP.mapState.offsetX, APP.mapState.offsetY);
  ctx.scale(APP.mapState.scale, APP.mapState.scale);

  // 1. Draw terrain background
  drawTerrain();

  // 2. Draw water/coastal areas
  drawWaterBodies();

  // 3. Draw India outline
  drawIndiaOutline();

  // 4. Draw the rail network
  trackHitboxes = [];
  const zone = APP.mapState.activeZone;

  RAILWAY_DATABASE.tracks.forEach(track => {
    const from = stationLookup[track.from];
    const to = stationLookup[track.to];
    if (!from || !to) return;
    if (zone !== 'ALL' && from.zone !== zone && to.zone !== zone) return;
    const isHovered = APP.mapState.hoveredTrack === track.id;
    drawRailTrack(from, to, track, isHovered);
  });

  // 5. Draw stations
  RAILWAY_DATABASE.stations.forEach(station => {
    if (zone !== 'ALL' && station.zone !== zone) return;
    const isHovered = APP.mapState.hoveredStation === station.id;
    drawStation(station, isHovered);
  });

  ctx.restore();
}

// ─── Terrain ───────────────────────────────────────────────
function drawTerrain() {
  const grad = ctx.createLinearGradient(100, 100, 700, 650);
  grad.addColorStop(0,   '#1a2f1a');  // North – dark forest
  grad.addColorStop(0.2, '#22381a');
  grad.addColorStop(0.4, '#263320');
  grad.addColorStop(0.6, '#1e3025');
  grad.addColorStop(0.8, '#1a2e20');
  grad.addColorStop(1,   '#172b1f');

  ctx.fillStyle = grad;
  ctx.fillRect(-200, -100, 1100, 900);

  // Indo-Gangetic plains (light tan)
  ctx.save();
  ctx.fillStyle = 'rgba(200,175,120,0.08)';
  ctx.beginPath();
  ctx.ellipse(430, 200, 220, 80, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Deccan plateau (warm brownish)
  ctx.save();
  ctx.fillStyle = 'rgba(160,120,70,0.06)';
  ctx.beginPath();
  ctx.ellipse(360, 400, 160, 140, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Map grid (subtle road-map style)
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let x = -100; x < 800; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, -100); ctx.lineTo(x, 750); ctx.stroke();
  }
  for (let y = -50; y < 700; y += 50) {
    ctx.beginPath(); ctx.moveTo(-100, y); ctx.lineTo(800, y); ctx.stroke();
  }
  ctx.restore();
}

function drawWaterBodies() {
  ctx.save();
  // Western coast
  const coastGrad = ctx.createLinearGradient(100, 400, 180, 400);
  coastGrad.addColorStop(0, 'rgba(30,100,180,0.18)');
  coastGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coastGrad;
  ctx.beginPath();
  ctx.moveTo(130, 300); ctx.quadraticCurveTo(90, 450, 130, 560);
  ctx.lineTo(170, 560); ctx.quadraticCurveTo(140, 450, 170, 300);
  ctx.fill();

  // Eastern coast
  const eCoastGrad = ctx.createLinearGradient(570, 300, 620, 300);
  eCoastGrad.addColorStop(0, 'transparent');
  eCoastGrad.addColorStop(1, 'rgba(30,100,180,0.15)');
  ctx.fillStyle = eCoastGrad;
  ctx.beginPath();
  ctx.moveTo(560, 280); ctx.quadraticCurveTo(600, 400, 560, 510);
  ctx.lineTo(600, 510); ctx.quadraticCurveTo(640, 400, 600, 280);
  ctx.fill();

  // Bay of Bengal hint (bottom right)
  const bayGrad = ctx.createRadialGradient(580, 560, 0, 580, 560, 120);
  bayGrad.addColorStop(0, 'rgba(20,80,160,0.15)');
  bayGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = bayGrad;
  ctx.fillRect(460, 500, 200, 150);

  ctx.restore();
}

function drawIndiaOutline() {
  // Simplified stylized India boundary – approximate polygon
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  // NW → NE → East → South → West
  ctx.moveTo(190, 120);
  ctx.lineTo(270, 100); ctx.lineTo(340, 110); ctx.lineTo(420, 115);
  ctx.lineTo(510, 120); ctx.lineTo(590, 155); ctx.lineTo(660, 165);
  ctx.lineTo(700, 195); ctx.lineTo(690, 230); ctx.lineTo(655, 250);
  ctx.lineTo(590, 330); ctx.lineTo(560, 370); ctx.lineTo(540, 420);
  ctx.lineTo(530, 460); ctx.lineTo(515, 495); ctx.lineTo(490, 520);
  ctx.lineTo(460, 550); ctx.lineTo(430, 570); ctx.lineTo(400, 580);
  ctx.lineTo(370, 575); ctx.lineTo(345, 590); ctx.lineTo(330, 598);
  ctx.lineTo(300, 585); ctx.lineTo(270, 570); ctx.lineTo(240, 545);
  ctx.lineTo(210, 520); ctx.lineTo(190, 490); ctx.lineTo(170, 460);
  ctx.lineTo(155, 420); ctx.lineTo(150, 380); ctx.lineTo(155, 340);
  ctx.lineTo(170, 295); ctx.lineTo(180, 250); ctx.lineTo(185, 200);
  ctx.lineTo(190, 165); ctx.lineTo(190, 120);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Draw Double-Rail Track ─────────────────────────────────
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

  ctx.save();

  // Glow shadow
  if (isBlocked) {
    ctx.shadowColor = 'rgba(239,68,68,0.5)';
    ctx.shadowBlur = isHovered ? 22 : 12;
  } else if (isDeviated) {
    ctx.shadowColor = 'rgba(249,115,22,0.7)';
    ctx.shadowBlur = isHovered ? 24 : 16;
  } else if (isCompleted) {
    ctx.shadowColor = 'rgba(37,99,235,0.5)';
    ctx.shadowBlur = isHovered ? 18 : 8;
  } else if (isHovered) {
    ctx.shadowColor = 'rgba(16,185,129,0.6)';
    ctx.shadowBlur = 16;
  }

  // Determine color
  let railColor, ballastColor;
  if (isBlocked) {
    railColor = isHovered ? '#dc2626' : '#ef4444';
    ballastColor = 'rgba(239,68,68,0.15)';
  } else if (isDeviated) {
    railColor = '#f97316';
    ballastColor = 'rgba(249,115,22,0.2)';
  } else if (isCompleted) {
    railColor = isHovered ? '#1d4ed8' : '#3b82f6';
    ballastColor = 'rgba(59,130,246,0.15)';
  } else {
    railColor = isHovered ? '#4ade80' : (APP.mapState.scale > 1.5 ? '#6ee7b7' : '#10b981');
    ballastColor = 'rgba(16,185,129,0.1)';
  }

  // Get line angle for offset
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;  // normal
  const railGap = APP.mapState.scale > 1.4 ? 2.5 : 1.8;

  // Ballast (wide background)
  ctx.beginPath();
  tracePath(ctx, x1, y1, x2, y2, cpx, cpy, isBezier);
  ctx.strokeStyle = ballastColor;
  ctx.lineWidth = isDeviated ? 10 : 8;
  ctx.setLineDash([]);
  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw sleepers if zoomed in
  if (APP.mapState.scale > 1.2 && !isBlocked) {
    drawDoubleRailSleepers(x1, y1, x2, y2, cpx, cpy, isBezier, railColor);
  }

  // Rail 1 (left)
  ctx.beginPath();
  tracePath(ctx, x1 + nx * railGap, y1 + ny * railGap, x2 + nx * railGap, y2 + ny * railGap, cpx + nx * railGap, cpy + ny * railGap, isBezier);
  if (isBlocked) ctx.setLineDash([10, 6]);
  else ctx.setLineDash([]);
  ctx.strokeStyle = railColor;
  ctx.lineWidth = isHovered ? 2.5 : 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Rail 2 (right)
  ctx.beginPath();
  tracePath(ctx, x1 - nx * railGap, y1 - ny * railGap, x2 - nx * railGap, y2 - ny * railGap, cpx - nx * railGap, cpy - ny * railGap, isBezier);
  ctx.stroke();
  ctx.setLineDash([]);

  // Deviation animated arrows
  if (isDeviated) drawDeviationArrows(x1, y1, x2, y2, cpx, cpy, isBezier);

  // Blocked pulsing midpoint indicator
  if (isBlocked) drawBlockedIndicator(x1, y1, x2, y2);

  // Completed tick
  if (isCompleted) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ctx.fillStyle = '#2563eb'; ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(37,99,235,0.6)';
    ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = 'bold 7px Inter';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowBlur = 0;
    ctx.fillText('✓', mx, my);
  }

  ctx.restore();
}

function tracePath(ctx, x1, y1, x2, y2, cpx, cpy, isBezier) {
  ctx.moveTo(x1, y1);
  if (isBezier) ctx.quadraticCurveTo(cpx, cpy, x2, y2);
  else ctx.lineTo(x2, y2);
}

function drawDoubleRailSleepers(x1, y1, x2, y2, cpx, cpy, isBezier, color) {
  const steps = 30;
  ctx.save();
  ctx.strokeStyle = color.replace(')', ',0.3)').replace('rgb', 'rgba');
  ctx.lineWidth = 1.5;

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    let mx, my;
    if (isBezier) {
      mx = (1-t)*(1-t)*x1 + 2*(1-t)*t*cpx + t*t*x2;
      my = (1-t)*(1-t)*y1 + 2*(1-t)*t*cpy + t*t*y2;
    } else {
      mx = x1 + (x2-x1)*t; my = y1 + (y2-y1)*t;
    }
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx*dx+dy*dy) || 1;
    const nx = -dy/len*3.5, ny = dx/len*3.5;

    ctx.beginPath();
    ctx.moveTo(mx+nx, my+ny); ctx.lineTo(mx-nx, my-ny);
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
  const alpha = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#f97316';
  ctx.shadowColor = 'rgba(249,115,22,0.8)';
  ctx.shadowBlur = 10;
  ctx.translate(mx, my);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(6, 0); ctx.lineTo(-4, 5); ctx.lineTo(-4, -5);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawBlockedIndicator(x1, y1, x2, y2) {
  const mx = (x1+x2)/2, my = (y1+y2)/2;
  const t = (Date.now() % 1500) / 1500;
  const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI));

  ctx.save();
  ctx.fillStyle = `rgba(239,68,68,${alpha})`;
  ctx.shadowColor = 'rgba(239,68,68,0.6)'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('✕', mx, my);
  ctx.restore();
}

// ─── Draw Station – Map Pin Style ──────────────────────────
function drawStation(station, isHovered) {
  const { x, y, type, id, name } = station;
  const isTerminal = type === 'terminal';
  const isJunction = type === 'junction';

  ctx.save();

  if (isHovered) {
    ctx.shadowColor = 'rgba(96,165,250,0.8)';
    ctx.shadowBlur = 24;
  }

  if (isTerminal) {
    // Map pin style for terminals
    const pinH = isHovered ? 22 : 18;
    const pinW = isHovered ? 14 : 12;

    // Pin body
    ctx.beginPath();
    ctx.arc(x, y - pinH/2, pinW/2, Math.PI, 0);
    ctx.lineTo(x + pinW/2, y - pinH/2);
    ctx.quadraticCurveTo(x + pinW/2, y - pinH/4, x, y);
    ctx.quadraticCurveTo(x - pinW/2, y - pinH/4, x - pinW/2, y - pinH/2);
    ctx.closePath();

    ctx.fillStyle = isHovered ? '#1d4ed8' : '#1e40af';
    ctx.fill();
    ctx.strokeStyle = isHovered ? '#93c5fd' : '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(x, y - pinH/2, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

  } else if (isJunction) {
    // Diamond for junctions
    const r = isHovered ? 7 : 5;
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fillStyle = isHovered ? '#1e40af' : '#1e3a8a';
    ctx.fill();
    ctx.strokeStyle = isHovered ? '#60a5fa' : '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else {
    // Small circle for regular stations
    ctx.beginPath();
    ctx.arc(x, y, isHovered ? 5 : 4, 0, Math.PI * 2);
    ctx.fillStyle = '#1e3a8a';
    ctx.fill();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Label
  const showLabel = APP.mapState.scale > 0.65 || isTerminal || isHovered;
  if (showLabel) {
    const fontSize = isTerminal
      ? Math.max(8, Math.min(12, 11 * APP.mapState.scale))
      : Math.max(6, Math.min(10, 9 * APP.mapState.scale));

    ctx.font = `${isTerminal ? '700' : '500'} ${fontSize}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const labelY = y + (isTerminal ? 6 : 8);
    const displayName = APP.mapState.scale > 1.2 ? name : id;
    const textWidth = ctx.measureText(displayName).width;

    // Label background
    const pad = 3;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.strokeStyle = 'rgba(96,165,250,0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(x - textWidth/2 - pad, labelY - 1, textWidth + pad*2, fontSize + 4, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isTerminal ? '#93c5fd' : '#60a5fa';
    ctx.fillText(displayName, x, labelY);
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

  let hoveredS = null, hoveredT = null;

  for (const s of RAILWAY_DATABASE.stations) {
    const dx = wx - s.x, dy = wy - s.y;
    const r = (s.type === 'terminal' ? 14 : 9);
    if (Math.sqrt(dx*dx + dy*dy) < r) { hoveredS = s.id; break; }
  }

  if (!hoveredS) {
    for (const h of trackHitboxes) {
      if (pointNearLine(wx, wy, h.x1, h.y1, h.x2, h.y2, 6)) {
        hoveredT = h.track.id; break;
      }
    }
  }

  APP.mapState.hoveredStation = hoveredS;
  APP.mapState.hoveredTrack = hoveredT;
  canvas.style.cursor = (hoveredS || hoveredT) ? 'pointer' : 'grab';
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

  for (const station of RAILWAY_DATABASE.stations) {
    const dx = wx - station.x, dy = wy - station.y;
    const r = station.type === 'terminal' ? 16 : 10;
    if (Math.sqrt(dx*dx + dy*dy) < r) {
      showStationPopup(station, cx, cy); return;
    }
  }

  for (const h of trackHitboxes) {
    if (pointNearLine(wx, wy, h.x1, h.y1, h.x2, h.y2, 8)) {
      showTrackPopup(h.track, cx, cy); return;
    }
  }

  closePopup(); closeTrackPopup();
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
  const popup = document.getElementById('track-popup');
  const from = stationLookup[track.from];
  const to = stationLookup[track.to];

  const icon = track.status === 'blocked' ? '🔴' : '🟢';
  document.getElementById('track-popup-icon').textContent = icon;
  document.getElementById('track-popup-route').textContent = `${from?.name || track.from} → ${to?.name || track.to}`;
  document.getElementById('track-popup-dist').textContent = `Distance: ${track.distance} km`;

  const statusEl = document.getElementById('track-popup-status');
  statusEl.textContent = track.status === 'blocked' ? '⛔ Blocked' : '✅ Operational';
  statusEl.className = 'track-status-badge ' + (track.status === 'blocked' ? 'blocked' : 'operational');

  const reasonEl = document.getElementById('track-popup-reason');
  if (track.reason) { reasonEl.textContent = '⚠ ' + track.reason; reasonEl.classList.remove('hidden'); }
  else { reasonEl.classList.add('hidden'); }

  // SM-only deviate button
  const deviateArea = document.getElementById('track-popup-deviate-area');
  if (deviateArea) {
    if (track.status === 'blocked' && APP.currentUser?.role === 'station_master') {
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

    const raiseBtn = (isSM && isBlocked && !isCompleted) ? `
      <button class="raise-query-btn" onclick="openQueryModal('${track.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${existingQuery ? '📋 Query Raised (' + STATUS_LABELS_SHORT[existingQuery.status] + ')' : 'Raise Repair Query'}
      </button>` : '';

    const deviateBtn = (isSM && isBlocked && !isCompleted) ? `
      <button class="raise-query-btn" style="background:linear-gradient(135deg,#c2410c,#ea580c);margin-top:6px" onclick="openDeviationModal('${track.id}')">
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
        ${raiseBtn}${deviateBtn}
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
  const blockedTracks = RAILWAY_DATABASE.tracks.filter(t => t.status === 'blocked');
  sel.innerHTML = '<option value="">-- Select Track --</option>' +
    blockedTracks.map(t => {
      const from = stationLookup[t.from]?.name || t.from;
      const to   = stationLookup[t.to]?.name   || t.to;
      return `<option value="${t.id}" ${t.id === preselectedTrackId ? 'selected' : ''}>${t.id}: ${from} → ${to}</option>`;
    }).join('');

  if (preselectedTrackId) {
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
  const user = APP.currentUser;
  if (!user) return;

  const trackId   = document.getElementById('qf-track').value;
  const damageType = document.getElementById('qf-damage-type').value;
  const reason    = document.getElementById('qf-reason').value.trim();
  const hours     = parseInt(document.getElementById('qf-hours').value);
  const priority  = document.getElementById('qf-priority').value;

  const track = RAILWAY_DATABASE.tracks.find(t => t.id === trackId);
  const from  = stationLookup[track?.from]?.name || track?.from || '?';
  const to    = stationLookup[track?.to]?.name   || track?.to   || '?';

  const queries = loadQueries();
  queries.push({
    id: 'Q' + String(Date.now()).slice(-6),
    trackId, fromStation: from, toStation: to,
    damageType, reason, estimatedHours: hours, priority,
    raisedById: user.id, raisedByName: user.name,
    raisedAt: new Date().toISOString(),
    status: 'pending',
    assignedToId: null, assignedToName: null,
    acceptedAt: null, startedAt: null, completedAt: null,
  });
  saveQueries(queries);

  closeQueryModal();
  showToast('✅ Repair query submitted successfully!', 'success');
  updateQueryBadges();
  if (APP.currentTab === 'tracks') renderTracksGrid();
  if (APP.currentTab === 'my-queries') renderMyQueries();
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
