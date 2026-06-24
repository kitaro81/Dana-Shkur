import React, { useState } from 'react';
import { Project, Task, User, WorkflowStage, TaskType } from '../types';
import { FileText, Download, Printer, Percent, BarChart2, CheckCircle2, History, AlertTriangle } from 'lucide-react';
import { filterTasksByTimeframe, exportTasksToCSV, printReportHTML } from '../utils/reports';
import { motion } from 'motion/react';

interface ReportsPanelProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  stages: WorkflowStage[];
  currentUser: User;
  reportTemplateSettings?: any;
}

export const ReportsPanel: React.FC<ReportsPanelProps> = ({
  projects,
  tasks,
  users,
  stages,
  currentUser,
  reportTemplateSettings,
}) => {
  const isTeamMember = currentUser.role !== 'admin' && currentUser.role !== 'viewer';
  // Filters: Selected Project & Selected Timeframe
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');

  // Filter tasks based on selections
  const projectFilterTasks = selectedProjectId === 'all' 
    ? tasks 
    : tasks.filter(t => t.projectId === selectedProjectId);

  const finalFilteredTasks = filterTasksByTimeframe(projectFilterTasks, selectedTimeframe);

  // Compute stats metrics
  const totalTasksCount = finalFilteredTasks.length;
  
  const estimatedHoursSum = finalFilteredTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const loggedHoursSum = finalFilteredTasks.reduce((sum, t) => sum + t.loggedHours, 0);
  
  const completedTasksCount = finalFilteredTasks.filter(t => t.stageId === 'approved').length;
  const overdueTasksCount = finalFilteredTasks.filter(t => {
    if (t.stageId === 'approved') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const currentProjectSelection = projects.find(p => p.id === selectedProjectId) || null;

  // Pie chart computations for Task Types / Disciplines
  const typeCounts: Record<TaskType, number> = {
    architecture: 0,
    structure: 0,
    electric: 0,
    mechanical: 0,
    other: 0,
  };
  finalFilteredTasks.forEach(task => {
    if (typeCounts[task.type] !== undefined) {
      typeCounts[task.type]++;
    } else {
      typeCounts.other++;
    }
  });

  const disciplineColors: Record<TaskType, string> = {
    architecture: '#EF4444', // Red-500
    structure: '#3B82F6',    // Blue-500
    electric: '#F59E0B',     // Amber-500
    mechanical: '#10B981',   // Emerald-500
    other: '#64748B',        // Slate-500
  };

  // Stage breakdowns for simple bar representation
  const stageCounts = stages.map(stage => {
    const count = finalFilteredTasks.filter(t => t.stageId === stage.id).length;
    return {
      name: stage.name,
      color: stage.color,
      count
    };
  });

  // Calculate percentage efficiency
  const performanceRate = estimatedHoursSum > 0 
    ? Math.round((loggedHoursSum / estimatedHoursSum) * 100) 
    : 0;

  const handleExportCSV = () => {
    const title = `ledger_report_${selectedProjectId}_${selectedTimeframe}`;
    exportTasksToCSV(finalFilteredTasks, projects, users, stages, title);
  };

  const handlePrint = () => {
    const durationLabel = selectedTimeframe === 'all' ? 'All Time' :
                          selectedTimeframe === 'daily' ? 'Last 24 Hours' :
                          selectedTimeframe === 'weekly' ? 'Last 7 Days' : 'Last 30 Days';
    printReportHTML(finalFilteredTasks, currentProjectSelection, users, stages, durationLabel, reportTemplateSettings);
  };

  return (
    <div className="space-y-6">
      
      {isTeamMember && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
          <div className="flex items-start gap-2.5">
            <span className="text-base select-none mt-0.5">🔒</span>
            <div>
              <p className="text-xs font-bold font-mono tracking-tight text-amber-850">Disciplined Space (Filtered View)</p>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">As a team member, your access is locked to the <span className="font-bold underline uppercase tracking-wider">{currentUser.discipline}</span> discipline. All report analytics, project scopes, and PDF/CSV exports show only your permitted workspace tasks.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters and export triggers bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        
        {/* Selection items */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Project drop down */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-mono">Scope Asset</label>
            <select
              className="text-xs font-semibold px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer text-slate-800"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="all">Enterprise-Wide (All Assets)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>

          {/* Timeframe drop down */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-mono">Duration Window</label>
            <select
              className="text-xs font-semibold px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer text-slate-800"
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            >
              <option value="all">All Logs Registered</option>
              <option value="daily">Live Ledger (Daily - Last 24 Hrs)</option>
              <option value="weekly">Weekly Summary (Last 7 Days)</option>
              <option value="monthly">Monthly Audit (Last 30 Days)</option>
            </select>
          </div>

        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" /> EXPORT CSV
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" /> GENERATE REPORT PDF
          </button>

        </div>
      </div>

      {/* Main KPI Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* KPI 1: Active Tasks */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="block text-[10px] uppercase font-mono font-bold text-slate-400">Tasks Scoped</span>
              <span className="text-2xl font-black font-mono text-slate-900">{totalTasksCount}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-500 border border-slate-100">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          {/* Progress metric */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>Completed Design:</span>
            <span className="font-bold text-emerald-600">{completedTasksCount} finished</span>
          </div>
        </div>

        {/* KPI 2: Logged Hours */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="block text-[10px] uppercase font-mono font-bold text-slate-400">Logged Hours</span>
              <span className="text-2xl font-black font-mono text-slate-900">{loggedHoursSum} <span className="text-xs text-slate-400">/ {estimatedHoursSum} hrs</span></span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-500 border border-slate-100">
              <History className="w-5 h-5" />
            </div>
          </div>
          {/* visual percentage progress */}
          <div className="mt-4">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
              <div className="bg-indigo-600 h-full" style={{ width: `${Math.min(100, (loggedHoursSum / (estimatedHoursSum || 1)) * 100)}%` }} />
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">Log utilization:</span>
              <span className="font-bold text-slate-700">{estimatedHoursSum > 0 ? Math.round((loggedHoursSum / estimatedHoursSum) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Speed index/Performance Rate */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="block text-[10px] uppercase font-mono font-bold text-slate-400">Engineering Ratio</span>
              <span className="text-2xl font-black font-mono text-slate-900">{performanceRate}%</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-500 border border-slate-100">
              <Percent className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed line-clamp-1">
            {performanceRate > 100 ? 'Logged ahead of estimated milestones' : 'Within calculated bounds'}
          </p>
        </div>

        {/* KPI 4: Overdue Deliveries */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="block text-[10px] uppercase font-mono font-bold text-slate-400">Milestone Risks</span>
              <span className={`text-2xl font-black font-mono ${overdueTasksCount > 0 ? 'text-red-600 animate-pulse' : 'text-slate-950'}`}>
                {overdueTasksCount} overdue
              </span>
            </div>
            <div className={`p-2 rounded-lg border ${overdueTasksCount > 0 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">
            {overdueTasksCount > 0 ? 'Immediate team redistribution required' : 'All structural pipelines stable'}
          </p>
        </div>

      </div>

      {/* Graphical Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart A: Discipline Distribution (Custom Responsive SVG Chart) */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-4">
          <h3 className="text-xs uppercase font-mono font-bold text-slate-705 tracking-wider border-b border-slate-100 pb-2">Category distribution</h3>
          
          {totalTasksCount === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs italic">No design tasks scannable for specified filter metrics.</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
              
              {/* Radial Pie Layout */}
              <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
                <svg width="170" height="170" viewBox="0 0 170 170" className="transform -rotate-90">
                  {(() => {
                    let accumulatedPercent = 0;
                    return (Object.keys(typeCounts) as TaskType[]).map((type, idx) => {
                      const val = typeCounts[type];
                      if (val === 0) return null;
                      
                      const percent = val / totalTasksCount;
                      const radLength = 2 * Math.PI * 65; // radius 65
                      const strokeDasharray = `${percent * radLength} ${radLength}`;
                      const strokeDashoffset = -accumulatedPercent * radLength;
                      accumulatedPercent += percent;

                      return (
                        <circle
                          key={type}
                          cx="85"
                          cy="85"
                          r="65"
                          fill="transparent"
                          stroke={disciplineColors[type]}
                          strokeWidth="24"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:scale-105 origin-center cursor-pointer"
                        />
                      );
                    });
                  })()}
                </svg>

                {/* center typography */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black font-mono text-slate-800">{totalTasksCount}</span>
                  <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">Scope items</span>
                </div>
              </div>

              {/* Legend with direct counters */}
              <div className="flex-1 space-y-2.5 w-full">
                {(Object.keys(typeCounts) as TaskType[]).map(type => {
                  const count = typeCounts[type];
                  return (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: disciplineColors[type] }} />
                        <span className="font-semibold text-slate-700 capitalize">{type}</span>
                      </div>
                      <span className="font-mono text-slate-500 font-semibold">{count} tasks ({totalTasksCount > 0 ? Math.round((count/totalTasksCount)*100) : 0}%)</span>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* Chart B: Horizontal Progress Bar breakdown */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-4">
          <h3 className="text-xs uppercase font-mono font-bold text-slate-705 tracking-wider border-b border-slate-100 pb-2">Workflow stage completion rates</h3>
          
          <div className="space-y-4 py-2">
            {stageCounts.map(stage => {
              const maxCount = Math.max(...stageCounts.map(s => s.count)) || 1;
              const widthPercentage = (stage.count / maxCount) * 100;
              
              return (
                <div key={stage.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{stage.name}</span>
                    <span className="font-mono text-slate-500 font-bold">{stage.count} active</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-md overflow-hidden relative border border-slate-200/40">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-md" 
                      style={{ backgroundColor: stage.color }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
