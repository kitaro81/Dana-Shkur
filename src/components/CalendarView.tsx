import React, { useState, useEffect } from 'react';
import { Task, Project, User, WorkflowStage, TaskType, VisualSettings } from '../types';
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
  LayoutGrid,
  Flag,
  Pin,
  Grid,
  Trash2,
  PlusCircle,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getBrandClasses } from '../utils/theme';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  stages: WorkflowStage[];
  selectedProjectId: string;
  onSelectTask: (taskId: string) => void;
  currentUser: User;
  onUpdateTask?: (updatedTask: Task) => void;
  visualSettings?: VisualSettings;
}

export interface TaskMarker {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  color: string; // Hex color code or similar
  description?: string;
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
  onUpdateTask,
  visualSettings,
}) => {
  const isTeamMember = currentUser.role !== 'admin' && currentUser.role !== 'viewer';
  
  const brand = getBrandClasses(visualSettings?.primaryColor);
  
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

  // Snap to Grid state
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Task Markers state
  const [taskMarkers, setTaskMarkers] = useState<TaskMarker[]>([]);

  // Marker Form States
  const [showAddMarker, setShowAddMarker] = useState<boolean>(false);
  const [markerFormDate, setMarkerFormDate] = useState<string>('2026-06-22');
  const [markerFormTitle, setMarkerFormTitle] = useState<string>('');
  const [markerFormColor, setMarkerFormColor] = useState<string>('#6366F1');
  const [markerFormDesc, setMarkerFormDesc] = useState<string>('');
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  // Visual/Action Feedback Banner Trigger
  const triggerFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  // Add customized task marker (Milestone)
  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markerFormTitle.trim()) return;

    // Dates naturally conform to standard grid because they are from HTML5 date picker (daily YYYY-MM-DD format)
    const newMarker: TaskMarker = {
      id: `marker-${Date.now()}`,
      date: markerFormDate,
      title: markerFormTitle.trim(),
      color: markerFormColor,
      description: markerFormDesc.trim() || undefined
    };

    setTaskMarkers(prev => [...prev, newMarker]);
    setMarkerFormTitle('');
    setMarkerFormDesc('');
    setShowAddMarker(false);
    triggerFeedback(`Task Marker "${newMarker.title}" pinned successfully!`);
  };

  // Delete task marker
  const handleDeleteMarker = (id: string) => {
    const target = taskMarkers.find(m => m.id === id);
    setTaskMarkers(prev => prev.filter(m => m.id !== id));
    if (target) {
      triggerFeedback(`Marker "${target.title}" has been deleted.`);
    }
  };

  // Gantt Date Shifter (Slides the task in time)
  const handleShiftTask = (task: Task, days: number) => {
    if (!onUpdateTask) return;

    const currentDueDateObj = new Date(task.dueDate + 'T00:00:00');
    currentDueDateObj.setDate(currentDueDateObj.getDate() + days);
    const newDueDateStr = currentDueDateObj.toISOString().split('T')[0];

    let newCreatedAtStr = task.createdAt;
    if (task.createdAt) {
      const currentCreatedDateObj = new Date(task.createdAt.substring(0, 10) + 'T00:00:00');
      currentCreatedDateObj.setDate(currentCreatedDateObj.getDate() + days);
      const timePortion = task.createdAt.includes('T') ? task.createdAt.split('T')[1] : '12:00:00.000Z';
      newCreatedAtStr = `${currentCreatedDateObj.toISOString().split('T')[0]}T${timePortion}`;
    }

    const updated = {
      ...task,
      createdAt: newCreatedAtStr,
      dueDate: newDueDateStr,
      updatedAt: new Date().toISOString()
    };

    onUpdateTask(updated);
    triggerFeedback(`Shifted task block by ${days} day${Math.abs(days) !== 1 ? 's' : ''}${snapToGrid ? ' (Snapped to Grid)' : ''}`);
  };

  // Gantt Duration Resizer (Extends or contracts task)
  const handleResizeTask = (task: Task, days: number) => {
    if (!onUpdateTask) return;

    const currentDueDateObj = new Date(task.dueDate + 'T00:00:00');
    currentDueDateObj.setDate(currentDueDateObj.getDate() + days);
    const newDueDateStr = currentDueDateObj.toISOString().split('T')[0];

    const startDateStr = task.createdAt ? task.createdAt.substring(0, 10) : '2026-06-22';
    if (new Date(newDueDateStr) < new Date(startDateStr)) {
      triggerFeedback("Error: Cannot contract duration past task start date!");
      return;
    }

    const updated = {
      ...task,
      dueDate: newDueDateStr,
      updatedAt: new Date().toISOString()
    };

    onUpdateTask(updated);
    triggerFeedback(`Adjusted due date by ${days} day${Math.abs(days) !== 1 ? 's' : ''}${snapToGrid ? ' (Snapped to Grid)' : ''}`);
  };

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
                  groupBy === 'project' ? `${brand.bg} text-white` : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Project
              </button>
              <button
                onClick={() => setGroupBy('discipline')}
                className={`px-3 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                  groupBy === 'discipline' ? `${brand.bg} text-white` : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Discipline
              </button>
              <button
                onClick={() => setGroupBy('assignee')}
                className={`px-3 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                  groupBy === 'assignee' ? `${brand.bg} text-white` : 'text-slate-600 hover:bg-slate-50'
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

            <button
              onClick={() => {
                setSnapToGrid(prev => !prev);
                triggerFeedback(snapToGrid ? "Snap to Grid: DISABLED (Fluid adjustments)" : "Snap to Grid: ENABLED (Daily align locked)");
              }}
              className={`px-2.5 py-1.5 border text-[11px] font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-3xs ${
                snapToGrid 
                  ? `${brand.bgSoft} ${brand.borderBrandSoft} ${brand.textSoft} ${brand.bgSoftHover}` 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
              title={snapToGrid ? "Align milestones and task adjustments to day grids" : "Free alignment mode"}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Snap to Grid: {snapToGrid ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowAddMarker(prev => !prev)}
              className={`px-2.5 py-1.5 border text-[11px] font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-3xs ${
                showAddMarker 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
              title="Pin a new milestone or project deadline on the timeline"
            >
              <Flag className="w-3.5 h-3.5 text-amber-500" />
              <span>Add Marker</span>
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

        {/* Feedback Alert Toast Overlay */}
        <AnimatePresence>
          {feedbackMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`text-white text-xs font-semibold px-4 py-2.5 flex items-center justify-between border-b shadow-inner ${brand.bg} ${brand.borderBrand}`}
            >
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1 rounded-full">
                  <Pin className="w-3.5 h-3.5 text-white" />
                </div>
                <span>{feedbackMessage}</span>
              </div>
              <button 
                onClick={() => setFeedbackMessage(null)}
                className={`text-[10px] ${brand.bgHover} text-white font-bold px-2 py-0.5 rounded transition-all cursor-pointer`}
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Marker Form Drawer */}
        <AnimatePresence>
          {showAddMarker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50 border-b border-slate-200 overflow-hidden"
            >
              <form onSubmit={handleAddMarker} className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Pin Timeline Milestone / Task Marker
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setShowAddMarker(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Target Date</label>
                    <input 
                      type="date" 
                      value={markerFormDate}
                      onChange={(e) => setMarkerFormDate(e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-${visualSettings?.primaryColor || 'indigo'}-500`}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Marker / Milestone Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Stage 1 Scheme Deliverable"
                      value={markerFormTitle}
                      onChange={(e) => setMarkerFormTitle(e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-${visualSettings?.primaryColor || 'indigo'}-500 placeholder-slate-400`}
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Theme Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={markerFormColor}
                        onChange={(e) => setMarkerFormColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                      />
                      <select
                        value={markerFormColor}
                        onChange={(e) => setMarkerFormColor(e.target.value)}
                        className={`flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-${visualSettings?.primaryColor || 'indigo'}-500`}
                      >
                        <option value="#EF4444">Rose Red</option>
                        <option value="#F59E0B">Amber Yellow</option>
                        <option value="#10B981">Emerald Green</option>
                        <option value="#3B82F6">Royal Blue</option>
                        <option value="#6366F1">Indigo Purple</option>
                        <option value="#EC4899">Hot Pink</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Brief Description</label>
                  <input 
                    type="text"
                    placeholder="Provide details about what must be locked, compiled, or reviewed by this milestone..."
                    value={markerFormDesc}
                    onChange={(e) => setMarkerFormDesc(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-${visualSettings?.primaryColor || 'indigo'}-500 placeholder-slate-400`}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className={`px-4 py-1.5 ${brand.bg} ${brand.bgHover} text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Pin Milestone Marker</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline Dates Scroll Grid Frame */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[800px] flex flex-col">
            
            {/* Grid Days Header Track */}
            <div className="flex border-b border-slate-100 bg-slate-50/70 py-2.5">
              <div className="w-[180px] shrink-0 pl-4 flex items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Swimlanes</span>
              </div>
              <div className="flex-1 grid animate-fadeIn" style={{ gridTemplateColumns: `repeat(${timeScaleDays}, minmax(0, 1fr))` }}>
                {timelineDates.map(dateStr => {
                  const dateObj = new Date(dateStr + 'T00:00:00');
                  const isToday = dateStr === '2026-06-22';
                  const matchingMarkers = taskMarkers.filter(m => m.date === dateStr);
                  
                  return (
                    <div 
                      key={dateStr} 
                      className={`text-center py-1 flex flex-col items-center justify-center border-l border-slate-100/60 font-mono relative group ${
                        isToday ? `${brand.bgSoft}/50` : ''
                      }`}
                    >
                      {/* Milestone Flag Badge indicators with tooltip details */}
                      {matchingMarkers.length > 0 && (
                        <div className="absolute top-0 flex gap-0.5 z-20">
                          {matchingMarkers.map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerFeedback(`Milestone Active: "${m.title}" - ${m.description || 'Deadline checkpoint'}`);
                              }}
                              onMouseEnter={() => setHoveredMarkerId(m.id)}
                              onMouseLeave={() => setHoveredMarkerId(null)}
                              className="p-0.5 rounded-full hover:scale-125 cursor-pointer transition-transform"
                              style={{ color: m.color }}
                              title={`${m.title}${m.description ? `: ${m.description}` : ''}`}
                            >
                              <Flag className="w-3 h-3 fill-current" />
                            </button>
                          ))}
                        </div>
                      )}

                      <span className={`text-[9px] font-bold uppercase ${isToday ? brand.text : 'text-slate-400'}`}>
                        {dateObj.toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      <span className={`text-xs font-extrabold mt-0.5 px-1.5 rounded-full ${
                        isToday ? `${brand.bg} text-white font-black scale-105` : 'text-slate-700'
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
                          <div className={`w-5 h-5 rounded-full ${brand.bgSoft} ${brand.textSoft} flex items-center justify-center text-[9px] font-bold shrink-0`}>
                            {lane.name[0]}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate leading-tight" title={lane.name}>{lane.name}</h4>
                            <span className="text-[9px] font-mono font-bold text-slate-450 uppercase leading-none block mt-0.5">{lane.subtitle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Lane Gantt Schedule Tracks Area */}
                      <div className="flex-1 relative bg-white" style={{ height: `${trackHeight}px` }}>
                        
                        {/* Interactive grid background lines & Snap to Grid click targets */}
                        <div className="absolute inset-0 grid z-0" style={{ gridTemplateColumns: `repeat(${timeScaleDays}, minmax(0, 1fr))` }}>
                          {timelineDates.map(dateStr => {
                            const isToday = dateStr === '2026-06-22';
                            return (
                              <div 
                                key={`bg-line-${dateStr}`} 
                                onClick={() => {
                                  if (selectedTaskId) {
                                    const selectedTask = tasks.find(t => t.id === selectedTaskId);
                                    if (selectedTask && onUpdateTask) {
                                      const updated = {
                                        ...selectedTask,
                                        dueDate: dateStr,
                                        updatedAt: new Date().toISOString()
                                      };
                                      onUpdateTask(updated);
                                      triggerFeedback(`Snapped due date of "${selectedTask.title}" to ${dateStr}`);
                                    }
                                  }
                                }}
                                className={`border-l border-slate-100 h-full transition-colors relative group ${
                                  isToday ? `${brand.bgSoft}/10 ${brand.borderBrandSoft}/50` : ''
                                } ${
                                  selectedTaskId 
                                    ? `cursor-pointer ${brand.bgSoftHover}/30` 
                                    : ''
                                }`}
                                title={selectedTaskId ? `Click to snap selected task due date to ${dateStr} (Snap to Grid)` : undefined}
                              >
                                {selectedTaskId && (
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className={`text-[8px] font-mono font-bold ${brand.text} bg-white border ${brand.borderBrandSoft} px-1.5 py-0.5 rounded shadow-3xs`}>
                                      Snap Date
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Task Milestone Vertical Markers & Guides (Aligning perfectly to the Grid) */}
                        {taskMarkers.map(m => {
                          const markerIndex = timelineDates.indexOf(m.date);
                          if (markerIndex === -1) return null;
                          const markerLeftPct = (markerIndex / timeScaleDays) * 100;
                          return (
                            <div 
                              key={`v-marker-${m.id}`}
                              className="absolute top-0 bottom-0 z-10 pointer-events-none border-l-2 border-dashed transition-all"
                              style={{ 
                                left: `${markerLeftPct}%`, 
                                borderColor: m.color,
                                opacity: hoveredMarkerId === m.id ? 0.9 : 0.4,
                                borderWidth: hoveredMarkerId === m.id ? '2.5px' : '1.5px'
                              }}
                            />
                          );
                        })}

                        {/* Absolutely positioned Dynamic Gantt Task Bars */}
                        <div className="absolute inset-0 p-2.5 z-20">
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
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering cell clicks!
                                  setSelectedTaskId(pt.task.id);
                                }}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  top: `${topPx}px`
                                }}
                                className={`absolute h-8 rounded-lg shadow-3xs hover:shadow-2xs border px-2 flex items-center justify-between gap-1.5 cursor-pointer transition-all ${
                                  isSelected 
                                    ? `ring-2 ${brand.ring} ring-offset-1 z-30 font-extrabold scale-[1.01]` 
                                    : 'z-10 hover:scale-[1.005]'
                                } ${getTypeColorClasses(pt.task.type)}`}
                              >
                                {/* Left Quick Shift Button (only on selected task) */}
                                {isSelected && onUpdateTask && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShiftTask(pt.task, -1);
                                    }}
                                    className="p-0.5 rounded bg-black/20 hover:bg-black/40 text-white cursor-pointer transition-colors shrink-0"
                                    title="Shift 1 Day Left (Snap to Grid)"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Task Priority Marker Dot & Icon */}
                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                  <span 
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      pt.task.priority === 'critical' ? 'bg-red-350 animate-ping' :
                                      pt.task.priority === 'high' ? 'bg-orange-300' :
                                      pt.task.priority === 'medium' ? 'bg-blue-300' :
                                      'bg-slate-300'
                                    }`} 
                                    title={`Priority: ${pt.task.priority}`}
                                  />
                                  <span className="text-[10px] font-mono truncate font-bold uppercase leading-none">{pt.task.title}</span>
                                </div>

                                {/* Right Info Section: Overdue alerts, Stage initials, Assignee Avatar Markers */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {pt.isOverdue && (
                                    <AlertTriangle className="w-3 h-3 text-red-250 animate-pulse" title="Schedule Overdue!" />
                                  )}
                                  
                                  {/* Stage abbreviation marker */}
                                  <span className="text-[8px] font-bold px-1 bg-white/20 text-white rounded uppercase">
                                    {pt.task.stageId.substring(0, 3)}
                                  </span>

                                  {/* Assignee Avatar Marker */}
                                  {pt.task.assignedTo && (
                                    <div 
                                      className="w-4 h-4 rounded-full bg-white/35 flex items-center justify-center text-[7px] font-extrabold text-white border border-white/50 overflow-hidden shrink-0"
                                      title={`Assignee: ${users.find(u => u.id === pt.task.assignedTo)?.name || 'Unknown'}`}
                                    >
                                      {users.find(u => u.id === pt.task.assignedTo)?.name.substring(0, 2).toUpperCase() || '??'}
                                    </div>
                                  )}
                                </div>

                                {/* Right Quick Shift Button (only on selected task) */}
                                {isSelected && onUpdateTask && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShiftTask(pt.task, 1);
                                    }}
                                    className="p-0.5 rounded bg-black/20 hover:bg-black/40 text-white cursor-pointer transition-colors shrink-0"
                                    title="Shift 1 Day Right (Snap to Grid)"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
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
          <div className={`pb-3 border-b ${brand.borderBrandSoft}`}>
            <span className={`text-[9px] uppercase font-bold tracking-widest ${brand.text} block`}>Schedule Timeline</span>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <CalendarIcon className={`w-4 h-4 ${brand.text}`} /> Track Scheduler
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
                    <span className={`font-extrabold ${brand.text}`}>{selectedTaskObj.dueDate}</span>
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
                    <div className={`w-5 h-5 rounded-full ${brand.bgSoft} ${brand.textSoft} flex items-center justify-center text-[9px] font-bold border border-slate-200 flex-shrink-0`}>
                      {selectedTaskAssignee.name[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-700 block leading-none">{selectedTaskAssignee.name}</span>
                      <span className="text-[9.5px] font-mono text-slate-600 block mt-0.5">{selectedTaskAssignee.discipline?.toUpperCase() || 'GENERAL'}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onSelectTask(selectedTaskObj.id)}
                  className={`w-full py-2 ${brand.bg} ${brand.bgHover} text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Task Workspace
                </button>

                {/* Snap to Grid Interactive Action Panel */}
                {onUpdateTask && (
                  <div className="pt-3.5 border-t border-slate-150 space-y-3.5 animate-fadeIn">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block font-mono">
                      Gantt Grid Adjusters (Snap Mode)
                    </span>
                    
                    {/* Shift Row */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase font-mono">
                        <span>Slide Task Position</span>
                        <span className={`px-1 rounded ${brand.textSoft} ${brand.bgSoft}`}>Shift Date</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => handleShiftTask(selectedTaskObj, -3)}
                          className="px-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded text-slate-600 cursor-pointer transition-colors"
                          title="Shift 3 days earlier"
                        >
                          -3d
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShiftTask(selectedTaskObj, -1)}
                          className="px-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded text-slate-600 cursor-pointer transition-colors"
                          title="Shift 1 day earlier"
                        >
                          -1d
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShiftTask(selectedTaskObj, 1)}
                          className="px-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded text-slate-600 cursor-pointer transition-colors"
                          title="Shift 1 day later"
                        >
                          +1d
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShiftTask(selectedTaskObj, 3)}
                          className="px-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded text-slate-600 cursor-pointer transition-colors"
                          title="Shift 3 days later"
                        >
                          +3d
                        </button>
                      </div>
                    </div>

                    {/* Resize Duration Row */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase font-mono">
                        <span>Extend/Contract Duration</span>
                        <span className="text-amber-600 bg-amber-50 px-1 rounded">Adjust End</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => handleResizeTask(selectedTaskObj, -3)}
                          className="px-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded text-slate-600 cursor-pointer transition-colors"
                          title="Reduce task length by 3 days"
                        >
                          -3d
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResizeTask(selectedTaskObj, -1)}
                          className="px-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded text-slate-600 cursor-pointer transition-colors"
                          title="Reduce task length by 1 day"
                        >
                          -1d
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResizeTask(selectedTaskObj, 1)}
                          className="px-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded text-slate-600 cursor-pointer transition-colors"
                          title="Extend task length by 1 day"
                        >
                          +1d
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResizeTask(selectedTaskObj, 3)}
                          className="px-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded text-slate-600 cursor-pointer transition-colors"
                          title="Extend task length by 3 days"
                        >
                          +3d
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <LayoutGrid className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
                <p className="text-xs font-medium">Select a colored timeline bar to audit or adjust its schedule properties.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Task Markers & Milestones List */}
        <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              Active Timeline Milestones ({taskMarkers.length})
            </span>
            <div className="flex items-center gap-2">
              {taskMarkers.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete all milestone markers?')) {
                      setTaskMarkers([]);
                      triggerFeedback('All milestone markers deleted.');
                    }
                  }}
                  className="text-[9px] text-red-600 hover:text-red-700 hover:underline font-bold cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowAddMarker(true)}
                className={`text-[9px] ${brand.text} hover:underline font-bold cursor-pointer`}
              >
                + Add Marker
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {taskMarkers.map(m => (
              <div
                key={m.id}
                onMouseEnter={() => setHoveredMarkerId(m.id)}
                onMouseLeave={() => setHoveredMarkerId(null)}
                className={`p-2 rounded-lg bg-white border text-[10px] flex items-center justify-between gap-1.5 transition-all ${
                  hoveredMarkerId === m.id ? `${brand.borderBrand} shadow-3xs` : 'border-slate-150'
                }`}
              >
                <div className="flex items-start gap-1.5 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ backgroundColor: m.color }} />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-850 block truncate" title={m.title}>{m.title}</span>
                    <span className="text-[9.5px] font-mono text-slate-600 font-bold block">{m.date}</span>
                    {m.description && (
                      <span className="text-[9.5px] text-slate-650 line-clamp-1 mt-0.5">{m.description}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMarker(m.id)}
                  className="p-1 text-slate-500 hover:text-red-500 rounded hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                  title="Remove Marker"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {taskMarkers.length === 0 && (
              <p className="text-[10.5px] text-slate-600 italic text-center py-2">No milestones pinned to the schedule.</p>
            )}
          </div>
        </div>



      </div>

    </div>
  );
};
