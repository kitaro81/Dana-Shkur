import { User, Project, WorkflowStage, Task, Comment, Notification, Label, TaskTemplate } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Dana Shkur (Admin)',
    email: 'dana.hshkur@gmail.com',
    role: 'admin',
    joinedAt: '2026-01-15',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    discipline: 'other'
  },
  {
    id: 'user-sarah',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@designstudio.corp',
    role: 'lead_designer',
    joinedAt: '2026-02-01',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    discipline: 'architecture'
  },
  {
    id: 'user-marcus',
    name: 'Marcus Vance',
    email: 'marcus.vance@structure.corp',
    role: 'engineer',
    joinedAt: '2026-02-15',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    discipline: 'structure'
  },
  {
    id: 'user-elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@powersystems.net',
    role: 'engineer',
    joinedAt: '2026-03-01',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    discipline: 'electric'
  },
  {
    id: 'user-david',
    name: 'David Kim',
    email: 'david.kim@thermal-mep.com',
    role: 'engineer',
    joinedAt: '2026-03-10',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    discipline: 'mechanical'
  },
  {
    id: 'user-clara',
    name: 'Clara Oswald',
    email: 'clara.oswald@client.com',
    role: 'viewer',
    joinedAt: '2026-03-20',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120',
    discipline: 'other'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-horizon',
    name: 'Grand Horizon Tech Park',
    code: 'PRJ-HZN-2026',
    description: 'A 5-story sustainable commercial hub focusing on carbon-neutral architecture, smart electrical distribution, and LEED Platinum certification.',
    location: 'Seattle, WA',
    status: 'active',
    createdAt: '2026-01-20'
  },
  {
    id: 'proj-oakwood',
    name: 'Oakwood Residential Complex',
    code: 'PRJ-OAK-1025',
    description: 'Multi-family wood-frame structure with high-efficiency centralized thermodynamic ventilation and solar-grid electrical infrastructure.',
    location: 'Austin, TX',
    status: 'active',
    createdAt: '2026-02-10'
  },
  {
    id: 'proj-ecopavilion',
    name: 'Riverfront Eco-Pavilion',
    code: 'PRJ-PAV-08',
    description: 'Exposed structural steel and glue-laminated timber pavilion serving as a community space with natural passive geothermal heating.',
    location: 'Portland, OR',
    status: 'planning',
    createdAt: '2026-04-05'
  }
];

export const INITIAL_WORKFLOW_STAGES: WorkflowStage[] = [
  { id: 'todo', name: 'Design Backlog', color: '#64748B', order: 0 },
  { id: 'in_progress', name: 'Active Design', color: '#F59E0B', order: 1 },
  { id: 'review', name: 'Peer & Q/C Review', color: '#6366F1', order: 2 },
  { id: 'approved', name: 'Issued for Construction', color: '#10B981', order: 3 }
];

export const INITIAL_LABELS: Label[] = [
  { id: 'label-urgent', name: 'Urgent', color: '#EF4444' },
  { id: 'label-qc', name: 'QC Needed', color: '#F59E0B' },
  { id: 'label-review', name: 'Client Review', color: '#6366F1' },
  { id: 'label-on-hold', name: 'On Hold', color: '#64748B' },
  { id: 'label-site', name: 'Site Visit', color: '#10B981' }
];

