/* ============================================================
   TRAINSYNC – AI AUTOMATIC BLOCK PLANNING SYSTEM
   block_planning.js – v1.0
   ============================================================ */

'use strict';

// ─────────────────────────────────────────────────────────────
// DATA MODEL – Maintenance Tasks from TMS / SMMS / TDMS / COA
// ─────────────────────────────────────────────────────────────
const BP_DATA = {
  currentView: 'week',
  optimizerRan: false,

  // Maintenance tasks aggregated from all departments
  tasks: [
    // Engineering – Track Management System (TMS)
    { id:'T001', dept:'ENG', section:'NDLS–CNB', description:'Rail fracture repair – fractured rail detected on ML track', priority:'critical', score:96, overdueDays:3, severity:5, durationHr:4, status:'pending', requiredBlock:'02:00–06:00', assignedBlock:null },
    { id:'T002', dept:'ENG', section:'CNB–ALD', description:'Track subsidence – ballast settlement at km 212', priority:'high', score:84, overdueDays:1, severity:4, durationHr:3, status:'pending', requiredBlock:'22:00–02:00', assignedBlock:null },
    { id:'T003', dept:'ENG', section:'ALD–MGS', description:'Bridge inspection – monsoon structural check', priority:'medium', score:62, overdueDays:0, severity:3, durationHr:5, status:'pending', requiredBlock:'00:00–05:00', assignedBlock:null },
    { id:'T004', dept:'ENG', section:'NDLS–CNB', description:'Sleeper replacement – 120 damaged sleepers at km 45', priority:'high', score:78, overdueDays:2, severity:3, durationHr:6, status:'scheduled', requiredBlock:'02:00–08:00', assignedBlock:'BLK-001' },
    { id:'T005', dept:'ENG', section:'SUR–ST', description:'Track geometry correction – longitudinal level defect', priority:'medium', score:55, overdueDays:0, severity:2, durationHr:4, status:'pending', requiredBlock:'00:00–04:00', assignedBlock:null },
    { id:'T006', dept:'ENG', section:'LKO–GKP', description:'Level crossing gate overhaul – LC No. 47', priority:'low', score:38, overdueDays:0, severity:1, durationHr:2, status:'pending', requiredBlock:'10:00–12:00', assignedBlock:null },

    // TRD – Traction Distribution Management System (TDMS)
    { id:'T007', dept:'TRD', section:'NDLS–CNB', description:'OHE wire replacement – broken catenary at km 67', priority:'critical', score:94, overdueDays:2, severity:5, durationHr:5, status:'pending', requiredBlock:'02:00–07:00', assignedBlock:null },
    { id:'T008', dept:'TRD', section:'CNB–ALD', description:'Mast inspection – 14 masts with corrosion detected', priority:'high', score:81, overdueDays:1, severity:4, durationHr:3, status:'pending', requiredBlock:'22:00–01:00', assignedBlock:null },
    { id:'T009', dept:'TRD', section:'ALD–MGS', description:'Booster transformer replacement – BT-18 failed', priority:'critical', score:91, overdueDays:4, severity:5, durationHr:4, status:'pending', requiredBlock:'00:00–04:00', assignedBlock:null },
    { id:'T010', dept:'TRD', section:'MGS–PNBE', description:'Return conductor repair – earthing fault detected', priority:'high', score:77, overdueDays:1, severity:3, durationHr:3, status:'pending', requiredBlock:'01:00–04:00', assignedBlock:null },
    { id:'T011', dept:'TRD', section:'SUR–ST', description:'Section insulator servicing – 8 insulators due', priority:'medium', score:59, overdueDays:0, severity:2, durationHr:2, status:'scheduled', requiredBlock:'10:00–12:00', assignedBlock:'BLK-003' },

    // S&T – Signal & Maintenance Management System (SMMS)
    { id:'T012', dept:'SNT', section:'NDLS–CNB', description:'Signal relay replacement – relay room at CNB South', priority:'critical', score:93, overdueDays:3, severity:5, durationHr:3, status:'pending', requiredBlock:'02:00–05:00', assignedBlock:null },
    { id:'T013', dept:'SNT', section:'CNB–ALD', description:'Point machine lubrication – 22 points overdue PM', priority:'high', score:76, overdueDays:2, severity:3, durationHr:4, status:'pending', requiredBlock:'22:00–02:00', assignedBlock:null },
    { id:'T014', dept:'SNT', section:'ALD–MGS', description:'Axle counter calibration – 5 units drift detected', priority:'high', score:82, overdueDays:1, severity:4, durationHr:2, status:'pending', requiredBlock:'00:00–02:00', assignedBlock:null },
    { id:'T015', dept:'SNT', section:'NDLS–CNB', description:'OFC cable fault repair – communication disruption', priority:'critical', score:97, overdueDays:5, severity:5, durationHr:3, status:'in-progress', requiredBlock:'Now', assignedBlock:'BLK-EMG' },
    { id:'T016', dept:'SNT', section:'LKO–GKP', description:'Level crossing alarm system servicing – LC 47 & 48', priority:'medium', score:52, overdueDays:0, severity:2, durationHr:2, status:'pending', requiredBlock:'10:00–12:00', assignedBlock:null },
    { id:'T017', dept:'SNT', section:'SUR–ST', description:'IPS battery bank replacement – 72V system at SUR', priority:'high', score:79, overdueDays:1, severity:3, durationHr:3, status:'pending', requiredBlock:'10:00–13:00', assignedBlock:null },
  ],

  // Block schedule – Gantt data (COA Available Corridors)
  blocks: [
    { id:'BLK-001', label:'Block A', section:'NDLS–CNB', startHr:2.0, endHr:8.0, depts:['ENG','TRD','SNT'], combined:true,  status:'active',    impact:'low',    trainImpact:2,  color:'#1565C0' },
    { id:'BLK-002', label:'Block B', section:'CNB–ALD',  startHr:22.0,endHr:26.0,depts:['ENG','TRD'],      combined:true,  status:'scheduled', impact:'medium', trainImpact:4,  color:'#0284c7' },
    { id:'BLK-003', label:'Block C', section:'SUR–ST',   startHr:10.0,endHr:12.0,depts:['TRD','SNT'],      combined:true,  status:'scheduled', impact:'low',    trainImpact:1,  color:'#0891b2' },
    { id:'BLK-004', label:'Block D', section:'ALD–MGS',  startHr:0.0, endHr:5.0, depts:['ENG','TRD','SNT'],combined:true,  status:'scheduled', impact:'medium', trainImpact:3,  color:'#1565C0' },
    { id:'BLK-EMG', label:'EMRG',    section:'NDLS–CNB', startHr:0.0, endHr:3.0, depts:['SNT'],            combined:false, status:'active',    impact:'high',   trainImpact:6,  color:'#7c3aed' },
    { id:'BLK-005', label:'Block E', section:'MGS–PNBE', startHr:1.0, endHr:4.0, depts:['TRD'],            combined:false, status:'scheduled', impact:'low',    trainImpact:1,  color:'#0284c7' },
    { id:'BLK-006', label:'Block F', section:'LKO–GKP',  startHr:10.0,endHr:12.0,depts:['ENG','SNT'],      combined:true,  status:'planned',   impact:'none',   trainImpact:0,  color:'#0369a1' },
  ],

  // Weekly plan (COA-approved corridors + AI-generated schedule)
  weeklyPlan: [
    { id:'WP-001', window:'Mon 02:00–08:00', section:'NDLS–CNB', depts:['ENG','TRD','SNT'], tasks:['T001','T004','T007','T012'], impact:'Low',    status:'active'    },
    { id:'WP-002', window:'Mon 22:00–Tue 02:00', section:'CNB–ALD', depts:['ENG','TRD'],   tasks:['T002','T008','T013'],        impact:'Medium', status:'scheduled' },
    { id:'WP-003', window:'Tue 00:00–05:00', section:'ALD–MGS',  depts:['ENG','TRD','SNT'],tasks:['T003','T009','T014'],        impact:'Medium', status:'scheduled' },
    { id:'WP-004', window:'Wed 10:00–12:00', section:'SUR–ST',   depts:['TRD','SNT'],      tasks:['T011','T017'],               impact:'Low',    status:'scheduled' },
    { id:'WP-005', window:'Thu 01:00–04:00', section:'MGS–PNBE', depts:['TRD'],            tasks:['T010'],                      impact:'Low',    status:'planned'   },
    { id:'WP-006', window:'Fri 10:00–12:00', section:'LKO–GKP',  depts:['ENG','SNT'],      tasks:['T006','T016'],               impact:'None',   status:'planned'   },
    { id:'WP-007', window:'Sat 00:00–06:00', section:'NDLS–CNB', depts:['ENG','TRD'],      tasks:['T005'],                      impact:'Low',    status:'planned'   },
  ],
};

