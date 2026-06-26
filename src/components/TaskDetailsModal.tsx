import React, { useState } from 'react';
import { Task, User, Comment, UserRole, TaskType, Label, VisualSettings } from '../types';
import { Tag, X, Calendar, User as UserIcon, Clock, MessageSquare, Plus, AlignLeft, AlertTriangle, Link, FileText, Trash, ChevronRight, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface TaskDetailsModalProps {
  task: Task;
  tasks: Task[];
  users: User[];
  comments: Comment[];
  currentUser: User;
  labels: Label[];
  onUpdateLabels: (labels: Label[]) => void;
  onClose: () => void;
  onUpdateTask: (updatedTask: Task) => void;
  onAddComment: (taskId: string, commentText: string) => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleArchiveTask?: (taskId: string) => void;
  onMessageUser?: (userId: string) => void;
  flowPermissions?: any;
  visualSettings?: VisualSettings;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  tasks,
  users,
  comments,
  currentUser,
  labels,
  onUpdateLabels,
  onClose,
  onUpdateTask,
  onAddComment,
  onDeleteComment,
  onDeleteTask,
  onToggleArchiveTask,
  onMessageUser,
  flowPermissions,
  visualSettings,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // Hours logger state REMOVED
  
  // Task Editing states
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [editedType, setEditedType] = useState<TaskType>(task.type);
  const [editedAssignedTo, setEditedAssignedTo] = useState(task.assignedTo || '');
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate);

  // Task Labels state
  const [taskLabelIds, setTaskLabelIds] = useState<string[]>(task.labelIds || []);
  
  // Custom label management/creation UI toggles
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showCreateLabelForm, setShowCreateLabelForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#EF4444');
  
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelName, setEditingLabelName] = useState('');
  const [editingLabelColor, setEditingLabelColor] = useState('#EF4444');

  // Dependencies and Quick Note states
  const [taskDependencies, setTaskDependencies] = useState<string[]>(task.dependencies || []);
  const [taskQuickNote, setTaskQuickNote] = useState(task.quickNote || '');
  const [isEditingNote, setIsEditingNote] = useState(false);

  React.useEffect(() => {
    setTaskLabelIds(task.labelIds || []);
  }, [task.id, task.labelIds]);

  React.useEffect(() => {
    setTaskDependencies(task.dependencies || []);
  }, [task.id, task.dependencies]);

  React.useEffect(() => {
    setTaskQuickNote(task.quickNote || '');
  }, [task.id, task.quickNote]);

  const handleAddDependency = (depTaskId: string) => {
    if (!isAuthorizedToEdit) return;
    if (taskDependencies.includes(depTaskId)) return;
    const updated = [...taskDependencies, depTaskId];
    setTaskDependencies(updated);
    if (!isEditing) {
      onUpdateTask({
        ...task,
        dependencies: updated,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleRemoveDependency = (depTaskId: string) => {
    if (!isAuthorizedToEdit) return;
    const updated = taskDependencies.filter(id => id !== depTaskId);
    setTaskDependencies(updated);
    if (!isEditing) {
      onUpdateTask({
        ...task,
        dependencies: updated,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleToggleLabel = (labelId: string) => {
    if (!isAuthorizedToEdit) return;
    const updated = taskLabelIds.includes(labelId)
      ? taskLabelIds.filter(id => id !== labelId)
      : [...taskLabelIds, labelId];
    
    setTaskLabelIds(updated);
    
    // If not in full details edit form mode, save right away!
    if (!isEditing) {
      onUpdateTask({
        ...task,
        labelIds: updated,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    
    const newLabel: Label = {
      id: 'label-' + Date.now().toString() + '-' + Math.floor(Math.random() * 1000000),
      name: newLabelName.trim(),
      color: newLabelColor
    };
    
    const updatedLabels = [...labels, newLabel];
    onUpdateLabels(updatedLabels);
    
    const updatedTaskLabelIds = [...taskLabelIds, newLabel.id];
    setTaskLabelIds(updatedTaskLabelIds);
    if (!isEditing) {
      onUpdateTask({
        ...task,
        labelIds: updatedTaskLabelIds,
        updatedAt: new Date().toISOString()
      });
    }
    
    setNewLabelName('');
    setShowCreateLabelForm(false);
  };

  const handleSaveEditLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabelId || !editingLabelName.trim()) return;
    
    const updatedLabels = labels.map(lbl => 
      lbl.id === editingLabelId 
        ? { ...lbl, name: editingLabelName.trim(), color: editingLabelColor } 
        : lbl
    );
    
    onUpdateLabels(updatedLabels);
    setEditingLabelId(null);
    setEditingLabelName('');
  };

  const handleDeleteLabel = (labelId: string) => {
    if (!confirm('Are you sure you want to delete this label? It will be removed from all tasks.')) return;
    
    const updatedLabels = labels.filter(lbl => lbl.id !== labelId);
    onUpdateLabels(updatedLabels);
    
    const updatedTaskLabelIds = taskLabelIds.filter(id => id !== labelId);
    setTaskLabelIds(updatedTaskLabelIds);
    
    if (!isEditing) {
      onUpdateTask({
        ...task,
        labelIds: updatedTaskLabelIds,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const taskComments = comments.filter(c => c.taskId === task.id);
  const isCompleted = task.stageId === 'approved';
  const isArchived = !!task.archived;
  const isCompletedOrArchived = isCompleted || isArchived;
  const isAuthorizedToEdit = (currentUser.role === 'admin' || currentUser.role === 'lead_designer') && !isCompletedOrArchived;
  const isEngineer = currentUser.role === 'engineer' && !isCompletedOrArchived;
  
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedToEdit) return;

    onUpdateTask({
      ...task,
      title: editedTitle,
      description: editedDescription,
      priority: editedPriority,
      type: editedType,
      assignedTo: editedAssignedTo || undefined,
      dueDate: editedDueDate,
      labelIds: taskLabelIds,
      dependencies: taskDependencies,
      quickNote: taskQuickNote,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText.trim());
    setCommentText('');
  };

  const assignedUser = users.find(u => u.id === task.assignedTo);

  return (
    <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200"
      >
        {/* Header bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-sm font-semibold border ${
              task.type === 'architecture' ? 'bg-red-50 text-red-700 border-red-200' :
              task.type === 'structure' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              task.type === 'electric' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              task.type === 'mechanical' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              {task.type}
            </span>
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm font-semibold border ${
              task.priority === 'critical' ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' :
              task.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              task.priority === 'medium' ? 'bg-slate-100 text-slate-700 border-slate-200' :
              'bg-slate-50 text-slate-500 border-slate-100'
            }`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCompletedOrArchived && (
          <div className="bg-amber-50/70 border-b border-amber-200/40 px-6 py-2.5 flex items-center gap-2 text-amber-800 text-xs font-semibold">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            <span>
              🔒 Task locked. Editing is disabled because this task has been{' '}
              {isCompleted && isArchived
                ? 'completed and archived'
                : isCompleted
                ? 'completed'
                : 'archived'}
              .
            </span>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="p-6 md:p-8 grid md:grid-cols-3 gap-6 max-h-[80vh] overflow-y-auto">
          
          {/* Left Columns - Info Description and Comments */}
          <div className="md:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.form 
                  key="edit-form"
                  onSubmit={handleSaveTask} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full text-base font-medium px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Detailed scope / Description</label>
                    <textarea
                      rows={4}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Discipline</label>
                      <select
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                        value={editedType}
                        onChange={(e) => setEditedType(e.target.value as TaskType)}
                      >
                        <option value="architecture">Architecture</option>
                        <option value="structure">Structural Engineering</option>
                        <option value="electric">Electrical Engineering</option>
                        <option value="mechanical">Mechanical Engineering</option>
                        <option value="other">Other Design Class</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                      <select
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                        value={editedPriority}
                        onChange={(e) => setEditedPriority(e.target.value as any)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                      <input
                        type="date"
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                        value={editedDueDate}
                        onChange={(e) => setEditedDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assignee</label>
                    <select
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                      value={editedAssignedTo}
                      onChange={(e) => setEditedAssignedTo(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => {
                        const isCurrentlyAssigned = editedAssignedTo === u.id;
                        return (
                          <option 
                            key={u.id} 
                            value={u.id}
                            disabled={u.deactivated && !isCurrentlyAssigned}
                          >
                            {u.name} ({u.role.replace('_', ' ')} - {u.discipline ? u.discipline.toUpperCase() : 'GENERAL'}){u.deactivated ? ' [DEACTIVATED]' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {editedAssignedTo && (() => {
                      const assignedUserData = users.find(u => u.id === editedAssignedTo);
                      if (assignedUserData && assignedUserData.discipline !== task.type) {
                        return (
                          <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1 mt-1 leading-tight">
                            ⚠️ Assignee discipline ({assignedUserData.discipline || 'general'}) differs from task type ({task.type}).
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key="view-only"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider">Design Objective</span>
                      {isAuthorizedToEdit && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer pb-0.5 border-b border-transparent hover:border-indigo-600"
                        >
                          Modify Details
                        </button>
                      )}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">{task.title}</h2>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                    <AlignLeft className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider mb-1">Engineering Scope</h4>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                    </div>
                  </div>

                  {/* Quick Sticky Note / Scratchpad Panel */}
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/40 flex gap-3 relative group">
                    <FileText className="w-5 h-5 text-amber-500/80 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs uppercase font-mono font-bold text-amber-600/90 tracking-wider">Quick Sticky Note / Scratchpad</h4>
                        {!isEditingNote ? (
                          <button
                            type="button"
                            onClick={() => setIsEditingNote(true)}
                            className="text-[10px] uppercase font-mono text-indigo-600 font-bold tracking-wider hover:underline cursor-pointer"
                          >
                            {taskQuickNote ? 'Edit Note' : 'Add Note'}
                          </button>
                        ) : null}
                      </div>

                      {isEditingNote ? (
                        <div className="space-y-2 mt-2">
                          <textarea
                            className="w-full text-sm p-2 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-100 focus:outline-none font-sans text-slate-700"
                            rows={3}
                            value={taskQuickNote}
                            placeholder="Jot down a quick note, status update, or fast reminder..."
                            onChange={(e) => setTaskQuickNote(e.target.value)}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setTaskQuickNote(task.quickNote || '');
                                setIsEditingNote(false);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateTask({
                                  ...task,
                                  quickNote: taskQuickNote,
                                  updatedAt: new Date().toISOString()
                                });
                                setIsEditingNote(false);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors cursor-pointer"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-750 italic font-medium leading-relaxed">
                          {taskQuickNote ? `"${taskQuickNote}"` : 'No quick reminders or sticky notes set. Write a fast scratchnote.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dependency Chain Mapping / Constraints Section */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex gap-3">
                    <Link className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider mb-2">Dependency Chain Mapping</h4>
                      
                      <div className="space-y-3">
                        {taskDependencies.length === 0 ? (
                          <p className="text-xs text-slate-500 italic pb-0.5">This task is currently unconstrained (no prerequisite blocker tasks).</p>
                        ) : (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none block mb-1">Prerequisite tasks (Blockers):</span>
                            {taskDependencies.map(depId => {
                              const depTask = tasks.find(t => t.id === depId);
                              if (!depTask) return null;
                              const isDepCompleted = depTask.stageId === 'approved';
                              return (
                                <div key={depId} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-100 text-xs shadow-3xs">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isDepCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                    <span className={`font-semibold truncate text-slate-700 ${isDepCompleted ? 'line-through text-slate-400 font-normal' : ''}`}>
                                      {depTask.title}
                                    </span>
                                    <span className={`text-[8px] tracking-tight px-1.5 py-0.2 rounded font-bold border uppercase flex-shrink-0 ${
                                      isDepCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                      {isDepCompleted ? 'Completed' : 'Pending'}
                                    </span>
                                  </div>
                                  {isAuthorizedToEdit && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDependency(depId)}
                                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 font-bold cursor-pointer"
                                      title="Remove dependency"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Downstream dependents */}
                        {(() => {
                          const dependents = tasks.filter(t => t.dependencies?.includes(task.id));
                          if (dependents.length > 0) {
                            return (
                              <div className="border-t border-slate-200/50 pt-2.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none block mb-1.5">Blocked Downstream Tasks:</span>
                                <div className="flex flex-col gap-1">
                                  {dependents.map(dep => (
                                    <div key={dep.id} className="text-xs bg-slate-100 border border-slate-200/55 rounded-lg px-2 py-1 text-slate-600 truncate flex items-center gap-1.5">
                                      <span className="text-[10px] select-none">⛓️</span>
                                      <span className="font-semibold text-slate-700 truncate">{dep.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Dropdown to append prerequisites */}
                        {isAuthorizedToEdit && (
                          <div className="pt-2 border-t border-slate-250/20">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Add Mapped Blocker / Prerequisite Constraint</label>
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAddDependency(e.target.value);
                                }
                              }}
                              className="w-full text-xs bg-white border border-slate-200 hover:border-slate-300 focus:outline-none p-1.5 rounded-lg text-slate-600 cursor-pointer"
                            >
                              <option value="">-- Choose project task that must finish before this --</option>
                              {tasks
                                .filter(t => t.id !== task.id && t.projectId === task.projectId && !taskDependencies.includes(t.id))
                                .map(t => (
                                  <option key={t.id} value={t.id}>
                                    [{t.type.toUpperCase()}] {t.title}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comments Thread */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2 mb-2 text-slate-700">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-sm">Task Peer Review Log ({taskComments.length})</h3>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={submitComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Post revision feedback or Q/C note..."
                  className="flex-1 text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none px-3 py-2 rounded-lg transition-colors"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg text-xs font-semibold shadow-xs flex-shrink-0 transition-colors cursor-pointer"
                >
                  Send
                </button>
              </form>

              {/* List Comments */}
              <div className="space-y-3 pt-2 max-h-[25vh] overflow-y-auto pr-1">
                {taskComments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center italic py-4">No comments posted yet. Add a note to start collaboration.</p>
                ) : (
                  taskComments.map(comment => {
                    const commentCreator = users.find(u => u.id === comment.userId);
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={comment.id} 
                        className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 relative group"
                      >
                        <div className="flex gap-2.5 items-start">
                          <img
                            src={commentCreator?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
                            alt={comment.userName}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between mb-0.5">
                              <span className="text-xs font-semibold text-slate-800">{comment.userName}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(comment.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed break-words">{comment.text}</p>
                          </div>
                        </div>
                        {/* Delete button for author/admin */}
                        {(currentUser.id === comment.userId || currentUser.role === 'admin') && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to permanently delete this comment?')) {
                                onDeleteComment(comment.id);
                              }
                            }}
                            className="absolute top-2 right-2 text-[10px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-150 px-2 py-0.5 rounded transition-all cursor-pointer shadow-3xs"
                            title="Delete comment permanently"
                          >
                            Delete
                          </button>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Status and Metadata Panel */}
          <div className="border-l border-slate-100 pl-0 md:pl-6 space-y-6">
            
            {/* Owner Section */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider block">Assigned Lead</span>
              {assignedUser ? (
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={assignedUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
                      alt={assignedUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{assignedUser.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{assignedUser.role.replace('_', ' ')}</span>
                        {assignedUser.discipline && (
                          <span className={`text-[9px] uppercase px-1 rounded font-bold border ${
                            assignedUser.discipline === 'architecture' ? 'bg-red-50 text-red-600 border-red-100' :
                            assignedUser.discipline === 'structure' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            assignedUser.discipline === 'electric' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            assignedUser.discipline === 'mechanical' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {assignedUser.discipline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {onMessageUser && assignedUser.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => onMessageUser(assignedUser.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-lg transition-all cursor-pointer"
                      title="Send instant message to lead"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 text-slate-400 rounded-lg border border-dashed border-slate-200">
                  <UserIcon className="w-5 h-5 text-slate-400" />
                  <p className="text-xs italic">Unassigned Design Lead</p>
                </div>
              )}
            </div>

            {/* Task Tags Section */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider block">Task Tags</span>
                {isAuthorizedToEdit && (
                  <button
                    onClick={() => {
                      setShowLabelManager(!showLabelManager);
                      setShowCreateLabelForm(false);
                      setEditingLabelId(null);
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer select-none"
                  >
                    {showLabelManager ? 'Close' : 'Manage'}
                  </button>
                )}
              </div>

              {/* Display currently selected tags */}
              <div className="flex flex-wrap gap-1.5">
                {taskLabelIds.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No tags assigned.</span>
                ) : (
                  taskLabelIds.map(labelId => {
                    const labelItem = labels.find(l => l.id === labelId);
                    if (!labelItem) return null;
                    return (
                      <span
                        key={labelId}
                        style={{
                          backgroundColor: labelItem.color + '18',
                          color: labelItem.color,
                          borderColor: labelItem.color + '35',
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded border leading-none tracking-tight select-none"
                      >
                        {labelItem.name}
                      </span>
                    );
                  })
                )}
              </div>

              {/* Tag / Label Manager Panel */}
              {showLabelManager && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2.5 mt-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Assign & Configure Tags</span>
                  
                  {/* List of current available labels with toggle checkboxes */}
                  <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                    {labels.map(lbl => {
                      const isAssigned = taskLabelIds.includes(lbl.id);
                      const isRefEditing = editingLabelId === lbl.id;
                      
                      return (
                        <div key={lbl.id} className="flex items-center justify-between gap-1.5 p-1 rounded hover:bg-slate-100/80 transition-colors">
                          {isRefEditing ? (
                            <form onSubmit={handleSaveEditLabel} className="flex items-center gap-1 w-full">
                              <input
                                type="text"
                                className="flex-1 text-[11px] px-1.5 py-0.5 border border-slate-300 rounded focus:outline-none"
                                value={editingLabelName}
                                onChange={(e) => setEditingLabelName(e.target.value)}
                                autoFocus
                                required
                              />
                              <input
                                type="color"
                                className="w-5 h-5 p-0 border-0 cursor-pointer rounded-full overflow-hidden"
                                value={editingLabelColor}
                                onChange={(e) => setEditingLabelColor(e.target.value)}
                              />
                              <button
                                type="submit"
                                className="text-[9px] bg-slate-900 hover:bg-slate-800 text-white font-semibold px-1.5 py-0.5 rounded"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingLabelId(null)}
                                className="text-[9px] text-slate-500 hover:underline"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleLabel(lbl.id)}
                                className="flex items-center gap-1.5 flex-grow text-left cursor-pointer"
                              >
                                <span
                                  className={`w-3 h-3 rounded border flex items-center justify-center text-[8px] font-bold text-white transition-all ${
                                    isAssigned ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isAssigned && '✓'}
                                </span>
                                <span
                                  style={{
                                    backgroundColor: lbl.color + '15',
                                    color: lbl.color,
                                    borderColor: lbl.color + '30',
                                  }}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                                >
                                  {lbl.name}
                                </span>
                              </button>
                              
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingLabelId(lbl.id);
                                    setEditingLabelName(lbl.name);
                                    setEditingLabelColor(lbl.color);
                                  }}
                                  className="text-[10px] text-slate-500 hover:text-indigo-600 transition-colors"
                                  title="Edit Name/Color"
                                >
                                  ✍️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLabel(lbl.id)}
                                  className="text-[10px] text-slate-500 hover:text-rose-600 transition-colors"
                                  title="Delete Tag"
                                >
                                  ❌
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New label form trigger */}
                  {!showCreateLabelForm ? (
                    <button
                      type="button"
                      onClick={() => setShowCreateLabelForm(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer select-none"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create New Custom Tag
                    </button>
                  ) : (
                    <form onSubmit={handleCreateLabel} className="pt-2 border-t border-slate-200/60 space-y-1.5">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Create New Tag</div>
                      
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Tag name (e.g., Urgent)"
                          className="flex-1 text-[11px] px-2 py-1 border border-slate-200 rounded focus:outline-none bg-white font-medium"
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          required
                        />
                        <input
                          type="color"
                          className="w-6 h-6 p-0 border border-slate-200 cursor-pointer rounded overflow-hidden flex-shrink-0"
                          value={newLabelColor}
                          onChange={(e) => setNewLabelColor(e.target.value)}
                        />
                      </div>

                      {/* Nice Preset Color Swatches for ease of choice */}
                      <div className="flex flex-wrap gap-1 pb-1">
                        {[
                          '#EF4444', // Red
                          '#F59E0B', // Amber
                          '#10B981', // Emerald
                          '#06B6D4', // Cyan
                          '#3B82F6', // Blue
                          '#6366F1', // Indigo
                          '#8B5CF6', // Purple
                          '#EC4899', // Pink
                          '#64748B', // Slate
                        ].map(c => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => setNewLabelColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-3.5 h-3.5 rounded-full border transition-all ${
                              newLabelColor === c ? 'ring-2 ring-indigo-500 border-white scale-110' : 'border-transparent hover:scale-105'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setShowCreateLabelForm(false)}
                          className="text-[9px] font-semibold text-slate-500 hover:bg-slate-150 px-1.5 py-0.5 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="text-[9px] font-bold bg-slate-900 hover:bg-slate-850 text-white px-1.5 py-0.5 rounded shadow-3xs"
                        >
                          Create Tag
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Timeline Section */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wide block">Schedule</span>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600 text-xs">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Target Delivery: <strong className="text-slate-800">{task.dueDate}</strong></span>
                </div>
                {/* Overdue alert */}
                {task.stageId !== 'approved' && new Date(task.dueDate) < new Date() && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-800 p-2 rounded text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>This task is overdue.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Delete Action */}
            {currentUser.role === 'admin' && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="text-[10px] uppercase text-rose-500 font-bold tracking-wider block">Administrator Actions</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
                      onDeleteTask(task.id);
                      onClose();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Trash className="w-3.5 h-3.5" /> Delete Task Permanently
                </button>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
};
