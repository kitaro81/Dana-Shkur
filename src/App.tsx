import { useState, useEffect } from 'react';
import { Project, Task, User, WorkflowStage, Comment, Notification, UserRole, TaskType, Label, FlowPermissions, VisualSettings, ReportTemplateSettings, TaskTemplate } from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_USERS, 
  INITIAL_WORKFLOW_STAGES, 
  INITIAL_TASKS, 
  INITIAL_COMMENTS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_LABELS,
  INITIAL_TASK_TEMPLATES
} from './data/mockData';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { ReportsPanel } from './components/ReportsPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { CalendarView } from './components/CalendarView';
import { ArchivePanel } from './components/ArchivePanel';
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Users, 
  Bell, 
  Building2, 
  Menu,
  SwitchCamera,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // --- Persistent Storage State ---
  const [projects, setProjects] = useState<Project[]>(() => {
    const local = localStorage.getItem('kanban_projects');
    return local ? JSON.parse(local) : INITIAL_PROJECTS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const local = localStorage.getItem('kanban_users');
    return local ? JSON.parse(local) : INITIAL_USERS;
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

  const [labels, setLabels] = useState<Label[]>(() => {
    const local = localStorage.getItem('kanban_labels');
    return local ? JSON.parse(local) : INITIAL_LABELS;
  });

  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>(() => {
    const local = localStorage.getItem('kanban_task_templates');
    return local ? JSON.parse(local) : INITIAL_TASK_TEMPLATES;
  });

  // --- Visual & Report Custom Template Settings ---
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(() => {
    const saved = localStorage.getItem('visualSettings');
    const defaults = {
      showCalendarTab: true,
      showReportsTab: true,
      showArchiveTab: true,
      showTaskPriorityBadge: true,
      showOverdueHighlight: true,
      showHoursCounter: true,
      showTaskTypeIcon: true,
      welcomeModalEnabled: true,
      welcomeModalTitle: 'Welcome to AEC Design Kanban Studio!',
      welcomeModalContent: 'We have updated our internal design standard submission procedures. Please ensure all drawings and calculations are logged prior to initiating Peer & Q/C Reviews.',
      welcomeModalButtonText: 'Acknowledge & Proceed',
      activeMethodology: 'waterfall',
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        // ignore
      }
    }
    return defaults;
  });

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

  const handleUpdateReportTemplateSettings = (newSettings: ReportTemplateSettings) => {
    setReportTemplateSettings(newSettings);
    localStorage.setItem('reportTemplateSettings', JSON.stringify(newSettings));
  };

  const handleUpdateTaskTemplates = (newTemplates: TaskTemplate[]) => {
    setTaskTemplates(newTemplates);
  };

  // --- App View State ---
  const [activeTab, setActiveTab] = useState<'board' | 'reports' | 'calendar' | 'admin' | 'archive'>('board');

  // Auto-switch away from tabs that are turned off by the admin
  useEffect(() => {
    if (activeTab === 'calendar' && !visualSettings.showCalendarTab) {
      setActiveTab('board');
    } else if (activeTab === 'reports' && !visualSettings.showReportsTab) {
      setActiveTab('board');
    } else if (activeTab === 'archive' && !visualSettings.showArchiveTab) {
      setActiveTab('board');
    }
  }, [activeTab, visualSettings]);

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
  
  // --- Active Session User ---
  const [currentUser, setCurrentUser] = useState<User>(() => {
    return INITIAL_USERS[0]; // defaults to Dana Shkur (Admin)
  });

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
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'info' | 'alert' }[]>([]);
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
    localStorage.setItem('kanban_labels', JSON.stringify(labels));
  }, [labels]);

  useEffect(() => {
    localStorage.setItem('kanban_task_templates', JSON.stringify(taskTemplates));
  }, [taskTemplates]);

  // --- Helper to trigger lightweight temporary slide toasts ---
  const triggerToast = (text: string, type: 'success' | 'info' | 'alert' = 'success') => {
    const id = Date.now().toString() + '-' + Math.floor(Math.random() * 1000000);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // --- Task Operations Actions ---
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      loggedHours: 0,
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
    triggerToast('New task listed in backlog stages.');
  };

  const handleUpdateTaskStage = (taskId: string, targetStageId: string, targetTaskId?: string, isAfter?: boolean) => {
    const targetStage = stages.find(s => s.id === targetStageId);
    
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
      triggerToast(`Moved to ${targetStage?.name || targetStageId}`);
    } else {
      triggerToast('Task sequence reordered');
    }
  };

  const handleUpdateTaskDetails = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    triggerToast('Task details modified successfully.');
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

    // Send target assign alert notification
    const task = tasks.find(t => t.id === taskId);
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
    const createdUser: User = {
      ...newUser,
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      joinedAt: new Date().toISOString().split('T')[0]
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
      triggerToast(`Focussed user: ${target.name} (${target.role.replace('_', ' ')})`, 'info');
    }
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
    
    if (allowedProjects.length > 0 && !allowedProjects.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId(allowedProjects[0].id);
    }
  }, [currentUser.id, currentUser.discipline, currentUser.role, projects, tasks, flowPermissions, showArchivedProjects]);

  const activeProject = visibleProjects.find(p => p.id === selectedProjectId) || visibleProjects[0] || null;
  const activeTask = tasks.find(t => t.id === selectedTaskId);
  const unreadNotifCount = notifications.filter(
    n => !n.read && (n.userId === 'all' || n.userId === currentUser.email || n.userId === 'user-admin')
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* TOP DECK HEADER BAR */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-40">
        <div className="px-4 justify-between sm:px-6 w-full flex items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-slate-900">Nexus Design Ops</h1>
          </div>

          <div className="flex items-center gap-2.5">
            {/* PERSONA SWITCHER */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-150 px-2 py-1 rounded text-slate-600 hover:bg-slate-100 transition-colors">
              <span className="hidden sm:inline text-[9px] font-medium text-slate-400 uppercase tracking-wider">Role Temp:</span>
              <select
                className="text-[10px] font-medium text-slate-600 uppercase bg-transparent border-none focus:outline-none cursor-pointer"
                value={currentUser.id}
                onChange={(e) => handleSwitchSessionUser(e.target.value)}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="text-slate-900 font-sans font-normal">
                    {u.name} ({u.role.replace('_', ' ')}){u.deactivated ? ' [DEACTIVATED]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification trigger bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className="p-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors relative cursor-pointer border border-transparent"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 block w-1.5 h-1.5 rounded-full bg-indigo-600" />
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
        <div className="px-4 py-2.5 sm:px-6 mx-auto flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          
          {/* Multi-project dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Project:</span>
            <select
              className="px-2 py-1 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {visibleProjects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'board' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              Board
            </button>
            {visualSettings.showReportsTab && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'reports' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                Reports
              </button>
            )}
            {visualSettings.showCalendarTab && (
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                Calendar
              </button>
            )}
            {visualSettings.showArchiveTab && (
              <button
                onClick={() => setActiveTab('archive')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'archive' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                Archive
              </button>
            )}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                Settings
              </button>
            )}
          </div>

        </div>
      </section>

      {/* ACTIVE PROJECT INFO LEDGER BANNER */}
      {activeProject && activeTab === 'board' && (
        <section className="bg-white border-b border-slate-100">
          <div className="px-4 py-3 sm:px-6 mx-auto">
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {activeProject.name} <span className="text-xs font-normal text-slate-400">({activeProject.code})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 select-none">{activeProject.description}</p>
          </div>
        </section>
      )}

      {/* CORE CONTROLLER STAGE WORKSPACE */}
      <main className="flex-1 p-4 sm:p-6 mx-auto w-full">
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
                taskTemplates={taskTemplates}
                onAddTask={handleAddTask}
                onUpdateTaskStage={handleUpdateTaskStage}
                onSelectTask={(id) => setSelectedTaskId(id)}
                onArchiveCompletedTasks={handleArchiveCompletedTasks}
                onUpdateTask={handleUpdateTaskDetails}
                onDeleteTask={handleDeleteTask}
                onToggleArchiveTask={handleToggleArchiveTask}
                onDeleteProject={handleDeleteProject}
                onToggleArchiveProject={handleToggleArchiveProject}
                showArchivedTasks={showArchivedTasks}
                setShowArchivedTasks={setShowArchivedTasks}
                showArchivedProjects={showArchivedProjects}
                setShowArchivedProjects={setShowArchivedProjects}
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
                taskTemplates={taskTemplates}
                onUpdateTaskTemplates={handleUpdateTaskTemplates}
                labels={labels}
                onAddProject={handleAddProject}
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
                showArchivedProjects={showArchivedProjects}
                setShowArchivedProjects={setShowArchivedProjects}
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
             flowPermissions={flowPermissions}
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

      {/* MINIMAL FOOTER */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12 select-none">
        <div className="px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 Nexus Design Ops. Standard workflow management.</p>
          <div className="flex gap-3 text-[10px] text-slate-400">
            <span>{stages.length} Lanes</span>
            <span>{users.length} Members</span>
            <span>{tasks.length} Tasks</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