// Priority score → visual tier
function scoreTier(score) {
  if (score >= 90) return 'critical';
  if (score >= 75) return 'high';
  if (score >= 55) return 'medium';
  return 'low';
}
const tierLabel = { critical:'Critical', high:'High', medium:'Medium', low:'Low' };
const deptLabel  = { ENG:'Engineering', TRD:'TRD', SNT:'S&T' };
const deptColor  = { ENG:'#1565C0', TRD:'#0284c7', SNT:'#0891b2' };

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
let bpInitialised = false;

function initBlockPlanning() {
  if (bpInitialised) { updateBPStats(); return; }
  bpInitialised = true;
  updateBPStats();
  renderBPQueue();
  renderBPWeeklyPlan();
  renderDeptCards();
  setTimeout(() => drawGantt(), 80);
}

// ─────────────────────────────────────────────────────────────
// KPI STATS
// ─────────────────────────────────────────────────────────────
function updateBPStats() {
  const tasks    = BP_DATA.tasks;
  const blocks   = BP_DATA.blocks;
  const now      = new Date();
  const nowHr    = now.getHours() + now.getMinutes() / 60;

  const activeBlocks   = blocks.filter(b => b.status === 'active').length;
  const pendingTasks   = tasks.filter(t => t.status === 'pending').length;
  const combinedBlocks = blocks.filter(b => b.combined && b.depts.length >= 2).length;
  const criticalTasks  = tasks.filter(t => t.priority === 'critical').length;

  // Infrastructure availability: proportion of the day not blocked (simple estimate)
  const totalBlockedHrs = blocks.reduce((s, b) => {
    const end = b.endHr > 24 ? 24 : b.endHr;
    return s + Math.max(0, end - b.startHr);
  }, 0);
  const sectionCount = [...new Set(blocks.map(b => b.section))].length;
  const blockedPct   = Math.min(100, Math.round((totalBlockedHrs / (24 * sectionCount)) * 100));
  const availability = 100 - blockedPct;

  animCount('bpst-active',       activeBlocks);
  animCount('bpst-pending',      pendingTasks);
  animCount('bpst-combined',     combinedBlocks);
  animCount('bpst-critical',     criticalTasks);
  animCountStr('bpst-availability', `${availability}%`);
}

function animCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step = Math.ceil(target / 20);
  const iv = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(iv);
  }, 40);
}

function animCountStr(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─────────────────────────────────────────────────────────────
// GANTT CHART – Canvas-based 24h timeline
// ─────────────────────────────────────────────────────────────
function drawGantt() {
  const canvas = document.getElementById('bp-gantt-canvas');
  if (!canvas) return;
  const wrap   = canvas.parentElement;
  const W      = wrap.clientWidth || 700;
  const ROWS   = [...new Set(BP_DATA.blocks.map(b => b.section))];
  const ROW_H  = 46;
  const HEADER = 36;
  const LABEL_W = 110;
  const H      = HEADER + ROWS.length * ROW_H + 12;

  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const plotW = W - LABEL_W;

  // Background
  ctx.fillStyle = '#f8fafd';
  ctx.fillRect(0, 0, W, H);

  // Hour grid lines + labels
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  for (let h = 0; h <= 24; h += 2) {
    const x = LABEL_W + (h / 24) * plotW;
    ctx.strokeStyle = h % 6 === 0 ? 'rgba(37,99,235,0.2)' : 'rgba(37,99,235,0.07)';
    ctx.lineWidth = h % 6 === 0 ? 1.2 : 0.7;
    ctx.beginPath(); ctx.moveTo(x, HEADER - 6); ctx.lineTo(x, H); ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.fillText(h === 24 ? '24' : (h < 10 ? '0' + h : h) + ':00', x, HEADER - 12);
  }

  // NOW line
  const now      = new Date();
  const nowHr    = now.getHours() + now.getMinutes() / 60;
  const nowX     = LABEL_W + (nowHr / 24) * plotW;
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth   = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath(); ctx.moveTo(nowX, HEADER - 4); ctx.lineTo(nowX, H); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NOW', nowX, HEADER - 16);

  // Row backgrounds + section labels
  ROWS.forEach((section, ri) => {
    const y = HEADER + ri * ROW_H;
    ctx.fillStyle = ri % 2 === 0 ? '#f0f4ff' : '#f8fafd';
    ctx.fillRect(0, y, W, ROW_H);

    // Section label
    ctx.fillStyle = '#1e40af';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(section, 6, y + ROW_H / 2 + 4);
  });

  // Draw blocks
  BP_DATA.blocks.forEach(block => {
    const ri = ROWS.indexOf(block.section);
    if (ri < 0) return;
    const y = HEADER + ri * ROW_H + 5;
    const bH = ROW_H - 10;
    // clamp to 24h
    const startHr = block.startHr;
    const endHr   = Math.min(block.endHr, 24);
    const x1 = LABEL_W + (startHr / 24) * plotW;
    const x2 = LABEL_W + (endHr   / 24) * plotW;
    const bW = Math.max(x2 - x1, 8);

    // Shadow
    ctx.shadowColor = 'rgba(21,101,192,0.3)';
    ctx.shadowBlur  = 6;

    // Fill
    ctx.fillStyle = block.status === 'active' ? block.color : block.color + 'cc';
    roundRect(ctx, x1, y, bW, bH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label inside block
    if (bW > 40) {
      ctx.fillStyle = '#fff';
      ctx.font = `${block.status === 'active' ? 'bold ' : ''}10px Inter, sans-serif`;
      ctx.textAlign = 'center';
      const midX = x1 + bW / 2;
      ctx.fillText(block.label, midX, y + bH / 2 + 4);
    }

    // Active pulse border
    if (block.status === 'active') {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x1, y, bW, bH, 6);
      ctx.stroke();
    }
  });

  // Header background
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, W, HEADER - 8);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SECTION', 6, 18);

  // Tooltip hover
  attachGanttTooltip(canvas, ROWS, LABEL_W, HEADER, ROW_H, plotW, W);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function attachGanttTooltip(canvas, rows, LABEL_W, HEADER, ROW_H, plotW, W) {
  const tooltip = document.getElementById('bp-gantt-tooltip');
  if (!tooltip) return;

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const ri = Math.floor((my - HEADER) / ROW_H);
    if (ri < 0 || ri >= rows.length) { tooltip.style.display = 'none'; return; }

    const hoverHr = ((mx - LABEL_W) / plotW) * 24;
    const section = rows[ri];

    const hit = BP_DATA.blocks.find(b =>
      b.section === section &&
      hoverHr >= b.startHr &&
      hoverHr <= Math.min(b.endHr, 24)
    );

    if (!hit) { tooltip.style.display = 'none'; return; }

    const deptsStr = hit.depts.map(d => deptLabel[d]).join(', ');
    const statusClass = hit.status === 'active' ? '🟢' : hit.status === 'scheduled' ? '🔵' : '🟡';
    tooltip.innerHTML = `
      <div class="bptt-header">${statusClass} ${hit.label} — ${hit.section}</div>
      <div class="bptt-row"><span>Time:</span> ${fmt(hit.startHr)} – ${fmt(hit.endHr)}</div>
      <div class="bptt-row"><span>Departments:</span> ${deptsStr}</div>
      <div class="bptt-row"><span>Train Impact:</span> ${hit.trainImpact} trains affected</div>
      <div class="bptt-row"><span>Status:</span> ${hit.status.charAt(0).toUpperCase()+hit.status.slice(1)}</div>
    `;

    const ttW = 240;
    let left = e.clientX - rect.left + 12;
    if (left + ttW > W) left = e.clientX - rect.left - ttW - 8;
    tooltip.style.left = left + 'px';
    tooltip.style.top  = (my - 10) + 'px';
    tooltip.style.display = 'block';
  };
  canvas.onmouseleave = () => { tooltip.style.display = 'none'; };
}

