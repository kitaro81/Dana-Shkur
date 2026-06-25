import React, { useState, useRef, useEffect } from 'react';
import { Project, User } from '../types';
import { 
  Home, 
  ChevronRight, 
  Folder, 
  Layers, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings, 
  Archive,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BreadcrumbsProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  activeTab: 'board' | 'reports' | 'calendar' | 'admin' | 'archive' | 'resource_load' | 'my_overview';
  onSelectTab: (tab: 'board' | 'reports' | 'calendar' | 'admin' | 'archive' | 'resource_load' | 'my_overview') => void;
  currentUser: User;
  visualSettings: {
    showReportsTab: boolean;
    showCalendarTab: boolean;
  };
}

export function Breadcrumbs({
  projects,
  selectedProjectId,
  onSelectProject,
  activeTab,
  onSelectTab,
  currentUser,
  visualSettings
}: BreadcrumbsProps) {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const viewDropdownRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0] || null;

  // Map tabs to labels & icons
  const tabDetails = {
    board: { label: 'Kanban Board', icon: <Layers className="w-3.5 h-3.5" /> },
    my_overview: { label: 'My Overview', icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> },
    reports: { label: 'Reports & Stats', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    calendar: { label: 'Calendar Schedule', icon: <Calendar className="w-3.5 h-3.5" /> },
    resource_load: { label: 'Resource Load', icon: <Users className="w-3.5 h-3.5" /> },
    archive: { label: 'Archive', icon: <Archive className="w-3.5 h-3.5" /> },
    admin: { label: 'Admin Settings', icon: <Settings className="w-3.5 h-3.5" /> }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setProjectDropdownOpen(false);
      }
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setViewDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="flex items-center space-x-1.5 md:space-x-2 text-xs text-slate-500 dark:text-slate-400 select-none pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
      {/* Root/Home Level */}
      <div className="flex items-center">
        <button 
          onClick={() => {
            onSelectTab('board');
            setProjectDropdownOpen(false);
            setViewDropdownOpen(false);
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer font-medium"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Portal</span>
        </button>
      </div>

      <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700 flex-shrink-0" />

      {/* Project Level */}
      <div className="relative" ref={projectDropdownRef}>
        <button
          onClick={() => {
            setProjectDropdownOpen(!projectDropdownOpen);
            setViewDropdownOpen(false);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer font-semibold ${
            projectDropdownOpen 
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Folder className="w-3.5 h-3.5 text-indigo-500/80 dark:text-indigo-400/80" />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">{activeProject ? activeProject.name : 'Select Project'}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${projectDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Project Selector Dropdown */}
        <AnimatePresence>
          {projectDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1.5 z-50 origin-top-left"
            >
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono border-b border-slate-50 dark:border-slate-800 pb-1.5 mb-1">
                Switch Project
              </div>
              <div className="max-h-60 overflow-y-auto">
                {projects.map(proj => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj.id);
                      setProjectDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                      selectedProjectId === proj.id 
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/20' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs truncate font-medium">{proj.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">({proj.code})</span>
                    </div>
                    {selectedProjectId === proj.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700 flex-shrink-0" />

      {/* Active View Level */}
      <div className="relative" ref={viewDropdownRef}>
        <button
          onClick={() => {
            setViewDropdownOpen(!viewDropdownOpen);
            setProjectDropdownOpen(false);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer font-semibold ${
            viewDropdownOpen 
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          {tabDetails[activeTab]?.icon}
          <span>{tabDetails[activeTab]?.label || activeTab}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${viewDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* View/Tab Selector Dropdown */}
        <AnimatePresence>
          {viewDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1.5 z-50 origin-top-left"
            >
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono border-b border-slate-50 dark:border-slate-800 pb-1.5 mb-1">
                Select View
              </div>

              {/* Board View */}
              <button
                onClick={() => {
                  onSelectTab('board');
                  setViewDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                  activeTab === 'board' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {tabDetails.board.icon}
                <span>{tabDetails.board.label}</span>
              </button>

              {/* My Overview */}
              <button
                onClick={() => {
                  onSelectTab('my_overview');
                  setViewDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                  activeTab === 'my_overview' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {tabDetails.my_overview.icon}
                <span>{tabDetails.my_overview.label}</span>
              </button>

              {/* Reports */}
              {visualSettings.showReportsTab && (
                <button
                  onClick={() => {
                    onSelectTab('reports');
                    setViewDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    activeTab === 'reports' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tabDetails.reports.icon}
                  <span>{tabDetails.reports.label}</span>
                </button>
              )}

              {/* Calendar */}
              {visualSettings.showCalendarTab && (
                <button
                  onClick={() => {
                    onSelectTab('calendar');
                    setViewDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    activeTab === 'calendar' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tabDetails.calendar.icon}
                  <span>{tabDetails.calendar.label}</span>
                </button>
              )}

              {/* Resource Load */}
              <button
                onClick={() => {
                  onSelectTab('resource_load');
                  setViewDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                  activeTab === 'resource_load' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {tabDetails.resource_load.icon}
                <span>{tabDetails.resource_load.label}</span>
              </button>

              {/* Archive */}
              <button
                onClick={() => {
                  onSelectTab('archive');
                  setViewDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                  activeTab === 'archive' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {tabDetails.archive.icon}
                <span>{tabDetails.archive.label}</span>
              </button>

              {/* Admin Panel */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    onSelectTab('admin');
                    setViewDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    activeTab === 'admin' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tabDetails.admin.icon}
                  <span>{tabDetails.admin.label}</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
