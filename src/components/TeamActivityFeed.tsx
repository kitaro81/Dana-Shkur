import React from 'react';
import { TeamActivity, User } from '../types';
import { 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  MessageSquare, 
  PlusCircle, 
  MoveRight,
  Clock,
  User as UserIcon,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';

interface TeamActivityFeedProps {
  activities: TeamActivity[];
  users: User[];
}

export const TeamActivityFeed: React.FC<TeamActivityFeedProps> = ({ activities, users }) => {
  const [filter, setFilter] = React.useState<string>('all');
  const [search, setSearch] = React.useState<string>('');

  const filteredActivities = activities
    .filter(act => filter === 'all' || act.type === filter)
    .filter(act => 
      act.title.toLowerCase().includes(search.toLowerCase()) || 
      act.userName.toLowerCase().includes(search.toLowerCase()) ||
      (act.projectName && act.projectName.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getActivityIcon = (type: TeamActivity['type']) => {
    switch (type) {
      case 'task_completion':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'project_update':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'system_alert':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-pink-500" />;
      case 'task_created':
        return <PlusCircle className="w-4 h-4 text-cyan-500" />;
      case 'task_moved':
        return <MoveRight className="w-4 h-4 text-violet-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Team Activity Feed</h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Live transparency across projects</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-full md:w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('task_completion')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filter === 'task_completion' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tasks
            </button>
            <button
              onClick={() => setFilter('project_update')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filter === 'project_update' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Projects
            </button>
            <button
              onClick={() => setFilter('message_sent')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filter === 'message_sent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Messages
            </button>
            <button
              onClick={() => setFilter('system_alert')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filter === 'system_alert' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              System
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Vertical line connecting events */}
        <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-100 hidden md:block" />

        <div className="space-y-4">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex items-start gap-4"
              >
                {/* Timeline node */}
                <div className="relative z-10 flex-shrink-0 w-12 flex justify-center pt-2 hidden md:flex">
                  <div className={`w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                    activity.type === 'system_alert' ? 'bg-amber-50' : 
                    activity.type === 'task_completion' ? 'bg-emerald-50' : 
                    activity.type === 'message_sent' ? 'bg-pink-50' :
                    'bg-slate-50'
                  }`}>
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {activity.userId !== 'system' && (
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold border border-slate-200 flex-shrink-0">
                          {activity.userName[0] || 'U'}
                        </div>
                      )}
                      {activity.userId === 'system' && (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-bold text-slate-800">{activity.userName}</span>
                          <span className="text-slate-400 font-mono text-[10px] tracking-widest">•</span>
                          <span className="text-xs text-slate-500">{activity.title}</span>
                        </div>
                        
                        {activity.description && (
                          <p className="text-xs text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100 inline-block">
                            {activity.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <Clock className="w-3 h-3" />
                            {formatDate(activity.createdAt)}
                          </div>
                          
                          {activity.projectName && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold uppercase tracking-wider">
                              <Search className="w-2.5 h-2.5" />
                              {activity.projectName}
                            </div>
                          )}

                          {activity.taskTitle && (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              {activity.taskTitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:hidden">
                       {getActivityIcon(activity.type)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-600">No activity found</h3>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
