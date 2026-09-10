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

  // Maintenance tasks aggregated from all departments with VSN & operational linkages
  tasks: [
    // Engineering – Track Management System (TMS)
    {
      id: 'T001',
      dept: 'ENG',
      section: 'NDLS–CNB',
      trackId: 'TRK009',
      kmPosition: 'KM 18.5',
      description: 'Rail fracture repair – fractured rail detected on ML track',
      problem: 'Rail fracture risk (micro-fissure at weld joint #46)',
      priority: 'critical',
      score: 96,
      overdueDays: 3,
      severity: 5,
      durationHr: 4,
      status: 'pending',
      requiredBlock: '02:00–06:00',
      assignedBlock: null,
      vsnSource: 'Detected by VSN-024 (TRK009 · KM 18.5)',
      riskLevel: 'CRITICAL',
      recommendedAction: 'Immediate inspection + emergency maintenance block',
      contributingFactors: [
        'Critical track condition reported (rail fissure / structural fracture)',
        'High anomaly score (91%) from Virtual Sensor Node VSN-024',
        '94% blockage probability evaluated by real-time heuristic model',
        'Heavy traffic operational impact on primary trunk corridor',
        'Preventive maintenance overdue by 3 days'
      ],
      recommendation: 'Schedule an immediate multi-department combined maintenance block during the 02:00–08:00 shadow window. Integrate with pending TRD catenary adjustment and S&T signal relay inspection.'
    },
    {
      id: 'T002',
      dept: 'ENG',
      section: 'CNB–ALD',
      trackId: 'TRK014',
      kmPosition: 'KM 212.0',
      description: 'Track subsidence – ballast settlement at km 212',
      problem: 'Track subsidence & dynamic ballast void ratio > 14%',
      priority: 'high',
      score: 84,
      overdueDays: 1,
      severity: 4,
      durationHr: 3,
      status: 'pending',
      requiredBlock: '22:00–02:00',
      assignedBlock: null,
      vsnSource: 'Sensor anomaly detected (Track Geometry Index dip)',
      riskLevel: 'ELEVATED',
      recommendedAction: 'High-speed BCM tamping machine pack-up & laser levelling',
      contributingFactors: [
        'Dynamic track geometry index (TGI) dipped to 68/100',
        'Ballast void ratio exceeded 14% post-monsoon depression',
        'Speed restriction of 30 km/h currently enforced (TSR)',
        'Maintenance overdue by 1 day'
      ],
      recommendation: 'Schedule 3-hour night maintenance block in coordination with TRD mast inspection.'
    },
    {
      id: 'T003',
      dept: 'ENG',
      section: 'ALD–MGS',
      trackId: 'TRK018',
      kmPosition: 'KM 306.4',
      description: 'Bridge inspection – monsoon structural check on Pier #4',
      problem: 'Monsoon substructure scour monitoring',
      priority: 'medium',
      score: 62,
      overdueDays: 0,
      severity: 3,
      durationHr: 5,
      status: 'pending',
      requiredBlock: '00:00–05:00',
      assignedBlock: null,
      vsnSource: 'Routine TMS Cyclical Schedule',
      riskLevel: 'MODERATE',
      recommendedAction: 'Ultrasonic flaw detector & diver inspection rig deployment',
      contributingFactors: [
        'Annual statutory monsoon safety inspection',
        'No active displacement or acoustic anomaly detected',
        'Scheduled within standard corridor maintenance quota'
      ],
      recommendation: 'Combine into planned weekly shadow block with TRD booster transformer replacement.'
    },
    {
      id: 'T004',
      dept: 'ENG',
      section: 'NDLS–CNB',
      trackId: 'TRK008',
      kmPosition: 'KM 45.2',
      description: 'Sleeper replacement – 120 damaged PSC sleepers at km 45',
      problem: 'Damaged prestressed concrete sleepers under heavy freight',
      priority: 'high',
      score: 78,
      overdueDays: 2,
      severity: 3,
      durationHr: 6,
      status: 'scheduled',
      requiredBlock: '02:00–08:00',
      assignedBlock: 'BLK-001',
      vsnSource: 'TMS Defect Log #TMS-4412',
      riskLevel: 'ELEVATED',
      recommendedAction: 'Portal crane sleeper replacement in shadow window',
      contributingFactors: [
        '120 PSC sleepers showing surface spalling',
        'Overdue by 2 days',
        'Successfully combined into Block A (BLK-001)'
      ],
      recommendation: 'Execute concurrently with OHE wire replacement.'
    },
    {
      id: 'T005',
      dept: 'ENG',
      section: 'SUR–ST',
      trackId: 'TRK022',
      kmPosition: 'KM 110.0',
      description: 'Track geometry correction – longitudinal level defect',
      problem: 'Longitudinal alignment deviation (+6mm)',
      priority: 'medium',
      score: 55,
      overdueDays: 0,
      severity: 2,
      durationHr: 4,
      status: 'pending',
      requiredBlock: '00:00–04:00',
      assignedBlock: null,
      vsnSource: 'Track Recording Car TRC-208',
      riskLevel: 'MODERATE',
      recommendedAction: 'DUOMATIC tamping machine run',
      contributingFactors: [
        'Minor ride quality index deterioration',
        'No emergency risk to train operation'
      ],
      recommendation: 'Slot into mid-week night corridor window.'
    },
    {
      id: 'T006',
      dept: 'ENG',
      section: 'LKO–GKP',
      trackId: 'TRK027',
      kmPosition: 'KM 79.5',
      description: 'Level crossing gate overhaul – LC No. 47 flangeway clearance',
      problem: 'Rubberized check rail wear & roadway tarmac settlement',
      priority: 'low',
      score: 38,
      overdueDays: 0,
      severity: 1,
      durationHr: 2,
      status: 'pending',
      requiredBlock: '10:00–12:00',
      assignedBlock: null,
      vsnSource: 'Cyclic P-Way Inspection',
      riskLevel: 'LOW',
      recommendedAction: 'Local road traffic diversion & check rail swap',
      contributingFactors: [
        'Routine preventive maintenance',
        'Zero mainline speed restriction'
      ],
      recommendation: 'Execute during midday passenger lull.'
    },

    // TRD – Traction Distribution Management System (TDMS)
    {
      id: 'T007',
      dept: 'TRD',
      section: 'NDLS–CNB',
      trackId: 'TRK009',
      kmPosition: 'KM 67.0',
      description: 'OHE wire replacement – broken contact wire & worn catenary',
      problem: 'Overhead contact wire diameter reduced to critical 8.2mm',
      priority: 'critical',
      score: 94,
      overdueDays: 2,
      severity: 5,
      durationHr: 5,
      status: 'pending',
      requiredBlock: '02:00–07:00',
      assignedBlock: null,
      vsnSource: 'TDMS Current Pantograph Sensor & Thermal Cam',
      riskLevel: 'CRITICAL',
      recommendedAction: 'Tower Wagon catenary restringing & power block',
      contributingFactors: [
        'Catenary wire wear exceeded safety threshold',
        'Thermal hotspot detected at dropper joint #14',
        'Maintenance overdue by 2 days',
        'Direct risk of pantograph entanglement on high-speed corridor'
      ],
      recommendation: 'Combine with Engineering rail repair (T001) in single NDLS-CNB possession.'
    },
    {
      id: 'T008',
      dept: 'TRD',
      section: 'CNB–ALD',
      trackId: 'TRK014',
      kmPosition: 'KM 214.5',
      description: 'Mast inspection – 14 masts with base corrosion detected',
      problem: 'OHE mast guy rod & base plate oxidation near chemical zone',
      priority: 'high',
      score: 81,
      overdueDays: 1,
      severity: 4,
      durationHr: 3,
      status: 'pending',
      requiredBlock: '22:00–01:00',
      assignedBlock: null,
      vsnSource: 'Visual TDMS Inspection Patrol',
      riskLevel: 'ELEVATED',
      recommendedAction: 'Epoxy painting & guy rod tension adjustment',
      contributingFactors: [
        '14 steel portals showing atmospheric corrosion',
        'Overdue by 1 day'
      ],
      recommendation: 'Execute in parallel with track subsidence tamping (T002).'
    },
    {
      id: 'T009',
      dept: 'TRD',
      section: 'ALD–MGS',
      trackId: 'TRK019',
      kmPosition: 'KM 314.0',
      description: 'Booster transformer replacement – BT-18 insulation breakdown',
      problem: 'Thermal hotspot 88°C on 25kV traction transformer',
      priority: 'critical',
      score: 91,
      overdueDays: 4,
      severity: 5,
      durationHr: 4,
      status: 'pending',
      requiredBlock: '00:00–04:00',
      assignedBlock: null,
      vsnSource: 'SCADA Substation Alarm #TRD-BT18',
      riskLevel: 'CRITICAL',
      recommendedAction: 'Rail-crane transformer replacement & oil filtration',
      contributingFactors: [
        'Dielectric oil insulation test failure',
        'Severe overheating risking substation trip',
        'Overdue by 4 days'
      ],
      recommendation: 'Lock in joint night block with S&T axle counter calibration.'
    },
    {
      id: 'T010',
      dept: 'TRD',
      section: 'MGS–PNBE',
      trackId: 'TRK030',
      kmPosition: 'KM 420.2',
      description: 'Return conductor repair – earthing bond fault detected',
      problem: 'Return conductor severed by ballast tamper near culvert',
      priority: 'high',
      score: 77,
      overdueDays: 1,
      severity: 3,
      durationHr: 3,
      status: 'pending',
      requiredBlock: '01:00–04:00',
      assignedBlock: null,
      vsnSource: 'SCADA Earth Leakage Relay',
      riskLevel: 'ELEVATED',
      recommendedAction: 'Re-bonding with cadweld exothermic kit',
      contributingFactors: [
        'Return current unbalance detected on track circuit',
        'Overdue by 1 day'
      ],
      recommendation: 'Schedule in Thursday early-morning shadow slot.'
    },
    {
      id: 'T011',
      dept: 'TRD',
      section: 'SUR–ST',
      trackId: 'TRK023',
      kmPosition: 'KM 115.0',
      description: 'Section insulator servicing – 8 ceramic insulators due overhaul',
      problem: 'Creep path flashover risk during coastal fog',
      priority: 'medium',
      score: 59,
      overdueDays: 0,
      severity: 2,
      durationHr: 2,
      status: 'scheduled',
      requiredBlock: '10:00–12:00',
      assignedBlock: 'BLK-003',
      vsnSource: 'Preventive TDMS Cycle',
      riskLevel: 'MODERATE',
      recommendedAction: 'Insulator washing and silicone grease coating',
      contributingFactors: [
        'Routine coastal anti-pollution washing',
        'Combined into Block C (BLK-003)'
      ],
      recommendation: 'Execute during midday passenger lull.'
    },

    // S&T – Signal & Maintenance Management System (SMMS)
    {
      id: 'T012',
      dept: 'SNT',
      section: 'NDLS–CNB',
      trackId: 'TRK009',
      kmPosition: 'KM 18.2',
      description: 'Signal relay replacement – relay room latching delay at CNB South',
      problem: 'Signal relay contact resistance fluctuation (18ms delay)',
      priority: 'critical',
      score: 93,
      overdueDays: 3,
      severity: 5,
      durationHr: 3,
      status: 'pending',
      requiredBlock: '02:00–05:00',
      assignedBlock: null,
      vsnSource: 'SMMS Data Logger Diagnostic',
      riskLevel: 'CRITICAL',
      recommendedAction: 'Q-series plug-in relay swap & electronic interlocking test',
      contributingFactors: [
        'Signal aspect blanking risk on high-density line',
        'Data logger flagged intermittent false-occupancy',
        'Overdue by 3 days'
      ],
      recommendation: 'Combine into single corridor super-block with T001 and T007.'
    },
    {
      id: 'T013',
      dept: 'SNT',
      section: 'CNB–ALD',
      trackId: 'TRK014',
      kmPosition: 'KM 213.0',
      description: 'Point machine lubrication & throw testing – 22 points overdue PM',
      problem: 'Point machine motor current draw exceeded 4.2A limit',
      priority: 'high',
      score: 76,
      overdueDays: 2,
      severity: 3,
      durationHr: 4,
      status: 'pending',
      requiredBlock: '22:00–02:00',
      assignedBlock: null,
      vsnSource: 'SMMS Point Health Monitor',
      riskLevel: 'ELEVATED',
      recommendedAction: 'Gearbox grease replenishment & friction clutch adjustment',
      contributingFactors: [
        'Heavy dust ingress post-monsoon',
        'Overdue by 2 days'
      ],
      recommendation: 'Execute simultaneously with track tamping block.'
    },
    {
      id: 'T014',
      dept: 'SNT',
      section: 'ALD–MGS',
      trackId: 'TRK018',
      kmPosition: 'KM 312.5',
      description: 'Axle counter calibration – 5 multi-section units drift detected',
      problem: 'High-frequency track sensor phase angle deviation',
      priority: 'high',
      score: 82,
      overdueDays: 1,
      severity: 4,
      durationHr: 2,
      status: 'pending',
      requiredBlock: '00:00–02:00',
      assignedBlock: null,
      vsnSource: 'SMMS Automated Diagnostic Terminal',
      riskLevel: 'ELEVATED',
      recommendedAction: 'Oscillator re-tuning & wheel sensor reset',
      contributingFactors: [
        'Wheel count mismatch risk under heavy freight',
        'Overdue by 1 day'
      ],
      recommendation: 'Execute within night corridor possession window.'
    },
    {
      id: 'T015',
      dept: 'SNT',
      section: 'NDLS–CNB',
      trackId: 'TRK007',
      kmPosition: 'KM 18.0',
      description: 'OFC cable fault repair – 24-core optical fiber link disruption',
      problem: 'Fiber cut due to excavation near signaling cabin',
      priority: 'critical',
      score: 97,
      overdueDays: 5,
      severity: 5,
      durationHr: 3,
      status: 'in-progress',
      requiredBlock: 'Now',
      assignedBlock: 'BLK-EMG',
      vsnSource: 'OTDR Network Disruption Alert',
      riskLevel: 'CRITICAL',
      recommendedAction: 'Fusion optical splicing & armored duct laying',
      contributingFactors: [
        'Block section communication redundancy compromised',
        'Active emergency block (BLK-EMG) already in progress'
      ],
      recommendation: 'Complete under emergency possession protocol.'
    },
    {
      id: 'T016',
      dept: 'SNT',
      section: 'LKO–GKP',
      trackId: 'TRK027',
      kmPosition: 'KM 79.5',
      description: 'Level crossing alarm system servicing – LC 47 & 48 road warning',
      problem: 'Solar battery charger ripple voltage exceeds 5%',
      priority: 'medium',
      score: 52,
      overdueDays: 0,
      severity: 2,
      durationHr: 2,
      status: 'pending',
      requiredBlock: '10:00–12:00',
      assignedBlock: null,
      vsnSource: 'Periodic LC Gate Health Inspection',
      riskLevel: 'MODERATE',
      recommendedAction: 'Charge controller replacement & boom audio testing',
      contributingFactors: [
        'Routine statutory inspection',
        'No direct block on train movements'
      ],
      recommendation: 'Combine with Engineering check rail overhaul.'
    },
    {
      id: 'T017',
      dept: 'SNT',
      section: 'SUR–ST',
      trackId: 'TRK023',
      kmPosition: 'KM 114.8',
      description: 'IPS battery bank replacement – 72V signaling system at SUR',
      problem: 'Lead-acid cell internal resistance degradation',
      priority: 'high',
      score: 79,
      overdueDays: 1,
      severity: 3,
      durationHr: 3,
      status: 'pending',
      requiredBlock: '10:00–13:00',
      assignedBlock: null,
      vsnSource: 'SMMS Power Supply Telemetry',
      riskLevel: 'ELEVATED',
      recommendedAction: 'Cell string swap & float voltage calibration',
      contributingFactors: [
        'Backup autonomy reduced from 8h to 2.5h',
        'Overdue by 1 day'
      ],
      recommendation: 'Slot into midday passenger lull window.'
    },
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
// INIT & VSN TELEMETRY INGESTION
// ─────────────────────────────────────────────────────────────
let bpInitialised = false;

function initBlockPlanning() {
  syncVsnWithBlockPlanning();
  if (bpInitialised) {
    updateBPStats();
    filterBPRecords();
    return;
  }
  bpInitialised = true;
  updateBPStats();
  renderBPQueue();
  renderDeptCards();
  switchBPView(BP_DATA.currentView || 'week');
  setTimeout(() => drawGantt(), 80);
}

// Ingest software Virtual Sensor Node telemetry into maintenance planning
function syncVsnWithBlockPlanning() {
  try {
    let vsns = [];
    if (typeof loadVsns === 'function') {
      vsns = loadVsns();
    } else if (typeof window.loadVsns === 'function') {
      vsns = window.loadVsns();
    } else {
      const raw = localStorage.getItem('TRAINSYNC_VSN_DATA');
      if (raw) vsns = JSON.parse(raw);
    }

    const vsn24 = (vsns && vsns.find) ? vsns.find(v => v.vsn_id === 'VSN-024') : null;
    const isVsnFault = vsn24 && (vsn24.status === 'BLOCKED' || vsn24.anomaly_score >= 85 || vsn24.isSimulatedFault);

    const t001 = BP_DATA.tasks.find(t => t.id === 'T001');
    const pillText = document.getElementById('bp-vsn-pill-text');
    const pill = document.getElementById('bp-vsn-status-pill');
    const vsnStep = document.getElementById('bp-wf-step-vsn');
    const vsnSub = document.getElementById('bp-wf-vsn-sub');

    if (isVsnFault) {
      if (t001) {
        t001.score = 98;
        t001.priority = 'critical';
        t001.riskLevel = 'CRITICAL';
        t001.vsnSource = 'Detected by VSN-024 (TRK009 · KM 18.5)';
        t001.problem = 'Rail fracture risk (micro-fissure at weld joint #46)';
        t001.recommendedAction = 'Immediate inspection + emergency maintenance block';
      }
      if (pillText) pillText.textContent = '1 Critical (VSN-024 @ KM 18.5)';
      if (pill) {
        pill.classList.add('critical');
        pill.classList.remove('normal');
      }
      if (vsnStep) vsnStep.classList.add('active-vsn');
      if (vsnSub) vsnSub.textContent = 'TRK009 @ KM 18.5 (Score: 91%)';
    } else {
      if (t001 && !BP_DATA.optimizerRan) {
        t001.score = 72;
        t001.priority = 'high';
        t001.riskLevel = 'MODERATE';
        t001.vsnSource = 'Cyclic TMS Ultrasonic Scan';
        t001.problem = 'Routine weld joint ultrasonic monitoring';
        t001.recommendedAction = 'Periodic flaw detector sweep';
      }
      if (pillText) pillText.textContent = '24 Nodes (Normal)';
      if (pill) {
        pill.classList.remove('critical');
        pill.classList.add('normal');
      }
      if (vsnSub) vsnSub.textContent = 'Track condition & telemetry';
    }
  } catch (err) {
    console.warn('VSN sync non-critical notice:', err);
  }
}

// Demo Triggers for Hackathon Presentation
function triggerDemoVsnAnomaly() {
  if (typeof simulateVsnFault === 'function') {
    simulateVsnFault('VSN-024');
  } else if (typeof window.simulateVsnFault === 'function') {
    window.simulateVsnFault('VSN-024');
  }
  syncVsnWithBlockPlanning();
  updateBPStats();
  renderBPQueue();
  renderDeptCards();
  filterBPRecords();
  drawGantt();
  showBPToast('🚨 VSN-024 Critical Anomaly Injected at KM 18.5! TRK009 elevated to rank #1.');
}

function resetDemoVsnAnomaly() {
  if (typeof resetVsnSimulation === 'function') {
    resetVsnSimulation();
  } else if (typeof window.resetVsnSimulation === 'function') {
    window.resetVsnSimulation();
  }
  BP_DATA.optimizerRan = false;

  const t001 = BP_DATA.tasks.find(t => t.id === 'T001');
  if (t001) {
    t001.score = 72;
    t001.priority = 'high';
    t001.riskLevel = 'MODERATE';
    t001.vsnSource = 'Cyclic TMS Ultrasonic Scan';
    t001.problem = 'Routine weld joint ultrasonic monitoring';
    t001.recommendedAction = 'Periodic flaw detector sweep';
    t001.assignedBlock = null;
    t001.status = 'pending';
  }

  syncVsnWithBlockPlanning();
  updateBPStats();
  renderBPQueue();
  renderDeptCards();
  filterBPRecords();
  drawGantt();

  // Exact confirmation required by user
  showBPToast('Demo reset — network restored to normal state.');
}

function openVsnModalFromBP() {
  const t001 = BP_DATA.tasks.find(t => t.id === 'T001');
  if (t001) openBpAssessmentModal('T001');
}

// ─────────────────────────────────────────────────────────────
// KPI STATS & DRILL-DOWNS
// ─────────────────────────────────────────────────────────────
function updateBPStats() {
  const tasks    = BP_DATA.tasks;
  const blocks   = BP_DATA.blocks;

  const activeBlocks   = blocks.filter(b => b.status === 'active').length || 2;
  const pendingTasks   = tasks.filter(t => t.status === 'pending').length || 14;
  const combinedBlocks = BP_DATA.optimizerRan ? 2 : 1;
  const criticalTasks  = tasks.filter(t => t.priority === 'critical').length || 5;
  const availability   = BP_DATA.optimizerRan ? 89 : 84;

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
  const step = Math.ceil(target / 15) || 1;
  let iv;
  iv = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target && iv) clearInterval(iv);
  }, 35);
}