export const INITIAL_TASKS: Task[] = [
  // Project: Horizon
  {
    id: 'task-horizon-1',
    projectId: 'proj-horizon',
    title: 'Atrium Glass Dome Structural Framing Analysis',
    description: 'Perform finite element analysis (FEA) on the steel space-frame dome to withstand local heavy sleet and high structural wind forces. Prepare detail drawing sheets.',
    type: 'structure',
    stageId: 'in_progress',
    priority: 'critical',
    assignedTo: 'user-marcus',
    estimatedHours: 42,
    loggedHours: 18,
    dueDate: '2026-07-10',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-20',
    labelIds: ['label-urgent', 'label-qc'],
    quickNote: 'Waiting on ice loading factor parameters from municipal authority.'
  },
  {
    id: 'task-horizon-2',
    projectId: 'proj-horizon',
    title: 'HVAC Chilled Beam Distribution Layout',
    description: 'Coordinate active chilled beams piping routing across level 2 to level 5, avoiding conflicts with cable trays and gravity sewage lines in the plenum.',
    type: 'mechanical',
    stageId: 'in_progress',
    priority: 'high',
    assignedTo: 'user-david',
    estimatedHours: 35,
    loggedHours: 12,
    dueDate: '2026-07-15',
    createdAt: '2026-06-05',
    updatedAt: '2026-06-22',
    labelIds: ['label-qc'],
    dependencies: ['task-horizon-1'],
    quickNote: 'Dependent on Glass Dome structural geometry being frozen.'
  },
  {
    id: 'task-horizon-3',
    projectId: 'proj-horizon',
    title: 'Dual-feed 12.47kV Substation Wiring Schematics',
    description: 'Detail primary protection relay schematics, automatic transfer switch control loops, and generator battery backup battery rack charging setup.',
    type: 'electric',
    stageId: 'review',
    priority: 'high',
    assignedTo: 'user-elena',
    estimatedHours: 50,
    loggedHours: 46,
    dueDate: '2026-06-28',
    createdAt: '2026-05-18',
    updatedAt: '2026-06-21',
    labelIds: ['label-review']
  },
  {
    id: 'task-horizon-4',
    projectId: 'proj-horizon',
    title: 'Facade Glazing Material Specs & Solar Gain Calc',
    description: 'Finalize external glazing specifications. Calculate thermal resistance coefficients (U-value) and solar heat gain coefficient (SHGC) for the south face.',
    type: 'architecture',
    stageId: 'approved',
    priority: 'medium',
    assignedTo: 'user-sarah',
    estimatedHours: 24,
    loggedHours: 25,
    dueDate: '2026-06-15',
    createdAt: '2026-05-10',
    updatedAt: '2026-06-14'
  },
  {
    id: 'task-horizon-5',
    projectId: 'proj-horizon',
    title: 'Acoustic Wall Treatment for Mechanical Engine Room',
    description: 'Incorporate acoustic dampening insulation layout on inner structural concrete block walls to reduce surrounding office noise below 45 dBA.',
    type: 'mechanical',
    stageId: 'todo',
    priority: 'medium',
    assignedTo: 'user-david',
    estimatedHours: 16,
    loggedHours: 0,
    dueDate: '2026-08-01',
    createdAt: '2026-06-15',
    updatedAt: '2026-06-15'
  },

  // Project: Oakwood
  {
    id: 'task-oakwood-1',
    projectId: 'proj-oakwood',
    title: 'EWP Glu-Lam Beams Connection Details',
    description: 'Draft steel connector plates, bolt patterns, and epoxy-anchoring details for engineered wood headers sitting on load-bearing structural columns.',
    type: 'structure',
    stageId: 'review',
    priority: 'high',
    assignedTo: 'user-marcus',
    estimatedHours: 20,
    loggedHours: 19,
    dueDate: '2026-06-25',
    createdAt: '2026-06-02',
    updatedAt: '2026-06-20'
  },
  {
    id: 'task-oakwood-2',
    projectId: 'proj-oakwood',
    title: 'Centralized Solar Inverter Cluster Oneline Diagram',
    description: 'Design direct current (DC) string architecture for 145kW rooftop solar PV array. Outline combined cabinet fused disconnects and output AC filters.',
    type: 'electric',
    stageId: 'in_progress',
    priority: 'medium',
    assignedTo: 'user-elena',
    estimatedHours: 32,
    loggedHours: 15,
    dueDate: '2026-07-08',
    createdAt: '2026-06-10',
    updatedAt: '2026-06-18'
  },
  {
    id: 'task-oakwood-3',
    projectId: 'proj-oakwood',
    title: 'Building Envelope Thermal Bridge Analysis',
    description: 'Review structural wood framing details at balconies and continuous insulation layer interfaces to check with local thermal bridge requirements.',
    type: 'architecture',
    stageId: 'todo',
    priority: 'low',
    assignedTo: 'user-sarah',
    estimatedHours: 18,
    loggedHours: 0,
    dueDate: '2026-07-30',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18'
  },

  // Project: EcoPavilion
  {
    id: 'task-eco-1',
    projectId: 'proj-ecopavilion',
    title: 'Geothermal Loop Circuit Wellhead Placement Plan',
    description: 'Map physical placements of 8 concentric geothermal boreholes. Draft site trenching connections avoiding structural root systems of heritage oaks.',
    type: 'mechanical',
    stageId: 'todo',
    priority: 'high',
    assignedTo: 'user-david',
    estimatedHours: 28,
    loggedHours: 0,
    dueDate: '2026-09-10',
    createdAt: '2026-06-15',
    updatedAt: '2026-06-15'
  },
  {
    id: 'task-eco-2',
    projectId: 'proj-ecopavilion',
    title: 'Cantilevered Timber Truss Static Calculation',
    description: 'Verify bending stress and tension profiles under varying snow loads for the double-glulam dynamic cantilevered structural timber trusses.',
    type: 'structure',
    stageId: 'todo',
    priority: 'critical',
    assignedTo: 'user-marcus',
    estimatedHours: 60,
    loggedHours: 0,
    dueDate: '2026-08-15',
    createdAt: '2026-06-19',
    updatedAt: '2026-06-19'
  }
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    taskId: 'task-horizon-1',
    userId: 'user-sarah',
    userName: 'Sarah Jenkins',
    text: 'Marcus, make sure to cross-check the dome base bearing pads with our level-5 concrete column offsets. We had to relocate them slightly last Thursday.',
    createdAt: '2026-06-18T14:32:00Z'
  },
  {
    id: 'comm-2',
    taskId: 'task-horizon-1',
    userId: 'user-marcus',
    userName: 'Marcus Vance',
    text: 'Good catch, Sarah. I’ve updated the FEA node coordinates to match your latest floor plan. Re-running the static wind-load simulation now.',
    createdAt: '2026-06-20T09:12:00Z'
  },
  {
    id: 'comm-3',
    taskId: 'task-horizon-3',
    userId: 'user-admin',
    userName: 'Dana Shkur (Admin)',
    text: 'Relay plans look complete. Elena, did we secure utility sign-off of the automatic transfer loop delay settings on high-voltage incoming feeds?',
    createdAt: '2026-06-21T11:45:00Z'
  },
  {
    id: 'comm-4',
    taskId: 'task-horizon-3',
    userId: 'user-elena',
    userName: 'Elena Rostova',
    text: 'Yes Dana, utility engineers approved the 3.5-second power fail protection relay window. Included document sign-off sheet in the revision packet.',
    createdAt: '2026-06-21T16:20:00Z'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'all',
    title: 'New Project Provisioned',
    message: 'Dana Shkur created project "Riverfront Eco-Pavilion" with code PRJ-PAV-08.',
    type: 'success',
    read: false,
    createdAt: '2026-06-22T08:00:00-07:00'
  },
  {
    id: 'notif-2',
    userId: 'user-sarah',
    title: 'Task Peer Review Required',
    message: 'Marcus Vance moved Atrium Glass Dome framing plans into the Peer Review stage.',
    type: 'info',
    read: false,
    createdAt: '2026-06-21T17:30:00-07:00'
  },
  {
    id: 'notif-3',
    userId: 'user-marcus',
    title: 'Urgent Task Assigned',
    message: 'Dana Shkur assigned cantilever timber truss calculations (Critical) to you.',
    type: 'alert',
    read: true,
    createdAt: '2026-06-19T10:15:00-07:00'
  }
];

export const INITIAL_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Schematic Architectural Design',
    description: 'Develop initial architectural layout, floor plans, zoning reviews, and spatial relations.',
    defaultDurationHours: 40,
    type: 'architecture',
    priority: 'medium',
    labelIds: ['label-review']
  },
  {
    id: 'tpl-2',
    name: 'Structural Load Calculations',
    description: 'Perform structural loading analysis (dead, live, wind, and seismic loads) and prepare calculations log.',
    defaultDurationHours: 24,
    type: 'structure',
    priority: 'high',
    labelIds: ['label-qc']
  },
  {
    id: 'tpl-3',
    name: 'Electrical Single Line Diagram',
    description: 'Generate primary single line diagrams, utility connection details, load schedules, and main switchgear layout.',
    defaultDurationHours: 16,
    type: 'electric',
    priority: 'medium',
    labelIds: []
  },
  {
    id: 'tpl-4',
    name: 'HVAC Ductwork & Ventilation Sizing',
    description: 'Calculate space heating/cooling loads, and design optimal duct sizing routing and air balance schemes.',
    defaultDurationHours: 32,
    type: 'mechanical',
    priority: 'high',
    labelIds: ['label-qc']
  }
];

