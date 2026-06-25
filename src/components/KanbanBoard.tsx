import React, { useState, useEffect } from 'react';
import { Task, Project, User, WorkflowStage, TaskType, Label, VisualSettings, TaskTemplate } from '../types';
import { Plus, Search, Filter, AlertTriangle, ArrowRight, Clock, User as UserIcon, Archive, Link, FileText, Check, Download, Table, GripVertical, Compass, Layers, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface KanbanBoardProps {
  project: Project | null;
  tasks: Task[];
  users: User[];
  stages: WorkflowStage[];
  currentUser: User;
  labels: Label[];
  visualSettings?: VisualSettings;
  taskTemplates?: TaskTemplate[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>) => void;
  onUpdateTaskStage: (taskId: string, targetStageId: string, targetTaskId?: string, isAfter?: boolean) => void;
  onSelectTask: (taskId: string) => void;
  onArchiveCompletedTasks?: (projectId: string) => void;
  onUpdateTask?: (updatedTask: Task) => void;
  forceOpenAddTask?: boolean;
  onResetForceOpenAddTask?: () => void;
  onUpdateStages?: (stages: WorkflowStage[]) => void;
  onUpdateVisualSettings?: (settings: VisualSettings) => void;
  showBreadcrumbs?: boolean;
  onToggleBreadcrumbs?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  project,
  tasks,
  users,
  stages,
  currentUser,
  labels,
  visualSettings,
  taskTemplates = [],
  onAddTask,
  onUpdateTaskStage,
  onSelectTask,
  onArchiveCompletedTasks,
  onUpdateTask,
  forceOpenAddTask,
  onResetForceOpenAddTask,
  onUpdateStages,
  onUpdateVisualSettings,
  showBreadcrumbs = true,
  onToggleBreadcrumbs,
}) => {
  const showPriority = visualSettings?.showTaskPriorityBadge !== false;
  const showOverdue = visualSettings?.showOverdueHighlight !== false;
  const showHours = visualSettings?.showHoursCounter !== false;
  const showDisciplineBadge = visualSettings?.showTaskTypeIcon !== false;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<TaskType | 'all'>('all');
  const [selectedLabelFilterId, setSelectedLabelFilterId] = useState<string>('all');
  
  // Track collapsed stages in mobile horizontal list layout (default all expanded/false)
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});

  const toggleStageCollapsed = (stageId: string) => {
    setCollapsedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };
  
  // Create task state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<TaskType>('architecture');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [newEstHours, setNewEstHours] = useState('16');
  const [newDueDate, setNewDueDate] = useState('');
  const [sortBy, setSortBy] = useState<'custom' | 'priority' | 'date' | 'effort'>('custom');
  const [newStoryPoints, setNewStoryPoints] = useState<number>(3);
  const [newTShirtSize, setNewTShirtSize] = useState<'S' | 'M' | 'L' | 'XL'>('M');

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
  const projectTasks = tasks.filter(t => t.projectId === project.id && !t.archived);
  const filteredTasks = projectTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiscipline = selectedDiscipline === 'all' || task.type === selectedDiscipline;
    const matchesLabel = selectedLabelFilterId === 'all' || (task.labelIds && task.labelIds.includes(selectedLabelFilterId));
    return matchesSearch && matchesDiscipline && matchesLabel;
  });

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
        if (metric === 'hours') {
          hasEstimation = !!taskObj?.estimatedHours;
        } else if (metric === 't_shirt') {
          hasEstimation = !!taskObj?.tShirtSize;
        } else {
          hasEstimation = !!taskObj?.storyPoints;
        }

        if (!hasEstimation) {
          alert(`⚠️ Agile Guardrail: Mandatory Estimation is active. Please click to open this task card and assign ${metric === 'hours' ? 'Est. Hours' : metric === 't_shirt' ? 'T-Shirt Size' : 'Story Points'} before moving it from the backlog!`);
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
      if (metric === 'hours') {
        hasEstimation = !!taskObj?.estimatedHours;
      } else if (metric === 't_shirt') {
        hasEstimation = !!taskObj?.tShirtSize;
      } else {
        hasEstimation = !!taskObj?.storyPoints;
      }

      if (!hasEstimation) {
        alert(`⚠️ Agile Guardrail: Mandatory Estimation is active. Please click to open this task card and assign ${metric === 'hours' ? 'Est. Hours' : metric === 't_shirt' ? 'T-Shirt Size' : 'Story Points'} before moving it from the backlog!`);
        return;
      }
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const isAfter = offset > rect.height / 2;

    onUpdateTaskStage(draggedTaskId, targetTask.stageId, targetTask.id, isAfter);
    setSortBy('custom');
  };

  const handleSelectTemplate = (tplId: string) => {
    const tpl = taskTemplates.find(t => t.id === tplId);
    if (!tpl) return;
    setNewTitle(tpl.name);
    setNewDesc(tpl.description);
    setNewType(tpl.type);
    setNewPriority(tpl.priority);
    setNewEstHours(String(tpl.defaultDurationHours));
    setNewLabelIds(tpl.labelIds || []);
    setNewDisciplines([tpl.type]);
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
      projectId: project.id,
      title: newTitle.trim(),
      description: newDesc.trim(),
      type: disciplinesToSubmit[0] || 'other',
      stageId: stages[0]?.id || 'todo', // adds to the first column
      priority: newPriority,
      assignedTo: assigneesToSubmit[0] || undefined,
      estimatedHours: Number(newEstHours) || 8,
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
    setNewEstHours('16');
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

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Description', 'Stage', 'Priority', 'Assigned To', 'Due Date', 'Type'];
    const rows = filteredTasks.map(task => [
      `"${task.id}"`,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${task.description.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${stages.find(s => s.id === task.stageId)?.name || task.stageId}"`,
      `"${task.priority}"`,
      `"${users.filter(u => task.assignedUserIds?.includes(u.id)).map(u => u.name).join(', ') || 'Unassigned'}"`,
      `"${task.dueDate}"`,
      `"${task.type}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Title", "Stage", "Priority", "Assignees", "Due Date"];
    const tableRows = filteredTasks.map(task => [
      task.title,
      stages.find(s => s.id === task.stageId)?.name || task.stageId,
      task.priority,
      users.filter(u => task.assignedUserIds?.includes(u.id)).map(u => u.name).join(', ') || 'Unassigned',
      task.dueDate
    ]);

    doc.setFontSize(18);
    doc.text(`${project.name} - Kanban Board Data`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Tasks: ${filteredTasks.length}`, 14, 34);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 8, cellPadding: 3 }
    });
    
    doc.save(`${project.name.replace(/\s+/g, '_')}_tasks_${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
  const metricName = visualSettings?.agileEstimationMetric === 'hours' ? 'Est. Hours' : visualSettings?.agileEstimationMetric === 't_shirt' ? 'T-Shirt Weight' : 'Story Points';
  
  let currentLoad = 0;
  const tShirtMapping: Record<string, number> = { S: 1, M: 3, L: 5, XL: 8 };
  if (visualSettings?.agileEstimationMetric === 'hours') {
    currentLoad = activeSprintTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  } else if (visualSettings?.agileEstimationMetric === 't_shirt') {
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                boardViewMode === 'pipeline'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-850 hover:bg-slate-50'
              }`}
              title="Pipeline View"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pipeline View</span>
            </button>
            <button
              onClick={() => setBoardViewMode('methodology')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                boardViewMode === 'methodology'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-850 hover:bg-slate-50'
              }`}
              title="Methodology & Presets"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Methodology & Presets</span>
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

      {localFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-3xs animate-fadeIn">
          <span>🎉 {localFeedback}</span>
          <button onClick={() => setLocalFeedback(null)} className="text-emerald-500 hover:text-emerald-750 cursor-pointer">✕</button>
        </div>
      )}

      {boardViewMode === 'pipeline' ? (
        <>
          {/* Search & Discipline Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-3xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 rounded bg-slate-55/50 hover:bg-slate-50 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 font-sans">
          {currentUser.role !== 'admin' && currentUser.role !== 'viewer' ? (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded text-amber-800 text-xs font-bold font-mono shadow-3xs select-none">
              <span>🔒 {currentUser.discipline?.toUpperCase()} VIEW</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setSelectedDiscipline('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedDiscipline === 'all' 
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
                title="All Disciplines"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">All</span>
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
                    className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors capitalize cursor-pointer flex items-center gap-1 ${
                      selectedDiscipline === disc 
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                    title={disc}
                  >
                    <span>{getDisciplineIcon(disc)}</span>
                    <span className="hidden sm:inline">{disc}</span>
                  </button>
                );
              })}
            </>
          )}

          <span className="w-px h-4 bg-slate-200 mx-1 inline-block" />

          <select
            value={selectedLabelFilterId}
            onChange={(e) => setSelectedLabelFilterId(e.target.value)}
            className="px-2 py-1 text-xs font-medium rounded border border-slate-200 text-slate-550 bg-white hover:border-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Tags</option>
            {labels.map(lbl => (
              <option key={lbl.id} value={lbl.id}>
                🏷️ {lbl.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 text-xs font-semibold rounded border border-slate-200 text-slate-600 bg-white hover:border-slate-300 focus:outline-none cursor-pointer"
            title="Sort tasks within columns"
          >
            <option value="custom">↕️ Drag & Drop Sequence</option>
            <option value="priority">🔥 Sort by Priority</option>
            <option value="date">📅 Sort by Due Date</option>
            <option value="effort">💪 Sort by Effort ({visualSettings?.agileEstimationMetric === 'hours' ? 'Est. Hours' : visualSettings?.agileEstimationMetric === 't_shirt' ? 'T-Shirt Weight' : 'Story Points'})</option>
          </select>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Export Utilities */}
          <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3 mr-1">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded text-[10px] font-bold transition-all cursor-pointer shadow-3xs hover:shadow-2xs active:scale-95 group"
              title="Export visible tasks to CSV"
            >
              <Table className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded text-[10px] font-bold transition-all cursor-pointer shadow-3xs hover:shadow-2xs active:scale-95 group"
              title="Export visible tasks to PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>

          {/* Real estate Trail Toggle */}
          {onToggleBreadcrumbs && (
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3 mr-1">
              <button
                onClick={onToggleBreadcrumbs}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[10px] font-bold rounded transition-all cursor-pointer shadow-3xs hover:shadow-2xs active:scale-95 ${
                  showBreadcrumbs 
                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' 
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 animate-pulse'
                }`}
                title={showBreadcrumbs ? "Hide Navigation Trail (Reclaim Screen Space)" : "Show Navigation Trail"}
              >
                {showBreadcrumbs ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{showBreadcrumbs ? "Hide Trail" : "Show Trail"}</span>
              </button>
            </div>
          )}

          {!isViewer && onArchiveCompletedTasks && (
            <button
              onClick={() => onArchiveCompletedTasks(project.id)}
              disabled={completedTasksCount === 0}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border rounded text-xs font-medium transition-all select-none ${
                completedTasksCount === 0
                  ? 'bg-slate-50 border-slate-200 text-slate-350 cursor-not-allowed'
                  : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-700 font-semibold cursor-pointer shadow-3xs hover:shadow-2xs active:scale-[0.98]'
              }`}
              title={`Archive completed tasks (${completedTasksCount})`}
            >
              <Archive className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Archive Completed ({completedTasksCount})</span>
              <span className="inline sm:hidden text-[10px] font-bold">{completedTasksCount}</span>
            </button>
          )}

          {/* Add Task button */}
          {!isViewer && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors cursor-pointer"
              title="Add Task"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Task</span>
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
              {taskTemplates.length > 0 && (
                <div className="bg-white border border-indigo-100 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Prepopulate Template</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {taskTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className="px-2.5 py-1 text-[10px] font-medium text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-full transition-all cursor-pointer active:scale-95"
                      >
                        ⚡ {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Est. Hours</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 bg-white"
                    value={newEstHours}
                    onChange={(e) => setNewEstHours(e.target.value)}
                    required
                  />
                </div>
                {(!visualSettings || visualSettings.agileEstimationMetric === 'story_points') && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Story Points</label>
                    <select
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 bg-white cursor-pointer"
                      value={newStoryPoints}
                      onChange={(e) => setNewStoryPoints(Number(e.target.value))}
                    >
                      {[1, 2, 3, 5, 8, 13].map(val => (
                        <option key={val} value={val}>{val} SP</option>
                      ))}
                    </select>
                  </div>
                )}
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
                        {currentUser.avatarUrl && (
                          <img 
                            src={currentUser.avatarUrl} 
                            alt={currentUser.name} 
                            className="w-4 h-4 rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        )}
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
          const isCollapsed = collapsedStages[stage.id] ?? false;
          
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
              const isHours = visualSettings?.agileEstimationMetric === 'hours';
              const isTShirt = visualSettings?.agileEstimationMetric === 't_shirt';
              if (isHours) {
                return (b.estimatedHours || 0) - (a.estimatedHours || 0);
              } else if (isTShirt) {
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
                  ? 'bg-indigo-50/45 dark:bg-indigo-950/25 border-indigo-400 dark:border-indigo-800 shadow-sm scale-[1.01]' 
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Column Header - Clickable on mobile to expand/collapse */}
              <div 
                onClick={() => {
                  if (window.innerWidth < 768) {
                    toggleStageCollapsed(stage.id);
                  }
                }}
                className="flex items-center justify-between p-2.5 xs:p-3 border-b border-slate-150 cursor-pointer md:cursor-default select-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px] sm:max-w-[180px] md:max-w-[130px]" title={stage.name}>
                    {stage.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {stageTasks.length}
                  </span>
                  <div className="md:hidden text-slate-400 hover:text-slate-600 transition-colors">
                    {isCollapsed ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              </div>
 
              {/* Column Task Area */}
              <div className={`flex-1 overflow-y-auto p-1.5 sm:p-2.5 space-y-1.5 sm:space-y-2 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
                {sortedStageTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 text-center p-2">
                    <p className="text-[10px] font-normal">Empty</p>
                  </div>
                ) : (
                  sortedStageTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assignedTo);
                    const isTaskOverdue = task.stageId !== 'approved' && new Date(task.dueDate) < new Date();
                    
                    return (
                      <React.Fragment key={task.id}>
                        {dragOverTaskId === task.id && !isDragOverBufferAfter && (
                          <div className="h-1 w-full bg-indigo-500 rounded my-1 animate-pulse" />
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
                          onClick={() => onSelectTask(task.id)}
                          className={`${
                            visualSettings?.cardCompactness === 'compact' ? 'p-2' :
                            visualSettings?.cardCompactness === 'spacious' ? 'p-4.5' :
                            'p-3'
                          } bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded hover:border-slate-350 dark:hover:border-slate-700 cursor-pointer relative group transition-all duration-200 ${
                            isViewer ? '' : 'active:scale-[0.98]'
                          } ${
                            showOverdue && isTaskOverdue 
                              ? 'border-rose-300 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/15 via-white dark:via-slate-900 to-white dark:to-slate-900 shadow-xs hover:shadow-rose-100/20' 
                              : ''
                          } ${
                            draggedTaskId === task.id 
                              ? 'opacity-25 border-dashed border-indigo-400 dark:border-indigo-800 scale-[0.97] pointer-events-none' 
                              : ''
                          }`}
                        >
                          {/* Left-edge ribbon indicator for overdue cards */}
                          {showOverdue && isTaskOverdue && (
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500 rounded-l" />
                          )}
                          {/* Task metadata row */}
                          <div className="flex justify-between items-center gap-2 mb-1.5">
                            <div className="flex items-center gap-1">
                              {!isViewer && (
                                <div className="text-slate-400 dark:text-slate-600 cursor-grab active:cursor-grabbing p-0.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Drag to reorder">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                              )}
                              {showDisciplineBadge ? (
                                <span className={`text-[9px] capitalize px-1.5 py-0.2 rounded font-medium border ${
                                  task.type === 'architecture' ? 'bg-red-50 text-red-600 border-red-100' :
                                  task.type === 'structure' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  task.type === 'electric' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                  task.type === 'mechanical' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>
                                  {task.type}
                                </span>
                              ) : <div />}
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
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2">{task.title}</h4>

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

                          {/* Quick detail items */}
                          <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 mb-2">
                            <div className={`flex items-center gap-1 ${isTaskOverdue ? 'text-rose-500 font-medium' : ''}`}>
                              <AlertTriangle className={`w-3 h-3 ${isTaskOverdue ? 'text-rose-450 animate-pulse' : 'text-slate-300'}`} />
                              <span>Due: {task.dueDate}</span>
                              {(() => {
                                const metric = visualSettings?.agileEstimationMetric || 'story_points';
                                if (metric === 'hours' && task.estimatedHours) {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-150 border border-slate-200 text-slate-650 font-mono ml-auto select-none" title="Estimated Man Hours">
                                      ⏱️ {task.estimatedHours}h
                                    </span>
                                  );
                                } else if (metric === 't_shirt' && task.tShirtSize) {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-700 font-mono ml-auto select-none" title="T-Shirt Size Estimation">
                                      👕 {task.tShirtSize}
                                    </span>
                                  );
                                } else if (task.storyPoints) {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono ml-auto select-none" title="Story Points Estimation">
                                      ⚡ {task.storyPoints} SP
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>

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

                          {/* Task Health Progress Bar */}
                          {showHours && task.estimatedHours > 0 && (() => {
                            const progressRatio = task.loggedHours / task.estimatedHours;
                            const progressPercentage = Math.min(100, Math.round(progressRatio * 100));
                            const isOverLogged = task.loggedHours > task.estimatedHours;
                            
                            let barColorClass = 'bg-indigo-600';
                            let badgeText = `${progressPercentage}% logged`;
                            
                            if (isOverLogged) {
                              barColorClass = 'bg-rose-500 animate-pulse';
                              badgeText = `Over budget (+${Math.round((progressRatio - 1) * 100)}%)`;
                            } else if (progressPercentage === 100) {
                              barColorClass = 'bg-emerald-500';
                              badgeText = 'Completed (100%)';
                            } else if (progressPercentage >= 80) {
                              barColorClass = 'bg-amber-500';
                            }

                            return (
                              <div className="space-y-1 mb-2.5">
                                <div className="flex justify-between items-center text-[9px] font-mono font-medium">
                                  <span className={isOverLogged ? 'text-rose-600 font-bold' : progressPercentage === 100 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                                    {badgeText}
                                  </span>
                                  <span className="text-slate-400 shrink-0">
                                    {task.loggedHours}/{task.estimatedHours}h
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-150/50 shadow-3xs relative">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                                    style={{ width: `${progressPercentage}%` }}
                                  />
                                </div>
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
                                <img 
                                  src={assignee.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'} 
                                  alt={assignee.name}
                                  className="w-3.5 h-3.5 rounded-full object-cover border border-white"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-[10px] text-slate-600 truncate max-w-[80px]">{assignee.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-400">
                                <UserIcon className="w-3 h-3" />
                                <span className="text-[9px] italic">Unassigned</span>
                              </div>
                            )}

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
                        </motion.div>
                        {dragOverTaskId === task.id && isDragOverBufferAfter && (
                          <div className="h-1 w-full bg-indigo-500 rounded my-1 animate-pulse" />
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

          {/* Agile Scrum Iteration Parameters & Live Health Diagnostic */}
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            
            {/* Left Column: Editable Cadence Details */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs text-left space-y-4">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  ⚙️ Active Iteration Parameters
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Configure active cadence thresholds. Changes immediately update all dashboard visual metrics.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sprint Iteration Length</label>
                  <select
                    value={visualSettings?.agileSprintDurationWeeks || 2}
                    onChange={(e) => onUpdateVisualSettings?.({ ...visualSettings!, agileSprintDurationWeeks: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-200 bg-white text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={1}>1 Week (Fast Agile)</option>
                    <option value={2}>2 Weeks (Standard Sprint)</option>
                    <option value={3}>3 Weeks (Extended Cycle)</option>
                    <option value={4}>4 Weeks (Monthly Sprint)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Active Sprint Goal</label>
                  <input
                    type="text"
                    value={visualSettings?.agileSprintGoal || ''}
                    onChange={(e) => onUpdateVisualSettings?.({ ...visualSettings!, agileSprintGoal: e.target.value })}
                    placeholder="Focus of the current iteration..."
                    className="w-full px-3 py-2 text-xs rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Backlog Capacity Limit</label>
                    <input
                      type="number"
                      value={visualSettings?.agileTargetCapacity || 30}
                      onChange={(e) => onUpdateVisualSettings?.({ ...visualSettings!, agileTargetCapacity: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estimation Unit</label>
                    <select
                      value={visualSettings?.agileEstimationMetric || 'story_points'}
                      onChange={(e) => onUpdateVisualSettings?.({ ...visualSettings!, agileEstimationMetric: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded border border-slate-200 bg-white text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="story_points">🔴 Story Points</option>
                      <option value="hours">⏰ Estimated Hours</option>
                      <option value="t_shirt">👕 T-Shirt Sizes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Diagnostic */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs text-left space-y-4">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  📊 Active Sprint Health Check
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Computed live workload balance across all tasks scheduled in the current active lane.
                </p>
              </div>

              {/* Stats Card Widget */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Sprint Allocation Load:</span>
                  <span className={`${loadPercentage > 100 ? 'text-rose-600 font-extrabold' : 'text-indigo-600 font-bold'}`}>
                    {currentLoad} / {targetCapacity} {metricName} ({loadPercentage}%)
                  </span>
                </div>

                {/* Loading bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      loadPercentage > 100 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, loadPercentage)}%` }}
                  />
                </div>

                {/* System advice alert */}
                {loadPercentage > 100 ? (
                  <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-start gap-2 text-[10px] text-rose-700 leading-normal">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">System Overload Warning:</strong> Current lane commits exceed soft target guidelines by {currentLoad - targetCapacity} {metricName}. Recommend re-distributing tasks or pruning backlogs.
                    </div>
                  </div>
                ) : (
                  <div className="bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-lg flex items-start gap-2 text-[10px] text-indigo-800 leading-normal">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Workload Balanced:</strong> Safe bandwidth. The current team load is within comfortable operational tolerances.
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 leading-relaxed font-medium space-y-1">
                  <p>👉 <strong className="text-slate-600">Sprint Cadence:</strong> Evaluated every {visualSettings?.agileSprintDurationWeeks || 2} weeks.</p>
                  <p>👉 <strong className="text-slate-600">Active Commitments:</strong> {activeSprintTasks.length} tasks scheduled.</p>
                  {visualSettings?.agileSprintGoal && (
                    <p>🎯 <strong className="text-slate-600">Sprint Goal:</strong> "{visualSettings.agileSprintGoal}"</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