function animCountStr(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// KPI Click Handlers
function filterBPByKPI(type) {
  if (type === 'active') {
    switchBPView('week');
    showBPToast('Displaying active blocks in Master Schedule.');
  } else if (type === 'pending') {
    const sel = document.getElementById('bp-priority-filter');
    if (sel) sel.value = 'all';
    renderBPQueue();
    document.getElementById('bp-queue-list')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showBPToast('Showing all pending maintenance tasks.');
  } else if (type === 'combined') {
    document.querySelector('.bp-workflow-banner')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showBPToast('Highlighting Recommended Combined Block (NDLS–CNB).');
  } else if (type === 'critical') {
    const sel = document.getElementById('bp-priority-filter');
    if (sel) sel.value = 'critical';
    renderBPQueue();
    document.getElementById('bp-queue-list')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showBPToast('Filtered Priority Queue to Critical maintenance items.');
  }
}

// ─────────────────────────────────────────────────────────────
// DECISION SUPPORT MODALS (Why this schedule, Priority, Tasks, Reasoning)
// ─────────────────────────────────────────────────────────────
function openWhyScheduleModal() {
  openScheduleReasoningModal();
}

function openScheduleReasoningModal() {
  const overlay = document.getElementById('bp-explanation-modal-overlay');
  const titleEl = document.getElementById('bp-exp-modal-title');
  const subEl   = document.getElementById('bp-exp-modal-sub');
  const bodyEl  = document.getElementById('bp-exp-modal-body');
  if (!overlay || !bodyEl) return;

  if (titleEl) titleEl.textContent = 'Why This Schedule Was Recommended';
  if (subEl) subEl.textContent = 'Corridor Optimization & Traffic Synchronization';

  bodyEl.innerHTML = `
    <div style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:14px;">
      <div style="font-size:12px;font-weight:700;color:var(--blue-900);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
        WHY THIS BLOCK WAS RECOMMENDED
      </div>
      <ul style="margin:0;padding-left:18px;font-size:12.5px;color:#334155;line-height:1.6;">
        <li><strong>Engineering, TRD and S&amp;T tasks overlap</strong> on the same corridor (NDLS → CNB).</li>
        <li><strong>VSN-024 reports a high-risk anomaly</strong> requiring prioritized track intervention.</li>
        <li><strong>Combining the work avoids separate track access windows</strong> and multiple line possessions.</li>
      </ul>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
      <div style="background:#ffffff;padding:12px;border-radius:6px;border:1px solid #e2e8f0;">
        <div style="font-size:11px;color:#64748b;font-weight:600;">RECOMMENDATION:</div>
        <div style="font-size:14px;font-weight:700;color:var(--blue-900);margin-top:2px;">1 combined block</div>
        <div style="font-size:11px;color:#0f172a;margin-top:2px;">02:00 – 08:00 (Night Window)</div>
      </div>
      <div style="background:#ffffff;padding:12px;border-radius:6px;border:1px solid #e2e8f0;">
        <div style="font-size:11px;color:#64748b;font-weight:600;">ESTIMATED SAVING:</div>
        <div style="font-size:14px;font-weight:700;color:#16a34a;margin-top:2px;">6 hours</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">50% track possession reduction</div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f1f5f9;border-radius:6px;font-size:11px;border:1px solid #e2e8f0;">
      <span style="color:#475569;">Integrated Department Coordination System</span>
      <span style="font-weight:600;color:#64748b;font-style:italic;">Prototype estimate</span>
    </div>

    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="bp-table-btn" onclick="openPriorityExplanationModal()" style="flex:1;padding:8px;font-size:11.5px;font-weight:600;background:#e8f1fb;color:var(--blue-800);border:1px solid var(--blue-200);border-radius:4px;cursor:pointer;">
        📊 Priority Scoring
      </button>
      <button class="bp-table-btn" onclick="openCorridorTasksModal()" style="flex:1;padding:8px;font-size:11.5px;font-weight:600;background:#f1f5f9;color:var(--gray-800);border:1px solid var(--gray-300);border-radius:4px;cursor:pointer;">
        🛠️ Consolidated Tasks
      </button>
    </div>
  `;

  overlay.classList.remove('hidden');
}

function openPriorityExplanationModal() {
  const overlay = document.getElementById('bp-explanation-modal-overlay');
  const titleEl = document.getElementById('bp-exp-modal-title');
  const subEl   = document.getElementById('bp-exp-modal-sub');
  const bodyEl  = document.getElementById('bp-exp-modal-body');
  if (!overlay || !bodyEl) return;

  if (titleEl) titleEl.textContent = 'Maintenance Priority Scoring Formula';
  if (subEl) subEl.textContent = 'Multi-Factor Railway Risk Evaluation';

  bodyEl.innerHTML = `
    <div style="font-size:12px;color:#475569;margin-bottom:12px;">
      Maintenance tasks are ranked deterministically by combining physical track telemetry with operational impact metrics:
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f8fafc;border-radius:6px;border-left:4px solid #dc2626;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
        <div>
          <strong style="font-size:12px;color:#0f172a;">Track Geometry &amp; Structural Defect</strong>
          <div style="font-size:11px;color:#64748b;">USFD micro-fissures, rail fracture risk, weld integrity</div>
        </div>
        <span style="font-weight:700;font-size:12px;color:#dc2626;">40% Weight</span>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f8fafc;border-radius:6px;border-left:4px solid #d97706;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
        <div>
          <strong style="font-size:12px;color:#0f172a;">Traffic Density &amp; Corridor Impact</strong>
          <div style="font-size:11px;color:#64748b;">Trunk route GMT, express passenger buffer risk</div>
        </div>
        <span style="font-weight:700;font-size:12px;color:#d97706;">25% Weight</span>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f8fafc;border-radius:6px;border-left:4px solid #2563eb;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
        <div>
          <strong style="font-size:12px;color:#0f172a;">Overdue Maintenance Interval</strong>
          <div style="font-size:11px;color:#64748b;">Days elapsed beyond cyclic overhaul mandate</div>
        </div>
        <span style="font-weight:700;font-size:12px;color:#2563eb;">20% Weight</span>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f8fafc;border-radius:6px;border-left:4px solid #059669;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
        <div>
          <strong style="font-size:12px;color:#0f172a;">Virtual Sensor Telemetry (VSN)</strong>
          <div style="font-size:11px;color:#64748b;">Real-time axle oscillation and rail temperature anomalies</div>
        </div>
        <span style="font-weight:700;font-size:12px;color:#059669;">15% Weight</span>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-top:14px;">
      <button class="bp-table-btn" onclick="openScheduleReasoningModal()" style="flex:1;padding:8px;font-size:11.5px;font-weight:600;background:#f1f5f9;color:var(--gray-800);border:1px solid var(--gray-300);border-radius:4px;cursor:pointer;">
        ← Back to Schedule Reasoning
      </button>
      <button class="bp-table-btn" onclick="closeExplanationModal()" style="flex:1;padding:8px;font-size:11.5px;font-weight:600;background:var(--blue-700);color:#ffffff;border:none;border-radius:4px;cursor:pointer;">
        Done
      </button>
    </div>
  `;

  overlay.classList.remove('hidden');
}

function openCorridorTasksModal() {
  const overlay = document.getElementById('bp-explanation-modal-overlay');
  const titleEl = document.getElementById('bp-exp-modal-title');
  const subEl   = document.getElementById('bp-exp-modal-sub');
  const bodyEl  = document.getElementById('bp-exp-modal-body');
  if (!overlay || !bodyEl) return;

  if (titleEl) titleEl.textContent = 'Consolidated Corridor Tasks';
  if (subEl) subEl.textContent = 'Integrated Work Items on NDLS → CNB Corridor';

  bodyEl.innerHTML = `
    <div style="font-size:12px;color:#475569;margin-bottom:12px;">
      The system coordinates separate department requirements into a single possession window:
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
      <div style="background:#f8fafc;padding:10px 12px;border-radius:6px;border:1px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;color:#1e40af;font-size:12px;">T001 · Engineering (TMS)</span>
          <span style="font-size:11px;background:#fee2e2;color:#b91c1c;padding:1px 6px;border-radius:4px;font-weight:600;">CRITICAL</span>
        </div>
        <div style="font-size:12px;font-weight:600;color:#0f172a;margin-top:3px;">Rail fracture repair / ultrasonic weld inspection</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">Location: TRK009 @ KM 18.5 · Duration: 4h</div>
      </div>

      <div style="background:#f8fafc;padding:10px 12px;border-radius:6px;border:1px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;color:#0284c7;font-size:12px;">T007 · TRD (TDMS)</span>
          <span style="font-size:11px;background:#fee2e2;color:#b91c1c;padding:1px 6px;border-radius:4px;font-weight:600;">CRITICAL</span>
        </div>
        <div style="font-size:12px;font-weight:600;color:#0f172a;margin-top:3px;">OHE wire replacement &amp; catenary dropper adjustment</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">Location: TRK009 @ KM 67.0 · Duration: 5h</div>
      </div>

      <div style="background:#f8fafc;padding:10px 12px;border-radius:6px;border:1px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;color:#0891b2;font-size:12px;">T012 · S&amp;T (SMMS)</span>
          <span style="font-size:11px;background:#fef3c7;color:#b45309;padding:1px 6px;border-radius:4px;font-weight:600;">HIGH</span>
        </div>
        <div style="font-size:12px;font-weight:600;color:#0f172a;margin-top:3px;">Track circuit tuning &amp; axle counter loop calibration</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">Location: TRK009 @ KM 32.4 · Duration: 3h</div>
      </div>
    </div>

    <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:8px 12px;border-radius:6px;font-size:11.5px;color:#065f46;margin-bottom:14px;">
      ✓ Executing all 3 tasks concurrently in one 6-hour shadow window eliminates 2 separate corridor shutdowns.
    </div>

    <div style="display:flex;gap:8px;">
      <button class="bp-table-btn" onclick="openScheduleReasoningModal()" style="flex:1;padding:8px;font-size:11.5px;font-weight:600;background:#f1f5f9;color:var(--gray-800);border:1px solid var(--gray-300);border-radius:4px;cursor:pointer;">
        ← Back to Schedule Reasoning
      </button>
      <button class="bp-table-btn" onclick="closeExplanationModal()" style="flex:1;padding:8px;font-size:11.5px;font-weight:600;background:var(--blue-700);color:#ffffff;border:none;border-radius:4px;cursor:pointer;">
        Done
      </button>
    </div>
  `;

  overlay.classList.remove('hidden');
}

function closeExplanationModal(e) {
  if (e && e.target !== document.getElementById('bp-explanation-modal-overlay')) return;
  const overlay = document.getElementById('bp-explanation-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

window.openWhyScheduleModal = openWhyScheduleModal;
window.openScheduleReasoningModal = openScheduleReasoningModal;
window.openPriorityExplanationModal = openPriorityExplanationModal;
window.openCorridorTasksModal = openCorridorTasksModal;
window.closeExplanationModal = closeExplanationModal;
window.triggerDemoVsnAnomaly = triggerDemoVsnAnomaly;
window.resetDemoVsnAnomaly = resetDemoVsnAnomaly;

// Infrastructure Availability Modal Breakdown (Consistent with 34 central tracks)
function openInfrastructureAvailabilityModal() {
  const overlay = document.getElementById('bp-availability-modal-overlay');
  const body = document.getElementById('bp-availability-modal-body');
  if (!overlay || !body) return;

  const avail = BP_DATA.optimizerRan ? 89 : 84;
  const delta = BP_DATA.optimizerRan ? '↑ 5% post-AI multi-department task combination' : '↓ 3% temporary reduction due to active maintenance blocks';

  body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div>
        <div style="font-size:28px;font-weight:900;color:var(--blue-900);line-height:1;">${avail}%</div>
        <div style="font-size:12px;color:var(--gray-500);font-weight:600;margin-top:2px;">Network Infrastructure Availability Index</div>
      </div>
      <span class="bp-badge" style="background:${BP_DATA.optimizerRan ? '#dcfce7' : '#fef3c7'};color:${BP_DATA.optimizerRan ? '#15803d' : '#b45309'};font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;">
        ${delta}
      </span>
    </div>

    <!-- 4-Metric Grid Consistent with Central 34 Tracks -->
    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;margin-bottom:16px;text-align:center;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px;">
        <div style="font-size:20px;font-weight:900;color:#15803d;">26</div>
        <div style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;">Operational Tracks</div>
        <div style="font-size:9.5px;color:var(--gray-400);margin-top:2px;">Clear for full speed</div>
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;">
        <div style="font-size:20px;font-weight:900;color:#dc2626;">8</div>
        <div style="font-size:10px;font-weight:700;color:#991b1b;text-transform:uppercase;">Blocked / In Possession</div>
        <div style="font-size:9.5px;color:var(--gray-400);margin-top:2px;">Traffic held or diverted</div>
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px;">
        <div style="font-size:20px;font-weight:900;color:#d97706;">3</div>
        <div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;">Active Maintenance</div>
        <div style="font-size:9.5px;color:var(--gray-400);margin-top:2px;">Gangs on track</div>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px;">
        <div style="font-size:20px;font-weight:900;color:#2563eb;">5</div>
        <div style="font-size:10px;font-weight:700;color:#1e40af;text-transform:uppercase;">Speed Restricted (TSR)</div>
        <div style="font-size:9.5px;color:var(--gray-400);margin-top:2px;">Caution orders active</div>
      </div>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:11.5px;color:var(--gray-700);line-height:1.5;margin-bottom:14px;">
      <strong style="color:var(--blue-950);">How is this calculated?</strong><br>
      TrainSync calculates infrastructure availability based on active route kilometers open for unrestricted traffic across the 34 central railway network sectors.
      When maintenance work is combined across Engineering, TRD, and S&amp;T into unified blocks, duplicate track closures are avoided, restoring up to <strong>5% network availability</strong>.
    </div>

    <div style="display:flex;justify-content:flex-end;border-top:1px solid #e2e8f0;padding-top:10px;">
      <button class="bp-btn" onclick="closeInfrastructureAvailabilityModal()" style="background:var(--blue-700);color:#fff;border:none;padding:7px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">
        Close Breakdown
      </button>
    </div>
  `;

  overlay.classList.remove('hidden');
}

function closeInfrastructureAvailabilityModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn')) return;
  document.getElementById('bp-availability-modal-overlay')?.classList.add('hidden');
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

  // Hour grid lines + labels (00 to 24 with 4h major markers)
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  for (let h = 0; h <= 24; h += 2) {
    const x = LABEL_W + (h / 24) * plotW;
    ctx.strokeStyle = h % 4 === 0 ? 'rgba(37,99,235,0.22)' : 'rgba(37,99,235,0.08)';
    ctx.lineWidth = h % 4 === 0 ? 1.2 : 0.7;
    ctx.beginPath(); ctx.moveTo(x, HEADER - 6); ctx.lineTo(x, H); ctx.stroke();
    ctx.fillStyle = h % 4 === 0 ? '#1e3a8a' : '#64748b';
    ctx.font = h % 4 === 0 ? 'bold 10px Inter, sans-serif' : '10px Inter, sans-serif';
    ctx.fillText(h === 24 ? '24:00' : (h < 10 ? '0' + h : h) + ':00', x, HEADER - 12);
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
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(section, 6, y + ROW_H / 2 + 4);
  });

  // Draw blocks
  BP_DATA.blocks.forEach(block => {
    const ri = ROWS.indexOf(block.section);
    if (ri < 0) return;
    const y = HEADER + ri * ROW_H + 5;
    const bH = ROW_H - 10;
    const startHr = block.startHr;
    const endHr   = Math.min(block.endHr, 24);
    const x1 = LABEL_W + (startHr / 24) * plotW;
    const x2 = LABEL_W + (endHr   / 24) * plotW;
    const bW = Math.max(x2 - x1, 8);

    // Shadow
    ctx.shadowColor = 'rgba(21,101,192,0.25)';
    ctx.shadowBlur  = 5;

    // Fill
    ctx.fillStyle = block.status === 'active' ? block.color : block.color + 'cc';
    roundRect(ctx, x1, y, bW, bH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label inside block
    if (bW > 35) {
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

  // Click detection to open Block Detail Modal
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const ri = Math.floor((my - HEADER) / ROW_H);
    if (ri < 0 || ri >= ROWS.length) return;

    const clickHr = ((mx - LABEL_W) / plotW) * 24;
    const section = ROWS[ri];

    const hit = BP_DATA.blocks.find(b =>
      b.section === section &&
      clickHr >= b.startHr &&
      clickHr <= Math.min(b.endHr, 24)
    );

    if (hit) {
      openBpBlockDetailModal(hit.id);
    }
  };

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

    const deptsStr = hit.depts.map(d => deptLabel[d] || d).join(', ');
    const statusClass = hit.status === 'active' ? '🟢' : hit.status === 'scheduled' ? '🔵' : '🟡';
    tooltip.innerHTML = `
      <div class="bptt-header">${statusClass} ${hit.label} — ${hit.section}</div>
      <div class="bptt-row"><span>Time:</span> ${fmt(hit.startHr)} – ${fmt(hit.endHr)}</div>
      <div class="bptt-row"><span>Departments:</span> ${deptsStr}</div>
      <div class="bptt-row"><span>Train Impact:</span> ${hit.trainImpact} trains affected</div>
      <div class="bptt-row"><span>Status:</span> ${hit.status.charAt(0).toUpperCase()+hit.status.slice(1)}</div>
      <div style="font-size:9.5px;color:#94a3b8;margin-top:4px;font-style:italic;">Click bar to inspect block details</div>
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
// BLOCK DETAIL MODAL (GANTT INTERACTION)
// ─────────────────────────────────────────────────────────────
function openBpBlockDetailModal(blockId) {
  const b = BP_DATA.blocks.find(x => x.id === blockId) || BP_DATA.blocks[0];
  if (!b) return;
  const overlay = document.getElementById('bp-block-modal-overlay');
  const body = document.getElementById('bp-block-modal-body');
  if (!overlay || !body) return;

  const deptsStr = b.depts.map(d => deptLabel[d] || d).join(' + ');
  const relatedTasks = BP_DATA.tasks.filter(t => t.assignedBlock === b.id || (b.id === 'BLK-001' && ['T001','T004','T007','T012'].includes(t.id)));

  body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div>
        <span class="bp-badge" style="background:${b.color};color:#fff;font-weight:800;font-size:11px;padding:3px 8px;border-radius:6px;">${b.id}</span>
        <span style="font-size:15px;font-weight:800;color:var(--blue-900);margin-left:8px;">${b.label} — ${b.section}</span>
      </div>
      <span class="bp-status-badge ${b.status === 'active' ? 'status-active-bp' : 'status-sched-bp'}">${b.status.toUpperCase()}</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:12px;font-size:11.5px;">
      <div><strong>Time Window:</strong> ${fmt(b.startHr)} – ${fmt(b.endHr)} (${Math.round(b.endHr - b.startHr)}h possession)</div>
      <div><strong>Corridor:</strong> ${b.section} Trunk Line</div>
      <div><strong>Departments:</strong> ${deptsStr}</div>
      <div><strong>Block Type:</strong> ${b.combined ? 'Integrated Combined (AI Synced)' : 'Single Department Block'}</div>
      <div><strong>Train Impact:</strong> ${b.trainImpact} freight trains regulated</div>
      <div><strong>Estimated Utilization:</strong> 87% corridor capacity</div>
    </div>

    <div style="margin-bottom:12px;">
      <div style="font-size:11.5px;font-weight:700;color:var(--gray-800);margin-bottom:6px;text-transform:uppercase;">
        Integrated Maintenance Tasks (${relatedTasks.length}):
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${relatedTasks.map(t => `
          <div style="display:flex;align-items:center;justify-content:space-between;background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;font-size:11px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="bp-dept-chip ${t.dept.toLowerCase()}-dept">${t.dept}</span>
              <strong style="color:var(--blue-950);">${t.id}:</strong>
              <span style="color:var(--gray-700);">${t.description}</span>
            </div>
            <span class="bp-score-badge ${scoreTier(t.score)}-tier" style="font-size:10px;padding:2px 6px;">Score: ${t.score}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px;font-size:11px;color:#166534;margin-bottom:14px;line-height:1.4;">
      <strong>Reason for Scheduling:</strong> AI combined overlapping track tamping, catenary wire replacement &amp; signal relay overhaul into a single shadow window to eliminate repeated track access permits and prevent passenger delays.
    </div>

    <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;border-top:1px solid #e2e8f0;padding-top:12px;">
      <button class="bp-btn" onclick="closeBpBlockDetailModal()" style="background:#f1f5f9;color:var(--gray-700);border:1px solid #cbd5e1;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">
        ✕ Close
      </button>
      <button class="bp-btn" onclick="acceptBlockPlan('${b.id}')" style="background:#059669;color:#ffffff;border:none;padding:7px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        ✓ Accept Plan
      </button>
    </div>
  `;

  overlay.classList.remove('hidden');
}

function closeBpBlockDetailModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn')) return;
  document.getElementById('bp-block-modal-overlay')?.classList.add('hidden');
}

function acceptBlockPlan(planId) {
  const wp = BP_DATA.weeklyPlan.find(w => w.id === planId);
  if (wp) {
    wp.status = 'approved';
    wp.accepted = true;
  }
  const blk = BP_DATA.blocks.find(b => b.id === planId);
  if (blk) {
    blk.status = 'scheduled';
    blk.accepted = true;
  }
  closeBpBlockDetailModal();
  switchBPView(BP_DATA.currentView);
  drawGantt();
  showBPToast(`✓ Block Plan ${planId} Approved & Locked! Dispatched to Station Master.`);
}

// ─────────────────────────────────────────────────────────────
// DEPARTMENT TASK CARDS (INTERACTIVE FILTERING)
// ─────────────────────────────────────────────────────────────
function renderDeptCards() {
  ['ENG','TRD','SNT'].forEach(dept => {
    const suffix  = { ENG:'eng', TRD:'trd', SNT:'snt' }[dept];
    const tasks   = BP_DATA.tasks.filter(t => t.dept === dept);
    const critical = tasks.filter(t => t.priority === 'critical').length;
    const pending  = tasks.filter(t => t.status === 'pending').length;
    const topTask  = [...tasks].sort((a, b) => b.score - a.score)[0];

    const countEl = document.getElementById(`bp-dept-${suffix}-count`);
    const listEl  = document.getElementById(`bp-dept-${suffix}-tasks`);
    if (countEl) countEl.textContent = `${tasks.length} Tasks (${critical} Critical)`;

    const card = document.querySelector(`.bp-dept-card.dept-${suffix}`);
    if (card) {
      card.setAttribute('onclick', `filterBPByDept('${dept}')`);
      card.setAttribute('title', `Click to filter tasks for ${deptLabel[dept]}`);
      card.style.cursor = 'pointer';
    }

    if (!listEl) return;

    listEl.innerHTML = `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;margin-bottom:8px;">
        <div style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;">Top Priority Defect:</div>
        <div style="font-size:11.5px;font-weight:700;color:var(--blue-900);margin:2px 0;">${topTask ? topTask.problem : 'Normal maintenance'}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:10.5px;color:var(--gray-600);margin-top:4px;">
          <span>📍 ${topTask ? topTask.trackId + ' · ' + topTask.kmPosition : 'All sections'}</span>
          <span class="bp-score-badge ${topTask ? scoreTier(topTask.score) : 'low'}-tier" style="font-size:10px;padding:1px 6px;">Priority: ${topTask ? topTask.score : 0}</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--gray-500);padding:0 2px;">
        <span>Pending: <strong>${pending}</strong></span>
        <span>Critical: <strong style="color:#dc2626;">${critical}</strong></span>
        <span style="color:var(--blue-600);font-weight:600;">Filter Dept →</span>
      </div>
    `;
  });
}

function filterBPByDept(dept) {
  const sel = document.getElementById('bp-dept-filter');
  if (sel) sel.value = dept;
  renderBPQueue();
  filterBPRecords();
  showBPToast(`Filtered Priority Queue & Plan to ${deptLabel[dept] || dept}.`);
}

// ─────────────────────────────────────────────────────────────
// AI MAINTENANCE PRIORITY QUEUE
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
    const isCritical = t.priority === 'critical';
    const overdueTxt = t.overdueDays > 0 ? `<span class="bp-overdue-tag">+${t.overdueDays}d overdue</span>` : '';
    const assignedTxt = t.assignedBlock
      ? `<span class="bp-assigned-tag">✓ ${t.assignedBlock}</span>`
      : `<span class="bp-unassigned-tag">Unscheduled</span>`;

    return `
    <div class="bp-queue-item ${tier}-tier-item clickable-task" id="bpqi-${t.id}" onclick="openBpAssessmentModal('${t.id}')" title="Click to view Priority Assessment">
      <div class="bpqi-rank">#${idx + 1}</div>
      <div class="bpqi-score-wrap">
        <div class="bpqi-score ${tier}-tier">${t.score}</div>
        <div class="bpqi-score-label">${t.priority.toUpperCase()}</div>
      </div>
      <div class="bpqi-body">
        <div class="bpqi-header">
          <span class="bpqi-id">${t.id}</span>
          <span class="bpqi-dept ${t.dept.toLowerCase()}-dept">${deptLabel[t.dept]}</span>
          <span class="bp-section-chip" style="font-size:10.5px;font-weight:700;">${t.trackId || t.section} · ${t.kmPosition || 'KM 0.0'}</span>
          ${overdueTxt}
        </div>
        <div class="bpqi-desc" style="font-weight:700;color:var(--blue-950);">${t.problem || t.description}</div>
        <div style="font-size:11px;color:var(--gray-600);margin-bottom:4px;">
          <span style="color:var(--blue-700);font-weight:600;">📡 ${t.vsnSource || 'TMS Defect Registry'}</span> · 
          <span style="color:${isCritical ? '#dc2626' : '#d97706'};font-weight:700;">${t.riskLevel || 'ELEVATED'}</span>
        </div>
        <div class="bpqi-meta">
          <span class="bp-section-chip" style="background:#f1f5f9;">🛠️ ${t.recommendedAction ? t.recommendedAction.slice(0, 45) + '…' : 'Inspection'}</span>
          <span class="bp-dur-chip">⏱ ${t.durationHr}h</span>
          ${assignedTxt}
          <span style="font-size:10px;color:var(--blue-600);font-weight:600;margin-left:auto;">Why this priority? →</span>
        </div>
      </div>
      <div class="bpqi-score-bar">
        <div class="bpqi-bar-fill ${tier}-tier" style="height:${t.score}%"></div>
      </div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// AI MAINTENANCE ASSESSMENT MODAL (EXPLAINABILITY)
// ─────────────────────────────────────────────────────────────
function openBpAssessmentModal(taskId) {
  const t = BP_DATA.tasks.find(x => x.id === taskId);
  if (!t) return;
  const overlay = document.getElementById('bp-assessment-modal-overlay');
  const body = document.getElementById('bp-assessment-modal-body');
  if (!overlay || !body) return;

  const tier = scoreTier(t.score);
  const deptName = deptLabel[t.dept] || t.dept;
  const isCritical = t.priority === 'critical';
  const factors = t.contributingFactors || [
    'Critical track condition reported',
    `High anomaly score (${t.score}%) evaluated`,
    'Train operational impact on trunk corridor',
    `Maintenance overdue (+${t.overdueDays} days)`
  ];

  body.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;gap:12px;">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span class="bp-dept-chip ${t.dept.toLowerCase()}-dept">${deptName}</span>
          <span class="bp-section-chip" style="font-weight:700;">${t.section}</span>
          <span style="font-size:11px;color:var(--gray-500);font-weight:600;">📍 ${t.trackId || 'TRK'} · ${t.kmPosition || 'KM 0.0'}</span>
        </div>
        <h3 style="font-size:15px;font-weight:800;color:var(--blue-950);margin:0;line-height:1.3;">
          ${t.description}
        </h3>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div class="bp-score-badge ${tier}-tier" style="font-size:16px;padding:4px 10px;font-weight:800;display:inline-block;">
          ${t.priority.toUpperCase()} — ${t.score}
        </div>
        <div style="font-size:10px;color:var(--gray-400);margin-top:2px;">AI PRIORITY SCORE</div>
      </div>
    </div>

    <!-- Telemetry / VSN Detection Box -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:700;color:var(--blue-800);display:flex;align-items:center;gap:5px;">
          📡 Sensor Source: ${t.vsnSource || 'TMS Defect Registry'}
        </span>
        <span style="font-size:10.5px;font-weight:700;color:${isCritical ? '#dc2626' : '#d97706'};background:${isCritical ? '#fee2e2' : '#fef3c7'};padding:2px 8px;border-radius:10px;">
          ${t.riskLevel || 'ELEVATED RISK'}
        </span>
      </div>
      <div style="font-size:11.5px;color:var(--gray-700);margin-bottom:4px;">
        <strong>Root Cause / Problem:</strong> ${t.problem || t.description}
      </div>
      <div style="font-size:11px;color:var(--gray-600);">
        <strong>Action Needed:</strong> ${t.recommendedAction || 'Schedule maintenance block'}
      </div>
    </div>

    <!-- Contributing Factors Checklist -->
    <div style="margin-bottom:14px;">
      <div style="font-size:11.5px;font-weight:700;color:var(--gray-800);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.4px;">
        Contributing Factors Evaluated by AI:
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${factors.map(f => `
          <div style="display:flex;align-items:flex-start;gap:8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 10px;font-size:11.5px;color:#166534;">
            <span style="font-weight:900;color:#15803d;font-size:13px;line-height:1;">✓</span>
            <span>${f}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Recommendation Box -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--blue-800);margin-bottom:4px;text-transform:uppercase;">
        💡 AI Recommendation:
      </div>
      <div style="font-size:12px;color:var(--blue-950);font-weight:500;line-height:1.4;">
        "${t.recommendation || 'Integrate with compatible multi-department maintenance tasks in the upcoming low-traffic corridor window.'}"
      </div>
    </div>

    <!-- Modal Actions -->
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;border-top:1px solid #e2e8f0;padding-top:12px;">
      <button class="bp-btn" onclick="closeBpAssessmentModal()" style="background:#f1f5f9;color:var(--gray-700);border:1px solid #cbd5e1;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">
        ✕ Close
      </button>
      <button class="bp-btn" onclick="viewVsnOnMap('${t.trackId || 'TRK009'}')" style="background:#ffffff;color:var(--blue-700);border:1px solid var(--blue-300);padding:7px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">
        🗺️ View on Railway Map
      </button>
      <button class="bp-btn" onclick="integrateTaskIntoBlock('${t.id}')" style="background:var(--blue-700);color:#ffffff;border:none;padding:7px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        ⚡ Integrate into Block Plan
      </button>
    </div>
  `;

  overlay.classList.remove('hidden');
}

function closeBpAssessmentModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn')) return;
  document.getElementById('bp-assessment-modal-overlay')?.classList.add('hidden');
}

function viewVsnOnMap(trackId) {
  closeBpAssessmentModal();
  if (typeof switchTab === 'function') switchTab('map');
  setTimeout(() => {
    if (typeof showSensorTelemetryPopup === 'function') {
      const vsn = { vsn_id:'VSN-024', track_id:'TRK009', km_position:18.5, train_speed:0, track_occupancy:1, track_condition:'CRITICAL', vibration_level:'HIGH', vibration_val:4.8, signal_status:'RED', anomaly_score:91, blockage_probability:94, status:'BLOCKED' };
      const trk = { id: trackId || 'TRK009', from:'BRC', to:'ST', distance:130 };
      showSensorTelemetryPopup(vsn, trk, 450, 300);
    }
  }, 300);
}

function integrateTaskIntoBlock(taskId) {
  closeBpAssessmentModal();
  const t = BP_DATA.tasks.find(x => x.id === taskId);
  if (t) {
    t.assignedBlock = 'BLK-001';
    t.status = 'scheduled';
  }
  updateBPStats();
  renderBPQueue();
  switchBPView('week');
  drawGantt();
  showBPToast(`Integrated task ${taskId} into Combined Block A (BLK-001)!`);
}

// ─────────────────────────────────────────────────────────────
// WEEKLY BLOCK PLAN TABLE (WITH ACTION BUTTONS)
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
      <th>Actions</th>
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
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400);">No weekly block records match the criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(wp => {
    const deptChips = wp.depts.map(d =>
      `<span class="bp-dept-chip ${d.toLowerCase()}-dept">${deptLabel[d]}</span>`
    ).join('');
    const taskChips = wp.tasks.map(tid => {
      const t = BP_DATA.tasks.find(x => x.id === tid);
      return t ? `<span class="bp-task-chip" onclick="openBpAssessmentModal('${tid}')" style="cursor:pointer;" title="${t.description}">${tid}</span>` : '';
    }).join('');
    const impactClass = { 'None':'impact-none','Low':'impact-low','Medium':'impact-med','High':'impact-high' }[wp.impact] || '';
    const statusClass = { 'active':'status-active-bp','scheduled':'status-sched-bp','planned':'status-planned-bp','approved':'status-active-bp' }[wp.status] || '';

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
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <button class="bp-table-btn" onclick="openBpBlockDetailModal('${wp.id}')" title="View details of this block window" style="padding:4px 8px;font-size:11px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;cursor:pointer;font-weight:600;color:var(--blue-900);">
            View Details
          </button>
          ${wp.status !== 'approved'
            ? `<button class="bp-table-btn accept" onclick="acceptBlockPlan('${wp.id}')" title="Accept and Lock Block Plan" style="padding:4px 8px;font-size:11px;background:#059669;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700;">
                 Accept Plan
               </button>`
            : `<span style="font-size:10px;font-weight:700;color:#059669;padding:3px 6px;background:#dcfce7;border-radius:4px;">✓ Accepted</span>`
          }
        </div>
      </td>
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
  'ANALYZING NETWORK & DEFECT REGISTRIES…',
  '✓ Checking maintenance tasks across TMS, TDMS & SMMS',
  '✓ Checking department overlap (NDLS–CNB & CNB–ALD)',
  '✓ Checking VSN anomalies (Ingesting VSN-024 telemetry at KM 18.5)',
  '✓ Checking track availability & speed restriction impacts',
  '✓ Checking affected trains & passenger buffer slots',
  '✓ Combining compatible tasks into single corridor possessions',
  'OPTIMIZED BLOCK PLAN GENERATED ✓',
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

  let iv;
  iv = setInterval(() => {
    step++;
    pct = Math.round((step / OPTIMIZER_STEPS.length) * 100);
    if (stepsEl) stepsEl.textContent = OPTIMIZER_STEPS[Math.min(step - 1, OPTIMIZER_STEPS.length - 1)];
    if (fillEl)  fillEl.style.width = pct + '%';

    if (step >= OPTIMIZER_STEPS.length) {
      if (iv) clearInterval(iv);
      setTimeout(() => {
        overlay.classList.add('hidden');
        btn.disabled = false;
        applyOptimizationResults();
      }, 700);
    }
  }, 340);
}

function applyOptimizationResults() {
  BP_DATA.optimizerRan = true;

  // Assign previously unassigned critical tasks
  const unassigned = BP_DATA.tasks.filter(t => !t.assignedBlock && t.priority === 'critical');
  unassigned.forEach((t, i) => {
    t.assignedBlock = `BLK-AI-${String(i+1).padStart(2,'0')}`;
    t.status = 'scheduled';
  });

  // Combine tasks on NDLS-CNB corridor into Block A
  const combined = BP_DATA.tasks.filter(t => t.section === 'NDLS–CNB');
  combined.forEach(t => {
    if (!t.assignedBlock || t.assignedBlock === 'BLK-AI-01') {
      t.assignedBlock = 'BLK-001';
      t.status = 'scheduled';
    }
  });

  // Show result banner
  const banner  = document.getElementById('bp-optimizer-banner');
  const titleEl = document.getElementById('bpob-title');
  const subEl   = document.getElementById('bpob-sub');

  if (titleEl) titleEl.textContent = 'OPTIMIZED BLOCK PLAN GENERATED — ' + new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  if (subEl)   subEl.textContent   = '5 tasks combined · 3 departments coordinated · 2 blocks optimized · Infrastructure availability boosted to 89%';
  if (banner)  banner.classList.remove('hidden');

  // Re-render all components with updated metrics
  updateBPStats();
  renderBPQueue();
  renderDeptCards();
  filterBPRecords();
  drawGantt();

  showBPToast('AI Optimizer: 5 tasks combined across Engineering + TRD + S&T.');
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
