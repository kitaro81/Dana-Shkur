import React, { useState, useEffect } from 'react';
import { Task, Project, User, WorkflowStage, TaskType } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Briefcase, 
  Layers, 
  Clock, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Users,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  stages: WorkflowStage[];
  selectedProjectId: string;
  onSelectTask: (taskId: string) => void;
  currentUser: User;
}

interface PackedTask {
  task: Task;
  startIndex: number;
  endIndex: number;
  rowIndex: number;
  isOverdue: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  projects,
  users,
  stages,
  selectedProjectId,
  onSelectTask,
  currentUser,
}) => {
  const isTeamMember = currentUser.role !== 'admin' && currentUser.role !== 'viewer';
  
  // Use 2026-06-22 as default anchor today, matching other system dates
  const todayAnchor = new Date('2026-06-22');
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-06-15'));
  const [timeScaleDays, setTimeScaleDays] = useState<number>(14);
  const [groupBy, setGroupBy] = useState<'project' | 'discipline' | 'assignee'>('project');
  const [projectFilter, setProjectFilter] = useState<string>(selectedProjectId || 'all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>(
    isTeamMember && currentUser.discipline ? currentUser.discipline : 'all'
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Sync disciplineFilter when current user or role shifts
  useEffect(() => {
    if (isTeamMember && currentUser.discipline) {
      setDisciplineFilter(currentUser.discipline);
    } else {
      setDisciplineFilter('all');
    }
  }, [currentUser.id, currentUser.discipline, currentUser.role]);

  // Sync projectFilter with active selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      setProjectFilter(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Generate date array for the schedule timeline view
  const generateTimelineDates = (start: Date, daysCount: number): string[] => {
    const dates: string[] = [];
    const temp = new Date(start);
    for (let i = 0; i < daysCount; i++) {
      dates.push(temp.toISOString().split('T')[0]);
      temp.setDate(temp.getDate() + 1);
    }
    return dates;
  };

  const timelineDates = generateTimelineDates(currentDate, timeScaleDays);

  const handlePrevRange = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleNextRange = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date('2026-06-15'));
  };

  // Filter tasks based on general project / discipline filters
  const filteredTasks = tasks.filter(task => {
    if (task.archived) return false;
    // Project filter
    if (projectFilter !== 'all' && task.projectId !== projectFilter) {
      return false;
    }
    // Discipline filter
    if (disciplineFilter !== 'all' && task.type !== disciplineFilter) {
      return false;
    }
    return true;
  });

  // Stacking/packing scheduling algorithm to place tasks cleanly on tracks
  const packTasksForLane = (laneTasks: Task[], visibleDates: string[]): PackedTask[] => {
    const rangeStart = new Date(visibleDates[0]);
    const rangeEnd = new Date(visibleDates[visibleDates.length - 1]);

    const prepared = laneTasks.map(t => {
      const sStr = t.createdAt ? t.createdAt.substring(0, 10) : '2026-06-22';
      const eStr = t.dueDate || sStr;
      
      const sDate = new Date(sStr + 'T00:00:00');
      const eDate = new Date(eStr + 'T00:00:00');
      const finalEDate = eDate >= sDate ? eDate : sDate;

      // If entirely outside the visible range
      if (finalEDate < rangeStart || sDate > rangeEnd) {
        return null;
      }

      // Calculate start index clamped to visible grid
      let startIndex = 0;
      if (sDate >= rangeStart) {
        const diffTime = Math.abs(sDate.getTime() - rangeStart.getTime());
        startIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate end index clamped to visible grid
      let endIndex = visibleDates.length - 1;
      if (finalEDate <= rangeEnd) {
        const diffTime = Math.abs(finalEDate.getTime() - rangeStart.getTime());
        endIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Safeguards
      if (startIndex < 0) startIndex = 0;
      if (endIndex >= visibleDates.length) endIndex = visibleDates.length - 1;
      if (endIndex < startIndex) endIndex = startIndex;

      const isOverdue = t.stageId !== 'approved' && new Date(t.dueDate) < todayAnchor;

      return {
        task: t,
        startIndex,
        endIndex,
        isOverdue
      };
    }).filter((x): x is { task: Task; startIndex: number; endIndex: number; isOverdue: boolean } => x !== null);

    // Sort by start index (leftmost first), then by duration desc
    prepared.sort((a, b) => {
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex;
      }
      return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
    });

    const packed: PackedTask[] = [];

    prepared.forEach(item => {
      let assignedRow = 0;
      // Stacking loop: Increment row index until no overlap is found
      while (true) {
        const hasOverlap = packed.some(p => 
          p.rowIndex === assignedRow && 
          item.startIndex <= p.endIndex && 
          p.startIndex <= item.endIndex
        );
        if (!hasOverlap) {
          break;
        }
        assignedRow++;
      }

      packed.push({
        ...item,
        rowIndex: assignedRow
      });
    });

    return packed;
  };

  // Organize timeline lanes
  interface TimelineLane {
    id: string;
    name: string;
    subtitle?: string;
    avatarUrl?: string;
    color?: string;
    packedTasks: PackedTask[];
  }

  const getTimelineLanes = (): TimelineLane[] => {
    switch (groupBy) {
      case 'project': {
        const activeProjects = projectFilter === 'all' 
          ? projects.filter(p => !p.archived)
          : projects.filter(p => p.id === projectFilter);

        return activeProjects.map(proj => {
          const projTasks = filteredTasks.filter(t => t.projectId === proj.id);
          return {
            id: proj.id,
            name: proj.name,
            subtitle: proj.code,
            color: '#4F46E5',
            packedTasks: packTasksForLane(projTasks, timelineDates)
          };
        });
      }
      case 'discipline': {
        const disciplines: { type: TaskType; name: string; color: string }[] = [
          { type: 'architecture', name: 'Architecture', color: '#EF4444' },
          { type: 'structure', name: 'Structure', color: '#3B82F6' },
          { type: 'electric', name: 'Electrical', color: '#6366F1' },
          { type: 'mechanical', name: 'Mechanical', color: '#10B981' },
          { type: 'other', name: 'Other', color: '#64748B' }
        ];

        const activeDisciplines = disciplineFilter === 'all'
          ? disciplines
          : disciplines.filter(d => d.type === disciplineFilter);

        return activeDisciplines.map(d => {
          const discTasks = filteredTasks.filter(t => t.type === d.type);
          return {
            id: d.type,
            name: d.name,
            subtitle: `${discTasks.length} active tasks`,
            color: d.color,
            packedTasks: packTasksForLane(discTasks, timelineDates)
          };
        });
      }
      case 'assignee': {
        return users.map(user => {
          const userTasks = filteredTasks.filter(t => t.assignedTo === user.id);
          return {
            id: user.id,
            name: user.name,
            subtitle: user.discipline ? user.discipline.toUpperCase() : 'GENERAL',
            avatarUrl: user.avatarUrl,
            color: '#F59E0B',
            packedTasks: packTasksForLane(userTasks, timelineDates)
          };
        });
      }
    }
  };

  const lanes = getTimelineLanes();

  // Selected task detail mapping
  const selectedTaskObj = tasks.find(t => t.id === selectedTaskId);
  const selectedTaskProject = selectedTaskObj ? projects.find(p => p.id === selectedTaskObj.projectId) : null;
  const selectedTaskAssignee = selectedTaskObj ? users.find(u => u.id === selectedTaskObj.assignedTo) : null;

  // Timeline-wide analytics
  const scheduledTasksCount = filteredTasks.length;
  const totalLoadHours = filteredTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
  const totalOverdueCount = filteredTasks.filter(t => t.stageId !== 'approved' && new Date(t.dueDate) < todayAnchor).length;

  const getTypeColorClasses = (type: TaskType) => {
    switch (type) {
      case 'architecture':
        return 'bg-red-500 border-red-600 text-white hover:bg-red-600';
      case 'structure':
        return 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600';
      case 'electric':
        return 'bg-indigo-500 border-indigo-600 text-white hover:bg-indigo-600';
      case 'mechanical':
        return 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600';
      default:
        return 'bg-slate-500 border-slate-600 text-white hover:bg-slate-600';
    }
  };

  return (
    <div id="schedule-timeline-view" className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
      
      {/* Schedule Timeline Grid Frame (3 columns spacing) */}
      <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        
        {/* Timeline Header Controls Desk */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          
          {/* Group and Range Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Nav Arrows */}
            <div className="flex items-center bg-white border border-slate-200 rounded p-1 shadow-2xs">
              <button 
                onClick={handlePrevRange}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                title="Move 1 Week Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextRange}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                title="Move 1 Week Forward"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-3xs">
              <button
                onClick={() => setGroupBy('project')}
                className={`px-3 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                  groupBy === 'project' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Project
              </button>
              <button
                onClick={() => setGroupBy('discipline')}
                className={`px-3 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                  groupBy === 'discipline' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Discipline
              </button>
              <button
                onClick={() => setGroupBy('assignee')}
                className={`px-3 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                  groupBy === 'assignee' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Assignee
              </button>
            </div>

            <button
              onClick={handleGoToToday}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[11px] text-slate-600 font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-3xs"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              Reset Window
            </button>
          </div>

          {/* Scale & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Timeline Window Scale */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 text-xs shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <select
                className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                value={timeScaleDays}
                onChange={(e) => setTimeScaleDays(Number(e.target.value))}
              >
                <option value={10}>10 Days View</option>
                <option value={14}>14 Days View</option>
                <option value={21}>21 Days View</option>
                <option value={30}>30 Days View</option>
              </select>
            </div>

            {/* Project Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 text-xs shadow-2xs">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <select
                className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Discipline Filter */}
            {isTeamMember ? (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded text-amber-800 text-[11px] font-bold font-mono shadow-2xs select-none">
                <span>🔒 {currentUser.discipline?.toUpperCase()} ONLY</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 text-xs shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                >
                  <option value="all">All Disciplines</option>
                  <option value="architecture">Architecture</option>
                  <option value="structure">Structure</option>
                  <option value="electric">Electrical</option>
                  <option value="mechanical">Mechanical</option>
                </select>
              </div>
            )}

          </div>

        </div>

        {/* Timeline Dates Scroll Grid Frame */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[800px] flex flex-col">
            
            {/* Grid Days Header Track */}
            <div className="flex border-b border-slate-100 bg-slate-50/70 py-2.5">
              <div className="w-[180px] shrink-0 pl-4 flex items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Swimlanes</span>
              </div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${timeScaleDays}, minmax(0, 1fr))` }}>
                {timelineDates.map(dateStr => {
                  const dateObj = new Date(dateStr + 'T00:00:00');
                  const isToday = dateStr === '2026-06-22';
                  
                  return (
                    <div 
                      key={dateStr} 
                      className={`text-center py-1 flex flex-col items-center justify-center border-l border-slate-100/60 font-mono ${
                        isToday ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <span className={`text-[9px] font-bold uppercase ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {dateObj.toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      <span className={`text-xs font-extrabold mt-0.5 px-1.5 rounded-full ${
                        isToday ? 'bg-indigo-600 text-white font-black scale-105' : 'text-slate-700'
                      }`}>
                        {dateObj.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Swimlanes Rows Container */}
            <div className="divide-y divide-slate-100 bg-slate-50/10 flex-1">
              {lanes.length === 0 ? (
                <div className="text-center py-24 text-slate-400">
                  <LayoutGrid className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No active timeline objects match your filters.</p>
                </div>
              ) : (
                lanes.map(lane => {
                  // Calculate dynamic row packing height
                  const maxRowIndex = lane.packedTasks.reduce((max, pt) => pt.rowIndex > max ? pt.rowIndex : max, -1);
                  const trackHeight = Math.max((maxRowIndex + 1) * 38 + 20, 75);

                  return (
                    <div key={lane.id} className="flex min-h-[75px] transition-colors hover:bg-slate-50/20">
                      
                      {/* Lane details block */}
                      <div className="w-[180px] shrink-0 p-3 flex flex-col justify-center border-r border-slate-100 bg-slate-50/40 select-none">
                        <div className="flex items-center gap-2">
                          {lane.avatarUrl ? (
                            <img 
                              src={lane.avatarUrl} 
                              alt={lane.name} 
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded-full object-cover shrink-0" 
                            />
                          ) : (
                            <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: lane.color }} />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate leading-tight" title={lane.name}>{lane.name}</h4>
                            <span className="text-[9px] font-mono font-bold text-slate-450 uppercase leading-none block mt-0.5">{lane.subtitle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Lane Gantt Schedule Tracks Area */}
                      <div className="flex-1 relative" style={{ height: `${trackHeight}px` }}>
                        
                        {/* Column separator background lines */}
                        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${timeScaleDays}, minmax(0, 1fr))` }}>
                          {timelineDates.map(dateStr => (
                            <div key={`bg-line-${dateStr}`} className={`border-l border-slate-100 h-full ${
                              dateStr === '2026-06-22' ? 'bg-indigo-50/10 border-l-indigo-200/50' : ''
                            }`} />
                          ))}
                        </div>

                        {/* Absolutely positioned Dynamic Gantt Task Bars */}
                        <div className="absolute inset-0 p-2.5">
                          {lane.packedTasks.map(pt => {
                            const totalCols = timeScaleDays;
                            const leftPct = (pt.startIndex / totalCols) * 100;
                            const widthPct = ((pt.endIndex - pt.startIndex + 1) / totalCols) * 100;
                            const topPx = pt.rowIndex * 38;
                            const isSelected = selectedTaskId === pt.task.id;

                            return (
                              <motion.div
                                key={pt.task.id}
                                layoutId={`timeline-bar-${pt.task.id}`}
                                onClick={() => setSelectedTaskId(pt.task.id)}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  top: `${topPx}px`
                                }}
                                className={`absolute h-8 rounded-lg shadow-3xs hover:shadow-2xs border px-2.5 flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'ring-2 ring-indigo-600 ring-offset-1 z-30 font-extrabold scale-[1.01]' 
                                    : 'z-10 hover:scale-[1.005]'
                                } ${getTypeColorClasses(pt.task.type)}`}
                              >
                                <span className="text-[10px] font-mono truncate font-bold uppercase flex-1">{pt.task.title}</span>
                                
                                {pt.isOverdue && (
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-200 animate-pulse" title="Schedule Overdue!" />
                                )}
                              </motion.div>
                            );
                          })}
                        </div>

                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Schedule Details Side-car Tool Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 flex flex-col justify-between">
        
        {/* Upper Details Block */}
        <div className="space-y-4">
          <div className="pb-3 border-b border-indigo-100">
            <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-500 block">Schedule Timeline</span>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <CalendarIcon className="w-4 h-4 text-indigo-500" /> Track Scheduler
            </h3>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Currently tracking Gantt durations from design inception to approved construction release.
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            {selectedTaskObj ? (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                key={selectedTaskObj.id}
                className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 shadow-3xs space-y-3.5 relative"
              >
                {/* Ribbon Tag */}
                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 border rounded-md font-mono ${
                  selectedTaskObj.type === 'architecture' ? 'bg-red-50 text-red-700 border-red-100' :
                  selectedTaskObj.type === 'structure' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  selectedTaskObj.type === 'electric' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                  selectedTaskObj.type === 'mechanical' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  {selectedTaskObj.type}
                </span>

                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 leading-snug">{selectedTaskObj.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                    {selectedTaskObj.description}
                  </p>
                </div>

                <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-150 text-[10px] font-mono text-slate-500">
                  <div className="flex justify-between">
                    <span>Priority:</span>
                    <span className="font-extrabold uppercase text-slate-700">{selectedTaskObj.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span className="font-extrabold text-indigo-600">{selectedTaskObj.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est Hours:</span>
                    <span className="font-extrabold text-slate-700">{selectedTaskObj.estimatedHours} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Project:</span>
                    <span className="font-semibold text-slate-600 truncate max-w-[110px]">{selectedTaskProject ? selectedTaskProject.name : 'N/A'}</span>
                  </div>
                </div>

                {selectedTaskAssignee && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <img 
                      src={selectedTaskAssignee.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'} 
                      alt={selectedTaskAssignee.name} 
                      className="w-5 h-5 rounded-full border border-white"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-700 block leading-none">{selectedTaskAssignee.name}</span>
                      <span className="text-[8px] font-mono text-slate-400 block mt-0.5">{selectedTaskAssignee.discipline?.toUpperCase() || 'GENERAL'}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onSelectTask(selectedTaskObj.id)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Task Workspace
                </button>
              </motion.div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <LayoutGrid className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
                <p className="text-xs font-medium">Select a colored timeline bar to audit its schedule properties.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Lower Timeline Statistics */}
        <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-3 mt-4">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block font-mono">timeline health indices</span>
          
          <div className="grid grid-cols-2 gap-2 text-center text-slate-800 font-mono">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="block text-[8px] uppercase text-slate-400 font-bold mb-0.5">Tasks Spanned</span>
              <span className="text-sm font-extrabold text-slate-800">{scheduledTasksCount}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="block text-[8px] uppercase text-slate-400 font-bold mb-0.5">Total Load</span>
              <span className="text-xs font-extrabold text-slate-800 leading-normal">{totalLoadHours} hrs</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs font-mono">
            <span className="text-slate-400 text-[9px] uppercase font-bold">Timeline Overdue</span>
            <span className={`font-extrabold px-1.5 py-0.2 rounded-full text-[10px] ${
              totalOverdueCount > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalOverdueCount} delay{totalOverdueCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] text-indigo-850 space-y-1">
            <div className="flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 inline shrink-0" />
              <span>Gantt Sequence Lock</span>
            </div>
            <p className="text-[9px] text-indigo-700/90 leading-relaxed font-sans">
              Schedule tracks visually chart individual durations between task registration date and projected completion milestones.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