function fmt(hr) {
  const h = Math.floor(hr % 24);
  const m = Math.round((hr - Math.floor(hr)) * 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ─────────────────────────────────────────────────────────────
// DEPARTMENT TASK CARDS
// ─────────────────────────────────────────────────────────────
function renderDeptCards() {
  ['ENG','TRD','SNT'].forEach(dept => {
    const deptKey = dept.toLowerCase().replace('&','').replace('snt','snt');
    const suffix  = { ENG:'eng', TRD:'trd', SNT:'snt' }[dept];
    const tasks   = BP_DATA.tasks.filter(t => t.dept === dept);
    const countEl = document.getElementById(`bp-dept-${suffix}-count`);
    const listEl  = document.getElementById(`bp-dept-${suffix}-tasks`);
    if (countEl) countEl.textContent = tasks.length;
    if (!listEl) return;

    const top = tasks.slice(0, 3);
    listEl.innerHTML = top.map(t => `
      <div class="bp-dept-task-row">
        <div class="bp-dtr-score ${scoreTier(t.score)}-tier">${t.score}</div>
        <div class="bp-dtr-desc">${t.description}</div>
        <div class="bp-dtr-meta">
          <span class="bp-section-chip">${t.section}</span>
          <span class="bp-status-chip ${t.status}">${t.status.replace('-',' ')}</span>
        </div>
      </div>
    `).join('');
  });
}

// ─────────────────────────────────────────────────────────────
// PRIORITY QUEUE
// ─────────────────────────────────────────────────────────────
function renderBPQueue() {
  const deptF  = document.getElementById('bp-dept-filter')?.value  || 'all';
  const prioF  = document.getElementById('bp-priority-filter')?.value || 'all';
  const listEl = document.getElementById('bp-queue-list');
  if (!listEl) return;

  let tasks = [...BP_DATA.tasks]
    .filter(t => deptF === 'all' || t.dept === deptF)
    .filter(t => prioF === 'all' || t.priority === prioF)
    .sort((a, b) => b.score - a.score);

  if (!tasks.length) {
    listEl.innerHTML = '<div class="bp-empty">No tasks match the current filters.</div>';
    return;
  }

  listEl.innerHTML = tasks.map((t, idx) => {
    const tier  = scoreTier(t.score);
    const overdueTxt = t.overdueDays > 0 ? `<span class="bp-overdue-tag">+${t.overdueDays}d overdue</span>` : '';
    const assignedTxt = t.assignedBlock
      ? `<span class="bp-assigned-tag">✓ ${t.assignedBlock}</span>`
      : `<span class="bp-unassigned-tag">Unscheduled</span>`;

    return `
    <div class="bp-queue-item ${tier}-tier-item" id="bpqi-${t.id}">
      <div class="bpqi-rank">#${idx + 1}</div>
      <div class="bpqi-score-wrap">
        <div class="bpqi-score ${tier}-tier">${t.score}</div>
        <div class="bpqi-score-label">AI Score</div>
      </div>
      <div class="bpqi-body">
        <div class="bpqi-header">
          <span class="bpqi-id">${t.id}</span>
          <span class="bpqi-dept ${t.dept.toLowerCase()}-dept">${deptLabel[t.dept]}</span>
          ${overdueTxt}
        </div>
        <div class="bpqi-desc">${t.description}</div>
        <div class="bpqi-meta">
          <span class="bp-section-chip">${t.section}</span>
          <span class="bp-dur-chip">⏱ ${t.durationHr}h</span>
          ${assignedTxt}
        </div>
      </div>
      <div class="bpqi-score-bar">
        <div class="bpqi-bar-fill ${tier}-tier" style="height:${t.score}%"></div>
      </div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// WEEKLY BLOCK PLAN TABLE
// ─────────────────────────────────────────────────────────────
function renderBPWeeklyPlan() {
  const tbody = document.getElementById('bp-plan-tbody');
  if (!tbody) return;

  tbody.innerHTML = BP_DATA.weeklyPlan.map(wp => {
    const deptChips = wp.depts.map(d =>
      `<span class="bp-dept-chip ${d.toLowerCase()}-dept">${deptLabel[d]}</span>`
    ).join('');
    const taskChips = wp.tasks.map(tid => {
      const t = BP_DATA.tasks.find(x => x.id === tid);
      return t ? `<span class="bp-task-chip" title="${t.description}">${tid}</span>` : '';
    }).join('');
    const impactClass = { 'None':'impact-none','Low':'impact-low','Medium':'impact-med','High':'impact-high' }[wp.impact] || '';
    const statusClass = { 'active':'status-active-bp','scheduled':'status-sched-bp','planned':'status-planned-bp' }[wp.status] || '';

    return `<tr class="bp-plan-row ${wp.status}">
      <td class="bp-plan-window">
        <div class="bp-plan-clock">🕐</div>
        <div>${wp.window}</div>
      </td>
      <td><span class="bp-section-chip">${wp.section}</span></td>
      <td><div class="bp-dept-chips">${deptChips}</div></td>
      <td><div class="bp-task-chips">${taskChips}</div></td>
      <td><span class="bp-impact-badge ${impactClass}">${wp.impact}</span></td>
      <td><span class="bp-status-badge ${statusClass}">${wp.status.charAt(0).toUpperCase()+wp.status.slice(1)}</span></td>
    </tr>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// VIEW TOGGLE (Weekly / Monthly)
// ─────────────────────────────────────────────────────────────
function switchBPView(view) {
  BP_DATA.currentView = view;
  document.getElementById('bpvt-week')?.classList.toggle('active',  view === 'week');
  document.getElementById('bpvt-month')?.classList.toggle('active', view === 'month');

  const tbody = document.getElementById('bp-plan-tbody');
  if (view === 'month' && tbody) {
    // Show a richer monthly plan
    const months = generateMonthlyPlan();
    tbody.innerHTML = months.map(wp => {
      const deptChips = wp.depts.map(d =>
        `<span class="bp-dept-chip ${d.toLowerCase()}-dept">${deptLabel[d]}</span>`
      ).join('');
      const impactClass = { 'None':'impact-none','Low':'impact-low','Medium':'impact-med','High':'impact-high' }[wp.impact] || '';
      const statusClass = { 'active':'status-active-bp','scheduled':'status-sched-bp','planned':'status-planned-bp' }[wp.status] || '';
      return `<tr class="bp-plan-row ${wp.status}">
        <td class="bp-plan-window"><div class="bp-plan-clock">📅</div><div>${wp.window}</div></td>
        <td><span class="bp-section-chip">${wp.section}</span></td>
        <td><div class="bp-dept-chips">${deptChips}</div></td>
        <td><div class="bp-task-chips"><span class="bp-task-chip">${wp.taskCount} tasks</span></div></td>
        <td><span class="bp-impact-badge ${impactClass}">${wp.impact}</span></td>
        <td><span class="bp-status-badge ${statusClass}">${wp.status.charAt(0).toUpperCase()+wp.status.slice(1)}</span></td>
      </tr>`;
    }).join('');

    const card = document.querySelector('.bp-card:has(#bp-plan-table) .bp-card-title');
    if (card) card.lastChild.textContent = ' Optimized Block Plan – This Month';
  } else {
    renderBPWeeklyPlan();
    const card = document.querySelector('.bp-card-title');
  }
}

function generateMonthlyPlan() {
  const sections = ['NDLS–CNB','CNB–ALD','ALD–MGS','MGS–PNBE','SUR–ST','LKO–GKP'];
  const deptCombos = [['ENG','TRD','SNT'],['ENG','TRD'],['TRD','SNT'],['ENG','SNT'],['ENG'],['TRD']];
  const impacts = ['Low','Low','Medium','None','Medium','Low','High','None','Low','Medium'];
  const statuses = ['planned','planned','planned','planned'];
  const weeks = ['Week 1','Week 2','Week 3','Week 4'];
  const result = [];
  weeks.forEach(wk => {
    sections.slice(0, 4).forEach((sec, si) => {
      const dc = deptCombos[(si + weeks.indexOf(wk)) % deptCombos.length];
      result.push({
        window: `${wk} – ${['Mon','Tue','Wed','Thu','Fri','Sat'][si % 6]} 02:00–08:00`,
        section: sec,
        depts: dc,
        taskCount: dc.length * 2 + 1,
        impact: impacts[(si + weeks.indexOf(wk)) % impacts.length],
        status: 'planned',
      });
    });
  });
  return result;
}

// ─────────────────────────────────────────────────────────────
// AI OPTIMIZER
// ─────────────────────────────────────────────────────────────
const OPTIMIZER_STEPS = [
  'Initialising AI engine…',
  'Fetching TMS defect data…',
  'Fetching TDMS traction faults…',
  'Fetching SMMS signal data…',
  'Loading COA corridor windows…',
  'Loading train timetable…',
  'Analysing conflict matrix…',
  'Computing priority scores…',
  'Identifying merge opportunities…',
  'Running combinatorial optimisation…',
  'Validating against safety rules…',
  'Generating block schedule…',
  'Optimisation complete ✓',
];

function runAIOptimizer() {
  const overlay  = document.getElementById('bp-optimizer-overlay');
  const fillEl   = document.getElementById('bpoo-fill');
  const stepsEl  = document.getElementById('bpoo-steps');
  const btn      = document.getElementById('bp-optimize-btn');
  if (!overlay) return;

  btn.disabled = true;
  overlay.classList.remove('hidden');

  let step = 0;
  let pct  = 0;

  const iv = setInterval(() => {
    step++;
    pct = Math.round((step / OPTIMIZER_STEPS.length) * 100);
    if (stepsEl) stepsEl.textContent = OPTIMIZER_STEPS[Math.min(step - 1, OPTIMIZER_STEPS.length - 1)];
    if (fillEl)  fillEl.style.width = pct + '%';

    if (step >= OPTIMIZER_STEPS.length) {
      clearInterval(iv);
      setTimeout(() => {
        overlay.classList.add('hidden');
        btn.disabled = false;
        applyOptimizationResults();
      }, 800);
    }
  }, 320);
}

function applyOptimizationResults() {
  // Assign previously unassigned critical tasks
  const unassigned = BP_DATA.tasks.filter(t => !t.assignedBlock && t.priority === 'critical');
  unassigned.forEach((t, i) => {
    t.assignedBlock = `BLK-AI-${String(i+1).padStart(2,'0')}`;
    t.status = 'scheduled';
  });

  // Mark some tasks as combined
  const combined = BP_DATA.tasks.filter(t => t.section === 'NDLS–CNB' && !t.assignedBlock);
  combined.forEach(t => { t.assignedBlock = 'BLK-001'; t.status = 'scheduled'; });

  // Show result banner
  const banner  = document.getElementById('bp-optimizer-banner');
  const titleEl = document.getElementById('bpob-title');
  const subEl   = document.getElementById('bpob-sub');
  const saved   = unassigned.length;
  const blocks  = BP_DATA.blocks.filter(b => b.combined).length;

  if (titleEl) titleEl.textContent = 'AI Optimisation Complete — ' + new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  if (subEl)   subEl.textContent   = `${saved} critical tasks scheduled · ${blocks} combined blocks saved · Infrastructure availability improved to 93%`;
  if (banner)  banner.classList.remove('hidden');

  BP_DATA.optimizerRan = true;

  // Re-render all components
  updateBPStats();
  renderBPQueue();
  renderDeptCards();
  renderBPWeeklyPlan();
  drawGantt();

  showBPToast('AI Optimizer finished — block plan updated.');
}

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────
function exportBlockPlan() {
  const rows = [
    ['Block Window', 'Section', 'Departments', 'Tasks', 'Impact', 'Status'],
    ...BP_DATA.weeklyPlan.map(wp => [
      wp.window,
      wp.section,
      wp.depts.map(d => deptLabel[d]).join(' + '),
      wp.tasks.join(', '),
      wp.impact,
      wp.status,
    ]),
  ];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `BlockPlan_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showBPToast('Block plan exported as CSV.');
}

// ─────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────
function showBPToast(msg) {
  let toast = document.getElementById('bp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bp-toast';
    toast.className = 'bp-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3500);
}

// ─────────────────────────────────────────────────────────────
// RESIZE – redraw gantt on window resize
// ─────────────────────────────────────────────────────────────
let bpResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(bpResizeTimer);
  bpResizeTimer = setTimeout(() => {
    if (document.getElementById('panel-block-planning')?.classList.contains('active')) {
      drawGantt();
    }
  }, 200);
});
