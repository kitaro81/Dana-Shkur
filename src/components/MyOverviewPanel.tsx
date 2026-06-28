import React, { useState, useMemo } from 'react';
import { Project, Task, User, WorkflowStage, Label, VisualSettings } from '../types';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Tag, 
  Folder, 
  ArrowUpDown, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  CircleDot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getBrandClasses } from '../utils/theme';

interface MyOverviewPanelProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  stages: WorkflowStage[];
  currentUser: User;
  onSelectTask: (taskId: string) => void;
  visualSettings?: VisualSettings;
}

export function MyOverviewPanel({ 
  tasks, 
  projects, 
  users, 
  stages, 
  currentUser, 
  onSelectTask,
  visualSettings
}: MyOverviewPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'all' | 'active' | 'completed'
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const brand = getBrandClasses(visualSettings?.primaryColor);

  // Find all tasks assigned to current user
  const myTasks = useMemo(() => {
    return tasks.filter(task => {
      // Not archived
      if (task.archived) return false;

      // Check if assigned to current user (both direct assignedTo or in assignedUserIds)
      const isAssigned = task.assignedTo === currentUser.id || 
                         (task.assignedUserIds && task.assignedUserIds.includes(currentUser.id));
      
      return isAssigned;
    });
  }, [tasks, currentUser.id]);

  // Identify final/completed stages
  const completedStageIds = useMemo(() => {
    return stages.filter((s, i) => {
      const idLower = s.id.toLowerCase();
      const nameLower = s.name.toLowerCase();
      return i === stages.length - 1 || 
             idLower.includes('approve') || 
             idLower.includes('complete') || 
             idLower.includes('done') ||
             nameLower.includes('issued for construction') ||
             nameLower.includes('complete') ||
             nameLower.includes('delivered');
    }).map(s => s.id);
  }, [stages]);

  // Calculate stats for assigned tasks
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let total = myTasks.length;
    let completed = 0;
    let active = 0;
    let overdue = 0;
    let dueSoon = 0; // due within 48 hours

    myTasks.forEach(task => {
      const isCompleted = completedStageIds.includes(task.stageId);
      if (isCompleted) {
        completed++;
      } else {
        active++;
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          if (dueDate < today) {
            overdue++;
          } else {
            const diffTime = Math.abs(dueDate.getTime() - today.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 2) {
              dueSoon++;
            }
          }
        }
      }
    });

    return { total, completed, active, overdue, dueSoon };
  }, [myTasks, completedStageIds]);

  // Filter and sort the tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...myTasks];

    // Search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) || 
        task.id.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Project filter
    if (projectFilter !== 'all') {
      result = result.filter(task => task.projectId === projectFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(task => task.priority === priorityFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(task => !completedStageIds.includes(task.stageId));
    } else if (statusFilter === 'completed') {
      result = result.filter(task => completedStageIds.includes(task.stageId));
    }

    // Sort by due date
    result.sort((a, b) => {
      if (!a.dueDate) return 1; // place tasks without due date at the end
      if (!b.dueDate) return -1;
      
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();

      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [myTasks, searchTerm, projectFilter, priorityFilter, statusFilter, sortOrder, completedStageIds]);

  // Get project information for a task
  const getProjectInfo = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  // Get stage information for a task
  const getStageInfo = (stageId: string) => {
    return stages.find(s => s.id === stageId);
  };

  // Format priority styling
  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200/50">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
            Low
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 px-2.5 py-0.5 rounded-full bg-slate-100">
            {priority}
          </span>
        );
    }
  };

  // Format due date indicator
  const getDueDateDisplay = (dueDateStr?: string, stageId?: string) => {
    if (!dueDateStr) {
      return {
        text: 'No due date',
        style: 'text-slate-400',
        icon: <Clock className="w-3.5 h-3.5 text-slate-400" />
      };
    }

    const isCompleted = completedStageIds.includes(stageId || '');
    if (isCompleted) {
      return {
        text: `Due: ${dueDateStr}`,
        style: 'text-slate-500 line-through',
        icon: <Clock className="w-3.5 h-3.5 text-slate-400" />
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(dueDateStr);

    if (dueDate < today) {
      return {
        text: `Overdue (${dueDateStr})`,
        style: 'text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100',
        icon: <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
      };
    }

    const diffTime = Math.abs(dueDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 2) {
      return {
        text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''} (${dueDateStr})`,
        style: 'text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100',
        icon: <Clock className="w-3.5 h-3.5 text-amber-500" />
      };
    }

    return {
      text: dueDateStr,
      style: 'text-slate-600 font-medium',
      icon: <Calendar className="w-3.5 h-3.5 text-slate-500" />
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded border border-[#e5e5e5]">
        <div>
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <Folder className={`w-5 h-5 ${brand.text}`} />
            My Work Overview
          </h2>
        </div>

        {/* Action button bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-[#e5e5e5] bg-white text-[#737373] hover:bg-slate-50 ${brand.hoverText} ${brand.hoverBorder} transition-all cursor-pointer`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort: {sortOrder === 'asc' ? 'Earliest Deadline' : 'Latest Deadline'}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Assigned */}
        <div className={`bg-white border border-[#e5e5e5] border-t-4 ${brand.borderBrand} p-4 rounded shadow-sm`}>
          <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider font-mono">Total Assigned Tasks</p>
          <h3 className="text-2xl font-bold text-black mt-1">
            {stats.total}
          </h3>
          <p className="text-[10px] text-[#737373] mt-1.5 font-mono">
            Across all authorized projects
          </p>
        </div>

        {/* Active Work */}
        <div className={`bg-white border border-[#e5e5e5] border-t-4 ${brand.borderBrand} p-4 rounded shadow-sm`}>
          <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider font-mono">Active Responsibilities</p>
          <h3 className="text-2xl font-bold text-black mt-1">
            {stats.active}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Tasks in progress/backlog stages
          </p>
        </div>

        {/* Overdue Limit */}
        <div className={`p-4 rounded border border-t-4 ${
          stats.overdue > 0 
            ? 'bg-red-50/20 border-red-200 border-t-red-500' 
            : `bg-white border-[#e5e5e5] ${brand.borderBrand}`
        } shadow-sm`}>
          <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider font-mono">Overdue Actions</p>
          <h3 className={`text-2xl font-bold mt-1 ${
            stats.overdue > 0 ? 'text-red-600' : 'text-black'
          }`}>
            {stats.overdue}
          </h3>
          <p className="text-[10px] text-[#737373] mt-1.5 font-mono">
            Deadlines missed
          </p>
        </div>

        {/* Due soon */}
        <div className={`p-4 rounded border border-t-4 ${
          stats.dueSoon > 0 
            ? 'bg-amber-50/25 border-amber-200 border-t-amber-500' 
            : `bg-white border-[#e5e5e5] ${brand.borderBrand}`
        } shadow-sm`}>
          <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider font-mono">Due Soon</p>
          <h3 className={`text-2xl font-bold mt-1 ${
            stats.dueSoon > 0 ? 'text-amber-600' : 'text-black'
          }`}>
            {stats.dueSoon}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Required within next 48h
          </p>
        </div>
      </div>

      {/* Filter Options & List Control Panel */}
      <div className="bg-white border border-[#e5e5e5] p-4 rounded flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by task title, description, ID..."
            className={`w-full text-xs pl-9 pr-4 py-2 bg-[#fafafa] border border-[#e5e5e5] rounded focus:outline-none ${brand.borderFocus} focus:ring-1 ${brand.ring} text-black font-sans`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter tabs */}
          <div className="inline-flex rounded bg-slate-100 p-1">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? `${brand.bg} text-white shadow-sm`
                  : 'text-[#737373] hover:text-black'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? `${brand.bg} text-white shadow-sm`
                  : 'text-[#737373] hover:text-black'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? `${brand.bg} text-white shadow-sm`
                  : 'text-[#737373] hover:text-black'
              }`}
            >
              All
            </button>
          </div>

          {/* Project Dropdown */}
          <select
            className={`text-xs px-2.5 py-1.5 bg-[#fafafa] border border-[#e5e5e5] rounded text-black focus:outline-none ${brand.borderFocus} focus:ring-1 ${brand.ring} font-sans cursor-pointer`}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(proj => (
              <option key={proj.id} value={proj.id}>{proj.name}</option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            className={`text-xs px-2.5 py-1.5 bg-[#fafafa] border border-[#e5e5e5] rounded text-black focus:outline-none ${brand.borderFocus} focus:ring-1 ${brand.ring} font-sans cursor-pointer`}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Unified Task List */}
      <div className="bg-white border border-[#e5e5e5] rounded overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#e5e5e5] bg-[#fafafa] flex items-center justify-between">
          <h3 className="text-xs font-bold text-black uppercase tracking-wider font-mono">
            Unified Queue ({filteredAndSortedTasks.length} tasks)
          </h3>
          <span className={`text-[10px] ${brand.bg} text-white font-mono px-2 py-0.5 rounded`}>
            Filtered View
          </span>
        </div>

        {filteredAndSortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-xs text-slate-400">
            No assigned tasks
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAndSortedTasks.map((task, index) => {
              const project = getProjectInfo(task.projectId);
              const stage = getStageInfo(task.stageId);
              const dueDateObj = getDueDateDisplay(task.dueDate, task.stageId);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.4) }}
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-all cursor-pointer group"
                >
                  {/* Task details & Project relation */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Project Pill */}
                      {project && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-black ${brand.bgSoft} px-2 py-0.5 rounded font-mono border ${brand.borderBrandSoft}`}>
                          {project.name}
                        </span>
                      )}
                      
                      {/* Task Code */}
                      {task.code && (
                        <span className="text-[10px] font-mono text-[#737373] font-semibold">
                          #{task.code}
                        </span>
                      )}

                      {/* Discipline / Type Pill */}
                      <span className="text-[10px] uppercase font-bold text-[#737373] font-mono px-1.5 py-0.2 bg-[#f5f5f5] rounded border border-[#e5e5e5]">
                        {task.type}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold text-black ${brand.hoverText} transition-colors`}>
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Stage, priority, due date and interaction button */}
                  <div className="flex flex-wrap items-center gap-4 sm:flex-shrink-0">
                    {/* Stage status tracker */}
                    {stage && (
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-[11px] font-medium text-slate-600">
                          {stage.name}
                        </span>
                      </div>
                    )}

                    {/* Priority badge */}
                    {getPriorityBadge(task.priority)}

                    {/* Due Date Indicator */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {dueDateObj.icon}
                      <span className={dueDateObj.style}>
                        {dueDateObj.text}
                      </span>
                    </div>

                    {/* Open action chevron */}
                    <div className={`hidden sm:block p-1 rounded-full group-hover:bg-slate-100 ${brand.text} transition-all`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
