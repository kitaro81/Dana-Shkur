import { useState, useEffect } from 'react';
import { Project, Task, User, WorkflowStage, Comment, Notification, TeamActivity, Message, UserRole, TaskType, Label, FlowPermissions, VisualSettings, ReportTemplateSettings, TeamConversation } from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_USERS, 
  INITIAL_WORKFLOW_STAGES, 
  INITIAL_TASKS, 
  INITIAL_COMMENTS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_LABELS,
  INITIAL_ACTIVITIES
} from './data/mockData';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { ReportsPanel } from './components/ReportsPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { CalendarView } from './components/CalendarView';
import { ArchivePanel } from './components/ArchivePanel';
import { TeamLoginPortal } from './components/TeamLoginPortal';
import { CommandPalette } from './components/CommandPalette';
import { ResourceLoadPanel } from './components/ResourceLoadPanel';
import { MyOverviewPanel } from './components/MyOverviewPanel';
import { MessagingPortal } from './components/MessagingPortal';
import { TeamActivityFeed } from './components/TeamActivityFeed';
import { ExportPanel } from './components/ExportPanel';
import { printReportHTML } from './utils/reports';
import { 
  LayoutDashboard, 
  BarChart3, 
  MessageSquare,
  Settings, 
  Users, 
  Bell, 
  Building2, 
  Menu,
  SwitchCamera,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Megaphone,
  ChevronDown,
  LogOut,
  FileText,
  Check,
  LogIn,
  Shield,
  Clock,
  Download,
  ArrowRight,
  Search,
  Command,
  Eye,
  EyeOff,
  Calendar,
  Archive,
  Key,
  AlertCircle,
  Undo,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const getBrandClasses = () => {
    const color = visualSettings.primaryColor || 'indigo';
    const mapping = {
      indigo: {
        text: 'text-indigo-600',
        textSoft: 'text-indigo-700',
        bg: 'bg-indigo-600',
        bgHover: 'hover:bg-indigo-700',
        bgSoft: 'bg-indigo-50',
        bgSoftHover: 'hover:bg-indigo-100/80',
        borderSoft: 'border-indigo-100',
        ring: 'focus:ring-indigo-100',
        borderFocus: 'focus:border-indigo-500',
        accentText: 'text-indigo-600'
      },
      emerald: {
        text: 'text-emerald-600',
        textSoft: 'text-emerald-700',
        bg: 'bg-emerald-600',
        bgHover: 'hover:bg-emerald-700',
        bgSoft: 'bg-emerald-50',
        bgSoftHover: 'hover:bg-emerald-100/80',
        borderSoft: 'border-emerald-100',
        ring: 'focus:ring-emerald-100',
        borderFocus: 'focus:border-emerald-500',
        accentText: 'text-emerald-600'
      },
      amber: {
        text: 'text-amber-600',
        textSoft: 'text-amber-700',
        bg: 'bg-amber-600',
        bgHover: 'hover:bg-amber-700',
        bgSoft: 'bg-amber-50',
        bgSoftHover: 'hover:bg-amber-100/80',
        borderSoft: 'border-amber-100',
        ring: 'focus:ring-amber-100',
        borderFocus: 'focus:border-amber-500',
        accentText: 'text-amber-600'
      },
      rose: {
        text: 'text-rose-600',
        textSoft: 'text-rose-700',
        bg: 'bg-rose-600',
        bgHover: 'hover:bg-rose-700',
        bgSoft: 'bg-rose-50',
        bgSoftHover: 'hover:bg-rose-100/80',
        borderSoft: 'border-rose-100',
        ring: 'focus:ring-rose-100',
        borderFocus: 'focus:border-rose-500',
        accentText: 'text-rose-600'
      },
      violet: {
        text: 'text-violet-600',
        textSoft: 'text-violet-700',
        bg: 'bg-violet-600',
        bgHover: 'hover:bg-violet-700',
        bgSoft: 'bg-violet-50',
        bgSoftHover: 'hover:bg-violet-100/80',
        borderSoft: 'border-violet-100',
        ring: 'focus:ring-violet-100',
        borderFocus: 'focus:border-violet-500',
        accentText: 'text-violet-600'
      },
      cyan: {
        text: 'text-cyan-600',
        textSoft: 'text-cyan-700',
        bg: 'bg-cyan-600',
        bgHover: 'hover:bg-cyan-700',
        bgSoft: 'bg-cyan-50',
        bgSoftHover: 'hover:bg-cyan-100/80',
        borderSoft: 'border-cyan-100',
        ring: 'focus:ring-cyan-100',
        borderFocus: 'focus:border-cyan-500',
        accentText: 'text-cyan-600'
      },
    };
    return mapping[color] || mapping.indigo;
  };

  // --- Active Session User ---
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('nexus_current_user_id');
    let user = INITIAL_USERS[0];
    if (saved) {
      const match = INITIAL_USERS.find(u => u.id === saved);
      if (match) user = match;
    }
    if (user.id === 'user-admin') {
      return { ...user, password: 'pms26@212981' };
    }
    return user;
  });

  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(() => {
    return localStorage.getItem('nexus_logged_out') === 'true';
  });

  const [showProfilePopover, setShowProfilePopover] = useState(false);

  // brand will be initialized after visualSettings state is defined

  // --- Persistent Storage State ---
  const [projects, setProjects] = useState<Project[]>(() => {
    const local = localStorage.getItem('kanban_projects');
    return local ? JSON.parse(local) : INITIAL_PROJECTS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const local = localStorage.getItem('kanban_users');
    const loadedUsers: User[] = local ? JSON.parse(local) : INITIAL_USERS;
    return loadedUsers.map(u => {
      if (u.id === 'user-admin') {
        return { ...u, password: 'pms26@212981' };
      }
      return u;
    });
  });

  const [stages, setStages] = useState<WorkflowStage[]>(() => {
    const local = localStorage.getItem('kanban_stages');
    return local ? JSON.parse(local) : INITIAL_WORKFLOW_STAGES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const local = localStorage.getItem('kanban_tasks');
    return local ? JSON.parse(local) : INITIAL_TASKS;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const local = localStorage.getItem('kanban_comments');
    return local ? JSON.parse(local) : INITIAL_COMMENTS;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const local = localStorage.getItem('kanban_notifications');
    return local ? JSON.parse(local) : INITIAL_NOTIFICATIONS;
  });

  const [activities, setActivities] = useState<TeamActivity[]>(() => {
    const local = localStorage.getItem('kanban_activities');
    return local ? JSON.parse(local) : INITIAL_ACTIVITIES;
  });

  const [labels, setLabels] = useState<Label[]>(() => {
    const local = localStorage.getItem('kanban_labels');
    return local ? JSON.parse(local) : INITIAL_LABELS;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const local = localStorage.getItem('kanban_messages');
    return local ? JSON.parse(local) : [];
  });

  const [teamConversations, setTeamConversations] = useState<TeamConversation[]>(() => {
    const local = localStorage.getItem('kanban_channels');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'channel-general',
        name: 'General Chat',
        description: 'A general channel for company-wide announcements and team conversations.',
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ];
  });

  const handleAddTeamConversation = (name: string, description?: string) => {
    const newConv: TeamConversation = {
      id: `channel-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };
    setTeamConversations(prev => [...prev, newConv]);
    
    addActivity({
      type: 'project_update',
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      title: `Created team conversation #${name}`,
      description: description,
    });
  };

  const handleSendMessage = (text: string, receiverId: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId,
      text,
      createdAt: new Date().toISOString(),
      read: false
    };
    setMessages(prev => [...prev, newMessage]);

    const channel = teamConversations.find(c => c.id === receiverId);
    if (channel) {
      addActivity({
        type: 'message_sent',
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        title: `Sent message in #${channel.name}`,
        description: text,
      });
    } else {
      const receiver = users.find(u => u.id === receiverId);
      addActivity({
        type: 'message_sent',
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        title: `Sent message to ${receiver?.name || 'User'}`,
        description: text,
      });
    }
  };

  const handleMarkMessagesRead = (senderId: string) => {
    setMessages(prev => {
      const hasUnread = prev.some(m => m.senderId === senderId && m.receiverId === currentUser.id && !m.read);
      if (!hasUnread) return prev;
      
      return prev.map(m => 
        (m.senderId === senderId && m.receiverId === currentUser.id && !m.read) 
          ? { ...m, read: true } 
          : m
      );
    });
  };

  const handleMessageUser = (userId: string) => {
    setSelectedMessageUserId(userId);
    setActiveTab('messages');
  };

  const handleSendBulkMessage = (userIds: string[], text: string) => {
    const newMessages: Message[] = userIds.map((userId, index) => ({
      id: `bulk-msg-${Date.now()}-${index}`,
      senderId: currentUser.id,
      receiverId: userId,
      text,
      createdAt: new Date().toISOString(),
      read: false
    }));
    setMessages(prev => [...prev, ...newMessages]);
    
    // Add a notification for the admin confirming the messages were sent
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Bulk Messages Dispatched',
      message: `Your message has been successfully sent to ${userIds.length} members.`,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'success'
    };
    setNotifications(prev => [notification, ...prev]);

    addActivity({
      type: 'message_sent',
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      title: 'Dispatched bulk message',
      description: `Unified announcement sent to ${userIds.length} members: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
    });
  };

  // --- Visual & Report Custom Template Settings ---
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(() => {
    const saved = localStorage.getItem('visualSettings');
    const defaults: VisualSettings = {
      showCalendarTab: true,
      showReportsTab: true,
      showArchiveTab: true,
      showTaskPriorityBadge: true,
      showOverdueHighlight: true,
      showTaskTypeIcon: true,
      enlargeIconSize: false,
      welcomeModalEnabled: true,
      welcomeModalTitle: 'Welcome to AEC Design Kanban Studio!',
      welcomeModalContent: 'We have updated our internal design standard submission procedures. Please ensure all drawings and calculations are logged prior to initiating Peer & Q/C Reviews.',
      welcomeModalButtonText: 'Acknowledge & Proceed',
      activeMethodology: 'waterfall',
      workspaceName: 'Nexus Design Ops',
      primaryColor: 'indigo',
      cardCompactness: 'comfortable',
      agileSprintDurationWeeks: 2,
      agileSprintGoal: 'Complete sprint iterations and delivery artifacts',
      agileEstimationMetric: 'story_points',
      agileTargetCapacity: 40,
      agileRequireStoryPoints: false,
      agileEnforceSprintAssignment: false,
      masterPassword: 'pms26@212981',
      compactMode: false,
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.masterPassword = 'pms26@212981';
        return { ...defaults, ...parsed };
      } catch (e) {
        // ignore
      }
    }
    return defaults;
  });

  const brand = getBrandClasses();

  const [reportTemplateSettings, setReportTemplateSettings] = useState<ReportTemplateSettings>(() => {
    const saved = localStorage.getItem('reportTemplateSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      reportTitle: 'Engineering Design Report',
      companyName: 'AEC DESIGN STUDIO',
      accentColor: '#0f172a',
      includeStatCards: true,
      includeDisciplineBreakdown: true,
      includeTaskDescription: true,
      includeComments: false,
      footerText: 'Design Project Kanban Ledger. Generated automatically.',
    };
  });

  const handleUpdateVisualSettings = (newSettings: VisualSettings) => {
    setVisualSettings(newSettings);
    localStorage.setItem('visualSettings', JSON.stringify(newSettings));
  };

  useEffect(() => {
    // Force light mode
    document.documentElement.classList.remove('dark');
  }, []);

  const handleUpdateReportTemplateSettings = (newSettings: ReportTemplateSettings) => {
    setReportTemplateSettings(newSettings);
    localStorage.setItem('reportTemplateSettings', JSON.stringify(newSettings));
  };

  // --- App View State ---
  const [activeTab, setActiveTab] = useState<'board' | 'reports' | 'calendar' | 'admin' | 'archive' | 'resource_load' | 'my_overview' | 'messages' | 'team_activity' | 'export'>('board');
  const [selectedMessageUserId, setSelectedMessageUserId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [forceOpenAddTask, setForceOpenAddTask] = useState(false);

  const addActivity = (activity: Omit<TeamActivity, 'id' | 'createdAt'>) => {
    const newActivity: TeamActivity = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
  };
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  const handleUpdatePassword = (userId: string, password: string) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, password } : u);
    setUsers(updatedUsers);
    localStorage.setItem('kanban_users', JSON.stringify(updatedUsers));

    // Update currentUser if it's the one changing
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, password }));
    }
  };

  const handleResetUserPassword = (userId: string) => {
    const masterPassword = visualSettings.masterPassword || 'admin';
    handleUpdatePassword(userId, masterPassword);
    
    const targetUser = users.find(u => u.id === userId);
    const userName = targetUser ? targetUser.name : 'User';
    triggerToast(`Password reset for ${userName} to the team master key.`, 'success');
    
    setNotifications([
      {
        id: `pw-reset-${Date.now()}`,
        userId: userId,
        title: 'Security Reset',
        message: 'Your account password has been reset to the team master key by an administrator.',
        type: 'alert',
        read: false,
        createdAt: new Date().toISOString()
      },
      ...notifications
    ]);
  };

  // Auto-switch away from tabs that are turned off by the admin or role-restricted
  useEffect(() => {
    if (activeTab === 'calendar' && !visualSettings.showCalendarTab) {
      setActiveTab('board');
    } else if (activeTab === 'reports' && !visualSettings.showReportsTab) {
      setActiveTab('board');
    } else if (activeTab === 'archive' && !visualSettings.showArchiveTab) {
      setActiveTab('board');
    } else if (activeTab === 'resource_load' && currentUser.role !== 'admin') {
      setActiveTab('board');
    }
  }, [activeTab, visualSettings, currentUser.role]);

  // --- Welcome Modal State & Effect ---
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (visualSettings.welcomeModalEnabled) {
      const dismissed = sessionStorage.getItem('welcome_modal_dismissed');
      if (dismissed !== 'true') {
        setShowWelcomeModal(true);
      }
    } else {
      setShowWelcomeModal(false);
    }
  }, [visualSettings.welcomeModalEnabled]);

  const handleDismissWelcomeModal = () => {
    setShowWelcomeModal(false);
    sessionStorage.setItem('welcome_modal_dismissed', 'true');
  };
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return INITIAL_PROJECTS[0]?.id || '';
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // --- Dynamic Permissions and Archiving Flow ---
  const DEFAULT_FLOW_PERMISSIONS: FlowPermissions = {
    visibility: {
      admin: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
      lead_designer: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
      engineer: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
      viewer: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
    },
    commenting: {
      admin: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
      lead_designer: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
      engineer: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
      viewer: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
    },
    exporting: {
      admin: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
      lead_designer: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
      engineer: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
      viewer: ['architecture', 'structure', 'electric', 'mechanical', 'other'],
    }
  };

  const [flowPermissions, setFlowPermissions] = useState<FlowPermissions>(() => {
    const local = localStorage.getItem('kanban_flow_perms');
    return local ? JSON.parse(local) : DEFAULT_FLOW_PERMISSIONS;
  });

  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);

  // --- UI Interactive Triggers ---
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'info' | 'alert'; onUndo?: () => void }[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Sync storage changes ---
  useEffect(() => {
    localStorage.setItem('kanban_flow_perms', JSON.stringify(flowPermissions));
  }, [flowPermissions]);

  useEffect(() => {
    localStorage.setItem('kanban_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('kanban_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kanban_stages', JSON.stringify(stages));
  }, [stages]);

  useEffect(() => {
    localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('kanban_comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('kanban_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('kanban_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('kanban_labels', JSON.stringify(labels));
  }, [labels]);

  useEffect(() => {
    localStorage.setItem('kanban_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('kanban_channels', JSON.stringify(teamConversations));
  }, [teamConversations]);

  // --- Auto-archive 'Approved' tasks after 30 days ---
  useEffect(() => {
    if (!visualSettings.autoArchiveApprovedTasks) return;

    const now = new Date();
    const newActivities: TeamActivity[] = [];
    let updated = false;

    const updatedTasks = tasks.map(task => {
      if (task.stageId === 'approved' && !task.archived) {
        // Use updatedAt or createdAt as the baseline for how long it has been in the stage
        const lastUpdated = new Date(task.updatedAt || task.createdAt);
        const diffMs = now.getTime() - lastUpdated.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays > 30) {
          updated = true;
          
          newActivities.push({
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'system_alert',
            userId: 'system',
            userName: 'System Automation',
            title: `Auto-archived task: "${task.title}"`,
            description: `Automatically archived because it remained in 'Approved' stage for over 30 days.`,
            projectId: task.projectId,
            taskId: task.id,
            taskTitle: task.title,
            createdAt: now.toISOString()
          });

          return {
            ...task,
            archived: true,
            updatedAt: now.toISOString()
          };
        }
      }
      return task;
    });

    if (updated) {
      setTasks(updatedTasks);
      if (newActivities.length > 0) {
        setActivities(prev => [...newActivities, ...prev]);
      }
      triggerToast(`Cleaned board: automatically archived ${newActivities.length} Approved task(s) older than 30 days.`, 'info');
    }
  }, [visualSettings.autoArchiveApprovedTasks, tasks]);

  // --- Global Keyboard Shortcuts for Power Users ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+K or Cmd+K: Toggle Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // 2. Escape: Close active modals
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          e.preventDefault();
          return;
        }
        if (selectedTaskId) {
          setSelectedTaskId(null);
          e.preventDefault();
          return;
        }
        if (showWelcomeModal) {
          handleDismissWelcomeModal();
          e.preventDefault();
          return;
        }
        if (showNotificationCenter) {
          setShowNotificationCenter(false);
          e.preventDefault();
          return;
        }
        if (showProfilePopover) {
          setShowProfilePopover(false);
          e.preventDefault();
          return;
        }
      }

      // 3. Alt + 1-5 direct navigation tabs (only if not typing in inputs/textareas)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (!isInput && e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('board');
        } else if (e.key === '2' && visualSettings.showReportsTab !== false) {
          e.preventDefault();
          setActiveTab('reports');
        } else if (e.key === '3' && visualSettings.showCalendarTab !== false) {
          e.preventDefault();
          setActiveTab('calendar');
        } else if (e.key === '4' && visualSettings.showArchiveTab !== false) {
          e.preventDefault();
          setActiveTab('archive');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveTab('admin');
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setActiveTab('board');
          setForceOpenAddTask(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCommandPaletteOpen,
    selectedTaskId,
    showWelcomeModal,
    showNotificationCenter,
    showProfilePopover,
    visualSettings
  ]);

  // --- Helper to trigger lightweight temporary slide toasts ---
  const triggerToast = (text: string, type: 'success' | 'info' | 'alert' = 'success', onUndo?: () => void) => {
    const id = Date.now().toString() + '-' + Math.floor(Math.random() * 1000000);
    setToasts(prev => [...prev, { id, text, type, onUndo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, onUndo ? 7500 : 4500);
  };

  // --- Task Operations Actions ---
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTasks(prev => [newTask, ...prev]);

    // Generate broadcast notification
    const proj = projects.find(p => p.id === newTask.projectId);
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      userId: 'all',
      title: 'New Task Created',
      message: `${currentUser.name} added "${newTask.title}" directly to ${proj?.name || 'project'}.`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    };

    const newNotifications = [newNotif];
    if (currentUser.role === 'engineer') {
      const adminNotif: Notification = {
        id: `notif-admin-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        userId: 'user-admin', // Specifically target the Admin (Dana Shkur)
        title: 'Engineer Task Registered',
        message: `Engineer ${currentUser.name} added task "${newTask.title}" in their discipline "${newTask.type.toUpperCase()}" for project "${proj?.name || 'project'}".`,
        type: 'alert',
        read: false,
        createdAt: new Date().toISOString()
      };
      newNotifications.push(adminNotif);
    }
    
    setNotifications(prev => [...newNotifications, ...prev]);
    
    addActivity({
      type: 'task_created',
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      title: `Created new task: ${newTask.title}`,
      description: newTask.description,
      projectId: newTask.projectId,
      projectName: proj?.name,
      taskId: newTask.id,
      taskTitle: newTask.title
    });

    triggerToast('New task listed in backlog stages.');
  };

  const handleUpdateTaskStage = (taskId: string, targetStageId: string, targetTaskId?: string, isAfter?: boolean) => {
    // Capture previous states for potential undo action
    const previousTasksState = [...tasks];
    const previousCommentsState = [...comments];
    const previousActivitiesState = [...activities];
    const previousNotificationsState = [...notifications];

    const undoAction = () => {
      setTasks(previousTasksState);
      setComments(previousCommentsState);
      setActivities(previousActivitiesState);
      setNotifications(previousNotificationsState);
      triggerToast('Task move reverted successfully.', 'info');
    };

    const targetStage = stages.find(s => s.id === targetStageId);
    
    // Auto-comment logic for QA/Approved stages
    const stageNameLower = targetStage?.name.toLowerCase() || '';
    const isQAOrApproved = stageNameLower.includes('qa') || stageNameLower.includes('approved') || stageNameLower.includes('qc') || stageNameLower.includes('review');
    const existingTask = tasks.find(t => t.id === taskId);
    
    if (isQAOrApproved && existingTask && existingTask.stageId !== targetStageId) {
      handleAddComment(taskId, `System: Moved to ${targetStage?.name} by ${currentUser.name} on ${new Date().toLocaleString()}`);
      
      const project = projects.find(p => p.id === existingTask.projectId);
      
      addActivity({
        type: stageNameLower.includes('approved') ? 'task_completion' : 'task_moved',
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        title: stageNameLower.includes('approved') ? `Completed task: ${existingTask.title}` : `Moved task to ${targetStage?.name}`,
        description: existingTask.description,
        projectId: existingTask.projectId,
        projectName: project?.name,
        taskId: existingTask.id,
        taskTitle: existingTask.title
      });
    }

    setTasks(prev => {
      const draggedTask = prev.find(t => t.id === taskId);
      if (!draggedTask) return prev;

      const remainingTasks = prev.filter(t => t.id !== taskId);
      const updatedDraggedTask = {
        ...draggedTask,
        stageId: targetStageId,
        updatedAt: new Date().toISOString()
      };

      if (!targetTaskId) {
        // Appending to the end of the column: find other tasks of the same stage and project
        const stageTasks = remainingTasks.filter(t => t.projectId === draggedTask.projectId && t.stageId === targetStageId);
        if (stageTasks.length > 0) {
          const lastStageTask = stageTasks[stageTasks.length - 1];
          const lastIndex = remainingTasks.findIndex(t => t.id === lastStageTask.id);
          const newTasks = [...remainingTasks];
          newTasks.splice(lastIndex + 1, 0, updatedDraggedTask);
          return newTasks;
        } else {
          return [...remainingTasks, updatedDraggedTask];
        }
      }

      const targetIndex = remainingTasks.findIndex(t => t.id === targetTaskId);
      if (targetIndex === -1) {
        return [...remainingTasks, updatedDraggedTask];
      }

      const newTasks = [...remainingTasks];
      const insertIndex = isAfter ? targetIndex + 1 : targetIndex;
      newTasks.splice(insertIndex, 0, updatedDraggedTask);
      return newTasks;
    });

    // Handle notifications if column changed
    const draggedTask = tasks.find(t => t.id === taskId);
    if (draggedTask && draggedTask.stageId !== targetStageId) {
      const newNotif: Notification = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        userId: draggedTask.assignedTo || 'all',
        title: 'Design Pipeline Changed',
        message: `${currentUser.name} advanced design column "${draggedTask.title}" to ${targetStage?.name || targetStageId}.`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
      triggerToast(`Moved to ${targetStage?.name || targetStageId}`, 'success', undoAction);
    } else {
      triggerToast('Task sequence reordered', 'success', undoAction);
    }
  };

  const handleUpdateTaskDetails = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    triggerToast('Task details modified successfully.');
  };

  const handleBulkUpdateTasks = (taskIds: string[], updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => taskIds.includes(t.id) ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    
    // Check for auto-comments in bulk move
    if (updates.stageId) {
      const targetStage = stages.find(s => s.id === updates.stageId);
      const stageNameLower = targetStage?.name.toLowerCase() || '';
      const isQAOrApproved = stageNameLower.includes('qa') || stageNameLower.includes('approved') || stageNameLower.includes('qc') || stageNameLower.includes('review');
      
      if (isQAOrApproved) {
        taskIds.forEach(id => {
          const task = tasks.find(t => t.id === id);
          if (task && task.stageId !== updates.stageId) {
            handleAddComment(id, `System: Bulk moved to ${targetStage?.name} by ${currentUser.name} on ${new Date().toLocaleString()}`);
          }
        });
      }
    }
    
    triggerToast(`Bulk updated ${taskIds.length} tasks.`);
  };

  const handleBulkArchiveTasks = (taskIds: string[]) => {
    setTasks(prev => prev.map(t => taskIds.includes(t.id) ? { ...t, archived: true, updatedAt: new Date().toISOString() } : t));
    triggerToast(`Archived ${taskIds.length} tasks.`);
  };

  const handleUpdateLabels = (updatedLabels: Label[]) => {
    setLabels(updatedLabels);
    // Relational cleanup for deleted labels on all tasks
    setTasks(prev => prev.map(t => {
      if (!t.labelIds) return t;
      const filtered = t.labelIds.filter(id => updatedLabels.some(l => l.id === id));
      if (filtered.length !== t.labelIds.length) {
        return { ...t, labelIds: filtered, updatedAt: new Date().toISOString() };
      }
      return t;
    }));
  };

  const handleArchiveCompletedTasks = (projectId: string) => {
    const lastStageId = stages[stages.length - 1]?.id || 'approved';
    const completedTaskIds = tasks
      .filter(t => t.projectId === projectId && (t.stageId === lastStageId || t.stageId === 'approved') && !t.archived)
      .map(t => t.id);

    if (completedTaskIds.length === 0) {
      triggerToast('No completed tasks to archive.', 'info');
      return;
    }

    setTasks(prev => prev.map(t => completedTaskIds.includes(t.id) ? { ...t, archived: true, updatedAt: new Date().toISOString() } : t));
    triggerToast(`Archived ${completedTaskIds.length} completed task(s)`);

    // Generate broadcast notification
    const proj = projects.find(p => p.id === projectId);
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      userId: 'all',
      title: 'Tasks Archived',
      message: `${currentUser.name} archived ${completedTaskIds.length} completed task(s) on "${proj?.name || 'project'}".`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // --- Comment Logs ---
  const handleAddComment = (taskId: string, text: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      createdAt: new Date().toISOString()
    };

    setComments(prev => [...prev, newComment]);

    const task = tasks.find(t => t.id === taskId);
    const proj = projects.find(p => p.id === task?.projectId);

    if (task && !text.startsWith('System:')) {
      addActivity({
        type: 'comment_added',
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        title: `Commented on task: ${task.title}`,
        description: text,
        projectId: task.projectId,
        projectName: proj?.name,
        taskId: task.id,
        taskTitle: task.title
      });
    }
    if (task && task.assignedTo && task.assignedTo !== currentUser.id) {
      const newNotif: Notification = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        userId: task.assignedTo,
        title: 'New Feedback Comment',
        message: `${currentUser.name} tagged a QC revision comment on task "${task.title}".`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
    triggerToast('Comment posted onto task timeline.');
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    triggerToast('Comment removed.', 'info');
  };

  // --- Admin Configurations Actions ---
  const handleAddProject = (newProjData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProj: Project = {
      ...newProjData,
      id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setProjects(prev => [...prev, newProj]);
    setSelectedProjectId(newProj.id); // auto switch focusing inside

    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      userId: 'all',
      title: 'Structural Asset Added',
      message: `${currentUser.name} provisioned dynamic new asset ledger: "${newProj.name}" [${newProj.code}].`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);

    addActivity({
      type: 'project_update',
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      title: `Launched new project: ${newProj.name}`,
      description: newProj.description,
      projectId: newProj.id,
      projectName: newProj.name
    });
  };

  const handleUpdateProject = (updatedProj: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
    
    // Add real-time notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      userId: 'all',
      title: 'Project Settings Updated',
      message: `${currentUser.name} updated details for project: "${updatedProj.name}" [${updatedProj.code}].`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Log Activity
    addActivity({
      type: 'project_update',
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      title: `Updated project parameters: ${updatedProj.name}`,
      description: `Refined general details, disciplines, and team members.`,
      projectId: updatedProj.id,
      projectName: updatedProj.name
    });
    
    triggerToast(`Project "${updatedProj.name}" updated successfully.`, 'success');
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    // Auto sync current user if session user roles changed
    if (userId === currentUser.id) {
      setCurrentUser(prev => ({ ...prev, role: newRole }));
    }
    triggerToast(`Member role updated to ${newRole.toUpperCase()}`, 'info');
  };

  const handleUpdateUserDiscipline = (userId: string, newDiscipline: TaskType) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, discipline: newDiscipline } : u));
    
    // Auto sync current user if session user discipline changed
    if (userId === currentUser.id) {
      setCurrentUser(prev => ({ ...prev, discipline: newDiscipline }));
    }
    triggerToast(`Member discipline updated to ${newDiscipline.toUpperCase()}`, 'info');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      triggerToast('Cannot delete yourself from the system roster!', 'alert');
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      if (confirm(`Are you sure you want to permanently delete user "${targetUser.name}"?`)) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        triggerToast(`Permanently deleted "${targetUser.name}" from roster.`, 'info');
      }
    }
  };

  const handleToggleDeactivateUser = (userId: string) => {
    if (userId === currentUser.id) {
      triggerToast('Cannot deactivate yourself!', 'alert');
      return;
    }
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextDeactivated = !u.deactivated;
        triggerToast(`${u.name} has been ${nextDeactivated ? 'DEACTIVATED' : 'REACTIVATED'}`, 'info');
        return { ...u, deactivated: nextDeactivated };
      }
      return u;
    }));
  };

  const handleInviteUser = (newUser: Omit<User, 'id' | 'joinedAt'>) => {
    const masterPassword = visualSettings.masterPassword || 'admin';
    const createdUser: User = {
      ...newUser,
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      joinedAt: new Date().toISOString().split('T')[0],
      password: masterPassword
    };
    setUsers(prev => [...prev, createdUser]);
    triggerToast(`${newUser.name} registered in corporate team list.`);
  };

  const handleUpdateStages = (updatedStages: WorkflowStage[]) => {
    setStages(updatedStages);
    triggerToast('Kanban workflow stages updated successfully.');
  };

  // --- Notification Center helpers ---
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    triggerToast('Logs history flushed.', 'info');
  };

  // Switch Active Session Persona
  const handleSwitchSessionUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('nexus_current_user_id', target.id);
      triggerToast(`Focussed user: ${target.name} (${target.role.replace('_', ' ')})`, 'info');
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedOut(false);
    localStorage.setItem('nexus_current_user_id', user.id);
    localStorage.setItem('nexus_logged_out', 'false');
    triggerToast(`Welcome back, ${user.name}! Authenticated successfully.`, 'success');
  };

  const handleLogout = () => {
    setIsLoggedOut(true);
    localStorage.setItem('nexus_logged_out', 'true');
    setShowProfilePopover(false);
    triggerToast('Logged out of workspace session.', 'info');
  };

  const handleExportAssignedTasksPDF = (userToExport: User) => {
    // Filter tasks assigned to this user
    const userTasks = tasks.filter(t => 
      t.assignedTo === userToExport.id || 
      (t.assignedUserIds && t.assignedUserIds.includes(userToExport.id))
    );
    
    if (userTasks.length === 0) {
      triggerToast(`No active tasks currently assigned to ${userToExport.name}.`, 'info');
      return;
    }
    
    const durationLabel = `Assigned Tasks Portfolio for ${userToExport.name}`;
    const reportSettings = {
      reportTitle: `Individual Assignment Portfolio - ${userToExport.name}`,
      companyName: `Nexus Design Ops`,
      accentColor: `#4f46e5`,
      includeStatCards: true,
      includeDisciplineBreakdown: true,
      includeTaskDescription: true,
      footerText: `Design Project Kanban Ledger. Generated for ${userToExport.name} on ${new Date().toLocaleDateString()}.`
    };

    printReportHTML(userTasks, activeProject, users, stages, durationLabel, reportSettings);
    triggerToast(`PDF Report generated for ${userToExport.name}'s assigned tasks.`, 'success');
  };

  const isTeamMember = currentUser.role !== 'admin' && currentUser.role !== 'viewer';

  // Filters projects and tasks visible to team members
  const visibleTasks = tasks.filter(t => {
    // Check if task type is in its role's permitted visibility list
    const allowed = flowPermissions?.visibility[currentUser.role] || [];
    if (!allowed.includes(t.type)) return false;

    // Filter by archived status
    if (!showArchivedTasks && t.archived) return false;

    return true;
  });

  const visibleProjects = projects.filter(p => {
    // Filter out archived projects by default
    if (!showArchivedProjects && p.archived) return false;

    // Filter by permitted tasks or show empty project
    const projectTasks = tasks.filter(t => t.projectId === p.id);
    if (projectTasks.length === 0) return true;

    return projectTasks.some(t => {
      const allowed = flowPermissions?.visibility[currentUser.role] || [];
      return allowed.includes(t.type);
    });
  });

  // --- Dynamic flow updating and delete handlers ---
  const handleUpdateFlowPermissions = (newPermissions: FlowPermissions) => {
    setFlowPermissions(newPermissions);
    triggerToast('Permission flow settings synchronized.', 'success');
  };

  const handleDeleteTask = (taskId: string) => {
    if (currentUser.role !== 'admin') {
      triggerToast('Only administrators can delete tasks.', 'alert');
      return;
    }
    if (confirm('Are you sure you want to permanently delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      triggerToast('Task permanently deleted.', 'info');
      setSelectedTaskId(null);
    }
  };

  const handleToggleArchiveTask = (taskId: string) => {
    if (currentUser.role !== 'admin') {
      triggerToast('Only administrators can archive/unarchive tasks.', 'alert');
      return;
    }
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextArchived = !t.archived;
        triggerToast(nextArchived ? 'Task archived successfully.' : 'Task restored to board.', 'success');
        return { ...t, archived: nextArchived, updatedAt: new Date().toISOString() };
      }
      return t;
    }));
  };

  const handleDeleteProject = (projectId: string) => {
    if (currentUser.role !== 'admin') {
      triggerToast('Only administrators can delete projects.', 'alert');
      return;
    }
    if (confirm('Are you sure you want to permanently delete this project and all its associated tasks?')) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTasks(prev => prev.filter(t => t.projectId !== projectId));
      triggerToast('Project and tasks permanently deleted.', 'info');
    }
  };

  const handleToggleArchiveProject = (projectId: string) => {
    if (currentUser.role !== 'admin') {
      triggerToast('Only administrators can archive/unarchive projects.', 'alert');
      return;
    }
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const nextArchived = !p.archived;
        triggerToast(nextArchived ? 'Project archived successfully.' : 'Project restored to active list.', 'success');
        return { ...p, archived: nextArchived };
      }
      return p;
    }));
  };

  // --- Sync Selected Project ID when current user changes ---
  useEffect(() => {
    const allowedProjects = projects.filter(p => {
      if (!showArchivedProjects && p.archived) return false;
      const projectTasks = tasks.filter(t => t.projectId === p.id);
      if (projectTasks.length === 0) return true;
      return projectTasks.some(t => {
        const allowed = flowPermissions?.visibility[currentUser.role] || [];
        return allowed.includes(t.type);
      });
    });
    
    if (allowedProjects.length > 0 && selectedProjectId !== 'all' && !allowedProjects.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId(allowedProjects[0].id);
    }
  }, [currentUser.id, currentUser.discipline, currentUser.role, projects, tasks, flowPermissions, showArchivedProjects]);

  const enterpriseProject: Project = {
    id: 'all',
    name: 'All Projects (Enterprise Portfolio)',
    code: 'ENT',
    description: 'Consolidated portfolio view of all active projects.',
    archived: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const activeProject = selectedProjectId === 'all'
    ? enterpriseProject
    : (visibleProjects.find(p => p.id === selectedProjectId) || visibleProjects[0] || null);
  const activeTask = tasks.find(t => t.id === selectedTaskId);
  const unreadNotifCount = notifications.filter(
    n => !n.read && (n.userId === 'all' || n.userId === currentUser.email || n.userId === 'user-admin')
  ).length;

  const currentUserAssignedTasks = tasks.filter(t => 
    t.assignedTo === currentUser.id || 
    (t.assignedUserIds && t.assignedUserIds.includes(currentUser.id))
  );

  if (isLoggedOut) {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col font-sans transition-colors ${visualSettings.enlargeIconSize ? 'enlarge-icons' : ''} ${visualSettings.compactMode ? 'compact-layout' : 'spacious-layout'}`}>
        {/* Toast Overlay Container */}
        <div className="fixed top-4 right-4 z-50 pointer-events-none space-y-2">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                key={toast.id}
                className={`p-3.5 rounded-lg shadow-lg flex items-center gap-2.5 max-w-sm pointer-events-auto border ${
                  toast.type === 'success' ? 'bg-[#1e293b] text-[#34d399] border-[#34d399]/10' :
                  toast.type === 'alert' ? 'bg-rose-900 text-rose-100 border-rose-800' :
                  'bg-slate-900 text-amber-100 border-amber-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold font-mono tracking-tight">{toast.text}</span>
                {toast.onUndo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.onUndo?.();
                      setToasts(prev => prev.filter(t => t.id !== toast.id));
                    }}
                    className="ml-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/25 rounded font-sans font-bold text-[10px] tracking-wide transition-all flex items-center gap-1 cursor-pointer pointer-events-auto"
                  >
                    <Undo className="w-3 h-3" />
                    Undo
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <TeamLoginPortal users={users} onLogin={handleLogin} visualSettings={visualSettings} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans transition-colors ${visualSettings.enlargeIconSize ? 'enlarge-icons' : ''} ${visualSettings.compactMode ? 'compact-layout' : 'spacious-layout'}`}>
      
      {/* Toast Overlay Container */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              key={toast.id}
              className={`p-3.5 rounded-lg shadow-lg flex items-center gap-2.5 max-w-sm pointer-events-auto border ${
                toast.type === 'success' ? 'bg-[#1e293b] text-[#34d399] border-[#34d399]/10' :
                toast.type === 'alert' ? 'bg-rose-900 text-rose-100 border-rose-800' :
                'bg-slate-900 text-amber-100 border-amber-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-bold font-mono tracking-tight">{toast.text}</span>
              {toast.onUndo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.onUndo?.();
                    setToasts(prev => prev.filter(t => t.id !== toast.id));
                  }}
                  className="ml-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/25 rounded font-sans font-bold text-[10px] tracking-wide transition-all flex items-center gap-1 cursor-pointer pointer-events-auto"
                >
                  <Undo className="w-3 h-3" />
                  Undo
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* TOP DECK HEADER BAR */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-40 transition-colors">
        <div className="px-2 sm:px-6 justify-between w-full flex items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-slate-900 truncate max-w-[140px] sm:max-w-none">{visualSettings.workspaceName || 'Nexus Design Ops'}</h1>
            </div>
            
            {/* Desktop Command Palette Trigger */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-2.5 py-1 text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer w-52 justify-between"
              title="Search (Ctrl+K)"
            >
              <div className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-white text-slate-400 border border-slate-200 rounded select-none shadow-2xs">
                Ctrl+K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* INTERACTIVE PROFILE SWITCHER & PORTAL */}
            <div className="relative">
              <button
                onClick={() => setShowProfilePopover(!showProfilePopover)}
                className="group flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-left focus:outline-none cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {currentUser.name[0]}
                </div>
                <div className="flex flex-col whitespace-nowrap">
                  <span className="text-[10px] font-bold text-slate-700 leading-none">{currentUser.name}</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider mt-0.5 leading-none font-mono">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </button>

              <AnimatePresence>
                {showProfilePopover && (
                  <>
                    {/* Backdrop cover to click away */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfilePopover(false)} 
                    />
                    
                    {/* Popover Content */}
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 space-y-4"
                    >
                      {/* User Info Header */}
                      <div className="text-left space-y-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                        {currentUser.phoneNumber && (
                          <p className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{currentUser.phoneNumber}</span>
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[7px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 border rounded-md leading-none bg-indigo-50 text-indigo-700 border-indigo-100">
                            {currentUser.role.replace('_', ' ')}
                          </span>
                          {currentUser.discipline && currentUser.discipline !== 'other' && (
                            <span className="text-[7px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 border rounded-md leading-none bg-emerald-50 text-emerald-700 border-emerald-100">
                              {currentUser.discipline}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats Section */}
                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-left">
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                          Your Assignments:
                        </span>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{currentUserAssignedTasks.length} Active Tasks</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">{activeProject?.code || 'No Project'}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChangeModal(true);
                            setShowProfilePopover(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-left bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer text-xs font-bold"
                        >
                          <span className="flex items-center gap-2">
                            <Key className="w-3.5 h-3.5 text-slate-500" />
                            <span>Change Password</span>
                          </span>
                        </button>

                        {/* Export Assigned Tasks Button */}
                        <button
                          type="button"
                          onClick={() => {
                            handleExportAssignedTasksPDF(currentUser);
                            setShowProfilePopover(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-left bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-100 rounded-lg transition-colors cursor-pointer text-xs font-bold"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Export My Tasks (PDF)</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>



                        {/* Logout Button */}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-100 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Command Palette Trigger removed per request */}

            {/* Notification trigger bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className="group flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors relative cursor-pointer border border-transparent"
              >
                <Bell className="w-4 h-4 flex-shrink-0" />
                <span className="hidden group-hover:inline group-focus:inline group-active:inline text-xs font-semibold whitespace-nowrap">Notifications</span>
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 block w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </button>

              {showNotificationCenter && (
                <NotificationCenter
                  notifications={notifications}
                  currentUserEmail={currentUser.email}
                  onMarkAsRead={handleMarkNotificationAsRead}
                  onClearAll={handleClearNotifications}
                  onClose={() => setShowNotificationCenter(false)}
                />
              )}
            </div>

          </div>
        </div>
      </header>

      {/* DASHBOARD UTILITY SUBBAR (Selectors & Primary Tabs) */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="px-2 sm:px-6 py-2 mx-auto flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 w-full max-w-full">
          
          {/* Multi-project dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest shrink-0">Project:</span>
            <select
              className="flex-1 sm:flex-initial px-2 py-1 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer min-w-0"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="all">💼 All Projects (Enterprise Portfolio)</option>
              {visibleProjects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-5 sm:flex sm:flex-wrap items-center gap-1 max-w-full pb-0.5 shrink-0 select-none">
            <button
              onClick={() => setActiveTab('board')}
              className={`group px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${
                activeTab === 'board' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Board</span>
            </button>

            <button
              onClick={() => setActiveTab('my_overview')}
              className={`group px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${
                activeTab === 'my_overview' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">My Overview</span>
            </button>

            {visualSettings.showReportsTab && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`group px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${
                  activeTab === 'reports' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Reports</span>
              </button>
            )}

            {visualSettings.showCalendarTab && (
              <button
                onClick={() => setActiveTab('calendar')}
                className={`group px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${
                  activeTab === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Calendar</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('export')}
              className={`group px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${
                activeTab === 'export' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Export</span>
            </button>

            {visualSettings.showArchiveTab && (
              <button
                onClick={() => setActiveTab('archive')}
                className={`group px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${
                  activeTab === 'archive' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Archive className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Archive</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('team_activity')}
                className={`group px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${
                  activeTab === 'team_activity' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Activity</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('resource_load')}
                className={`group px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${
                  activeTab === 'resource_load' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Resource Load</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`group px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${
                  activeTab === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Settings className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Settings</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('messages')}
              className={`group px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 relative ${
                activeTab === 'messages' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Team Chat</span>
              {messages.some(m => m.receiverId === currentUser.id && !m.read) && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-600 rounded-full border border-white" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ACTIVE PROJECT INFO LEDGER BANNER */}
      {activeProject && activeTab === 'board' && (
        <section className="bg-white border-b border-slate-100">
          <div className="px-2 py-3 sm:px-6 mx-auto">
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {activeProject.name} <span className="text-xs font-normal text-slate-400">({activeProject.code})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 select-none">{activeProject.description}</p>
          </div>
        </section>
      )}

      {/* CORE CONTROLLER STAGE WORKSPACE */}
      <main className="flex-1 mx-auto w-full max-w-full px-2 py-4 sm:px-6 sm:py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {activeTab === 'board' && (
              <KanbanBoard
                project={activeProject}
                tasks={visibleTasks}
                users={users}
                stages={stages}
                currentUser={currentUser}
                labels={labels}
                visualSettings={visualSettings}
                projects={visibleProjects}
                onAddTask={handleAddTask}
                onUpdateTaskStage={handleUpdateTaskStage}
                onSelectTask={(id) => setSelectedTaskId(id)}
                onArchiveCompletedTasks={handleArchiveCompletedTasks}
                onUpdateTask={handleUpdateTaskDetails}
                onBulkUpdateTasks={handleBulkUpdateTasks}
                onBulkArchiveTasks={handleBulkArchiveTasks}
                onDeleteTask={handleDeleteTask}
                onToggleArchiveTask={handleToggleArchiveTask}
                onDeleteProject={handleDeleteProject}
                onToggleArchiveProject={handleToggleArchiveProject}
                showArchivedTasks={showArchivedTasks}
                setShowArchivedTasks={setShowArchivedTasks}
                showArchivedProjects={showArchivedProjects}
                setShowArchivedProjects={setShowArchivedProjects}
                forceOpenAddTask={forceOpenAddTask}
                onResetForceOpenAddTask={() => setForceOpenAddTask(false)}
                onUpdateStages={handleUpdateStages}
                onUpdateVisualSettings={handleUpdateVisualSettings}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsPanel
                projects={visibleProjects}
                tasks={visibleTasks}
                users={users}
                stages={stages}
                currentUser={currentUser}
                flowPermissions={flowPermissions}
                reportTemplateSettings={reportTemplateSettings}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarView
                tasks={visibleTasks}
                projects={visibleProjects}
                users={users}
                stages={stages}
                selectedProjectId={selectedProjectId}
                onSelectTask={(id) => setSelectedTaskId(id)}
                currentUser={currentUser}
                onUpdateTask={handleUpdateTaskDetails}
              />
            )}

            {activeTab === 'archive' && (
              <ArchivePanel
                projects={projects}
                tasks={tasks}
                users={users}
                stages={stages}
                currentUser={currentUser}
                flowPermissions={flowPermissions}
                onToggleArchiveTask={handleToggleArchiveTask}
                onDeleteTask={handleDeleteTask}
                onSelectTask={(id) => setSelectedTaskId(id)}
                onToggleArchiveProject={handleToggleArchiveProject}
                onDeleteProject={handleDeleteProject}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard
                projects={projects}
                users={users}
                stages={stages}
                currentUser={currentUser}
                visualSettings={visualSettings}
                onUpdateVisualSettings={handleUpdateVisualSettings}
                reportTemplateSettings={reportTemplateSettings}
                onUpdateReportTemplateSettings={handleUpdateReportTemplateSettings}
                labels={labels}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onUpdateUserRole={handleUpdateUserRole}
                onUpdateUserDiscipline={handleUpdateUserDiscipline}
                onDeleteUser={handleDeleteUser}
                onToggleDeactivateUser={handleToggleDeactivateUser}
                onInviteUser={handleInviteUser}
                onUpdateStages={handleUpdateStages}
                flowPermissions={flowPermissions}
                onUpdateFlowPermissions={handleUpdateFlowPermissions}
                onDeleteProject={handleDeleteProject}
                onToggleArchiveProject={handleToggleArchiveProject}
                onResetUserPassword={handleResetUserPassword}
                onMessageUser={handleMessageUser}
                onSendBulkMessage={handleSendBulkMessage}
                showArchivedProjects={showArchivedProjects}
                setShowArchivedProjects={setShowArchivedProjects}
                tasks={tasks}
                activities={activities}
              />
            )}

            {activeTab === 'messages' && (
              <MessagingPortal
                users={users}
                currentUser={currentUser}
                messages={messages}
                onSendMessage={handleSendMessage}
                onMarkRead={handleMarkMessagesRead}
                visualSettings={visualSettings}
                initialUserId={selectedMessageUserId}
                teamConversations={teamConversations}
                onAddTeamConversation={handleAddTeamConversation}
              />
            )}

            {activeTab === 'resource_load' && currentUser.role === 'admin' && (
              <ResourceLoadPanel
                tasks={tasks}
                users={users}
                stages={stages}
                projects={projects}
              />
            )}

            {activeTab === 'my_overview' && (
              <MyOverviewPanel
                tasks={tasks}
                projects={projects}
                users={users}
                stages={stages}
                currentUser={currentUser}
                onSelectTask={(id) => setSelectedTaskId(id)}
              />
            )}

            {activeTab === 'team_activity' && currentUser.role === 'admin' && (
              <TeamActivityFeed
                activities={activities}
                users={users}
              />
            )}

            {activeTab === 'export' && (
              <ExportPanel
                tasks={tasks}
                projects={projects}
                activities={activities}
                users={users}
              />
            )}
          </motion.div>
         </AnimatePresence>
       </main>

       {/* DETAILED TASK QC SLIDE OVER MODAL */}
       <AnimatePresence>
         {selectedTaskId && activeTask && (
           <TaskDetailsModal
             task={activeTask}
             tasks={visibleTasks}
             users={users}
             comments={comments}
             currentUser={currentUser}
             labels={labels}
             onUpdateLabels={handleUpdateLabels}
             onClose={() => setSelectedTaskId(null)}
             onUpdateTask={handleUpdateTaskDetails}
             onAddComment={handleAddComment}
             onDeleteComment={handleDeleteComment}
             onDeleteTask={handleDeleteTask}
             onToggleArchiveTask={handleToggleArchiveTask}
             onMessageUser={handleMessageUser}
             flowPermissions={flowPermissions}
             visualSettings={visualSettings}
          />
        )}
      </AnimatePresence>

      {/* Custom Welcome Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDismissWelcomeModal}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden z-10"
            >
              {/* Decorative Header Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <div className="space-y-4 pt-2">
                <div className="inline-flex p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Megaphone className="w-6 h-6" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {visualSettings.welcomeModalTitle || 'Welcome to AEC Design Kanban Studio!'}
                  </h3>
                  <div className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {visualSettings.welcomeModalContent || 'We have updated our internal design standard submission procedures. Please ensure all drawings and calculations are logged prior to initiating Peer & Q/C Reviews.'}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleDismissWelcomeModal}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow cursor-pointer active:scale-95"
                  >
                    {visualSettings.welcomeModalButtonText || 'Acknowledge & Proceed'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Change Modal Overlay */}
      <AnimatePresence>
        {showPasswordChangeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200"
            >
              <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <h3 className="text-sm font-bold">Update Account Security</h3>
                </div>
                <button onClick={() => setShowPasswordChangeModal(false)} className="hover:bg-white/10 p-1 rounded transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordChangeError(null); }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none"
                    placeholder="Min 4 characters"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordChangeError(null); }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none"
                    placeholder="Repeat new password"
                  />
                </div>

                {passwordChangeError && (
                  <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg flex items-center gap-2 text-rose-600 text-[10px] font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {passwordChangeError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowPasswordChangeModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newPassword.length < 4) {
                        setPasswordChangeError('Password must be at least 4 characters long.');
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        setPasswordChangeError('Passwords do not match.');
                        return;
                      }
                      handleUpdatePassword(currentUser.id, newPassword);
                      setShowPasswordChangeModal(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      // Add a notification
                      setNotifications([
                        {
                          id: `pw-change-${Date.now()}`,
                          userId: currentUser.id,
                          title: 'Security Updated',
                          message: 'Your personal access password has been changed successfully.',
                          type: 'success',
                          read: false,
                          createdAt: new Date().toISOString()
                        },
                        ...notifications
                      ]);
                    }}
                    className="flex-[2] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL COMMAND PALETTE */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            tasks={tasks}
            projects={projects}
            users={users}
            onSelectTask={(taskId) => {
              setSelectedTaskId(taskId);
              setIsCommandPaletteOpen(false);
            }}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setIsCommandPaletteOpen(false);
            }}
            onTriggerAddTask={() => {
              setForceOpenAddTask(true);
              setIsCommandPaletteOpen(false);
            }}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      {/* MINIMAL FOOTER */}
      {activeTab === 'board' && (
        <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12 select-none">
          <div className="px-2 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p>© 2026 Nexus Design Ops. Standard workflow management.</p>
            <div className="flex gap-3 text-[10px] text-slate-400">
              <span>{stages.length} Lanes</span>
              <span>{users.length} Members</span>
              <span>{tasks.length} Tasks</span>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
