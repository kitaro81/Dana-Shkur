import React, { useState, useEffect, useMemo } from 'react';
import { Task, Project, User, WorkflowStage, TaskType, Label, VisualSettings } from '../types';
import { Plus, Search, Filter, AlertTriangle, ArrowRight, Clock, User as UserIcon, Archive, Link, Check, Table, GripVertical, Compass, Layers, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KanbanBoardProps {
  project: Project | null;
  tasks: Task[];
  users: User[];
  stages: WorkflowStage[];
  currentUser: User;
  labels: Label[];
  visualSettings?: VisualSettings;
  projects?: Project[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>) => void;
  onUpdateTaskStage: (taskId: string, targetStageId: string, targetTaskId?: string, isAfter?: boolean) => void;
  onSelectTask: (taskId: string) => void;
  onArchiveCompletedTasks?: (projectId: string) => void;
  onUpdateTask?: (updatedTask: Task) => void;
  onBulkUpdateTasks?: (taskIds: string[], updates: Partial<Task>) => void;
  onBulkArchiveTasks?: (taskIds: string[]) => void;
  forceOpenAddTask?: boolean;
  onResetForceOpenAddTask?: () => void;
  onUpdateStages?: (stages: WorkflowStage[]) => void;
  onUpdateVisualSettings?: (settings: VisualSettings) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  project,
  tasks,
  users,
  stages,
  currentUser,
  labels,
  visualSettings,
  projects,
  onAddTask,
  onUpdateTaskStage,
  onSelectTask,
  onArchiveCompletedTasks,
  onUpdateTask,
  onBulkUpdateTasks,
  onBulkArchiveTasks,
  forceOpenAddTask,
  onResetForceOpenAddTask,
  onUpdateStages,
  onUpdateVisualSettings,
}) => {
  const showPriority = visualSettings?.showTaskPriorityBadge !== false;
  const showOverdue = visualSettings?.showOverdueHighlight !== false;
  const showDisciplineBadge = visualSettings?.showTaskTypeIcon !== false;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<TaskType | 'all'>('all');
  const [selectedLabelFilterId, setSelectedLabelFilterId] = useState<string>('all');
  
  // Multi-select state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showBulkStageMenu, setShowBulkStageMenu] = useState(false);
  const [showBulkLabelMenu, setShowBulkLabelMenu] = useState(false);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleBulkArchive = () => {
    if (onBulkArchiveTasks && selectedTaskIds.length > 0) {
      onBulkArchiveTasks(selectedTaskIds);
      setSelectedTaskIds([]);
    }
  };

  const handleBulkMove = (stageId: string) => {
    if (onBulkUpdateTasks && selectedTaskIds.length > 0) {
      onBulkUpdateTasks(selectedTaskIds, { stageId });
      setSelectedTaskIds([]);
      setShowBulkStageMenu(false);
    }
  };

  const handleBulkAddLabel = (labelId: string) => {
    if (onBulkUpdateTasks && selectedTaskIds.length > 0) {
      // For each task, we need to add the label if it's not already there
      const taskUpdates = tasks.filter(t => selectedTaskIds.includes(t.id));
      taskUpdates.forEach(task => {
        const currentLabels = task.labelIds || [];
        if (!currentLabels.includes(labelId)) {
          onUpdateTask?.({
            ...task,
            labelIds: [...currentLabels, labelId],
            updatedAt: new Date().toISOString()
          });
        }
      });
      setSelectedTaskIds([]);
      setShowBulkLabelMenu(false);
    }
  };
  
  // Track collapsed stages in mobile horizontal list layout (default all expanded/false)
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});

  const toggleStageCollapsed = (stageId: string) => {
    setCollapsedStages(prev => {
      const current = prev[stageId] ?? (typeof window !== 'undefined' && window.innerWidth < 768);
      return {
        ...prev,
        [stageId]: !current
      };
    });
  };
  
  // Create task state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<TaskType>('architecture');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [sortBy, setSortBy] = useState<'custom' | 'priority' | 'date' | 'effort'>('custom');
  const [newStoryPoints, setNewStoryPoints] = useState<number>(3);
  const [newTShirtSize, setNewTShirtSize] = useState<'S' | 'M' | 'L' | 'XL'>('M');
  const [newSelectedProjectId, setNewSelectedProjectId] = useState<string>(project?.id === 'all' ? (projects && projects[0]?.id || '') : (project?.id || ''));

  useEffect(() => {
    if (project?.id && project.id !== 'all') {
      setNewSelectedProjectId(project.id);
    } else if (project?.id === 'all' && projects && projects.length > 0) {
      setNewSelectedProjectId(projects[0].id);
    }
  }, [project, projects]);

  // Multiple select states for multi assignee/disciplines
  const [newAssignedUserIds, setNewAssignedUserIds] = useState<string[]>([]);
  const [newDisciplines, setNewDisciplines] = useState<TaskType[]>([]);

  useEffect(() => {
    if (forceOpenAddTask) {
      setShowAddForm(true);
      if (onResetForceOpenAddTask) {
        onResetForceOpenAddTask();
      }
    }
  }, [forceOpenAddTask, onResetForceOpenAddTask]);

  const isTeamMember = currentUser.role !== 'admin' && currentUser.role !== 'viewer';

  // Sync state with current user roles and discipline
  React.useEffect(() => {
    if (isTeamMember && currentUser.discipline) {
      setNewType(currentUser.discipline);
      setSelectedDiscipline(currentUser.discipline);
    } else {
      setSelectedDiscipline('all');
    }
  }, [currentUser.id, currentUser.role, currentUser.discipline, isTeamMember]);
  
  // Inline card-level quick note editing state
  const [editingNoteTaskId, setEditingNoteTaskId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [newLabelIds, setNewLabelIds] = useState<string[]>([]);
  const [boardViewMode, setBoardViewMode] = useState<'pipeline' | 'methodology'>('pipeline');
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <h3 className="text-base font-bold text-slate-700 mb-1">No Project Available</h3>
        <p className="text-xs text-slate-500 max-w-md">Please provision or select a design active project to manage tasks on the Kanban board.</p>
      </div>
    );
  }

  // Filter tasks belonging only to the current active project, search title, and selected design discipline 
  const projectTasks = useMemo(() => {
    return tasks.filter(t => (project.id === 'all' || t.projectId === project.id) && !t.archived);
  }, [tasks, project.id]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return projectTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(q) || 
                            task.description.toLowerCase().includes(q);
      const matchesDiscipline = selectedDiscipline === 'all' || task.type === selectedDiscipline;
      const matchesLabel = selectedLabelFilterId === 'all' || (task.labelIds && task.labelIds.includes(selectedLabelFilterId));
      return matchesSearch && matchesDiscipline && matchesLabel;
    });
  }, [projectTasks, searchQuery, selectedDiscipline, selectedLabelFilterId]);

  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [isDragOverBufferAfter, setIsDragOverBufferAfter] = useState<boolean>(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDragOverStageId, setActiveDragOverStageId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setActiveDragOverStageId(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault(); // mandatory to allow drop
    if (activeDragOverStageId !== stageId) {
      setActiveDragOverStageId(stageId);
    }
  };

  const handleDragLeaveStage = (e: React.DragEvent) => {
    // Only remove active highlight if we actually drag outside of the column container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setActiveDragOverStageId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDraggedTaskId(null);
    setActiveDragOverStageId(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      const taskObj = tasks.find(t => t.id === taskId);
      const firstStageId = stages[0]?.id;

      if (visualSettings?.agileRequireStoryPoints && targetStageId !== firstStageId) {
        const metric = visualSettings.agileEstimationMetric || 'story_points';
        let hasEstimation = false;
        if (metric === 't_shirt') {
          hasEstimation = !!taskObj?.tShirtSize;
        } else {
          hasEstimation = !!taskObj?.storyPoints;
        }

        if (!hasEstimation) {
          alert(`⚠️ Agile Guardrail: Mandatory Estimation is active. Please click to open this task card and assign Story Points before moving it from the backlog!`);
          return;
        }
      }
      onUpdateTaskStage(taskId, targetStageId);
      setSortBy('custom');
    }
  };

  const handleCardDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (isViewer) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const isAfter = offset > rect.height / 2;

    setDragOverTaskId(targetTaskId);
    setIsDragOverBufferAfter(isAfter);
  };

  const handleCardDragLeave = () => {
    setDragOverTaskId(null);
  };

  const handleCardDrop = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTaskId(null);

    if (isViewer) return;

    const draggedTaskId = e.dataTransfer.getData('text/plain');
    if (!draggedTaskId || draggedTaskId === targetTask.id) return;

    const taskObj = tasks.find(t => t.id === draggedTaskId);
    const firstStageId = stages[0]?.id;

    if (visualSettings?.agileRequireStoryPoints && targetTask.stageId !== firstStageId) {
      const metric = visualSettings.agileEstimationMetric || 'story_points';
      let hasEstimation = false;
      if (metric === 't_shirt') {
        hasEstimation = !!taskObj?.tShirtSize;
      } else {
        hasEstimation = !!taskObj?.storyPoints;
      }

      if (!hasEstimation) {
        alert(`⚠️ Agile Guardrail: Mandatory Estimation is active. Please click to open this task card and assign Story Points before moving it from the backlog!`);
        return;
      }
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const isAfter = offset > rect.height / 2;

    onUpdateTaskStage(draggedTaskId, targetTask.stageId, targetTask.id, isAfter);
    setSortBy('custom');
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Default due date to 2 weeks out if empty
    let finalDueDate = newDueDate;
    if (!finalDueDate) {
      const future = new Date();
      future.setDate(future.getDate() + 14);
      finalDueDate = future.toISOString().split('T')[0];
    }

    const disciplinesToSubmit = currentUser.role === 'engineer' && currentUser.discipline
      ? [currentUser.discipline]
      : (newDisciplines.length > 0 ? newDisciplines : [newType]);

    const assigneesToSubmit = currentUser.role === 'engineer'
      ? [currentUser.id]
      : (newAssignedUserIds.length > 0 ? newAssignedUserIds : (newAssignedTo ? [newAssignedTo] : []));

    onAddTask({
      projectId: project.id === 'all' ? (newSelectedProjectId || (projects && projects[0]?.id) || 'all') : project.id,
      title: newTitle.trim(),
      description: newDesc.trim(),
      type: disciplinesToSubmit[0] || 'other',
      stageId: stages[0]?.id || 'todo', // adds to the first column
      priority: newPriority,
      assignedTo: assigneesToSubmit[0] || undefined,
      dueDate: finalDueDate,
      labelIds: newLabelIds,
      disciplines: disciplinesToSubmit,
      assignedUserIds: assigneesToSubmit,
      storyPoints: newStoryPoints,
      tShirtSize: newTShirtSize,
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewType('architecture');
    setNewPriority('medium');
    setNewAssignedTo('');
    setNewDueDate('');
    setNewLabelIds([]);
    setNewAssignedUserIds([]);
    setNewDisciplines([]);
    setNewStoryPoints(3);
    setNewTShirtSize('M');
    setShowAddForm(false);
  };

  const isViewer = currentUser.role === 'viewer';
  const lastStageId = stages[stages.length - 1]?.id || 'approved';
  const completedTasksCount = projectTasks.filter(t => t.stageId === lastStageId || t.stageId === 'approved').length;

  const handleApplyPresetInBoard = (presetType: 'waterfall' | 'agile' | 'simple') => {
    let presetStages: WorkflowStage[] = [];
    if (presetType === 'waterfall') {
      presetStages = [
        { id: 'planning', name: 'Planning & Feasibility', color: '#64748b', order: 0 },
        { id: 'design', name: 'Core Drafting & Design', color: '#3b82f6', order: 1 },
        { id: 'peer_review', name: 'Peer & Q/C Review', color: '#f59e0b', order: 2 },
        { id: 'client_approval', name: 'Client Approval', color: '#8b5cf6', order: 3 },
        { id: 'approved', name: 'Issued for Construction', color: '#10b981', order: 4 },
      ];
    } else if (presetType === 'agile') {
      presetStages = [
        { id: 'backlog', name: 'Backlog / To Do', color: '#475569', order: 0 },
        { id: 'in_progress', name: 'Active Sprint', color: '#2563eb', order: 1 },
        { id: 'code_review', name: 'QC & Code Review', color: '#db2777', order: 2 },
        { id: 'testing', name: 'Testing & Validation', color: '#ca8a04', order: 3 },
        { id: 'approved', name: 'Done / Delivered', color: '#059669', order: 4 },
      ];
    } else {
      presetStages = [
        { id: 'todo', name: 'Simple Tasks To Do', color: '#64748b', order: 0 },
        { id: 'in_progress', name: 'Under Execution', color: '#3b82f6', order: 1 },
        { id: 'blocked', name: 'Blocked / Delayed', color: '#ef4444', order: 2 },
        { id: 'approved', name: 'Completed / Done', color: '#10b981', order: 3 },
      ];
    }
    onUpdateStages?.(presetStages);
    if (onUpdateVisualSettings && visualSettings) {
      onUpdateVisualSettings({
        ...visualSettings,
        activeMethodology: presetType
      });
    }
    setLocalFeedback(`Switched project delivery methodology to ${presetType === 'waterfall' ? 'Waterfall Sequential' : presetType === 'agile' ? 'Agile Scrum' : 'Simple Kanban'}! Stages populated.`);
  };

  const sprintStageId = stages.find(s => s.id.toLowerCase().includes('sprint') || s.id.toLowerCase().includes('progress'))?.id || stages[1]?.id || 'sprint';
  const activeSprintTasks = tasks.filter(t => t.stageId === sprintStageId && !t.archived);
  const metricName = visualSettings?.agileEstimationMetric === 't_shirt' ? 'T-Shirt Weight' : 'Story Points';
  
  let currentLoad = 0;
  const tShirtMapping: Record<string, number> = { S: 1, M: 3, L: 5, XL: 8 };
  if (visualSettings?.agileEstimationMetric === 't_shirt') {
    currentLoad = activeSprintTasks.reduce((sum, t) => sum + (tShirtMapping[t.tShirtSize || 'M'] || 3), 0);
  } else {
    currentLoad = activeSprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  }
  const targetCapacity = visualSettings?.agileTargetCapacity || 30;
  const loadPercentage = Math.min(100, Math.round((currentLoad / targetCapacity) * 100)) || 0;

  return (
    <div className="space-y-6">
      
      {/* Segmented View Mode Toggle: Methodology vs Pipeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 shadow-3xs">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-white rounded-lg border border-slate-200/60 flex items-center gap-1 shadow-3xs">
            <button
              onClick={() => setBoardViewMode('pipeline')}
              className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                boardViewMode === 'pipeline'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-850 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Pipeline View</span>
            </button>
            <button
              onClick={() => setBoardViewMode('methodology')}
              className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                boardViewMode === 'methodology'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-850 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Methodology & Presets</span>
            </button>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono ml-1 hidden md:inline">
            Active Delivery Standard: <span className="text-indigo-600 font-extrabold">{visualSettings?.activeMethodology || 'waterfall'}</span>
          </span>
        </div>

        {/* Dynamic status or helper text on current selection */}
        <div className="text-[11px] text-slate-500 font-medium select-none px-2 flex items-center gap-1.5">
          {boardViewMode === 'pipeline' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Flowing {filteredTasks.length} design tickets across {stages.length} pipeline phases</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>Standardize project stage structures & iteration rules</span>
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedTaskIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-[57px] z-30 flex items-center justify-between gap-4 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg border border-indigo-500"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full text-[11px] font-bold">
                {selectedTaskIds.length}
              </div>
              <span className="text-xs font-bold tracking-tight">Tasks Selected</span>
              <button 
                onClick={() => setSelectedTaskIds([])}
                className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 hover:text-white transition-colors cursor-pointer ml-2"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowBulkStageMenu(!showBulkStageMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Move Stage
                </button>
                <AnimatePresence>
                  {showBulkStageMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50"
                    >
                      {stages.map(stage => (
                        <button
                          key={stage.id}
                          onClick={() => handleBulkMove(stage.id)}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                          {stage.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowBulkLabelMenu(!showBulkLabelMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  Add Tag
                </button>
                <AnimatePresence>
                  {showBulkLabelMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 max-h-60 overflow-y-auto"
                    >
                      {labels.map(label => (
                        <button
                          key={label.id}
                          onClick={() => handleBulkAddLabel(label.id)}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                          {label.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-rose-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {localFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-3xs animate-fadeIn">
          <span>🎉 {localFeedback}</span>
          <button onClick={() => setLocalFeedback(null)} className="text-emerald-500 hover:text-emerald-750 cursor-pointer">✕</button>
        </div>
      )}

      {boardViewMode === 'pipeline' ? (
        <>
          {/* Search & Discipline Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200 shadow-3xs w-full">
        
        {/* Search */}
        <div className="relative w-full md:w-[350px] shrink-0 p-2 sm:p-4">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 rounded bg-slate-50 hover:bg-slate-50 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="w-full basis-full md:basis-auto md:w-auto max-w-full pb-0.5 shrink-0 select-none">
          {currentUser.role !== 'admin' && currentUser.role !== 'viewer' ? (
            <div className="flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded text-amber-800 text-xs font-bold font-mono shadow-3xs select-none w-full">
              <span>🔒 {currentUser.discipline?.toUpperCase()} VIEW</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-1.5 font-sans w-full">
              <button
                onClick={() => setSelectedDiscipline('all')}
                className={`group px-2 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer flex items-center justify-center gap-1.5 w-auto ${
                  selectedDiscipline === 'all' 
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span>🌐</span>
                <span className="inline whitespace-nowrap">All</span>
              </button>

              {(['architecture', 'structure', 'electric', 'mechanical', 'other'] as TaskType[]).map(disc => {
                const getDisciplineIcon = (d: TaskType) => {
                  switch (d) {
                    case 'architecture': return '🏛️';
                    case 'structure': return '🏗️';
                    case 'electric': return '⚡';
                    case 'mechanical': return '⚙️';
                    default: return '📁';
                  }
                };
                return (
                  <button
                    key={disc}
                    onClick={() => setSelectedDiscipline(disc)}
                    className={`group px-2 py-1.5 text-xs font-medium rounded border transition-colors capitalize cursor-pointer flex items-center justify-center gap-1.5 w-auto ${
                      selectedDiscipline === disc 
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span>{getDisciplineIcon(disc)}</span>
                    <span className="inline whitespace-nowrap">{disc}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap flex-shrink-0 w-full md:w-auto justify-center">

          {!isViewer && onArchiveCompletedTasks && (
            <button
              onClick={() => onArchiveCompletedTasks(project.id)}
              disabled={completedTasksCount === 0}
              className={`group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border rounded text-xs font-medium transition-all select-none ${
                completedTasksCount === 0
                  ? 'bg-slate-50 border-slate-200 text-slate-350 cursor-not-allowed'
                  : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-700 font-semibold cursor-pointer shadow-3xs hover:shadow-2xs active:scale-[0.98]'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Archive Completed ({completedTasksCount})</span>
              <span className="inline sm:hidden group-hover:hidden group-focus:hidden group-active:hidden text-[10px] font-bold">{completedTasksCount}</span>
            </button>
          )}

          {/* Add Task button */}
          {!isViewer && (
            <button
              onClick={() => setShowAddForm(true)}
              className="group flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline group-hover:inline group-focus:inline group-active:inline whitespace-nowrap">Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Creation Drawer/Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-50 border border-slate-200 rounded-lg p-4"
          >
            <h3 className="text-xs font-bold text-slate-800 mb-3 pb-1.5 border-b border-slate-200">New Task</h3>
            <form onSubmit={handleAddTaskSubmit} className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                {project.id === 'all' && projects && (
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Target Project</label>
                    <select
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 bg-white cursor-pointer font-medium text-slate-800"
                      value={newSelectedProjectId}
                      onChange={(e) => setNewSelectedProjectId(e.target.value)}
                      required
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Task Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Update seismic joint calculations"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 bg-white"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Multi-discipline checkbox selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Disciplines (Select Multiple)</label>
                {isTeamMember && currentUser.discipline ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded text-amber-800 text-xs font-bold font-mono">
                    🔒 {currentUser.discipline.toUpperCase()} (Team Member Lock)
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4 p-2.5 bg-white border border-slate-200 rounded-lg">
                    {(['architecture', 'structure', 'electric', 'mechanical', 'other'] as TaskType[]).map(disc => {
                      const isChecked = newDisciplines.includes(disc) || (newDisciplines.length === 0 && newType === disc);
                      return (
                        <label key={disc} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setNewDisciplines(prev => {
                                const currentList = prev.length > 0 ? prev : [newType];
                                if (currentList.includes(disc)) {
                                  if (currentList.length === 1) return currentList;
                                  const next = currentList.filter(d => d !== disc);
                                  setNewType(next[0] || 'other');
                                  return next;
                                } else {
                                  const next = [...currentList, disc];
                                  setNewType(next[0]);
                                  return next;
                                }
                              });
                            }}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <span className="capitalize">{disc}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Description</label>
                <textarea
                  placeholder="Outline task details and standards..."
                  rows={2}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 bg-white"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                />
              </div>

              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Priority</label>
                  <select
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 bg-white cursor-pointer"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {visualSettings?.agileEstimationMetric === 't_shirt' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">T-Shirt Size Weight</label>
                    <select
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 bg-white cursor-pointer"
                      value={newTShirtSize}
                      onChange={(e) => setNewTShirtSize(e.target.value as any)}
                    >
                      {['S', 'M', 'L', 'XL'].map(sz => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Assignees (Select Multiple)</label>
                  {currentUser.role === 'engineer' ? (
                    <div className="p-2 bg-amber-50/50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-medium">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="font-bold">🔒 Assigned to Yourself</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-2 py-1.5 border border-amber-100 rounded">
                        <div className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[9px] font-bold">
                          {currentUser.name[0]}
                        </div>
                        <span className="font-semibold text-slate-700">{currentUser.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-white border border-slate-200 rounded-lg max-h-[120px] overflow-y-auto">
                      {users.filter(u => !u.deactivated).map(u => {
                        const isChecked = newAssignedUserIds.includes(u.id) || (newAssignedUserIds.length === 0 && newAssignedTo === u.id);
                        return (
                          <label key={u.id} className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded transition-colors text-[11px] text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setNewAssignedUserIds(prev => {
                                  const currentList = prev.length > 0 ? prev : (newAssignedTo ? [newAssignedTo] : []);
                                  if (currentList.includes(u.id)) {
                                    const next = currentList.filter(id => id !== u.id);
                                    setNewAssignedTo(next[0] || '');
                                    return next;
                                  } else {
                                    const next = [...currentList, u.id];
                                    setNewAssignedTo(next[0]);
                                    return next;
                                  }
                                });
                              }}
                              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                            />
                            <span className="truncate" title={u.name}>{u.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Due Date</label>
                  <input
                    type="date"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 bg-white cursor-pointer"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Optional labels selection */}
              <div className="pt-2">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Assign Tags / Labels</label>
                <div className="flex flex-wrap gap-2">
                  {labels.map(lbl => {
                    const isSelected = newLabelIds.includes(lbl.id);
                    return (
                      <button
                        type="button"
                        key={lbl.id}
                        onClick={() => {
                          setNewLabelIds(prev => 
                            prev.includes(lbl.id) 
                              ? prev.filter(id => id !== lbl.id) 
                              : [...prev, lbl.id]
                          );
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all select-none font-medium cursor-pointer ${
                          isSelected ? 'font-semibold ring-1' : 'hover:bg-slate-100 hover:text-slate-700'
                        }`}
                        style={{
                          backgroundColor: isSelected ? lbl.color + '20' : '#f8fafc',
                          color: isSelected ? lbl.color : '#64748b',
                          borderColor: isSelected ? lbl.color + '50' : '#e2e8f0',
                          borderWidth: '1px'
                        }}
                      >
                        {lbl.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 rounded text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board Grid */}
      <div className="flex flex-col md:flex-row md:flex-nowrap gap-3.5 pb-4 w-full md:overflow-x-auto select-none">
        {stages.map(stage => {
          const stageTasks = filteredTasks.filter(t => t.stageId === stage.id);
          const isCollapsed = collapsedStages[stage.id] ?? (typeof window !== 'undefined' && window.innerWidth < 768);
          
          const sortedStageTasks = [...stageTasks].sort((a, b) => {
            if (sortBy === 'priority') {
              const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
              const aWeight = priorityWeights[a.priority] || 0;
              const bWeight = priorityWeights[b.priority] || 0;
              return bWeight - aWeight;
            }
            if (sortBy === 'date') {
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (sortBy === 'effort') {
              const isTShirt = visualSettings?.agileEstimationMetric === 't_shirt';
              if (isTShirt) {
                const tShirtWeights = { 'XL': 4, 'L': 3, 'M': 2, 'S': 1 };
                return (tShirtWeights[b.tShirtSize || 'M'] || 2) - (tShirtWeights[a.tShirtSize || 'M'] || 2);
              } else {
                return (b.storyPoints || 0) - (a.storyPoints || 0);
              }
            }
            return 0; // keeps the drag-and-drop sequence order as is
          });
          
          return (
            <div 
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeaveStage}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`kanban-column-container flex flex-col w-full md:flex-1 md:min-w-0 md:shrink rounded-lg transition-all duration-200 border-2 ${
                isCollapsed 
                  ? 'max-h-[50px] min-h-[50px] md:max-h-[70vh] md:min-h-[420px]' 
                  : 'max-h-[70vh] min-h-[120px] md:min-h-[420px]'
              } ${
                activeDragOverStageId === stage.id 
                  ? 'bg-indigo-50/45 border-indigo-400 shadow-sm scale-[1.01]' 
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Column Header - Clickable on mobile to expand/collapse */}
              <div 
                onClick={() => {
                  if (window.innerWidth < 768) {
                    toggleStageCollapsed(stage.id);
                  }
                }}
                className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200/60 cursor-pointer md:cursor-default select-none"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate max-w-[180px] sm:max-w-[220px] md:max-w-[130px]" title={stage.name}>
                    {stage.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/60 text-slate-600">
                    {stageTasks.length}
                  </span>
                  <div className="md:hidden text-slate-400 hover:text-slate-600 transition-colors">
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
 
              {/* Column Task Area */}
              <div className={`flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 sm:space-y-3.5 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
                {sortedStageTasks.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center h-full py-12 text-slate-400 text-center p-2 border-2 border-dashed rounded-xl transition-colors duration-200 ${
                    activeDragOverStageId === stage.id ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-100'
                  }`}>
                    <Plus className={`w-5 h-5 mb-1 transition-colors ${activeDragOverStageId === stage.id ? 'text-indigo-400' : 'text-slate-200'}`} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">{activeDragOverStageId === stage.id ? 'Drop to Add' : 'Empty Column'}</p>
                  </div>
                ) : (
                  sortedStageTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assignedTo);
                    const isTaskOverdue = task.stageId !== 'approved' && new Date(task.dueDate) < new Date();
                    
                    return (
                      <React.Fragment key={task.id}>
                        {dragOverTaskId === task.id && !isDragOverBufferAfter && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 6, opacity: 1 }}
                            className="w-full bg-indigo-500 rounded-full my-1.5 shadow-[0_0_10px_rgba(99,102,241,0.5)] z-10" 
                          />
                        )}
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ 
                            y: -3, 
                            scale: 1.015,
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                          }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 25,
                            layout: { duration: 0.15 }
                          }}
                          draggable={!isViewer}
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleCardDragOver(e, task.id)}
                          onDragLeave={handleCardDragLeave}
                          onDrop={(e) => handleCardDrop(e, task)}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('.selection-trigger')) return;
                            onSelectTask(task.id);
                          }}
                          className={`${
                            visualSettings?.cardCompactness === 'compact' ? 'p-2' :
                            visualSettings?.cardCompactness === 'spacious' ? 'p-4.5' :
                            'p-3'
                          } bg-white border border-slate-200/80 rounded hover:border-slate-350 cursor-pointer relative group transition-all duration-200 ${
                            isViewer ? '' : 'active:scale-[0.98]'
                          } ${
                            showOverdue && isTaskOverdue 
                              ? 'border-rose-300 bg-gradient-to-br from-rose-50/15 via-white to-white shadow-xs hover:shadow-rose-100/20' 
                              : ''
                          } ${
                            draggedTaskId === task.id 
                              ? 'opacity-25 border-dashed border-indigo-400 scale-[0.97] pointer-events-none' 
                              : ''
                          } ${
                            selectedTaskIds.includes(task.id) ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10' : ''
                          }`}
                        >
                          {/* Selection Checkbox Overlay */}
                          {!isViewer && (
                            <div 
                              className={`selection-trigger absolute top-2 right-2 z-10 transition-opacity ${
                                selectedTaskIds.includes(task.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskSelection(task.id);
                              }}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                selectedTaskIds.includes(task.id) 
                                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                                  : 'bg-white border-slate-300 hover:border-indigo-400'
                              }`}>
                                {selectedTaskIds.includes(task.id) && <Check className="w-2.5 h-2.5" />}
                              </div>
                            </div>
                          )}

                          {/* Left-edge ribbon indicator for overdue cards */}
                          {showOverdue && isTaskOverdue && (
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500 rounded-l" />
                          )}
                          {/* Task metadata row */}
                          <div className="flex justify-between items-center gap-2 mb-1.5">
                            <div className="flex items-center gap-1">
                              {!isViewer && (
                                <div 
                                  className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 cursor-grab active:cursor-grabbing p-1 bg-slate-50/80 border border-slate-200 rounded-md transition-all flex items-center justify-center shadow-3xs mr-1 shrink-0" 
                                  title="Drag or touch and hold this grip handle to move the task card"
                                >
                                  <GripVertical className="w-4 h-4 md:w-3.5 md:h-3.5 shrink-0" />
                                </div>
                              )}
                            </div>

                            {showPriority && (
                              <span className={`text-[9px] font-medium capitalize ${
                                task.priority === 'critical' ? 'text-red-500' :
                                task.priority === 'high' ? 'text-orange-450' :
                                task.priority === 'medium' ? 'text-slate-500' :
                                'text-slate-400'
                              }`}>
                                {task.priority}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-semibold text-slate-800 leading-snug mb-2">{task.title}</h4>

                          {/* Task Labels Scanning Badges */}
                          {task.labelIds && task.labelIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {task.labelIds.map(labelId => {
                                const labelItem = labels.find(l => l.id === labelId);
                                if (!labelItem) return null;
                                return (
                                  <span
                                    key={labelId}
                                    style={{
                                      backgroundColor: labelItem.color + '12',
                                      color: labelItem.color,
                                      borderColor: labelItem.color + '30',
                                    }}
                                    className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border leading-none tracking-tight select-none shadow-3xs"
                                  >
                                    <span 
                                      className="w-1.5 h-1.5 rounded-full" 
                                      style={{ backgroundColor: labelItem.color }}
                                    />
                                    {labelItem.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Quick detail items (Estimation metrics only) */}
                          {(() => {
                            const metric = visualSettings?.agileEstimationMetric || 'story_points';
                            const hasEstimation = (metric === 't_shirt' && task.tShirtSize) || (metric !== 't_shirt' && task.storyPoints);
                            if (!hasEstimation) return null;
                            return (
                              <div className="flex justify-end text-[10px] text-slate-400 mb-2">
                                {metric === 't_shirt' && task.tShirtSize ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-700 font-mono select-none" title="T-Shirt Size Estimation">
                                    👕 {task.tShirtSize}
                                  </span>
                                ) : task.storyPoints ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono select-none" title="Story Points Estimation">
                                    ⚡ {task.storyPoints} SP
                                  </span>
                                ) : null}
                              </div>
                            );
                          })()}

                          {/* Dependency Mapping Blocker Badge */}
                          {task.dependencies && task.dependencies.length > 0 && (() => {
                            const projectTasks = tasks.filter(t => t.projectId === task.projectId);
                            const blockingTasks = projectTasks.filter(t => task.dependencies?.includes(t.id));
                            const incompleteBlockers = blockingTasks.filter(t => t.stageId !== 'approved');
                            const isBlocked = incompleteBlockers.length > 0;
                            
                            return (
                              <div 
                                className={`mb-2 p-1 px-1.5 text-[8.5px] rounded font-medium flex items-center justify-between border cursor-pointer select-none transition-all ${
                                  isBlocked 
                                    ? 'bg-amber-50/50 border-amber-200/50 text-amber-700 hover:bg-amber-100/60 font-semibold' 
                                    : 'bg-slate-50/70 text-slate-500 border-slate-200/30 hover:bg-slate-100'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isBlocked && incompleteBlockers[0]) {
                                    onSelectTask(incompleteBlockers[0].id);
                                  } else {
                                    onSelectTask(task.id);
                                  }
                                }}
                                title={isBlocked ? `Prerequisites: ${incompleteBlockers.map(t => t.title).join(', ')}` : 'All prerequisites completed.'}
                              >
                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                  <Link className={`w-2.5 h-2.5 ${isBlocked ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
                                  <span className="truncate">
                                    {isBlocked ? `${incompleteBlockers.length} Blocker(s)` : 'Prereqs Resolved'}
                                  </span>
                                </div>
                                <span className="font-bold text-[8px] tracking-tight uppercase px-1 rounded-xs flex-shrink-0">
                                  {isBlocked ? 'Blocked' : 'Clear'}
                                </span>
                              </div>
                            );
                          })()}

                          {/* Quick note display or inline editor section */}
                          {editingNoteTaskId === task.id ? (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-305 rounded-md text-[10px]" onClick={e => e.stopPropagation()}>
                              <textarea
                                value={tempNoteText}
                                onChange={e => setTempNoteText(e.target.value)}
                                className="w-full text-xs p-1.5 border border-amber-200 rounded focus:outline-none bg-white font-medium text-slate-700 font-sans"
                                placeholder="Type quick reminder or note..."
                                rows={2}
                                autoFocus
                              />
                              <div className="flex justify-end gap-1 mt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteTaskId(null)}
                                  className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-500 rounded hover:bg-slate-200 cursor-pointer font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onUpdateTask) {
                                      onUpdateTask({ ...task, quickNote: tempNoteText || undefined, updatedAt: new Date().toISOString() });
                                    }
                                    setEditingNoteTaskId(null);
                                  }}
                                  className="px-1.5 py-0.5 text-[9px] bg-amber-600 text-white rounded font-bold hover:bg-amber-700 cursor-pointer"
                                >
                                  Save Note
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={(e) => {
                                if (!isViewer && onUpdateTask) {
                                  e.stopPropagation();
                                  setEditingNoteTaskId(task.id);
                                  setTempNoteText(task.quickNote || '');
                                }
                              }}
                              className={`mt-2 p-2 rounded text-[10px] leading-normal font-sans border transition-all duration-150 ${
                                task.quickNote 
                                  ? 'bg-amber-50/60 border-amber-200/40 hover:bg-amber-100/60 hover:border-amber-200 text-amber-805 cursor-pointer shadow-3xs' 
                                  : 'bg-slate-50/15 border-dashed border-slate-200/45 text-slate-400 hover:border-amber-200/60 hover:text-amber-800 opacity-0 group-hover:opacity-100 cursor-pointer'
                              }`}
                              title={task.quickNote ? 'Click to edit note' : 'Click to add quick note'}
                            >
                              {task.quickNote ? (
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1 text-amber-600 font-mono text-[8px] uppercase tracking-wider font-bold">
                                    <span>📝 Quick Note</span>
                                  </div>
                                  <p className="italic text-slate-750 font-medium pl-1.5 truncate">{task.quickNote}</p>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1 text-[9px] font-semibold font-mono uppercase tracking-wider text-slate-400">
                                  <span>+ Add Quick Note</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bottom assignee */}
                          <div className="flex justify-between items-center bg-slate-50/40 p-1 rounded -mx-1 -mb-1 mt-2">
                            {assignee ? (
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[9px] font-bold border border-white">
                                  {assignee.name[0]}
                                </div>
                                <span className="text-[10px] text-slate-600 truncate max-w-[80px]">{assignee.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-400">
                                <UserIcon className="w-3 h-3" />
                                <span className="text-[9px] italic">Unassigned</span>
                              </div>
                            )}

                            {/* Bottom Right Badges & Controls */}
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              {showDisciplineBadge && (
                                <span className={`text-[9px] capitalize px-1.5 py-0.2 rounded font-medium border ${
                                  task.type === 'architecture' ? 'bg-red-50 text-red-600 border-red-100' :
                                  task.type === 'structure' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  task.type === 'electric' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                  task.type === 'mechanical' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>
                                  {task.type}
                                </span>
                              )}

                              <div className={`flex items-center gap-0.5 text-[9px] ${isTaskOverdue ? 'text-rose-500 font-bold' : 'text-slate-400 font-medium'}`}>
                                <AlertTriangle className={`w-3 h-3 ${isTaskOverdue ? 'text-rose-450 animate-pulse' : 'text-slate-300'}`} />
                                <span className="whitespace-nowrap">Due: {task.dueDate}</span>
                              </div>

                              {/* Fast move button for quick progression */}
                              {!isViewer && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIdx = stages.findIndex(s => s.id === task.stageId);
                                    const nextIdx = (currentIdx + 1) % stages.length;
                                    onUpdateTaskStage(task.id, stages[nextIdx].id);
                                  }}
                                  className="p-0.5 bg-white border border-slate-150 text-slate-400 rounded hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Advance lane"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                        {dragOverTaskId === task.id && isDragOverBufferAfter && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 6, opacity: 1 }}
                            className="w-full bg-indigo-500 rounded-full my-1.5 shadow-[0_0_10px_rgba(99,102,241,0.5)] z-10" 
                          />
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Main Hero Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-955 to-slate-900 text-white p-6 rounded-2xl border border-indigo-950 shadow-md">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400 animate-spin-slow" />
              <span>Project Delivery Methodology</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
              Standardize your engineering processes by selecting standard pipeline structures. Team members can switch between Waterfall sequential stages and Agile Scrum sprints to streamline active design collaboration.
            </p>
          </div>

          {/* Preset Cards Bento Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Standard Presets & Flow Pipelines
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              
              {/* Card 1: Waterfall */}
              <div className={`p-5 bg-white border rounded-2xl flex flex-col justify-between hover:shadow-md transition-all ${
                visualSettings?.activeMethodology === 'waterfall'
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      🏗️ Waterfall System
                    </span>
                    {visualSettings?.activeMethodology === 'waterfall' && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                        ACTIVE STANDARD
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Best for sequential engineering deliverables requiring formal peer reviews and design verifications.
                  </p>
                  
                  {/* Stages Timeline */}
                  <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Pipeline Sequence:</span>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { id: 'planning', name: 'Planning & Feasibility' },
                        { id: 'design', name: 'Core Drafting & Design' },
                        { id: 'peer_review', name: 'Peer & Q/C Review' },
                        { id: 'client_approval', name: 'Client Approval' },
                        { id: 'approved', name: 'Issued for Construction' }
                      ].map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700">
                          <span className="w-4 h-4 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] font-mono">{idx + 1}</span>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyPresetInBoard('waterfall')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    visualSettings?.activeMethodology === 'waterfall'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-default'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
                  }`}
                  disabled={visualSettings?.activeMethodology === 'waterfall'}
                >
                  {visualSettings?.activeMethodology === 'waterfall' ? '✓ Currently Applied' : 'Apply Waterfall Standard'}
                </button>
              </div>

              {/* Card 2: Agile */}
              <div className={`p-5 bg-white border rounded-2xl flex flex-col justify-between hover:shadow-md transition-all ${
                visualSettings?.activeMethodology === 'agile'
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      ⚡ Agile Scrum
                    </span>
                    {visualSettings?.activeMethodology === 'agile' && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                        ACTIVE STANDARD
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Best for quick iteration cycles, dynamic backlogs, continuous integration, and rapid sprint cycles.
                  </p>
                  
                  {/* Stages Timeline */}
                  <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Pipeline Sequence:</span>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { id: 'backlog', name: 'Backlog / To Do' },
                        { id: 'in_progress', name: 'Active Sprint' },
                        { id: 'code_review', name: 'QC & Code Review' },
                        { id: 'testing', name: 'Testing & Validation' },
                        { id: 'approved', name: 'Done / Delivered' }
                      ].map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700">
                          <span className="w-4 h-4 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] font-mono">{idx + 1}</span>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyPresetInBoard('agile')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    visualSettings?.activeMethodology === 'agile'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-default'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
                  }`}
                  disabled={visualSettings?.activeMethodology === 'agile'}
                >
                  {visualSettings?.activeMethodology === 'agile' ? '✓ Currently Applied' : 'Apply Agile Scrum Standard'}
                </button>
              </div>

              {/* Card 3: Simple */}
              <div className={`p-5 bg-white border rounded-2xl flex flex-col justify-between hover:shadow-md transition-all ${
                visualSettings?.activeMethodology === 'simple'
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      📝 Simple Kanban
                    </span>
                    {visualSettings?.activeMethodology === 'simple' && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                        ACTIVE STANDARD
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Best for lightweight, general workflows with no complex testing/review iterations.
                  </p>
                  
                  {/* Stages Timeline */}
                  <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Pipeline Sequence:</span>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { id: 'todo', name: 'Simple Tasks To Do' },
                        { id: 'in_progress', name: 'Under Execution' },
                        { id: 'blocked', name: 'Blocked / Delayed' },
                        { id: 'approved', name: 'Completed / Done' }
                      ].map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700">
                          <span className="w-4 h-4 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] font-mono">{idx + 1}</span>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyPresetInBoard('simple')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    visualSettings?.activeMethodology === 'simple'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-default'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
                  }`}
                  disabled={visualSettings?.activeMethodology === 'simple'}
                >
                  {visualSettings?.activeMethodology === 'simple' ? '✓ Currently Applied' : 'Apply Simple Standard'}
                </button>
              </div>

            </div>
          </div>


        </div>
      )}

    </div>
  );
};
