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

  // Daily records of executed, active, and slated blocks for today
  dailyRecords: [
    { id:'DBR-101', date:'Today (10-Sep)', window:'02:00 – 06:00', section:'NDLS–CNB', kmSpan:'KM 42/12 – 47/18', depts:['ENG','TRD','SNT'], tasks:['T001','T004','T007'], machinery:'09-3X Tamping Machine + Tower Wagon 428', regulation:'2 Freight trains regulated by 22m', status:'active', efficiency:'96%' },
    { id:'DBR-102', date:'Today (10-Sep)', window:'00:00 – 03:00', section:'NDLS–CNB', kmSpan:'KM 18/04 – 19/20', depts:['SNT'], tasks:['T015'], machinery:'OFC Optical Splicer Kit', regulation:'1 Express train cautioned (15 kmph)', status:'completed', efficiency:'98%' },
    { id:'DBR-103', date:'Today (10-Sep)', window:'10:00 – 12:00', section:'SUR–ST', kmSpan:'KM 114/02 – 116/10', depts:['TRD','SNT'], tasks:['T011','T017'], machinery:'Ladder Trolley + TRD Inspection Car', regulation:'Zero train detention (Shadow block)', status:'scheduled', efficiency:'100%' },
    { id:'DBR-104', date:'Today (10-Sep)', window:'22:00 – 01:30', section:'CNB–ALD', kmSpan:'KM 212/00 – 215/14', depts:['ENG','TRD'], tasks:['T002','T008'], machinery:'DGS Dynamic Track Stabilizer', regulation:'3 Express trains diverted to Loop 2', status:'scheduled', efficiency:'94%' },
    { id:'DBR-105', date:'Today (10-Sep)', window:'23:30 – 04:30', section:'ALD–MGS', kmSpan:'KM 304/10 – 309/22', depts:['ENG','TRD','SNT'], tasks:['T003','T009','T014'], machinery:'Crane B-40 + Ultrasonic Testing Rig', regulation:'Freight traffic held at Naini Jn', status:'planned', efficiency:'92%' }
  ],

  // Monthly aggregated overhaul & corridor quotas
  monthlyRecords: [
    { id:'MBR-M1', month:'September 2026', weekRange:'Week 1 (01-07 Sep)', section:'NDLS–CNB', totalBlocks:14, hrsBlocked:54, departments:'ENG + TRD + SNT', quotaAchieved:'94.8%', trainPunctuality:'96.2%', status:'completed' },
    { id:'MBR-M2', month:'September 2026', weekRange:'Week 2 (08-14 Sep)', section:'CNB–ALD',  totalBlocks:11, hrsBlocked:42, departments:'ENG + TRD',         quotaAchieved:'91.5%', trainPunctuality:'94.8%', status:'active' },
    { id:'MBR-M3', month:'September 2026', weekRange:'Week 2 (08-14 Sep)', section:'ALD–MGS',  totalBlocks:10, hrsBlocked:38, departments:'ENG + TRD + SNT', quotaAchieved:'88.0%', trainPunctuality:'93.4%', status:'active' },
    { id:'MBR-M4', month:'September 2026', weekRange:'Week 3 (15-21 Sep)', section:'SUR–ST',   totalBlocks:8,  hrsBlocked:24, departments:'TRD + SNT',         quotaAchieved:'Slated',trainPunctuality:'98.0%', status:'planned' },
    { id:'MBR-M5', month:'September 2026', weekRange:'Week 3 (15-21 Sep)', section:'MGS–PNBE', totalBlocks:9,  hrsBlocked:30, departments:'TRD',               quotaAchieved:'Slated',trainPunctuality:'97.5%', status:'planned' },
    { id:'MBR-M6', month:'September 2026', weekRange:'Week 4 (22-30 Sep)', section:'LKO–GKP',  totalBlocks:6,  hrsBlocked:18, departments:'ENG + SNT',         quotaAchieved:'Slated',trainPunctuality:'99.0%', status:'planned' },
  ],

  // AI Block Probability and "Where Can Be What" tracking model
  aiPredictions: [
    {
      id: 'AIP-01',
      section: 'NDLS–CNB',
      kmRange: 'KM 42/10 – 48/25 (Ghaziabad–Aligarh Down ML)',
      chanceOfBlock: 94,
      urgency: 'Immediate Intervention (Next 24h)',
      whyBlockNeeded: 'High acoustic rail oscillation detected by axle sensors + USFD ultrasonic probe detected micro-fissure at weld joint #46. Heavy freight GMT loading exceeded wear threshold.',
      whereCanBeWhat: {
        where: 'Down Main Line KM 45/14 near Dadri Loop',
        what: 'Triple Department Simultaneous Joint Block (Track Tamping + Catenary Dropper Adjustment + Track Circuit Tuning)',
        optimalWindow: 'Tomorrow 02:15 – 05:45 AM (Ghost Freight Shadow Window)',
        trainsAffected: 'Zero passenger trains (2 Container rakes buffered at Maripat)',
        suggestedSlot: 'Combined Corridor Slot #3',
        prioScore: 98
      }
    },
    {
      id: 'AIP-02',
      section: 'ALD–MGS',
      kmRange: 'KM 312/00 – 316/80 (Mirzapur Gradient Sector)',
      chanceOfBlock: 87,
      urgency: 'High (Next 48h Window)',
      whyBlockNeeded: 'Traction Distribution TDMS logged 4 thermal hotspots on overhead catenary wires. Signal relay room at Mirzapur showing 18ms latching delay.',
      whereCanBeWhat: {
        where: 'Up Loop Line KM 314/05 & Mirzapur Junction C-Cabin',
        what: 'TRD Section Insulator Replacement + S&T Solid State Interlocking Card Swap',
        optimalWindow: 'Thursday 00:30 – 04:00 AM (Post-Rajdhani Clear Corridor)',
        trainsAffected: '1 Parcel Special rescheduled (+15m)',
        suggestedSlot: 'Night Maintenance Super-Block #7',
        prioScore: 89
      }
    },
    {
      id: 'AIP-03',
      section: 'CNB–ALD',
      kmRange: 'KM 208/10 – 214/40 (Fatehpur Ballast Bed)',
      chanceOfBlock: 76,
      urgency: 'Medium-High (Scheduled Weekend)',
      whyBlockNeeded: 'Ballast void ratio exceeded 14% after monsoon depression; dynamic track geometry index (TGI) dipped to 68/100.',
      whereCanBeWhat: {
        where: 'Both Up & Down Lines KM 211/12',
        what: 'High-speed BCM (Ballast Cleaning Machine) Pack-up & Laser Levelling',
        optimalWindow: 'Saturday 01:00 – 06:30 AM (Mega Traffic Diversion Window)',
        trainsAffected: '3 Overnight express trains diverted via loop with 12m caution',
        suggestedSlot: 'Weekend Integrated Window #W2',
        prioScore: 82
      }
    },
    {
      id: 'AIP-04',
      section: 'SUR–ST',
      kmRange: 'KM 108/30 – 112/10 (Western Heavy Corridor)',
      chanceOfBlock: 61,
      urgency: 'Medium (Next 5–7 Days)',
      whyBlockNeeded: 'TRD Mast foundation corrosion near marshy creek; point machines #12A and #12B reached 15,000 throw cycles.',
      whereCanBeWhat: {
        where: 'Cross-over 14B at Navsari Yard',
        what: 'Joint S&T Point Machine Overhaul & TRD Mast Guy Rod Strengthening',
        optimalWindow: 'Wednesday 11:30 AM – 01:30 PM (Midday Passenger Lull)',
        trainsAffected: 'Zero passenger impact; EMUs run on alternate Platform 3',
        suggestedSlot: 'Day Shadow Slot #D4',
        prioScore: 65
      }
    },
    {
      id: 'AIP-05',
      section: 'LKO–GKP',
      kmRange: 'KM 78/00 – 81/50 (Barabanki Jn approaches)',
      chanceOfBlock: 38,
      urgency: 'Low / Preventive Monitoring',
      whyBlockNeeded: 'Routine level crossing overhaul due at LC-47; optical fiber decibel attenuation within permissible limits.',
      whereCanBeWhat: {
        where: 'LC-47 Gate Assembly & Track Flangeway',
        what: 'Rubberized Check Rail Replacement & Road Surface Tarmac Laying',
        optimalWindow: 'Friday 10:00 AM – 12:00 PM (Local Traffic Block with Road Diversion)',
        trainsAffected: 'None; 1 DMU cleared with 20 kmph caution order',
        suggestedSlot: 'Routine Daytime LC Window',
        prioScore: 44
      }
    }
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
  if (bpInitialised) { updateBPStats(); filterBPRecords(); return; }
  bpInitialised = true;
  updateBPStats();
  renderBPQueue();
  renderDeptCards();
  switchBPView(BP_DATA.currentView || 'week');
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
  ctx.fillStyle = '#254b77';
  ctx.fillRect(0, 0, W, HEADER - 8);
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 11px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SECTION', 8, 18);

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
function renderBPWeeklyPlan(filterQuery = '', filterCorridor = 'all') {
  const tbody = document.getElementById('bp-plan-tbody');
  const thead = document.getElementById('bp-plan-thead');
  if (!tbody) return;

  if (thead) {
    thead.innerHTML = `<tr>
      <th>Block Window</th>
      <th>Corridor / Section</th>
      <th>Departments</th>
      <th>Integrated Tasks</th>
      <th>Impact / Punctuality</th>
      <th>Status</th>
    </tr>`;
  }

  let list = BP_DATA.weeklyPlan;
  if (filterCorridor !== 'all') {
    list = list.filter(wp => wp.section === filterCorridor);
  }
  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase();
    list = list.filter(wp =>
      wp.section.toLowerCase().includes(q) ||
      wp.window.toLowerCase().includes(q) ||
      wp.depts.some(d => d.toLowerCase().includes(q) || (deptLabel[d] && deptLabel[d].toLowerCase().includes(q))) ||
      wp.tasks.some(t => t.toLowerCase().includes(q))
    );
  }

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400);">No weekly block records match the criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(wp => {
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
// DAILY BLOCK RECORDS TABLE
// ─────────────────────────────────────────────────────────────
function renderBPDailyRecords(filterQuery = '', filterCorridor = 'all') {
  const tbody = document.getElementById('bp-plan-tbody');
  const thead = document.getElementById('bp-plan-thead');
  if (!tbody) return;

  if (thead) {
    thead.innerHTML = `<tr>
      <th>Execution Slot & ID</th>
      <th>Corridor & KM Span</th>
      <th>Gangs / Machinery</th>
      <th>Tasks Handled</th>
      <th>Train Regulation & Efficiency</th>
      <th>Status</th>
    </tr>`;
  }

  let list = BP_DATA.dailyRecords;
  if (filterCorridor !== 'all') {
    list = list.filter(d => d.section === filterCorridor);
  }
  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase();
    list = list.filter(d =>
      d.section.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.kmSpan.toLowerCase().includes(q) ||
      d.machinery.toLowerCase().includes(q) ||
      d.regulation.toLowerCase().includes(q) ||
      d.depts.some(dp => dp.toLowerCase().includes(q))
    );
  }

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400);">No daily block logs found for today.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(d => {
    const deptChips = d.depts.map(dp =>
      `<span class="bp-dept-chip ${dp.toLowerCase()}-dept">${deptLabel[dp] || dp}</span>`
    ).join('');
    const taskChips = d.tasks.map(tid => `<span class="bp-task-chip">${tid}</span>`).join('');
    const statusClass = { 'completed':'status-active-bp', 'active':'status-sched-bp', 'scheduled':'status-planned-bp', 'planned':'status-planned-bp' }[d.status] || '';

    return `<tr class="bp-plan-row ${d.status}">
      <td class="bp-plan-window">
        <div style="font-weight:700;color:var(--blue-800);">${d.window}</div>
        <div style="font-size:10px;color:var(--gray-400);">${d.id} · ${d.date}</div>
      </td>
      <td>
        <span class="bp-section-chip">${d.section}</span>
        <div style="font-size:11px;color:var(--gray-500);margin-top:2px;">📍 ${d.kmSpan}</div>
      </td>
      <td>
        <div class="bp-dept-chips" style="margin-bottom:4px;">${deptChips}</div>
        <div style="font-size:11px;color:var(--gray-600);font-weight:500;">🚜 ${d.machinery}</div>
      </td>
      <td><div class="bp-task-chips">${taskChips}</div></td>
      <td>
        <div style="font-size:11px;font-weight:600;color:var(--blue-900);">${d.regulation}</div>
        <div style="font-size:10px;color:#059669;font-weight:700;margin-top:2px;">⚡ Efficiency: ${d.efficiency}</div>
      </td>
      <td><span class="bp-status-badge ${statusClass}">${d.status.toUpperCase()}</span></td>
    </tr>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// MONTHLY BLOCK RECORDS TABLE
// ─────────────────────────────────────────────────────────────
function renderBPMonthlyRecords(filterQuery = '', filterCorridor = 'all') {
  const tbody = document.getElementById('bp-plan-tbody');
  const thead = document.getElementById('bp-plan-thead');
  if (!tbody) return;

  if (thead) {
    thead.innerHTML = `<tr>
      <th>Month & Schedule Period</th>
      <th>Corridor / Zone</th>
      <th>Departments Combined</th>
      <th>Total Blocks & Cumulative Hrs</th>
      <th>Quota Achieved</th>
      <th>Train Punctuality Index</th>
    </tr>`;
  }

  let list = BP_DATA.monthlyRecords;
  if (filterCorridor !== 'all') {
    list = list.filter(m => m.section === filterCorridor);
  }
  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase();
    list = list.filter(m =>
      m.section.toLowerCase().includes(q) ||
      m.weekRange.toLowerCase().includes(q) ||
      m.departments.toLowerCase().includes(q) ||
      m.month.toLowerCase().includes(q)
    );
  }

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400);">No monthly records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(m => {
    return `<tr class="bp-plan-row">
      <td class="bp-plan-window">
        <div style="font-weight:700;color:var(--blue-900);">${m.weekRange}</div>
        <div style="font-size:10px;color:var(--gray-400);">${m.month} · ${m.id}</div>
      </td>
      <td><span class="bp-section-chip" style="font-weight:700;">${m.section}</span></td>
      <td><div style="font-size:12px;font-weight:600;color:var(--blue-700);">${m.departments}</div></td>
      <td>
        <div style="font-weight:700;color:var(--blue-800);">${m.totalBlocks} Blocks</div>
        <div style="font-size:10px;color:var(--gray-500);">${m.hrsBlocked} hrs total track possession</div>
      </td>
      <td>
        <span class="bp-status-badge status-sched-bp" style="font-weight:700;">${m.quotaAchieved}</span>
      </td>
      <td>
        <div style="font-size:12px;font-weight:700;color:#059669;">${m.trainPunctuality}</div>
        <div style="font-size:10px;color:var(--gray-400);">Zone Target: &gt;92%</div>
      </td>
    </tr>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// AI PREDICTIVE BLOCK TRACKING & "WHERE CAN BE WHAT"
