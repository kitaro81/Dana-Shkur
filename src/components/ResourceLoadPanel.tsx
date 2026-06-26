import React, { useState, useMemo } from 'react';
import { Task, User, WorkflowStage, Project } from '../types';
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Sliders, 
  Filter, 
  Briefcase, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

interface ResourceLoadPanelProps {
  tasks: Task[];
  users: User[];
  stages: WorkflowStage[];
  projects: Project[];
}

export function ResourceLoadPanel({ tasks, users, stages, projects }: ResourceLoadPanelProps) {
  // Configurable thresholds for over-allocation
  const [taskThreshold, setTaskThreshold] = useState<number>(4);
  const metricType = 'tasks';
  
  // Exclude completed/final stages from active workload calculation option
  const [excludeCompleted, setExcludeCompleted] = useState<boolean>(true);
  
  // Search and specialty filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Filter out deactivated users
  const activeUsers = useMemo(() => {
    return users.filter(u => !u.deactivated);
  }, [users]);

  // Identify final/completed stage IDs
  const finalStageIds = useMemo(() => {
    // Treat the last stage or stages with 'approved'/'completed'/'done' in the ID/name as completed
    const finalStages = stages.filter((s, i) => {
      const idLower = s.id.toLowerCase();
      const nameLower = s.name.toLowerCase();
      return i === stages.length - 1 || 
             idLower.includes('approve') || 
             idLower.includes('complete') || 
             idLower.includes('done') ||
             nameLower.includes('issued for construction') ||
             nameLower.includes('complete') ||
             nameLower.includes('delivered');
    });
    return finalStages.map(s => s.id);
  }, [stages]);

  // Compute workload statistics for each user
  const userLoads = useMemo(() => {
    return activeUsers.map(user => {
      // Find all tasks assigned to this user
      const assignedTasks = tasks.filter(task => {
        // Exclude archived tasks
        if (task.archived) return false;
        
        // Match project filter
        if (projectFilter !== 'all' && task.projectId !== projectFilter) return false;

        // Check both single assignee and multiple assignees
        const isAssigned = task.assignedTo === user.id || task.assignedUserIds?.includes(user.id);
        
        if (!isAssigned) return false;
        
        // Optionally exclude completed tasks
        if (excludeCompleted && finalStageIds.includes(task.stageId)) {
          return false;
        }
        
        return true;
      });

      // Group tasks by stage
      const stageCounts: Record<string, number> = {};
      stages.forEach(s => {
        stageCounts[s.id] = 0;
      });
      
      assignedTasks.forEach(task => {
        if (stageCounts[task.stageId] !== undefined) {
          stageCounts[task.stageId]++;
        } else {
          stageCounts[task.stageId] = (stageCounts[task.stageId] || 0) + 1;
        }
      });

      const totalTasks = assignedTasks.length;
      
      // Determine over-allocation
      const isOverAllocated = totalTasks > taskThreshold;

      const loadRatio = (totalTasks / taskThreshold) * 100;

      return {
        user,
        tasks: assignedTasks,
        stageCounts,
        totalTasks,
        isOverAllocated,
        loadRatio
      };
    });
  }, [activeUsers, tasks, stages, excludeCompleted, finalStageIds, taskThreshold, projectFilter]);

  // Filtered list of users for display
  const filteredUserLoads = useMemo(() => {
    return userLoads.filter(load => {
      const matchSearch = load.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          load.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || load.user.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [userLoads, searchTerm, roleFilter]);

  // Summary statistics
  const stats = useMemo(() => {
    const totalUsers = userLoads.length;
    const overAllocatedCount = userLoads.filter(ul => ul.isOverAllocated).length;
    const totalActiveTasks = userLoads.reduce((sum, ul) => sum + ul.totalTasks, 0);
    const averageLoadPercent = totalUsers > 0 
      ? Math.round(userLoads.reduce((sum, ul) => sum + ul.loadRatio, 0) / totalUsers)
      : 0;

    return {
      totalUsers,
      overAllocatedCount,
      totalActiveTasks,
      averageLoadPercent
    };
  }, [userLoads]);

  // Chart data format: Array of objects with user name and stage counts
  const chartData = useMemo(() => {
    return filteredUserLoads.map(ul => {
      const dataPoint: Record<string, any> = {
        name: ul.user.name.split(' ')[0], // Use first name for space
        fullName: ul.user.name,
        'Total Tasks': ul.totalTasks,
        limit: taskThreshold,
        ratio: Math.round(ul.loadRatio)
      };

      stages.forEach(s => {
        dataPoint[s.name] = ul.stageCounts[s.id] || 0;
      });

      return dataPoint;
    });
  }, [filteredUserLoads, stages, taskThreshold]);

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-md text-xs space-y-1.5">
          <p className="font-bold text-slate-800">{data.fullName}</p>
          <div className="border-t border-slate-100 pt-1.5 space-y-1">
            <p className="text-slate-600">
              <span className="font-semibold">Total Tasks:</span> {data['Total Tasks']} / {taskThreshold}
            </p>
            <p className="text-slate-500">
              <span className="font-semibold">Capacity Used:</span> {data.ratio}%
            </p>
            <div className="pt-1 text-[10px] space-y-0.5 font-mono text-slate-500">
              <p className="font-bold border-b border-slate-100 pb-0.5 mb-1 uppercase tracking-wider">Stages breakdown:</p>
              {stages.map(s => {
                const count = data[s.name] || 0;
                if (count === 0) return null;
                return (
                  <div key={s.id} className="flex justify-between gap-4">
                    <span>{s.name}:</span>
                    <span className="font-bold" style={{ color: s.color }}>{count} tasks</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Resource Allocation & Capacity Load
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Identify bottleneck stages, track task distribution per team member, and visualize potential over-allocations.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        {/* Card 1: Over-allocated resources */}
        <div className={`p-4 rounded-xl border transition-all ${
          stats.overAllocatedCount > 0 
            ? 'bg-red-50/50 border-red-200' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Over-allocated Team</p>
              <h3 className={`text-2xl font-bold mt-1 ${
                stats.overAllocatedCount > 0 ? 'text-red-600' : 'text-slate-900'
              }`}>
                {stats.overAllocatedCount} <span className="text-xs font-normal text-slate-400">/ {stats.totalUsers}</span>
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${
              stats.overAllocatedCount > 0 
                ? 'bg-red-100 text-red-600' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2.5">
            {stats.overAllocatedCount > 0 
              ? `${stats.overAllocatedCount} members exceed maximum ${taskThreshold} tasks limit.`
              : 'All active team members are within bounds.'}
          </p>
        </div>

        {/* Card 2: Avg load capacity */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Capacity Used</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats.averageLoadPercent}%
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3.5">
            <div 
              className={`h-1.5 rounded-full ${
                stats.averageLoadPercent > 100 ? 'bg-red-500' : stats.averageLoadPercent > 80 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(stats.averageLoadPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Total active tasks */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Monitored Load</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats.totalActiveTasks} <span className="text-xs font-normal text-slate-400">Tasks</span>
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2.5">
            {excludeCompleted ? 'Excluding closed/delivered stages' : 'Including all workflow stages'}
          </p>
        </div>
      </div>

      {/* Main Grid: Controls + Visual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Threshold Configuration Panel */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-5 h-fit">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Sliders className="w-4 h-4 text-slate-400" /> Capacity Parameters
          </h3>

          {/* Metric Selector Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Max Active Tasks / Member</span>
              <span className="text-indigo-600 px-1.5 py-0.5 bg-indigo-50 rounded font-mono">
                {taskThreshold} Tasks
              </span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="1"
              className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              value={taskThreshold}
              onChange={(e) => setTaskThreshold(Number(e.target.value))}
            />
            <p className="text-[10px] text-slate-400">
              Flag team members who have more than {taskThreshold} tasks in concurrent active stages.
            </p>
          </div>

          {/* Toggle stage active load */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={excludeCompleted}
                onChange={(e) => setExcludeCompleted(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span className="text-xs font-semibold text-slate-700 select-none">
                Exclude Closed/Completed Stages
              </span>
            </label>
            <p className="text-[10px] text-slate-400 pl-5.5 leading-normal">
              When checked, tasks in finalized/completed columns (like <em>Issued for Construction</em> or <em>Delivered</em>) won't count toward active workload capacity.
            </p>
          </div>

          {/* Filters Panel */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Resources
            </h4>
            
            {/* Search Input */}
            <div>
              <input
                type="text"
                placeholder="Search member name..."
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Role Filter dropdown */}
            <div>
              <select
                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 text-slate-700"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Security Roles</option>
                <option value="admin">Admin</option>
                <option value="lead_designer">Lead Designer</option>
                <option value="engineer">Engineer</option>
              </select>
            </div>

            {/* Project Filter dropdown */}
            <div>
              <select
                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 text-slate-700"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map(proj => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Visualized Stacked Stage Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
              Tasks Distribution Across Pipeline
            </h3>
            <p className="text-[10px] text-slate-400">
              Shows the count of active tasks stacked by their exact Kanban lane color accent.
            </p>
          </div>

          {/* Recharts Container */}
          <div className="h-[280px] w-full mt-4 flex items-center justify-center">
            {chartData.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">
                No matching team members found with assigned tasks.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    axisLine={{ stroke: '#CBD5E1' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                    iconType="circle"
                  />
                  
                  {/* Over-allocation Limit Reference line */}
                  <ReferenceLine 
                    y={taskThreshold} 
                    stroke="#EF4444" 
                    strokeDasharray="4 4"
                    label={{ 
                      value: 'Capacity Limit', 
                      position: 'top', 
                      fill: '#EF4444', 
                      fontSize: 8,
                      fontWeight: 'bold'
                    }} 
                  />

                  {/* Stacked bar chart based on actual stage names and colors! */}
                  {stages.map(s => (
                    <Bar 
                      key={s.id} 
                      dataKey={s.name} 
                      stackId="a" 
                      fill={s.color} 
                      radius={[0, 0, 0, 0]} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Allocations Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
            Active Workload Audit Grid
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded">
            Filtered: {filteredUserLoads.length} Members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono bg-slate-50/30">
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Discipline</th>
                <th className="py-3 px-4 text-center">Active Tasks</th>
                <th className="py-3 px-4">Load Ratio / Capacity Used</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUserLoads.map(ul => {
                const isOver = ul.isOverAllocated;
                
                return (
                  <tr key={ul.user.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={ul.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'} 
                          alt={ul.user.name} 
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-100"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{ul.user.name}</p>
                          <p className="text-[10px] text-slate-400">{ul.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                        {ul.user.discipline || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono">
                      {ul.totalTasks} <span className="text-slate-300">/ {taskThreshold}</span>
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500 font-mono">
                          <span>{Math.round(ul.loadRatio)}% Used</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              isOver 
                                ? 'bg-red-500' 
                                : ul.loadRatio > 75 
                                  ? 'bg-amber-500' 
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(ul.loadRatio, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isOver ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200/50">
                          <AlertTriangle className="w-3.5 h-3.5" /> OVERLOADED
                        </span>
                      ) : ul.totalTasks === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                          Unallocated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
                          <CheckCircle className="w-3.5 h-3.5" /> OPTIMAL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
