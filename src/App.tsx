import { useState, useEffect, useMemo, startTransition } from 'react';
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
import { GoogleSheetsSyncPanel } from './components/GoogleSheetsSyncPanel';
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
  ChevronUp,
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
    if (localStorage.getItem('kanban_empty_reset_v3') !== 'true') {
      localStorage.removeItem('kanban_projects');
      localStorage.removeItem('kanban_users');
      localStorage.removeItem('kanban_tasks');
      localStorage.removeItem('kanban_comments');
      localStorage.removeItem('kanban_notifications');
      localStorage.removeItem('kanban_activities');
      localStorage.removeItem('kanban_messages');
      localStorage.removeItem('kanban_channels');
      localStorage.removeItem('nexus_current_user_id');
      sessionStorage.removeItem('nexus_current_user_id');
      sessionStorage.removeItem('nexus_logged_out');
      localStorage.setItem('kanban_empty_reset_v3', 'true');
    }

    const saved = localStorage.getItem('nexus_current_user_id') || sessionStorage.getItem('nexus_current_user_id');
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
    return localStorage.getItem('nexus_logged_out') !== 'false' && sessionStorage.getItem('nexus_logged_out') !== 'false';
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

  const handleDeleteMessage = (messageId: string) => {
    if (currentUser.role !== 'admin') return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    triggerToast('Message deleted successfully.', 'success');
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (currentUser.role !== 'admin') return;

    const isChannel = conversationId.startsWith('channel-');
    if (isChannel) {
      if (conversationId === 'channel-general') {
        triggerToast('Default general conversation cannot be deleted.', 'alert');
        return;
      }

      const channelObj = teamConversations.find(c => c.id === conversationId);
      const channelName = channelObj ? channelObj.name : 'Unknown';

      setTeamConversations(prev => prev.filter(c => c.id !== conversationId));
      setMessages(prev => prev.filter(m => m.receiverId !== conversationId));

      addActivity({
        type: 'project_update',
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        title: `Deleted team conversation #${channelName}`,
        description: `Deleted channel and all associated messages.`,
      });

      triggerToast(`Conversation #${channelName} deleted.`, 'success');
    } else {
      setMessages(prev => prev.filter(m => 
        !(m.senderId === currentUser.id && m.receiverId === conversationId) &&
        !(m.senderId === conversationId && m.receiverId === currentUser.id)
      ));

      const otherUser = users.find(u => u.id === conversationId);
      triggerToast(`Direct messages with ${otherUser?.name || 'User'} cleared.`, 'success');
    }
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
      footerText: '© 2026 Nexus Design Ops. Standard workflow management.',
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
  const [activeTab, setActiveTab] = useState<'board' | 'reports' | 'calendar' | 'admin' | 'archive' | 'resource_load' | 'my_overview' | 'messages' | 'team_activity' | 'export' | 'google_sheets'>('board');
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
    } else if (activeTab === 'google_sheets' && currentUser.role !== 'admin') {
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
    startTransition(() => {
      setShowWelcomeModal(false);
    });
    setTimeout(() => {
      try {
        sessionStorage.setItem('welcome_modal_dismissed', 'true');
      } catch (e) {
        console.error(e);
      }
    }, 0);
  };
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return INITIAL_PROJECTS[0]?.id || '';
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [sidebarProjectsExpanded, setSidebarProjectsExpanded] = useState(true);
  const [sidebarTasksExpanded, setSidebarTasksExpanded] = useState(true);

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
    }, 1000);
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

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    // Auto sync current user if session user details changed
    if (updatedUser.id === currentUser.id) {
      setCurrentUser(updatedUser);
    }
    triggerToast(`Member details for "${updatedUser.name}" updated successfully.`, 'success');
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
      sessionStorage.setItem('nexus_current_user_id', target.id);
      triggerToast(`Focussed user: ${target.name} (${target.role.replace('_', ' ')})`, 'info');
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedOut(false);
    sessionStorage.setItem('nexus_current_user_id', user.id);
    localStorage.setItem('nexus_current_user_id', user.id);
    sessionStorage.setItem('nexus_logged_out', 'false');
    localStorage.setItem('nexus_logged_out', 'false');
    triggerToast(`Welcome back, ${user.name}! Authenticated successfully.`, 'success');
  };

  const handleLogout = () => {
    setIsLoggedOut(true);
    sessionStorage.setItem('nexus_logged_out', 'true');
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
  const visibleTasks = useMemo(() => {
    return tasks.filter(t => {
      // Exclude soft-deleted tasks
      if (t.isDeleted) return false;

      // Check if task type is in its role's permitted visibility list
      const allowed = flowPermissions?.visibility[currentUser.role] || [];
      if (!allowed.includes(t.type)) return false;

      // Filter by archived status
      if (!showArchivedTasks && t.archived) return false;

      return true;
    });
  }, [tasks, flowPermissions, currentUser.role, showArchivedTasks]);

  const visibleProjects = useMemo(() => {
    return projects.filter(p => {
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
  }, [projects, showArchivedProjects, tasks, flowPermissions, currentUser.role]);

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
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    if (taskToDelete.isDeleted) {
      if (confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        triggerToast('Task permanently deleted.', 'info');
        setSelectedTaskId(null);
      }
    } else {
      if (confirm('Are you sure you want to delete this task? Admins can still view and restore it from the Archive Vault.')) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isDeleted: true, updatedAt: new Date().toISOString() } : t));
        triggerToast('Task moved to deleted trash bin.', 'info');
        setSelectedTaskId(null);
      }
    }
  };

  const handleToggleArchiveTask = (taskId: string) => {
    if (currentUser.role !== 'admin') {
      triggerToast('Only administrators can archive/unarchive tasks.', 'alert');
      return;
    }
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (t.isDeleted) {
          triggerToast('Task restored to board successfully.', 'success');
          return { ...t, isDeleted: false, archived: false, updatedAt: new Date().toISOString() };
        }
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

  const enterpriseProject = useMemo<Project>(() => ({
    id: 'all',
    name: 'All Projects (Enterprise Portfolio)',
    code: 'ENT',
    description: 'Consolidated portfolio view of all active projects.',
    archived: false,
    status: 'active',
    createdAt: '2026-06-27T00:00:00.000Z',
  }), []);

  const activeProject = useMemo(() => {
    return selectedProjectId === 'all'
      ? enterpriseProject
      : (visibleProjects.find(p => p.id === selectedProjectId) || visibleProjects[0] || null);
  }, [selectedProjectId, enterpriseProject, visibleProjects]);

  const filteredSidebarProjects = useMemo(() => {
    if (!sidebarSearchQuery.trim()) return [];
    const q = sidebarSearchQuery.toLowerCase();
    return visibleProjects.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.code.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [sidebarSearchQuery, visibleProjects]);

  const filteredSidebarTasks = useMemo(() => {
    if (!sidebarSearchQuery.trim()) return [];
    const q = sidebarSearchQuery.toLowerCase();
    return tasks.filter(t => 
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      t.id.toLowerCase().includes(q)
    );
  }, [sidebarSearchQuery, tasks]);

  const activeTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId);
  }, [tasks, selectedTaskId]);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter(
      n => !n.read && (n.userId === 'all' || n.userId === currentUser.email || n.userId === 'user-admin')
    ).length;
  }, [notifications, currentUser.email]);

  const currentUserAssignedTasks = useMemo(() => {
    return tasks.filter(t => 
      t.assignedTo === currentUser.id || 
      (t.assignedUserIds && t.assignedUserIds.includes(currentUser.id))
    );
  }, [tasks, currentUser.id]);

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
    <div className={`min-h-screen bg-white text-[#0a0a0a] flex flex-col md:grid md:grid-cols-[280px_1fr] md:grid-rows-[1fr_60px] md:h-screen md:overflow-hidden font-sans transition-colors ${visualSettings.enlargeIconSize ? 'enlarge-icons' : ''} ${visualSettings.compactMode ? 'compact-layout' : 'spacious-layout'}`}>
      
      {/* Toast Overlay Container */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              key={toast.id}
              className={`p-3.5 rounded shadow-lg flex items-center gap-2.5 max-w-sm pointer-events-auto border ${
                toast.type === 'success' ? 'bg-[#0a0a0a] text-white border-black/20 font-mono text-[11px]' :
                toast.type === 'alert' ? 'bg-rose-950 text-rose-100 border-rose-900 font-mono text-[11px]' :
                'bg-slate-900 text-amber-100 border-amber-800 font-mono text-[11px]'
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

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden h-14 border-b border-[#e5e5e5] bg-white px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded hover:bg-slate-100 border border-slate-200 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">NCPT Core</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification bell on mobile top bar */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationCenter(!showNotificationCenter)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 block w-1.5 h-1.5 rounded-full bg-black" />
              )}
            </button>
            {showNotificationCenter && (
              <NotificationCenter
                notifications={notifications}
                currentUserEmail={currentUser.email}
                onMarkAsRead={handleMarkNotificationAsRead}
                onClearAll={handleClearNotifications}
                onClose={() => setShowNotificationCenter(false)}
                align="right"
              />
            )}
          </div>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION - MATCHING DESIGN VARIATION */}
      <aside className={`sidebar bg-white border-r border-[#e5e5e5] flex-col p-8 md:p-10 z-30 transition-transform duration-200 md:translate-x-0 md:row-span-2 md:h-screen ${mobileMenuOpen ? 'translate-x-0 fixed inset-y-0 left-0 w-[280px] shadow-2xl flex' : '-translate-x-full fixed inset-y-0 left-0 w-[280px] md:relative md:flex md:translate-x-0'}`}>
        <div className="brand-label flex items-center gap-2.5 font-mono text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-black mb-6">
          <span className="w-2.5 h-2.5 bg-black block shrink-0" />
          <span>NCPT // SYSTEM CORE</span>
        </div>

        {/* PERSISTENT SIDEBAR SEARCH */}
        <div className="sidebar-search mb-6 relative w-full shrink-0">
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects or tasks..."
            value={sidebarSearchQuery}
            onChange={(e) => setSidebarSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-[#e5e5e5] rounded text-xs focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white placeholder-[#a3a3a3] font-sans text-black"
          />
          {sidebarSearchQuery && (
            <button
              onClick={() => setSidebarSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-black font-bold uppercase font-mono px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* SEARCH RESULTS DISPLAY */}
        {sidebarSearchQuery && (
          <div className="sidebar-search-results mb-6 max-h-[220px] overflow-y-auto border border-[#e5e5e5] rounded p-3 bg-[#fafafa] shrink-0 no-scrollbar">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#e5e5e5]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#737373] font-bold">Search Results</span>
              <button 
                onClick={() => setSidebarSearchQuery('')} 
                className="text-[9px] uppercase tracking-wider text-[#737373] hover:text-black font-bold font-mono cursor-pointer"
              >
                Clear
              </button>
            </div>
            
            {/* Projects matching */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setSidebarProjectsExpanded(!sidebarProjectsExpanded)}
                className="w-full flex items-center justify-between text-left font-mono text-[8px] uppercase tracking-wider text-[#737373] hover:text-black font-bold mb-1 focus:outline-none select-none cursor-pointer group"
              >
                <span>Projects ({filteredSidebarProjects.length})</span>
                {sidebarProjectsExpanded ? (
                  <ChevronUp className="w-3 h-3 text-[#737373] group-hover:text-black transition-colors shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-[#737373] group-hover:text-black transition-colors shrink-0" />
                )}
              </button>
              {sidebarProjectsExpanded && (
                filteredSidebarProjects.length === 0 ? (
                  <div className="text-[10px] text-[#737373] italic font-sans pl-1 pt-0.5">No projects found</div>
                ) : (
                  <div className="space-y-1 pt-0.5">
                    {filteredSidebarProjects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setActiveTab('board');
                          setMobileMenuOpen(false);
                          triggerToast(`Switched to project: ${p.name}`, 'success');
                        }}
                        className="w-full text-left p-1.5 hover:bg-white border border-transparent hover:border-[#e5e5e5] rounded text-[11px] text-black font-medium transition-all block truncate cursor-pointer"
                      >
                        <span className="font-mono text-[9px] text-slate-500 mr-1">[{p.code}]</span> {p.name}
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Tasks matching */}
            <div>
              <button
                type="button"
                onClick={() => setSidebarTasksExpanded(!sidebarTasksExpanded)}
                className="w-full flex items-center justify-between text-left font-mono text-[8px] uppercase tracking-wider text-[#737373] hover:text-black font-bold mb-1 focus:outline-none select-none cursor-pointer group"
              >
                <span>Tasks ({filteredSidebarTasks.length})</span>
                {sidebarTasksExpanded ? (
                  <ChevronUp className="w-3 h-3 text-[#737373] group-hover:text-black transition-colors shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-[#737373] group-hover:text-black transition-colors shrink-0" />
                )}
              </button>
              {sidebarTasksExpanded && (
                filteredSidebarTasks.length === 0 ? (
                  <div className="text-[10px] text-[#737373] italic font-sans pl-1 pt-0.5">No tasks found</div>
                ) : (
                  <div className="space-y-1 pt-0.5">
                    {filteredSidebarTasks.map(t => {
                      const proj = projects.find(p => p.id === t.projectId);
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedProjectId(t.projectId);
                            setSelectedTaskId(t.id);
                            setActiveTab('board');
                            setMobileMenuOpen(false);
                            triggerToast(`Selected task: ${t.title}`, 'success');
                          }}
                          className="w-full text-left p-1.5 hover:bg-white border border-transparent hover:border-[#e5e5e5] rounded text-[11px] text-black transition-all block truncate cursor-pointer"
                        >
                          <div className="font-medium truncate flex items-center justify-between">
                            <span className="truncate">{t.title}</span>
                            {proj && <span className="font-mono text-[8px] text-slate-400 bg-white border border-[#e5e5e5] px-1 rounded ml-1 uppercase shrink-0">{proj.code}</span>}
                          </div>
                          <div className="text-[9px] text-[#737373] font-mono truncate">{t.id} • {t.type}</div>
                        </button>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        )}
        
        <nav className="nav-group flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
          {/* Board View */}
          <button
            onClick={() => { setActiveTab('board'); setMobileMenuOpen(false); }}
            className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'board' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
            }`}
          >
            <span>PRJ / [01] Board View</span>
          </button>

          {/* My Overview */}
          <button
            onClick={() => { setActiveTab('my_overview'); setMobileMenuOpen(false); }}
            className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'my_overview' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
            }`}
          >
            <span>OVR / [02] My Overview</span>
          </button>

          {/* Reports */}
          {visualSettings.showReportsTab && (
            <button
              onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
              className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'reports' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
              }`}
            >
              <span>ANL / [03] Reports</span>
            </button>
          )}

          {/* Calendar */}
          {visualSettings.showCalendarTab && (
            <button
              onClick={() => { setActiveTab('calendar'); setMobileMenuOpen(false); }}
              className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'calendar' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
              }`}
            >
              <span>CAL / [04] Calendar</span>
            </button>
          )}

          {/* Export */}
          <button
            onClick={() => { setActiveTab('export'); setMobileMenuOpen(false); }}
            className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'export' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
            }`}
          >
            <span>EXP / [05] Export</span>
          </button>

          {/* Archive */}
          {visualSettings.showArchiveTab && (
            <button
              onClick={() => { setActiveTab('archive'); setMobileMenuOpen(false); }}
              className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'archive' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
              }`}
            >
              <span>ARC / [06] Archive Vault</span>
            </button>
          )}

          {/* Team Chat */}
          <button
            onClick={() => { setActiveTab('messages'); setMobileMenuOpen(false); }}
            className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer relative ${
              activeTab === 'messages' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
            }`}
          >
            <span>CHT / [07] Team Chat</span>
            {messages.some(m => m.receiverId === currentUser.id && !m.read) && (
              <span className="w-1.5 h-1.5 bg-black rounded-full shrink-0" />
            )}
          </button>

          {/* Admin Panels */}
          {currentUser.role === 'admin' && (
            <>
              {/* Activity */}
              <button
                onClick={() => { setActiveTab('team_activity'); setMobileMenuOpen(false); }}
                className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'team_activity' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
                }`}
              >
                <span>ACT / [08] Activity Feed</span>
              </button>

              {/* Resource Load */}
              <button
                onClick={() => { setActiveTab('resource_load'); setMobileMenuOpen(false); }}
                className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'resource_load' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
                }`}
              >
                <span>RES / [09] Resource Load</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'admin' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
                }`}
              >
                <span>SET / [10] Settings</span>
              </button>

              {/* Cloud Sync */}
              <button
                onClick={() => { setActiveTab('google_sheets'); setMobileMenuOpen(false); }}
                className={`nav-link text-left bg-transparent border-none py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === 'google_sheets' ? 'font-semibold text-black' : 'text-[#737373] hover:text-black'
                }`}
              >
                <span>SYN / [11] Cloud Sync</span>
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Footer Context & User */}
        <div className="sidebar-context mt-auto border-t border-[#e5e5e5] pt-8 text-left relative">
          <span className="meta-label block font-mono text-[9px] uppercase tracking-[0.2em] text-[#737373] mb-2">Context Project</span>
          <div className="font-semibold text-sm text-[#0a0a0a] truncate mb-4">
            {activeProject?.name || 'All Projects'}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfilePopover(!showProfilePopover)}
              className="w-full text-left bg-transparent border-none focus:outline-none cursor-pointer group"
            >
              <span className="meta-label block font-mono text-[9px] uppercase tracking-[0.2em] text-[#737373] mb-2">Protocol Persona</span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase">
                  {currentUser.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-xs font-bold text-black truncate hover:underline flex items-center gap-1">
                    {currentUser.name}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <div className="font-mono text-[9px] text-[#737373] uppercase tracking-wider mt-0.5">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </button>

            {/* Profile Popover Overlay inside Sidebar context */}
            <AnimatePresence>
              {showProfilePopover && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfilePopover(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-16 left-0 w-64 bg-white border border-[#e5e5e5] rounded-lg shadow-xl p-4 z-50 space-y-4"
                  >
                    <div className="text-left space-y-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[8px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 border bg-slate-50 border-[#e5e5e5] text-slate-700 rounded">
                          {currentUser.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[#e5e5e5]/50 pt-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => { setShowPasswordChangeModal(true); setShowProfilePopover(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 rounded transition-colors cursor-pointer text-left"
                      >
                        <Key className="w-3.5 h-3.5 text-slate-500" />
                        <span>Update Security</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { handleExportAssignedTasksPDF(currentUser); setShowProfilePopover(false); }}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 rounded transition-colors cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export Portfolio (PDF)</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 rounded transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout Session</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* CORE SYSTEM WORKSPACE */}
      <main className={`flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 md:p-10 lg:p-12 min-w-0 ${activeTab === 'messages' ? 'md:row-span-2 md:h-screen' : 'md:row-span-1 md:h-full'}`}>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-6 md:mb-12 shrink-0">
          <div>
            <span className="meta-label block font-mono text-[10px] uppercase tracking-[0.2em] text-[#737373] mb-2">
              {activeProject ? `Project Portfolio / ${activeProject.code}` : 'System Deployment Cycle 2026'}
            </span>
            <h1 className="h-title font-sans text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[0.9] text-black select-none">
              {activeTab === 'board' ? 'Overview' : activeTab.replace('_', ' ').toUpperCase()}
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Project dropdown in header as in variation */}
            <div className="flex flex-col border-r border-[#e5e5e5] pr-3 mr-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#737373] block mb-1">Portfolio focus</span>
              <select
                className="bg-transparent border-none text-black font-sans text-sm font-semibold cursor-pointer outline-none focus:ring-0 text-left"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="all">💼 All Projects (Enterprise Portfolio)</option>
                {visibleProjects.map(proj => (
                  <option key={proj.id} value={proj.id} className="font-sans text-xs">
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification bell button (hidden on mobile, visible on desktop) */}
            <div className="hidden md:block relative mr-2">
              <button
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className="p-2 border border-[#e5e5e5] hover:border-black rounded text-[#737373] hover:text-black transition-colors relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 block w-1.5 h-1.5 rounded-full bg-black" />
                )}
              </button>
              {showNotificationCenter && (
                <NotificationCenter
                  notifications={notifications}
                  currentUserEmail={currentUser.email}
                  onMarkAsRead={handleMarkNotificationAsRead}
                  onClearAll={handleClearNotifications}
                  onClose={() => setShowNotificationCenter(false)}
                  align="right"
                />
              )}
            </div>

            <button
              onClick={() => {
                setActiveTab('board');
                setForceOpenAddTask(true);
              }}
              className="btn-cta bg-black hover:bg-[#333333] text-white border-none px-6 py-3.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-all shadow hover:shadow-lg cursor-pointer active:scale-95 shrink-0 rounded"
            >
              New Task +
            </button>
          </div>
        </header>

        {/* ACTIVE PROJECT INFO LEDGER BANNER */}
        {activeProject && activeTab === 'board' && (
          <section className="bg-white border border-[#e5e5e5] mb-6 rounded p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  {activeProject.name} <span className="text-xs font-normal text-slate-600">({activeProject.code})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 select-none">{activeProject.description}</p>
              </div>
            </div>
          </section>
        )}

        {/* CORE CONTROLLER STAGE WORKSPACE */}
        <div className="flex-1 mx-auto w-full max-w-full px-2 py-4 sm:px-6 sm:py-6 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="w-full flex-1 flex flex-col min-h-0"
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
                visualSettings={visualSettings}
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
                visualSettings={visualSettings}
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
                visualSettings={visualSettings}
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
                onUpdateUser={handleUpdateUser}
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
                tasks={tasks.filter(t => !t.isDeleted)}
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
                onDeleteMessage={handleDeleteMessage}
                onDeleteConversation={handleDeleteConversation}
              />
            )}

            {activeTab === 'resource_load' && currentUser.role === 'admin' && (
              <ResourceLoadPanel
                tasks={tasks.filter(t => !t.isDeleted)}
                users={users}
                stages={stages}
                projects={projects}
                visualSettings={visualSettings}
              />
            )}

            {activeTab === 'my_overview' && (
              <MyOverviewPanel
                tasks={tasks.filter(t => !t.isDeleted)}
                projects={projects}
                users={users}
                stages={stages}
                currentUser={currentUser}
                onSelectTask={(id) => setSelectedTaskId(id)}
                visualSettings={visualSettings}
              />
            )}

            {activeTab === 'team_activity' && currentUser.role === 'admin' && (
              <TeamActivityFeed
                activities={activities}
                users={users}
                visualSettings={visualSettings}
              />
            )}

            {activeTab === 'export' && (
              <ExportPanel
                tasks={tasks.filter(t => !t.isDeleted)}
                projects={projects}
                activities={activities}
                users={users}
                visualSettings={visualSettings}
              />
            )}

            {activeTab === 'google_sheets' && currentUser.role === 'admin' && (
              <GoogleSheetsSyncPanel
                localData={{
                  projects,
                  tasks: tasks.filter(t => !t.isDeleted),
                  users,
                  comments,
                  activities,
                  stages,
                  labels,
                  messages,
                  teamConversations
                }}
                onSyncLoaded={(newData) => {
                  if (newData.projects) setProjects(newData.projects);
                  if (newData.tasks) setTasks(newData.tasks);
                  if (newData.users) setUsers(newData.users);
                  if (newData.comments) setComments(newData.comments);
                  if (newData.activities) setActivities(newData.activities);
                  if (newData.stages) setStages(newData.stages);
                  if (newData.labels) setLabels(newData.labels);
                  if (newData.messages) setMessages(newData.messages);
                  if (newData.teamConversations) setTeamConversations(newData.teamConversations);
                }}
                currentUser={currentUser}
                triggerToast={triggerToast}
                brand={brand}
              />
            )}
          </motion.div>
         </AnimatePresence>
       </div>

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
              className="relative w-full max-w-lg bg-white border border-[#e5e5e5] rounded shadow-2xl p-6 md:p-8 overflow-hidden z-10"
            >
              {/* Decorative Header Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-black" />
              
              <div className="space-y-4 pt-2">
                <div className="inline-flex p-2.5 bg-[#f5f5f5] border border-[#e5e5e5] text-black rounded">
                  <Megaphone className="w-6 h-6" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-black tracking-tight">
                    {visualSettings.welcomeModalTitle || 'Welcome to AEC Design Kanban Studio!'}
                  </h3>
                  <div className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {visualSettings.welcomeModalContent || 'We have updated our internal design standard submission procedures. Please ensure all drawings and calculations are logged prior to initiating Peer & Q/C Reviews.'}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleDismissWelcomeModal}
                    className="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-[#333333] text-white rounded text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
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
              className="bg-white rounded shadow-xl w-full max-w-sm overflow-hidden border border-[#e5e5e5]"
            >
              <div className="bg-black p-5 text-white flex justify-between items-center">
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
                  <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider font-mono">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordChangeError(null); }}
                    className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded focus:ring-1 focus:ring-black focus:border-black transition-all outline-none font-sans"
                    placeholder="Min 4 characters"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wider font-mono">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordChangeError(null); }}
                    className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded focus:ring-1 focus:ring-black focus:border-black transition-all outline-none font-sans"
                    placeholder="Repeat new password"
                  />
                </div>

                {passwordChangeError && (
                  <div className="bg-rose-50 border border-rose-100 p-2 rounded flex items-center gap-2 text-rose-600 text-[10px] font-bold font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {passwordChangeError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowPasswordChangeModal(false)}
                    className="flex-1 px-4 py-2 border border-[#e5e5e5] text-[#737373] text-xs font-bold rounded hover:bg-[#fafafa] cursor-pointer"
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
                    className="flex-[2] px-4 py-2 bg-black hover:bg-[#333333] text-white text-xs font-bold rounded shadow-md transition-all cursor-pointer"
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
            tasks={tasks.filter(t => !t.isDeleted)}
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

      </main>

      {/* MINIMAL FOOTER */}
      {activeTab !== 'messages' && (
        <footer className="md:col-start-2 md:row-start-2 border-t border-[#e5e5e5] h-[60px] flex items-center justify-between px-10 font-mono text-[11px] uppercase tracking-wider text-[#737373] bg-white select-none">
          <p>{visualSettings.footerText || '© 2026 Nexus Design Ops. Standard workflow management.'}</p>
          <div className="flex gap-3 text-[10px] text-[#737373] items-center">
            <span>{stages.length} Lanes</span>
            <span>{users.length} Members</span>
            <span className="text-[8px] leading-[15px]">{tasks.length} Tasks</span>
          </div>
        </footer>
      )}

    </div>
  );
}
