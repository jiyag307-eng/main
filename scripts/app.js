/* ============================================================
   INDIAN RAILWAYS – INTEGRATED MANAGEMENT SYSTEM
   Main Application Script
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
  },
};

// ─────────────────────────────────────────────────────────────
// SPLASH SCREEN → LOGIN
// ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    const loginPage = document.getElementById('login-page');
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.classList.add('hidden');
      loginPage.classList.remove('hidden');
    }, 600);
  }, 3000);

  // Start clock
  updateClock();
  setInterval(updateClock, 1000);
});

function updateClock() {
  const el = document.getElementById('nav-datetime');
  if (!el) return;
  const now = new Date();
  const opts = { day:'2-digit', month:'short', year:'numeric' };
  el.innerHTML = `${now.toLocaleDateString('en-IN', opts)}<br>${now.toLocaleTimeString('en-IN', {hour12: false})} IST`;
}

// ───────────────────────────────────────────────────────────────
// HAMBURGER MENU
// ───────────────────────────────────────────────────────────────
function toggleHamburger() {
  const btn  = document.getElementById('hamburger-btn');
  const menu = document.getElementById('hamburger-menu');
  const isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
}

// Close hamburger when clicking outside
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

  // Populate form
  document.getElementById('login-form-title').textContent = meta.title;
  document.getElementById('login-form-subtitle').textContent = meta.subtitle;
  document.getElementById('login-form-role-icon').innerHTML = meta.icon;

  const hint = document.getElementById('login-hint');
  hint.textContent = meta.hint;
  hint.classList.add('visible');

  // Populate demo credentials
  const users = RAILWAY_DATABASE.users.filter(u => u.role === role);
  const credsList = document.getElementById('demo-creds-list');
  credsList.innerHTML = users.slice(0, 3).map(u => `
    <div class="demo-cred-item">
      <span class="cred-badge">${u.badge}</span>
      <span class="cred-pass">${u.password}</span>
      <button class="use-cred-btn" onclick="fillCreds('${u.badge}','${u.password}')">Use</button>
    </div>
  `).join('');

  // Clear fields
  document.getElementById('employee-id').value = '';
  document.getElementById('password').value = '';
  document.getElementById('login-error').classList.add('hidden');

  // Animate panels
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
  const pass  = document.getElementById('password').value;
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

  // Animate button
  const btn = document.getElementById('login-submit-btn');
  btn.innerHTML = '<span>Authenticating…</span>';
  btn.disabled = true;

  setTimeout(() => {
    showDashboard(user);
  }, 1200);
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

  // Update nav user info
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('nav-user-avatar').textContent = initials;
  document.getElementById('nav-user-name').textContent = user.name;
  document.getElementById('nav-user-role').textContent = ROLE_LABELS[user.role];
  document.getElementById('nav-zone-label').textContent =
    user.zone ? `Zone: ${user.zone}` : (user.station ? `Station: ${user.station}` : 'All Zones');

  // Populate alert ticker
  setupTicker();

  // Populate track status tab
  renderTracksGrid();

  // Populate alerts tab
  renderAlerts();

  // Populate trains tab
  renderTrains();

  // Initialize map
  setTimeout(() => initMap(), 100);

  // Update alert count
  const criticalCount = RAILWAY_DATABASE.alerts.filter(a => a.type === 'critical').length;
  document.getElementById('alert-count-badge').textContent = criticalCount;

  // Populate map header network stats
  const total       = RAILWAY_DATABASE.tracks.length;
  const operational = RAILWAY_DATABASE.tracks.filter(t => t.status === 'operational').length;
  const blocked     = total - operational;
  const stations    = RAILWAY_DATABASE.stations.length;
  const trainsAffected = RAILWAY_DATABASE.trains.filter(t => t.status === 'halted' || t.status === 'delayed').length;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  // Full-width status bar
  setEl('nsb-operational',    operational);
  setEl('nsb-blocked',        blocked);
  setEl('nsb-trains-blocked', trainsAffected);
  setEl('nsb-total',          total);
  setEl('nsb-stations',       stations);

  // Sidebar stats (legacy)
  setEl('ns-total-tracks', total);
  setEl('ns-operational',  operational);
  setEl('ns-blocked',      blocked);
  setEl('ns-stations',     stations);

  // Timestamp
  const now = new Date();
  setEl('nsb-updated', 'Updated: ' + now.toLocaleTimeString('en-IN', {hour12: false}) + ' IST');

  // ── ROLE-BASED TAB VISIBILITY ─────────────────────────────
  const smOnly = document.querySelectorAll('.sm-only');
  const reOnly = document.querySelectorAll('.re-only');
  const trainTab = document.getElementById('tab-trains');

  if (user.role === 'loco_pilot') {
    const hw = document.querySelector('.hamburger-wrapper');
    if (hw) hw.style.display = 'none';
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-map').classList.add('active');
    APP.currentTab = 'map';
  } else if (user.role === 'station_master') {
    const hw = document.querySelector('.hamburger-wrapper');
    if (hw) hw.style.display = '';
    smOnly.forEach(el => el.classList.remove('hidden'));
    reOnly.forEach(el => el.classList.add('hidden'));
    if (trainTab) trainTab.classList.remove('hidden');
    const trackTab = document.getElementById('tab-tracks');
    if (trackTab) trackTab.classList.remove('hidden');
  } else if (user.role === 'repair_engineer') {
    const hw = document.querySelector('.hamburger-wrapper');
    if (hw) hw.style.display = '';
    smOnly.forEach(el => el.classList.add('hidden'));
    reOnly.forEach(el => el.classList.remove('hidden'));
    // Hide Live Trains and Track Status for RE, show Repair Jobs
    if (trainTab) trainTab.classList.add('hidden');
    const trackTab = document.getElementById('tab-tracks');
    if (trackTab) trackTab.classList.add('hidden');
  }

  // Initialise query system
  initQuerySystem();
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

  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`panel-${tab}`).classList.add('active');
  APP.currentTab = tab;

  // Close hamburger menu after selection
  document.getElementById('hamburger-menu')?.classList.remove('open');
  document.getElementById('hamburger-btn')?.classList.remove('open');

  if (tab === 'map') setTimeout(() => initMap(), 50);
}

// ─────────────────────────────────────────────────────────────
// INTERACTIVE RAILWAY MAP (Canvas-based)
// ─────────────────────────────────────────────────────────────
let canvas, ctx, animFrame;
let stationLookup = {};
let trackHitboxes = [];

function initMap() {
  canvas = document.getElementById('railway-map');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  // Build station lookup
  stationLookup = {};
  RAILWAY_DATABASE.stations.forEach(s => stationLookup[s.id] = s);

  resizeCanvas();
  attachMapEvents();
  drawMap();
}

function resizeCanvas() {
  const container = document.getElementById('map-container');
  canvas.width  = container.offsetWidth;
  canvas.height = container.offsetHeight - 40; // minus header bar
}

function drawMap() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(APP.mapState.offsetX, APP.mapState.offsetY);
  ctx.scale(APP.mapState.scale, APP.mapState.scale);

  const zone = APP.mapState.activeZone;

  // Draw background grid (subtle)
  drawGrid();

  // Prepare track hitboxes
  trackHitboxes = [];

  // Draw tracks
  RAILWAY_DATABASE.tracks.forEach(track => {
    const from = stationLookup[track.from];
    const to   = stationLookup[track.to];
    if (!from || !to) return;
    if (zone !== 'ALL' && from.zone !== zone && to.zone !== zone) return;

    const isBlocked = track.status === 'blocked';
    const isHovered = APP.mapState.hoveredTrack === track.id;

    drawTrack(from, to, isBlocked, isHovered, track);
  });

  // Draw stations
  RAILWAY_DATABASE.stations.forEach(station => {
    if (zone !== 'ALL' && station.zone !== zone) return;
    const isHovered = APP.mapState.hoveredStation === station.id;
    drawStation(station, isHovered);
  });

  ctx.restore();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(37,99,235,0.04)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  const startX = -200, endX = 900;
  const startY = -100, endY = 750;
  for (let x = startX; x < endX; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
  }
  for (let y = startY; y < endY; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
  }
  ctx.restore();
}

function drawTrack(from, to, isBlocked, isHovered, track) {
  const x1 = from.x, y1 = from.y, x2 = to.x, y2 = to.y;

  // Register hitbox (for hover detection)
  trackHitboxes.push({ track, x1, y1, x2, y2 });

  ctx.save();

  // Shadow glow for blocked tracks
  if (isBlocked) {
    ctx.shadowColor = 'rgba(239,68,68,0.4)';
    ctx.shadowBlur = isHovered ? 20 : 10;
  } else if (isHovered) {
    ctx.shadowColor = 'rgba(16,185,129,0.5)';
    ctx.shadowBlur = 15;
  }

  // Draw track line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);

  if (isBlocked) {
    // Blocked: red dashed
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = isHovered ? '#dc2626' : '#ef4444';
    ctx.lineWidth = isHovered ? 4 : 3;
  } else {
    // Operational: solid green/blue
    ctx.setLineDash([]);
    ctx.strokeStyle = isHovered ? '#059669' : '#10b981';
    ctx.lineWidth = isHovered ? 3.5 : 2.5;
  }

  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw track "sleepers" for operational short tracks
  if (!isBlocked && APP.mapState.scale > 1.2) {
    drawSleepers(x1, y1, x2, y2);
  }

  // Blocked track: pulsing animation dots
  if (isBlocked) {
    drawBlockedIndicator(x1, y1, x2, y2);
  }

  ctx.restore();
}

function drawSleepers(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  const nx = -dy/len * 5, ny = dx/len * 5;
  const numSleepers = Math.floor(len / 15);

  ctx.save();
  ctx.strokeStyle = 'rgba(101,163,64,0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);

  for (let i = 1; i < numSleepers; i++) {
    const t = i / numSleepers;
    const mx = x1 + dx * t, my = y1 + dy * t;
    ctx.beginPath();
    ctx.moveTo(mx + nx, my + ny);
    ctx.lineTo(mx - nx, my - ny);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBlockedIndicator(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const t = (Date.now() % 1500) / 1500;
  const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI));

  ctx.save();
  ctx.fillStyle = `rgba(239,68,68,${alpha})`;
  ctx.shadowColor = 'rgba(239,68,68,0.6)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(mx, my, 5, 0, Math.PI * 2);
  ctx.fill();

  // ✗ symbol
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.font = 'bold 8px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✕', mx, my);

  ctx.restore();
}

function drawStation(station, isHovered) {
  const { x, y, type, id, name, zone } = station;
  const isTerminal = type === 'terminal';

  ctx.save();

  if (isHovered) {
    ctx.shadowColor = 'rgba(37,99,235,0.6)';
    ctx.shadowBlur = 20;
  }

  // Outer ring
  if (isTerminal) {
    ctx.beginPath();
    ctx.arc(x, y, isHovered ? 11 : 10, 0, Math.PI * 2);
    ctx.fillStyle = '#1040a0';
    ctx.fill();
    ctx.strokeStyle = isHovered ? '#60a5fa' : '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner dot
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, isHovered ? 7 : 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = isHovered ? '#3b82f6' : '#1a52c8';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Station label
  const showLabel = APP.mapState.scale > 0.7 || isTerminal;
  if (showLabel || isHovered) {
    const fontSize = isTerminal
      ? Math.max(8, Math.min(11, 10 * APP.mapState.scale))
      : Math.max(7, Math.min(10, 9 * APP.mapState.scale));

    ctx.font = `${isTerminal ? '700' : '600'} ${fontSize}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Label background
    const labelY = y + (isTerminal ? 13 : 10);
    const displayName = APP.mapState.scale > 1.1 ? name : id;
    const textWidth = ctx.measureText(displayName).width;

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    const pad = 3;
    ctx.roundRect(x - textWidth/2 - pad, labelY - 1, textWidth + pad*2, fontSize + 3, 3);
    ctx.fill();

    ctx.fillStyle = isTerminal ? '#0d2b6e' : '#1040a0';
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

  // Start animation loop for blinking blocked tracks
  cancelAnimationFrame(animFrame);
  function loop() {
    drawMap();
    animFrame = requestAnimationFrame(loop);
  }
  loop();
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

  // Hover detection
  let hoveredS = null, hoveredT = null;

  // Check station hover
  for (const s of RAILWAY_DATABASE.stations) {
    const dx = wx - s.x, dy = wy - s.y;
    const r = (s.type === 'terminal' ? 12 : 8);
    if (Math.sqrt(dx*dx + dy*dy) < r) { hoveredS = s.id; break; }
  }

  // Check track hover (only if no station hovered)
  if (!hoveredS) {
    for (const h of trackHitboxes) {
      if (pointNearLine(wx, wy, h.x1, h.y1, h.x2, h.y2, 6)) {
        hoveredT = h.track.id; break;
      }
    }
  }

  const changed = hoveredS !== APP.mapState.hoveredStation || hoveredT !== APP.mapState.hoveredTrack;
  APP.mapState.hoveredStation = hoveredS;
  APP.mapState.hoveredTrack = hoveredT;

  canvas.style.cursor = (hoveredS || hoveredT) ? 'pointer' : 'grab';
}

function onMouseUp() {
  APP.mapState.isDragging = false;
  canvas.style.cursor = 'grab';
}

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
  const newScale = Math.max(0.35, Math.min(4, APP.mapState.scale * zoomFactor));

  APP.mapState.offsetX = cx - (cx - APP.mapState.offsetX) * (newScale / APP.mapState.scale);
  APP.mapState.offsetY = cy - (cy - APP.mapState.offsetY) * (newScale / APP.mapState.scale);
  APP.mapState.scale = newScale;
}

function onCanvasClick(e) {
  const { cx, cy, wx, wy } = getWorldCoords(e);

  // Check station click
  for (const station of RAILWAY_DATABASE.stations) {
    const dx = wx - station.x, dy = wy - station.y;
    const r = (station.type === 'terminal' ? 14 : 10);
    if (Math.sqrt(dx*dx + dy*dy) < r) {
      showStationPopup(station, cx, cy);
      return;
    }
  }

  // Check track click
  for (const h of trackHitboxes) {
    if (pointNearLine(wx, wy, h.x1, h.y1, h.x2, h.y2, 8)) {
      showTrackPopup(h.track, cx, cy);
      return;
    }
  }

  closePopup(); closeTrackPopup();
}

function pointNearLine(px, py, x1, y1, x2, y2, threshold) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx*dx + dy*dy;
  if (len2 === 0) return Math.hypot(px-x1, py-y1) < threshold;
  const t = Math.max(0, Math.min(1, ((px-x1)*dx + (py-y1)*dy) / len2));
  const nearX = x1 + t*dx, nearY = y1 + t*dy;
  return Math.hypot(px-nearX, py-nearY) < threshold;
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

  // Tracks connected to this station
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

  // Position popup
  positionPopup(popup, cx, cy);
  popup.classList.remove('hidden');
}

function showTrackPopup(track, cx, cy) {
  closePopup();
  const popup = document.getElementById('track-popup');

  const from = stationLookup[track.from];
  const to   = stationLookup[track.to];

  const icon = track.status === 'blocked' ? '🔴' : '🟢';
  document.getElementById('track-popup-icon').textContent = icon;
  document.getElementById('track-popup-route').textContent = `${from?.name || track.from} → ${to?.name || track.to}`;
  document.getElementById('track-popup-dist').textContent = `Distance: ${track.distance} km`;

  const statusEl = document.getElementById('track-popup-status');
  statusEl.textContent = track.status === 'blocked' ? '⛔ Blocked' : '✅ Operational';
  statusEl.className = 'track-status-badge ' + (track.status === 'blocked' ? 'blocked' : 'operational');

  const reasonEl = document.getElementById('track-popup-reason');
  if (track.reason) {
    reasonEl.textContent = '⚠ ' + track.reason;
    reasonEl.classList.remove('hidden');
  } else {
    reasonEl.classList.add('hidden');
  }

  positionPopup(popup, cx, cy);
  popup.classList.remove('hidden');
}

function positionPopup(popup, cx, cy) {
  popup.style.display = 'block';
  const mapContainer = document.getElementById('map-container');
  const cw = mapContainer.offsetWidth;
  const ch = mapContainer.offsetHeight;

  let left = cx + 20, top = cy - 20;
  if (left + 290 > cw) left = cx - 300;
  if (top + 200 > ch) top = cy - 200;
  if (top < 50) top = 50;

  popup.style.left = left + 'px';
  popup.style.top  = top + 'px';
}

function closePopup() {
  document.getElementById('station-popup').classList.add('hidden');
}

function closeTrackPopup() {
  document.getElementById('track-popup').classList.add('hidden');
}

// ─────────────────────────────────────────────────────────────
// MAP CONTROLS
// ─────────────────────────────────────────────────────────────
function zoomIn() {
  APP.mapState.scale = Math.min(4, APP.mapState.scale * 1.2);
  drawMap();
}

function zoomOut() {
  APP.mapState.scale = Math.max(0.35, APP.mapState.scale / 1.2);
  drawMap();
}

function resetView() {
  APP.mapState.scale = 1;
  APP.mapState.offsetX = 0;
  APP.mapState.offsetY = 0;
  drawMap();
}

function filterByZone(zone, btn) {
  APP.mapState.activeZone = zone;
  document.querySelectorAll('.zone-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  drawMap();
}

// ─────────────────────────────────────────────────────────────
// TRACK STATUS TAB
// ─────────────────────────────────────────────────────────────
function renderTracksGrid() {
  const grid = document.getElementById('tracks-grid');
  grid.innerHTML = RAILWAY_DATABASE.tracks.map(track => {
    const from = stationLookup[track.from];
    const to   = stationLookup[track.to];
    const isBlocked = track.status === 'blocked';
    return `
      <div class="track-card ${isBlocked ? 'blocked' : ''}" data-track-id="${track.id}"
           data-from="${(from?.name || track.from).toLowerCase()}"
           data-to="${(to?.name || track.to).toLowerCase()}"
           data-status="${track.status}">
        <div class="track-card-header">
          <span class="track-card-id">${track.id}</span>
          <span class="track-status-badge ${isBlocked ? 'blocked' : 'operational'}">
            ${isBlocked ? '⛔ Blocked' : '✅ Operational'}
          </span>
        </div>
        <div class="track-card-route">
          ${from?.name || track.from} → ${to?.name || track.to}
        </div>
        <div class="track-card-meta">
          <span>📏 ${track.distance} km</span>
          <span>🚄 ${track.type.charAt(0).toUpperCase() + track.type.slice(1)}</span>
          <span>🗺 ${from?.zone || '?'}</span>
        </div>
        ${track.reason ? `<div class="track-card-reason">⚠ ${track.reason}</div>` : ''}
      </div>
    `;
  }).join('');
}

function filterTracks() {
  const query  = document.getElementById('track-search').value.toLowerCase();
  const status = document.getElementById('track-status-filter').value;
  document.querySelectorAll('.track-card').forEach(card => {
    const fromText = card.dataset.from;
    const toText   = card.dataset.to;
    const cardStatus = card.dataset.status;
    const matchQuery  = !query || fromText.includes(query) || toText.includes(query);
    const matchStatus = status === 'all' || cardStatus === status;
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
    const from  = track ? (stationLookup[track.from]?.name || track.from) : '';
    const to    = track ? (stationLookup[track.to]?.name || track.to)   : '';
    const date  = new Date(alert.time).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

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
      </div>
    `;
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
    const sec   = track ? `${stationLookup[track.from]?.id}–${stationLookup[track.to]?.id}` : '–';

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
          <div class="train-meta-item">
            <span class="train-meta-label">Speed</span>
            <span class="train-meta-val">${train.speed || 0} km/h</span>
          </div>
          <div class="train-meta-item">
            <span class="train-meta-label">Section</span>
            <span class="train-meta-val">${sec}</span>
          </div>
          ${train.delay ? `
          <div class="train-meta-item">
            <span class="train-meta-label">Delay</span>
            <span class="train-meta-val" style="color:var(--warning)">${train.delay} min</span>
          </div>` : ''}
          ${train.reason ? `
          <div class="train-meta-item" style="grid-column:span 2">
            <span class="train-meta-label">Reason</span>
            <span class="train-meta-val" style="font-size:12px;color:var(--blocked)">${train.reason}</span>
          </div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// WINDOW RESIZE HANDLER
// ─────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (canvas) { resizeCanvas(); drawMap(); }
});

// =============================================================
// QUERY / REPAIR JOB MANAGEMENT SYSTEM
// Persisted via localStorage under key 'ir_repair_queries'
// =============================================================
const QUERY_STORE_KEY = 'ir_repair_queries';

function loadQueries() {
  try { return JSON.parse(localStorage.getItem(QUERY_STORE_KEY)) || []; }
  catch { return []; }
}

function saveQueries(queries) {
  localStorage.setItem(QUERY_STORE_KEY, JSON.stringify(queries));
}

function initQuerySystem() {
  updateQueryBadges();
}

function updateQueryBadges() {
  const queries = loadQueries();
  const user = APP.currentUser;
  if (!user) return;

  if (user.role === 'station_master') {
    const mine = queries.filter(q => q.raisedById === user.id);
    const pending = mine.filter(q => q.status !== 'completed').length;
    const badge = document.getElementById('query-count-badge');
    if (badge) {
      badge.textContent = pending;
      badge.classList.toggle('hidden', pending === 0);
    }
  }

  if (user.role === 'repair_engineer') {
    const open = queries.filter(q => q.status !== 'completed').length;
    const badge = document.getElementById('repair-jobs-badge');
    if (badge) {
      badge.textContent = open;
      badge.classList.toggle('hidden', open === 0);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// TRACK STATUS TAB – override renderTracksGrid to add SM button
// ─────────────────────────────────────────────────────────────
function renderTracksGrid() {
  const grid = document.getElementById('tracks-grid');
  const isSM = APP.currentUser && APP.currentUser.role === 'station_master';
  const queries = loadQueries();

  grid.innerHTML = RAILWAY_DATABASE.tracks.map(track => {
    const from = stationLookup[track.from];
    const to   = stationLookup[track.to];
    const isBlocked  = track.status === 'blocked';
    const isCompleted = getCompletedTracks().includes(track.id);

    // Check if query already raised for this track
    const existingQuery = queries.find(q => q.trackId === track.id && q.status !== 'completed');

    const statusClass = isCompleted ? 'operational' : (isBlocked ? 'blocked' : 'operational');
    const statusLabel = isCompleted ? '✅ Repaired' : (isBlocked ? '⛔ Blocked' : '✅ Operational');

    const raiseBtn = (isSM && isBlocked && !isCompleted) ? `
      <button class="raise-query-btn" onclick="openQueryModal('${track.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${existingQuery ? '📋 Query Raised (' + STATUS_LABELS_SHORT[existingQuery.status] + ')' : 'Raise Repair Query'}
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
        <div class="track-card-route">
          ${from?.name || track.from} → ${to?.name || track.to}
        </div>
        <div class="track-card-meta">
          <span>📏 ${track.distance} km</span>
          <span>🚄 ${track.type.charAt(0).toUpperCase() + track.type.slice(1)}</span>
          <span>🗺 ${from?.zone || '?'}</span>
        </div>
        ${(track.reason && !isCompleted) ? `<div class="track-card-reason">⚠ ${track.reason}</div>` : ''}
        ${raiseBtn}
      </div>`;
  }).join('');
}

const STATUS_LABELS_SHORT = {
  pending: 'Pending', accepted: 'Accepted',
  in_progress: 'In Progress', completed: 'Done'
};

// ─────────────────────────────────────────────────────────────
// COMPLETED TRACKS (shown blue on map)
// ─────────────────────────────────────────────────────────────
function getCompletedTracks() {
  const queries = loadQueries();
  return queries.filter(q => q.status === 'completed').map(q => q.trackId);
}

// ─────────────────────────────────────────────────────────────
// QUERY MODAL
// ─────────────────────────────────────────────────────────────
function openQueryModal(preselectedTrackId) {
  // Populate blocked tracks dropdown
  const sel = document.getElementById('qf-track');
  const blockedTracks = RAILWAY_DATABASE.tracks.filter(t => t.status === 'blocked');
  sel.innerHTML = '<option value="">-- Select Track --</option>' +
    blockedTracks.map(t => {
      const from = stationLookup[t.from]?.name || t.from;
      const to   = stationLookup[t.to]?.name   || t.to;
      return `<option value="${t.id}" ${t.id === preselectedTrackId ? 'selected' : ''}>${t.id}: ${from} → ${to}</option>`;
    }).join('');

  // Pre-fill reason if track has one
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

  const trackId    = document.getElementById('qf-track').value;
  const damageType = document.getElementById('qf-damage-type').value;
  const reason     = document.getElementById('qf-reason').value.trim();
  const hours      = parseInt(document.getElementById('qf-hours').value);
  const priority   = document.getElementById('qf-priority').value;

  const track = RAILWAY_DATABASE.tracks.find(t => t.id === trackId);
  const from  = stationLookup[track?.from]?.name || track?.from || '?';
  const to    = stationLookup[track?.to]?.name   || track?.to   || '?';

  const queries = loadQueries();
  const query = {
    id:            'Q' + String(Date.now()).slice(-6),
    trackId,
    fromStation:   from,
    toStation:     to,
    damageType,
    reason,
    estimatedHours: hours,
    priority,
    raisedById:    user.id,
    raisedByName:  user.name,
    raisedAt:      new Date().toISOString(),
    status:        'pending',
    assignedToId:   null,
    assignedToName: null,
    acceptedAt:    null,
    startedAt:     null,
    completedAt:   null,
  };

  queries.push(query);
  saveQueries(queries);

  closeQueryModal();
  showToast('✅ Repair query submitted successfully!', 'success');
  updateQueryBadges();
  // Refresh track grid to show updated button state
  if (APP.currentTab === 'tracks') renderTracksGrid();
  if (APP.currentTab === 'my-queries') renderMyQueries();
}

// ─────────────────────────────────────────────────────────────
// MY QUERIES TAB (Station Master)
// ─────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:     { label: '⏳ Pending',     cls: 'pending' },
  accepted:    { label: '✔ Accepted',     cls: 'accepted' },
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
    container.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="60" height="60"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <h3>No queries yet</h3>
      <p>Go to Track Status and raise a repair query for any blocked track.</p>
    </div>`;
    return;
  }

  container.innerHTML = queries.map(q => {
    const sm = STATUS_META[q.status] || STATUS_META.pending;
    const pm = PRIORITY_META[q.priority] || PRIORITY_META.medium;
    const raisedAt = new Date(q.raisedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    const completedAt = q.completedAt ? new Date(q.completedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : null;

    return `<div class="query-card">
      <div class="query-card-header">
        <span class="query-card-id">${q.id}</span>
        <span class="query-status-badge ${sm.cls}">${sm.label}</span>
      </div>
      <div class="query-card-body">
        <div class="query-track-route">${q.fromStation} → ${q.toStation}</div>
        <div class="query-card-meta">
          <span class="qmeta-tag">Track: ${q.trackId}</span>
          <span class="qmeta-tag">🔨 ${q.damageType}</span>
          <span class="qmeta-tag ${pm.cls}">${pm.label}</span>
          <span class="qmeta-tag">⏱ ${q.estimatedHours}h allocated</span>
        </div>
        <div class="query-reason-box">📝 ${q.reason}</div>
        ${q.status === 'completed' ? `
          <div class="job-completed-banner">
            ✅ Repair Completed by ${q.assignedToName || 'Engineer'}
            ${completedAt ? ' · ' + completedAt : ''}
          </div>` : ''}
        ${q.assignedToName && q.status !== 'completed' ? `
          <div style="margin-top:8px;font-size:12px;color:var(--gray-500)">
            <span class="re-name-tag">🔧 ${q.assignedToName}</span> assigned
          </div>` : ''}
      </div>
      <div class="query-card-footer">
        <div class="qf-info">
          <span>🕐 Raised: ${raisedAt}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// REPAIR JOBS TAB (Repair Engineer)
// ─────────────────────────────────────────────────────────────
function renderRepairJobs() {
  const user = APP.currentUser;
  const filter = document.getElementById('job-filter')?.value || 'all';
  const queries = loadQueries().filter(q =>
    filter === 'all' || q.status === filter
  ).reverse();

  const container = document.getElementById('repair-jobs-list');

  if (queries.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="60" height="60"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      <h3>No jobs available</h3>
      <p>Repair queries raised by Station Masters will appear here.</p>
    </div>`;
    return;
  }

  container.innerHTML = queries.map(q => {
    const sm = STATUS_META[q.status] || STATUS_META.pending;
    const pm = PRIORITY_META[q.priority] || PRIORITY_META.medium;
    const raisedAt = new Date(q.raisedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    const isMyJob = q.assignedToId === user.id;
    const canAccept  = q.status === 'pending';
    const canStart   = q.status === 'accepted' && isMyJob;
    const canComplete= q.status === 'in_progress' && isMyJob;
    const isDone     = q.status === 'completed';

    const actionBtns = isDone ? '' : `
      <div class="job-actions">
        <button class="job-btn job-btn-accept" ${!canAccept ? 'disabled' : ''}
          onclick="jobAction('${q.id}','accept')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
          Accept Job
        </button>
        <button class="job-btn job-btn-start" ${!canStart ? 'disabled' : ''}
          onclick="jobAction('${q.id}','start')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Job
        </button>
        <button class="job-btn job-btn-complete" ${!canComplete ? 'disabled' : ''}
          onclick="jobAction('${q.id}','complete')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Complete Job
        </button>
      </div>`;

    return `<div class="query-card">
      <div class="query-card-header">
        <span class="query-card-id">${q.id}</span>
        <span class="query-status-badge ${sm.cls}">${sm.label}</span>
      </div>
      <div class="query-card-body">
        <div class="query-track-route">${q.fromStation} → ${q.toStation}</div>
        <div class="query-card-meta">
          <span class="qmeta-tag">Track: ${q.trackId}</span>
          <span class="qmeta-tag">🔨 ${q.damageType}</span>
          <span class="qmeta-tag ${pm.cls}">${pm.label}</span>
          <span class="qmeta-tag">⏱ ${q.estimatedHours}h</span>
        </div>
        <div class="query-reason-box">📝 ${q.reason}</div>
        <div style="font-size:12px;color:var(--gray-500);margin-bottom:4px">
          Raised by: <strong>${q.raisedByName}</strong> &nbsp;·&nbsp; ${raisedAt}
        </div>
        ${isDone ? `<div class="job-completed-banner">✅ Job Completed · ${new Date(q.completedAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>` : actionBtns}
      </div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// JOB WORKFLOW STATE MACHINE
// ─────────────────────────────────────────────────────────────
function jobAction(queryId, action) {
  const user = APP.currentUser;
  const queries = loadQueries();
  const q = queries.find(q => q.id === queryId);
  if (!q) return;

  if (action === 'accept' && q.status === 'pending') {
    q.status = 'accepted';
    q.assignedToId   = user.id;
    q.assignedToName = user.name;
    q.acceptedAt = new Date().toISOString();
    showToast('✔ Job accepted! You are now assigned.', 'info');
  } else if (action === 'start' && q.status === 'accepted' && q.assignedToId === user.id) {
    q.status = 'in_progress';
    q.startedAt = new Date().toISOString();
    showToast('🔧 Job started! Work in progress.', 'info');
  } else if (action === 'complete' && q.status === 'in_progress' && q.assignedToId === user.id) {
    q.status = 'completed';
    q.completedAt = new Date().toISOString();
    showToast('✅ Job completed! Track marked as repaired.', 'success');
  } else {
    showToast('⚠ Action not allowed at this stage.', 'error');
    return;
  }

  saveQueries(queries);
  updateQueryBadges();
  renderRepairJobs();
  // Refresh map to show blue track
  if (canvas) drawMap();
}

// ─────────────────────────────────────────────────────────────
// MAP DRAW PATCH – override drawTrack to handle 'completed'
// ─────────────────────────────────────────────────────────────
const _originalDrawTrack_ref = null; // patch applied below in drawMap override

function getTrackDisplayStatus(track) {
  const completed = getCompletedTracks();
  if (completed.includes(track.id)) return 'completed';
  return track.status;
}

// Override drawTrack inline inside drawMap by checking completed status
// Patch: drawTrack checks getCompletedTracks()
function drawTrackPatched(from, to, track, isHovered) {
  const displayStatus = getTrackDisplayStatus(track);
  const isBlocked   = displayStatus === 'blocked';
  const isCompleted = displayStatus === 'completed';

  const x1 = from.x, y1 = from.y, x2 = to.x, y2 = to.y;
  trackHitboxes.push({ track, x1, y1, x2, y2 });

  ctx.save();

  if (isBlocked) {
    ctx.shadowColor = 'rgba(239,68,68,0.4)';
    ctx.shadowBlur  = isHovered ? 20 : 10;
  } else if (isCompleted) {
    ctx.shadowColor = 'rgba(37,99,235,0.5)';
    ctx.shadowBlur  = isHovered ? 18 : 8;
  } else if (isHovered) {
    ctx.shadowColor = 'rgba(16,185,129,0.5)';
    ctx.shadowBlur  = 15;
  }

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);

  if (isBlocked) {
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = isHovered ? '#dc2626' : '#ef4444';
    ctx.lineWidth   = isHovered ? 4 : 3;
  } else if (isCompleted) {
    ctx.setLineDash([]);
    ctx.strokeStyle = isHovered ? '#1d4ed8' : '#3b82f6'; // blue
    ctx.lineWidth   = isHovered ? 4 : 3;
  } else {
    ctx.setLineDash([]);
    ctx.strokeStyle = isHovered ? '#059669' : '#10b981'; // green
    ctx.lineWidth   = isHovered ? 3.5 : 2.5;
  }

  ctx.lineCap = 'round';
  ctx.stroke();

  if (!isBlocked && !isCompleted && APP.mapState.scale > 1.2) drawSleepers(x1,y1,x2,y2);
  if (isBlocked) drawBlockedIndicator(x1,y1,x2,y2);

  // Completed: small blue tick badge at midpoint
  if (isCompleted) {
    const mx = (x1+x2)/2, my = (y1+y2)/2;
    ctx.fillStyle = '#2563eb';
    ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(37,99,235,0.6)';
    ctx.beginPath(); ctx.arc(mx,my,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 7px Inter'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowBlur = 0;
    ctx.fillText('✓', mx, my);
  }

  ctx.restore();
}

// Patch drawMap to use drawTrackPatched
const _origDrawMap = drawMap;
function drawMap() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(APP.mapState.offsetX, APP.mapState.offsetY);
  ctx.scale(APP.mapState.scale, APP.mapState.scale);

  const zone = APP.mapState.activeZone;
  drawGrid();
  trackHitboxes = [];

  RAILWAY_DATABASE.tracks.forEach(track => {
    const from = stationLookup[track.from];
    const to   = stationLookup[track.to];
    if (!from || !to) return;
    if (zone !== 'ALL' && from.zone !== zone && to.zone !== zone) return;
    const isHovered = APP.mapState.hoveredTrack === track.id;
    drawTrackPatched(from, to, track, isHovered);
  });

  RAILWAY_DATABASE.stations.forEach(station => {
    if (zone !== 'ALL' && station.zone !== zone) return;
    const isHovered = APP.mapState.hoveredStation === station.id;
    drawStation(station, isHovered);
  });

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  // Remove any existing toast
  const old = document.getElementById('ir-toast');
  if (old) old.remove();

  const colors = {
    success: '#065f46,#d1fae5',
    info:    '#1040a0,#dbeafe',
    error:   '#991b1b,#fee2e2',
  };
  const [textColor, bgColor] = (colors[type] || colors.info).split(',');

  const toast = document.createElement('div');
  toast.id = 'ir-toast';
  toast.style.cssText = `
    position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:${bgColor}; color:${textColor};
    padding:12px 24px; border-radius:999px;
    font-size:13px; font-weight:700; font-family:Inter,sans-serif;
    box-shadow:0 8px 30px rgba(0,0,0,0.2);
    z-index:1000; white-space:nowrap;
    animation:toastIn .3s cubic-bezier(.34,1.56,.64,1);
  `;
  toast.textContent = message;

  const style = document.createElement('style');
  style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Trigger re-render when my-queries or repair-jobs tab is switched to
const _origSwitchTab = switchTab;
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

  if (tab === 'map')          setTimeout(() => initMap(), 50);
  if (tab === 'tracks')       renderTracksGrid();
  if (tab === 'my-queries')   renderMyQueries();
  if (tab === 'repair-jobs')  renderRepairJobs();
}
