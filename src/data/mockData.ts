import { User, Project, WorkflowStage, Task, Comment, Notification, Label, TeamActivity } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Dana Shkur (Admin)',
    email: 'dana.hshkur@gmail.com',
    password: 'pms26@212981',
    role: 'admin',
    joinedAt: '2026-01-15',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    discipline: 'other'
  },
  {
    id: 'user-sarah',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@designstudio.corp',
    password: 'admin',
    role: 'lead_designer',
    joinedAt: '2026-02-01',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    discipline: 'architecture'
  },
  {
    id: 'user-marcus',
    name: 'Marcus Vance',
    email: 'marcus.vance@structure.corp',
    password: 'admin',
    role: 'engineer',
    joinedAt: '2026-02-15',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    discipline: 'structure'
  },
  {
    id: 'user-elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@powersystems.net',
    password: 'admin',
    role: 'engineer',
    joinedAt: '2026-03-01',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    discipline: 'electric'
  },
  {
    id: 'user-david',
    name: 'David Kim',
    email: 'david.kim@thermal-mep.com',
    password: 'admin',
    role: 'engineer',
    joinedAt: '2026-03-10',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    discipline: 'mechanical'
  },
  {
    id: 'user-clara',
    name: 'Clara Oswald',
    email: 'clara.oswald@client.com',
    password: 'admin',
    role: 'viewer',
    joinedAt: '2026-03-20',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120',
    discipline: 'other'
  }
];

export const INITIAL_PROJECTS: Project[] = [];

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

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_COMMENTS: Comment[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const INITIAL_ACTIVITIES: TeamActivity[] = [
  {
    id: 'act-1',
    type: 'task_completion',
    userId: 'user-sarah',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    title: 'Completed architectural layout',
    description: 'Final design for the main lobby has been approved.',
    projectId: 'p1',
    projectName: 'Cyber-Vault Alpha',
    taskId: 't1',
    taskTitle: 'Main Lobby Design',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'act-2',
    type: 'project_update',
    userId: 'user-admin',
    userName: 'Dana Shkur (Admin)',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    title: 'Launched Nexus Sky-Station',
    description: 'The project is now in active design phase.',
    projectId: 'p2',
    projectName: 'Nexus Sky-Station',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  },
  {
    id: 'act-3',
    type: 'system_alert',
    userId: 'system',
    userName: 'System',
    title: 'Backup Completed',
    description: 'Daily database backup was successful.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  },
  {
    id: 'act-4',
    type: 'comment_added',
    userId: 'user-marcus',
    userName: 'Marcus Vance',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    title: 'Commented on structural load',
    description: 'Checking the reinforcement details for the central column.',
    projectId: 'p1',
    projectName: 'Cyber-Vault Alpha',
    taskId: 't2',
    taskTitle: 'Foundation Calculations',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  }
];


