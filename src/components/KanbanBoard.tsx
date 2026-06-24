import React, { useState } from 'react';
import { Task, Project, User, WorkflowStage, TaskType, Label, VisualSettings, TaskTemplate } from '../types';
import { Plus, Search, Filter, AlertTriangle, ArrowRight, Clock, User as UserIcon, Archive, Link, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
}) => {
  const showPriority = visualSettings?.showTaskPriorityBadge !== false;
  const showOverdue = visualSettings?.showOverdueHighlight !== false;
  const showHours = visualSettings?.showHoursCounter !== false;
  const showDisciplineBadge = visualSettings?.showTaskTypeIcon !== false;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<TaskType | 'all'>('all');
  const [selectedLabelFilterId, setSelectedLabelFilterId] = useState<string>('all');
  
  // Create task state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<TaskType>('architecture');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [newEstHours, setNewEstHours] = useState('16');
  const [newDueDate, setNewDueDate] = useState('');

  // Multiple select states for multi assignee/disciplines
  const [newAssignedUserIds, setNewAssignedUserIds] = useState<string[]>([]);
  const [newDisciplines, setNewDisciplines] = useState<TaskType[]>([]);

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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // mandatory to allow drop
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onUpdateTaskStage(taskId, targetStageId);
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

    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const isAfter = offset > rect.height / 2;

    onUpdateTaskStage(draggedTaskId, targetTask.stageId, targetTask.id, isAfter);
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
    setShowAddForm(false);
  };

  const isViewer = currentUser.role === 'viewer';
  const lastStageId = stages[stages.length - 1]?.id || 'approved';
  const completedTasksCount = projectTasks.filter(t => t.stageId === lastStageId || t.stageId === 'approved').length;

  return (
    <div className="space-y-6">
      
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
                className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
                  selectedDiscipline === 'all' 
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                All Disciplines
              </button>

              {(['architecture', 'structure', 'electric', 'mechanical', 'other'] as TaskType[]).map(disc => (
                <button
                  key={disc}
                  onClick={() => setSelectedDiscipline(disc)}
                  className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors capitalize cursor-pointer ${
                    selectedDiscipline === disc 
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {disc}
                </button>
              ))}
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
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isViewer && onArchiveCompletedTasks && (
            <button
              onClick={() => onArchiveCompletedTasks(project.id)}
              disabled={completedTasksCount === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-medium transition-all select-none ${
                completedTasksCount === 0
                  ? 'bg-slate-50 border-slate-200 text-slate-350 cursor-not-allowed'
                  : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-700 font-semibold cursor-pointer shadow-3xs hover:shadow-2xs active:scale-[0.98]'
              }`}
              title="Archive all tasks in the final Approved/Construction column to keep the board clean"
            >
              <Archive className="w-3.5 h-3.5 text-emerald-500" />
              Archive Completed ({completedTasksCount})
            </button>
          )}

          {/* Add Task button */}
          {!isViewer && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {stages.map(stage => {
          const stageTasks = filteredTasks.filter(t => t.stageId === stage.id);
          
          return (
            <div 
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="flex flex-col bg-slate-50 border border-slate-200 rounded-lg max-h-[70vh] min-h-[420px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">{stage.name}</span>
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600">
                  {stageTasks.length}
                </span>
              </div>

              {/* Column Task Area */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {stageTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 text-center p-2">
                    <p className="text-[10px] font-normal">Empty</p>
                  </div>
                ) : (
                  stageTasks.map(task => {
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
                          onDragOver={(e) => handleCardDragOver(e, task.id)}
                          onDragLeave={handleCardDragLeave}
                          onDrop={(e) => handleCardDrop(e, task)}
                          onClick={() => onSelectTask(task.id)}
                          className={`p-3 bg-white border rounded hover:border-slate-350 cursor-pointer relative group transition-all duration-200 ${
                            isViewer ? '' : 'active:scale-[0.98]'
                          } ${
                            showOverdue && isTaskOverdue 
                              ? 'border-rose-300 bg-gradient-to-br from-rose-50/15 via-white to-white shadow-xs hover:shadow-rose-100/20' 
                              : 'border-slate-200/80'
                          }`}
                        >
                          {/* Left-edge ribbon indicator for overdue cards */}
                          {showOverdue && isTaskOverdue && (
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500 rounded-l" />
                          )}
                          {/* Task metadata row */}
                          <div className="flex justify-between items-center gap-2 mb-1.5">
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

                          {/* Quick detail items */}
                          <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 mb-2">
                            <div className={`flex items-center gap-1 ${isTaskOverdue ? 'text-rose-500 font-medium' : ''}`}>
                              <AlertTriangle className={`w-3 h-3 ${isTaskOverdue ? 'text-rose-450 animate-pulse' : 'text-slate-300'}`} />
                              <span>Due: {task.dueDate}</span>
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

    </div>
  );
};
