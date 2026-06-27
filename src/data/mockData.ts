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
    discipline: 'other',
    phoneNumber: '+1 (555) 019-2834'
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

export const INITIAL_ACTIVITIES: TeamActivity[] = [];


