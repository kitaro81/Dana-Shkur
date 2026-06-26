import React, { useState, useEffect, useRef } from 'react';
import { Task, Project, User } from '../types';
import { 
  Search, 
  Sparkles, 
  Plus, 
  Calendar, 
  BarChart3, 
  Settings, 
  Archive, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  Users, 
  Command,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  users: User[];
  onSelectTask: (taskId: string) => void;
  onSelectTab: (tab: 'board' | 'reports' | 'calendar' | 'admin' | 'archive') => void;
  onTriggerAddTask: () => void;
  currentUser: User;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Tasks';
  title: string;
  subtitle?: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  users,
  onSelectTask,
  onSelectTab,
  onTriggerAddTask,
  currentUser,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build the static commands list
  const commands: CommandItem[] = [
    {
      id: 'create-task',
      category: 'Actions',
      title: 'Create New Task',
      subtitle: 'Open the task creator panel on the Kanban board',
      shortcut: 'Alt+N',
      icon: <Plus className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onSelectTab('board');
        // Small delay to let tab transition finish
        setTimeout(() => {
          onTriggerAddTask();
        }, 120);
      }
    },
    {
      id: 'nav-board',
      category: 'Navigation',
      title: 'Go to Kanban Board',
      subtitle: 'View and manage team sprint stages',
      shortcut: 'Alt+1',
      icon: <LayoutGrid className="w-4 h-4 text-indigo-500" />,
      action: () => onSelectTab('board')
    },
    {
      id: 'nav-reports',
      category: 'Navigation',
      title: 'Go to Reports & Metrics Dashboard',
      subtitle: 'Analyze sprint velocity and discipline breakdown',
      shortcut: 'Alt+2',
      icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
      action: () => onSelectTab('reports')
    },
    {
      id: 'nav-calendar',
      category: 'Navigation',
      title: 'Go to Project Calendar View',
      subtitle: 'Keep track of delivery schedules and due dates',
      shortcut: 'Alt+3',
      icon: <Calendar className="w-4 h-4 text-purple-500" />,
      action: () => onSelectTab('calendar')
    },
    {
      id: 'nav-archive',
      category: 'Navigation',
      title: 'Go to Archive & History',
      subtitle: 'Audit previously closed and archived design tasks',
      shortcut: 'Alt+4',
      icon: <Archive className="w-4 h-4 text-slate-500" />,
      action: () => onSelectTab('archive')
    },
    {
      id: 'nav-admin',
      category: 'Navigation',
      title: 'Go to Admin Control & Preferences',
      subtitle: 'Configure guardrails, team roles, and metrics',
      shortcut: 'Alt+5',
      icon: <Settings className="w-4 h-4 text-rose-500" />,
      action: () => onSelectTab('admin')
    }
  ];

  // Filter tasks based on query
  const filteredTasks = query.trim() === '' 
    ? [] 
    : tasks.filter(task => {
        const titleMatch = task.title.toLowerCase().includes(query.toLowerCase());
        const descMatch = task.description.toLowerCase().includes(query.toLowerCase());
        const priorityMatch = task.priority.toLowerCase().includes(query.toLowerCase());
        
        // Find project code
        const projectObj = projects.find(p => p.id === task.projectId);
        const projectMatch = projectObj ? projectObj.name.toLowerCase().includes(query.toLowerCase()) || projectObj.code.toLowerCase().includes(query.toLowerCase()) : false;

        // Find assignee name
        const assignee = users.find(u => u.id === task.assignedTo);
        const assigneeMatch = assignee ? assignee.name.toLowerCase().includes(query.toLowerCase()) : false;

        return titleMatch || descMatch || priorityMatch || projectMatch || assigneeMatch;
      }).slice(0, 5); // show top 5 matching tasks

  // Filter static commands based on query
  const filteredCommands = commands.filter(cmd => {
    return cmd.title.toLowerCase().includes(query.toLowerCase()) || 
           cmd.subtitle?.toLowerCase().includes(query.toLowerCase());
  });

  // Combine items to make a single list for arrow-key navigation
  const combinedItems: Array<{ type: 'command'; item: CommandItem } | { type: 'task'; item: Task }> = [
    ...filteredCommands.map(cmd => ({ type: 'command' as const, item: cmd })),
    ...filteredTasks.map(task => ({ type: 'task' as const, item: task }))
  ];

  // Keyboard navigation inside the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % combinedItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + combinedItems.length) % combinedItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedItems[selectedIndex]) {
        triggerItemAction(combinedItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const triggerItemAction = (itemWrap: typeof combinedItems[number]) => {
    if (itemWrap.type === 'command') {
      itemWrap.item.action();
    } else {
      onSelectTask(itemWrap.item.id);
    }
    onClose();
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
      />

      {/* Palette Body */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -10 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Area */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-150 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none border-none p-0"
            placeholder="Type a command, task title, priority, or project..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white text-slate-400 border border-slate-200 rounded shadow-xs select-none">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-3 max-h-[50vh]">
          {combinedItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Command className="w-8 h-8 mx-auto mb-2.5 opacity-40 text-slate-400" />
              <p className="text-xs font-medium">No commands or tasks found matching "{query}"</p>
              <p className="text-[10px] mt-1 opacity-75">Try searching for task priority like "high", or action names like "reports".</p>
            </div>
          ) : (
            <>
              {/* Category segments */}
              {['Actions', 'Navigation', 'Tasks'].map(category => {
                const categoryItems = combinedItems.filter((wrap, idx) => {
                  if (category === 'Tasks') return wrap.type === 'task';
                  return wrap.type === 'command' && wrap.item.category === category;
                });

                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-1">
                    <h4 className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold text-slate-450 uppercase tracking-wider select-none font-mono">
                      {category}
                    </h4>
                    
                    <div className="space-y-0.5">
                      {combinedItems.map((wrap, absoluteIdx) => {
                        const isSelected = absoluteIdx === selectedIndex;
                        
                        // Check if this item is in the current category
                        if (category === 'Tasks') {
                          if (wrap.type !== 'task') return null;
                        } else {
                          if (wrap.type !== 'command' || wrap.item.category !== category) return null;
                        }

                        if (wrap.type === 'command') {
                          const cmd = wrap.item;
                          return (
                            <button
                              key={cmd.id}
                              data-active={isSelected}
                              onClick={() => triggerItemAction(wrap)}
                              onMouseEnter={() => setSelectedIndex(absoluteIdx)}
                              className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg transition-all ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white shadow-md' 
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`p-1.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {cmd.icon}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate leading-none mb-1">{cmd.title}</p>
                                  <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-150' : 'text-slate-400'}`}>{cmd.subtitle}</p>
                                </div>
                              </div>
                              {cmd.shortcut && (
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded select-none ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200/50'
                                }`}>
                                  {cmd.shortcut}
                                </span>
                              )}
                            </button>
                          );
                        } else {
                          const task = wrap.item;
                          const projectObj = projects.find(p => p.id === task.projectId);
                          const assignee = users.find(u => u.id === task.assignedTo);

                          return (
                            <button
                              key={task.id}
                              data-active={isSelected}
                              onClick={() => triggerItemAction(wrap)}
                              onMouseEnter={() => setSelectedIndex(absoluteIdx)}
                              className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg transition-all ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white shadow-md' 
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  task.priority === 'critical' ? 'bg-rose-500' :
                                  task.priority === 'high' ? 'bg-amber-500' :
                                  task.priority === 'medium' ? 'bg-sky-500' : 'bg-slate-400'
                                }`} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[8px] font-mono font-bold px-1 rounded select-none ${
                                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {projectObj?.code || 'N/A'}
                                    </span>
                                    <p className="text-xs font-semibold truncate leading-none">{task.title}</p>
                                  </div>
                                  <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-150' : 'text-slate-400'}`}>
                                    {task.description} • {assignee ? `Assignee: ${assignee.name}` : 'Unassigned'}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded select-none ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {task.stageId}
                              </span>
                            </button>
                          );
                        }
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer info cheat sheet */}
        <div className="bg-slate-50 border-t border-slate-150 px-4 py-2.5 flex items-center justify-between text-[10px] text-slate-400 font-medium select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded text-[9px] font-mono">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded text-[9px] font-mono">Enter</kbd> select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded text-[9px] font-mono">ESC</kbd> close
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-500">
            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
            <span>Power User Mode Active</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
