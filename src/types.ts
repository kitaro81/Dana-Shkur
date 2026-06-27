export type UserRole = 'admin' | 'lead_designer' | 'engineer' | 'viewer';

export type TaskType = 'architecture' | 'structure' | 'electric' | 'mechanical' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatarUrl?: string;
  joinedAt: string;
  discipline?: TaskType;
  deactivated?: boolean;
  phoneNumber?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string; // e.g. "PRJ-ARC-01"
  description: string;
  location?: string;
  status: 'planning' | 'active' | 'review' | 'completed';
  createdAt: string;
  archived?: boolean;
  disciplines?: TaskType[];
  assignedUserIds?: string[];
}

export interface WorkflowStage {
  id: string;
  name: string;
  color: string; // e.g., "bg-blue-500", "border-blue-500"
  order: number;
}

export interface Label {
  id: string;
  name: string;
  color: string; // e.g. "#EF4444"
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: TaskType;
  stageId: string; // references WorkflowStage.id
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string; // references User.id
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  labelIds?: string[];
  dependencies?: string[];
  quickNote?: string;
  assignedUserIds?: string[];
  disciplines?: TaskType[];
  storyPoints?: number;
  tShirtSize?: 'S' | 'M' | 'L' | 'XL';
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string; // "all" or specific User.id
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert';
  read: boolean;
  createdAt: string;
}

export interface TeamActivity {
  id: string;
  type: 'task_completion' | 'project_update' | 'system_alert' | 'comment_added' | 'task_created' | 'task_moved' | 'message_sent';
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  createdAt: string;
}

export interface ProjectReport {
  projectId: string;
  projectName: string;
  totalTasks: number;
  tasksByStage: Record<string, number>;
  tasksByType: Record<TaskType, number>;
  overdueTasksCount: number;
}

export interface FlowPermissions {
  visibility: Record<UserRole, TaskType[]>;
  commenting: Record<UserRole, TaskType[]>;
  exporting: Record<UserRole, TaskType[]>;
}

export interface VisualSettings {
  showCalendarTab: boolean;
  showReportsTab: boolean;
  showArchiveTab: boolean;
  showTaskPriorityBadge: boolean;
  showOverdueHighlight: boolean;
  showTaskTypeIcon: boolean;
  enlargeIconSize?: boolean;
  welcomeModalEnabled?: boolean;
  welcomeModalTitle?: string;
  welcomeModalContent?: string;
  welcomeModalButtonText?: string;
  activeMethodology?: string;
  workspaceName?: string;
  primaryColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';
  cardCompactness?: 'compact' | 'comfortable' | 'spacious';
  agileSprintDurationWeeks?: number;
  agileSprintGoal?: string;
  agileEstimationMetric?: 'story_points' | 'hours' | 't_shirt';
  agileTargetCapacity?: number;
  agileRequireStoryPoints?: boolean;
  agileEnforceSprintAssignment?: boolean;
  masterPassword?: string;
  autoArchiveApprovedTasks?: boolean;
  compactMode?: boolean;
  footerText?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface ReportTemplateSettings {
  reportTitle: string;
  companyName: string;
  accentColor: string;
  includeStatCards: boolean;
  includeDisciplineBreakdown: boolean;
  includeTaskDescription: boolean;
  includeComments: boolean;
  footerText: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  labelIds: string[];
}

export interface TeamConversation {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}

