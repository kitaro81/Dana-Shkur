import React, { useState } from 'react';
import { Project, Task, User, WorkflowStage, FlowPermissions, TaskType } from '../types';
import { Archive, RefreshCw, Trash2, Search, Filter, Folder, Calendar, User as UserIcon, Clock, ExternalLink, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import { printReportHTML } from '../utils/reports';

interface ArchivePanelProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  stages: WorkflowStage[];
  currentUser: User;
  flowPermissions: FlowPermissions;
  onToggleArchiveTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onToggleArchiveProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ArchivePanel: React.FC<ArchivePanelProps> = ({
  projects,
  tasks,
  users,
  stages,
  currentUser,
  flowPermissions,
  onToggleArchiveTask,
  onDeleteTask,
  onSelectTask,
  onToggleArchiveProject,
  onDeleteProject,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'projects'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');

  const [isMobile, setIsMobile] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isAdmin = currentUser.role === 'admin';
  const allowedDisciplines = flowPermissions?.visibility[currentUser.role] || [];

  // Filter archived tasks
  const archivedTasks = tasks.filter(t => {
    // Must be archived
    if (!t.archived) return false;
    
    // Must be of allowed discipline
    if (!allowedDisciplines.includes(t.type)) return false;

    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = t.title?.toLowerCase().includes(q);
      const codeMatch = t.code?.toLowerCase().includes(q);
      const descMatch = t.description?.toLowerCase().includes(q);
      if (!titleMatch && !codeMatch && !descMatch) return false;
    }

    // Project filter
    if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;

    // Discipline filter
    if (selectedDiscipline !== 'all' && t.type !== selectedDiscipline) return false;

    return true;
  });

  // Filter archived projects
  const archivedProjects = projects.filter(p => {
    if (!p.archived) return false;

    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name?.toLowerCase().includes(q);
      const codeMatch = p.code?.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      if (!nameMatch && !codeMatch && !descMatch) return false;
    }

    return true;
  });

  const getProjectName = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? `${proj.name} (${proj.code})` : 'Unknown Project';
  };

  const getAssignees = (task: Task): User[] => {
    // Support both single assignedTo and multiple assignedUserIds
    const list: User[] = [];
    if (task.assignedUserIds && task.assignedUserIds.length > 0) {
      task.assignedUserIds.forEach(id => {
        const u = users.find(usr => usr.id === id);
        if (u) list.push(u);
      });
    } else if (task.assignedTo) {
      const u = users.find(usr => usr.id === task.assignedTo || usr.name === task.assignedTo);
      if (u) list.push(u);
    }
    return list;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER BANNER */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Archive Vault</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, restore, or permanently delete completed and archived tasks or projects.
              </p>
            </div>
          </div>
        </div>

        {/* SUB TABS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setActiveSubTab('tasks');
                setSearchQuery('');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeSubTab === 'tasks'
                  ? 'bg-white text-slate-800 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Archived Tasks ({tasks.filter(t => t.archived && allowedDisciplines.includes(t.type)).length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab('projects');
                setSearchQuery('');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeSubTab === 'projects'
                  ? 'bg-white text-slate-800 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Archived Projects ({projects.filter(p => p.archived).length})
            </button>
          </div>

          {activeSubTab === 'tasks' && archivedTasks.length > 0 && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-400 italic">
                Export moved to Center
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'tasks' ? "Search archived tasks by code, title, or details..." : "Search archived projects..."}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all text-slate-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {activeSubTab === 'tasks' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-600 text-xs shadow-3xs">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <select
                className="bg-transparent border-none text-[11px] font-medium text-slate-700 focus:outline-none cursor-pointer"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Discipline Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-600 text-xs shadow-3xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                className="bg-transparent border-none text-[11px] font-medium text-slate-700 focus:outline-none cursor-pointer"
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
              >
                <option value="all">All Disciplines</option>
                <option value="architecture">Architecture</option>
                <option value="structure">Structure</option>
                <option value="electric">Electric</option>
                <option value="mechanical">Mechanical</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* WORKSPACE */}
      {activeSubTab === 'tasks' ? (
        archivedTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-3xs">
            <Archive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">No archived tasks found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              There are no completed or archived tasks matching your search and filter criteria in the database.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedTasks.map(task => {
              const taskAssignees = getAssignees(task);
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:shadow-2xs transition-all relative flex flex-col justify-between group"
                >
                  <div>
                    {/* Project and Discipline tag */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[150px]">
                        {getProjectName(task.projectId)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono border ${
                        task.type === 'architecture' ? 'bg-red-50 text-red-600 border-red-100' :
                        task.type === 'structure' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        task.type === 'electric' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        task.type === 'mechanical' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-slate-50 text-slate-600 border-slate-150'
                      }`}>
                        {task.type}
                      </span>
                    </div>

                    {/* Task Code & Title */}
                    <div
                      onClick={() => isMobile && setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                      className={`flex items-start justify-between gap-2 ${isMobile ? 'cursor-pointer select-none pb-1' : ''}`}
                    >
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-start gap-1.5 flex-1 leading-snug">
                        <span className="text-slate-400 font-mono text-[10px] select-none">[{task.code}]</span>
                        <span>{task.title}</span>
                      </h3>
                      {isMobile && (
                        <span className="text-slate-400 shrink-0 mt-0.5">
                          {expandedTasks[task.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      )}
                    </div>

                    {(!isMobile || expandedTasks[task.id]) && (
                      <>
                        {/* Task Description */}
                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 mb-3 bg-slate-50/50 p-1.5 rounded border border-slate-100">
                            {task.description}
                          </p>
                        )}

                        {/* Meta information row */}
                        <div className="grid grid-cols-2 gap-2 my-3 text-[10px] text-slate-500 font-mono border-t border-slate-100 pt-2.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Due: {task.dueDate || 'No due date'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Hrs: {task.loggedHours}/{task.estimatedHours}h</span>
                          </div>
                        </div>

                        {/* Multi disciplines if any */}
                        {task.disciplines && task.disciplines.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Additional Disciplines</p>
                            <div className="flex flex-wrap gap-1">
                              {task.disciplines.map(d => (
                                <span key={d} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] uppercase font-bold font-mono">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assignees list */}
                        <div className="flex items-center gap-1.5 mb-4">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider select-none">Assignees:</span>
                          {taskAssignees.length === 0 ? (
                            <span className="text-[10px] text-slate-400 font-medium">Unassigned</span>
                          ) : (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {taskAssignees.map(u => (
                                <div
                                  key={u.id}
                                  title={`${u.name} (${u.discipline || 'general'})`}
                                  className="w-5 h-5 rounded-full bg-slate-200 border border-white text-[9px] font-bold text-slate-700 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                >
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.name} referrerPolicy="no-referrer" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    u.name.charAt(0)
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Area */}
                  {(!isMobile || expandedTasks[task.id]) && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <button
                        onClick={() => onSelectTask(task.id)}
                        className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Details
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleArchiveTask(task.id)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-indigo-200/20"
                          title="Restore task back to live Kanban board"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Restore
                        </button>

                        <button
                          disabled={!isAdmin}
                          onClick={() => onDeleteTask(task.id)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                            isAdmin 
                              ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100 cursor-pointer' 
                              : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                          }`}
                          title={isAdmin ? "Delete permanently" : "Admin role required to delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        archivedProjects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-3xs">
            <Folder className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">No archived projects found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              There are no archived projects matching your search query in the database.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archivedProjects.map(proj => (
              <motion.div
                key={proj.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 select-none">CODE: {proj.code}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                      Archived
                    </span>
                  </div>

                  <div
                    onClick={() => isMobile && setExpandedProjects(prev => ({ ...prev, [proj.id]: !prev[proj.id] }))}
                    className={`flex items-start justify-between gap-2 ${isMobile ? 'cursor-pointer select-none pb-1' : ''}`}
                  >
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex-1 leading-snug">
                      {proj.name}
                    </h3>
                    {isMobile && (
                      <span className="text-slate-400 shrink-0 mt-0.5">
                        {expandedProjects[proj.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    )}
                  </div>

                  {(!isMobile || expandedProjects[proj.id]) && (
                    <>
                      <p className="text-xs text-slate-500 mt-2 mb-4 select-none">
                        {proj.description || 'No description provided.'}
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-500 font-mono border-t border-slate-100 pt-3 mb-4">
                        <div>
                          <span className="text-slate-400 uppercase font-semibold block text-[8px] tracking-wider">Created</span>
                          <span className="text-slate-700">{proj.createdAt ? new Date(proj.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase font-semibold block text-[8px] tracking-wider">Status</span>
                          <span className="text-slate-700 uppercase">{proj.status}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {(!isMobile || expandedProjects[proj.id]) && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <Archive className="w-3 h-3" />
                      <span>Project Vault</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleArchiveProject(proj.id)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-indigo-200/20"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Restore Project
                      </button>

                      <button
                        disabled={!isAdmin}
                        onClick={() => onDeleteProject(proj.id)}
                        className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                          isAdmin 
                            ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100 cursor-pointer' 
                            : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                        title={isAdmin ? "Delete project permanently" : "Admin role required to delete"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