// ─────────────────────────────────────────────────────────────
function renderBPAiPredictions(filterQuery = '', filterCorridor = 'all') {
  const container = document.getElementById('bp-predict-grid');
  if (!container) return;

  let list = BP_DATA.aiPredictions;
  if (filterCorridor !== 'all') {
    list = list.filter(p => p.section === filterCorridor);
  }
  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase();
    list = list.filter(p =>
      p.section.toLowerCase().includes(q) ||
      p.kmRange.toLowerCase().includes(q) ||
      p.whyBlockNeeded.toLowerCase().includes(q) ||
      p.whereCanBeWhat.where.toLowerCase().includes(q) ||
      p.whereCanBeWhat.what.toLowerCase().includes(q)
    );
  }

  if (!list.length) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--gray-400);">No predictive block alerts match the filter.</div>`;
    return;
  }

  container.innerHTML = list.map(item => {
    const chance = item.chanceOfBlock;
    const tierColor = chance >= 85 ? '#dc2626' : (chance >= 65 ? '#d97706' : '#2563eb');
    const tierBg = chance >= 85 ? 'rgba(239,68,68,0.1)' : (chance >= 65 ? 'rgba(245,158,11,0.1)' : 'rgba(37,99,235,0.1)');
    const tierBorder = chance >= 85 ? 'rgba(239,68,68,0.25)' : (chance >= 65 ? 'rgba(245,158,11,0.25)' : 'rgba(37,99,235,0.25)');

    return `
    <div class="bp-predict-card" id="bpc-${item.id}">
      <div class="bpp-header">
        <div>
          <span class="bp-section-chip" style="font-size:12px;font-weight:700;">${item.section}</span>
          <span style="font-size:11px;color:var(--gray-400);margin-left:6px;">${item.id}</span>
          <div style="font-size:11px;font-weight:600;color:var(--gray-600);margin-top:3px;">📍 ${item.kmRange}</div>
        </div>
        <div style="text-align:right;">
          <div style="display:inline-block;background:${tierBg};color:${tierColor};border:1px solid ${tierBorder};font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">
            ${item.urgency}
          </div>
        </div>
      </div>

      <!-- Chance of Block Meter -->
      <div class="bpp-meter-box">
        <div class="bpp-meter-top">
          <span class="bpp-meter-label">Track Block Necessity Probability</span>
          <span class="bpp-meter-pct" style="color:${tierColor};">${chance}%</span>
        </div>
        <div class="bpp-meter-bar">
          <div class="bpp-meter-fill" style="width:${chance}%;background:${tierColor};"></div>
        </div>
      </div>

      <!-- Why Block is Needed -->
      <div class="bpp-reason">
        <strong style="color:var(--gray-800);">Inspection Cause:</strong> ${item.whyBlockNeeded}
      </div>

      <!-- Where Can Be What (Integrated Corridor Maintenance Recommendation) -->
      <div class="bpp-rec-box">
        <div class="bpp-rec-title">
          <span>📌 Corridor Recommendation: Where Can Be What</span>
          <span class="bpp-prio-tag">Priority Index: ${item.whereCanBeWhat.prioScore}/100</span>
        </div>
        <div class="bpp-rec-row">
          <span class="bpp-rec-lbl">Where (Exact Track):</span>
          <span class="bpp-rec-val" style="color:var(--blue-800);font-weight:600;">${item.whereCanBeWhat.where}</span>
        </div>
        <div class="bpp-rec-row">
          <span class="bpp-rec-lbl">What (Department Work):</span>
          <span class="bpp-rec-val" style="color:#0f172a;font-weight:500;">${item.whereCanBeWhat.what}</span>
        </div>
        <div class="bpp-rec-row">
          <span class="bpp-rec-lbl">Optimal Traffic Slot:</span>
          <span class="bpp-rec-val" style="color:#15803d;font-weight:700;">${item.whereCanBeWhat.optimalWindow}</span>
        </div>
        <div class="bpp-rec-row">
          <span class="bpp-rec-lbl">Traffic Impact:</span>
          <span class="bpp-rec-val" style="color:var(--gray-600);">${item.whereCanBeWhat.trainsAffected}</span>
        </div>
      </div>

      <div class="bpp-actions">
        <span style="font-size:11px;color:var(--gray-400);">Recommended Slot: <strong>${item.whereCanBeWhat.suggestedSlot}</strong></span>
        <button class="bpp-apply-btn" onclick="applyAiBlockRecommendation('${item.id}')" style="background:var(--blue-700);box-shadow:none;">
          ⚡ Approve &amp; Integrate into Master Schedule
        </button>
      </div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// VIEW TOGGLE (Daily / Weekly / Monthly / AI Chances)
// ─────────────────────────────────────────────────────────────
function switchBPView(view) {
  BP_DATA.currentView = view;
  document.getElementById('bpvt-daily')?.classList.toggle('active',      view === 'daily');
  document.getElementById('bpvt-week')?.classList.toggle('active',       view === 'week');
  document.getElementById('bpvt-month')?.classList.toggle('active',      view === 'month');
  document.getElementById('bpvt-ai-predict')?.classList.toggle('active', view === 'ai-predict');

  const titleEl    = document.getElementById('bp-card-title-text');
  const tableWrap  = document.getElementById('bp-plan-table-wrap');
  const aiWrap     = document.getElementById('bp-ai-predict-wrap');

  const searchVal   = document.getElementById('bp-records-search')?.value || '';
  const corridorVal = document.getElementById('bp-records-corridor-filter')?.value || 'all';

  if (view === 'ai-predict') {
    if (tableWrap) tableWrap.classList.add('hidden');
    if (aiWrap)    aiWrap.classList.remove('hidden');
    if (titleEl)   titleEl.textContent = 'AI Predictive Block Tracking & "Where Can Be What"';
    renderBPAiPredictions(searchVal, corridorVal);
  } else {
    if (tableWrap) tableWrap.classList.remove('hidden');
    if (aiWrap)    aiWrap.classList.add('hidden');

    if (view === 'daily') {
      if (titleEl) titleEl.textContent = 'Daily Block Records & Execution Logs (Today)';
      renderBPDailyRecords(searchVal, corridorVal);
    } else if (view === 'month') {
      if (titleEl) titleEl.textContent = 'Monthly Mega-Block Quotas & Overhaul Records';
      renderBPMonthlyRecords(searchVal, corridorVal);
    } else {
      if (titleEl) titleEl.textContent = 'Optimized Block Plan – This Week';
      renderBPWeeklyPlan(searchVal, corridorVal);
    }
  }
}

// Filter records across active view
function filterBPRecords() {
  const searchVal   = document.getElementById('bp-records-search')?.value || '';
  const corridorVal = document.getElementById('bp-records-corridor-filter')?.value || 'all';

  const view = BP_DATA.currentView;
  if (view === 'daily') {
    renderBPDailyRecords(searchVal, corridorVal);
  } else if (view === 'month') {
    renderBPMonthlyRecords(searchVal, corridorVal);
  } else if (view === 'ai-predict') {
    renderBPAiPredictions(searchVal, corridorVal);
  } else {
    renderBPWeeklyPlan(searchVal, corridorVal);
  }
}

// Instant AI Recommendation Integration
function applyAiBlockRecommendation(predictId) {
  const pred = BP_DATA.aiPredictions.find(p => p.id === predictId);
  if (!pred) return;

  // Add into weekly plan dynamically if not present
  const exists = BP_DATA.weeklyPlan.some(w => w.id === 'WP-' + pred.id);
  if (!exists) {
    BP_DATA.weeklyPlan.unshift({
      id: 'WP-' + pred.id,
      window: pred.whereCanBeWhat.optimalWindow,
      section: pred.section,
      depts: ['ENG','TRD','SNT'],
      tasks: [pred.id],
      impact: 'Low',
      status: 'scheduled'
    });
  }

  showBPToast(`Integrated AI Recommendation for ${pred.section} into Master Schedule!`);
  switchBPView('week');
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
  filterBPRecords();
  drawGantt();

  showBPToast('AI Optimizer finished — block plan updated.');
}

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────
function exportBlockPlan() {
  const currentView = BP_DATA.currentView;
  let rows = [];
  let filename = `BlockPlan_${currentView}_${new Date().toISOString().slice(0,10)}.csv`;

  if (currentView === 'daily') {
    rows = [
      ['Log ID', 'Date', 'Time Window', 'Section', 'KM Span', 'Departments', 'Machinery', 'Train Regulation', 'Status', 'Efficiency'],
      ...BP_DATA.dailyRecords.map(d => [
        d.id, d.date, d.window, d.section, d.kmSpan, d.depts.join(' + '), d.machinery, d.regulation, d.status, d.efficiency
      ])
    ];
  } else if (currentView === 'month') {
    rows = [
      ['Record ID', 'Month', 'Schedule Period', 'Section', 'Total Blocks', 'Cumulative Hrs', 'Departments', 'Quota Achieved', 'Punctuality Index'],
      ...BP_DATA.monthlyRecords.map(m => [
        m.id, m.month, m.weekRange, m.section, m.totalBlocks, m.hrsBlocked, m.departments, m.quotaAchieved, m.trainPunctuality
      ])
    ];
  } else if (currentView === 'ai-predict') {
    rows = [
      ['Prediction ID', 'Section', 'KM Range', 'Chance of Block (%)', 'Urgency', 'Where', 'What', 'Optimal Window', 'Punctuality Impact'],
      ...BP_DATA.aiPredictions.map(p => [
        p.id, p.section, p.kmRange, p.chanceOfBlock, p.urgency, p.whereCanBeWhat.where, p.whereCanBeWhat.what, p.whereCanBeWhat.optimalWindow, p.whereCanBeWhat.trainsAffected
      ])
    ];
  } else {
    rows = [
      ['Block Window', 'Section', 'Departments', 'Tasks', 'Impact', 'Status'],
      ...BP_DATA.weeklyPlan.map(wp => [
        wp.window,
        wp.section,
        wp.depts.map(d => deptLabel[d] || d).join(' + '),
        wp.tasks.join(', '),
        wp.impact,
        wp.status,
      ]),
    ];
  }

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showBPToast(`Exported ${currentView.toUpperCase()} records as CSV.`);
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
