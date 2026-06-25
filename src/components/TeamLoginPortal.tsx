import React, { useState } from 'react';
import { User, UserRole, TaskType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Shield, Search, UserCheck, ArrowRight, Wrench, Sparkles, Building, ChevronRight } from 'lucide-react';

interface TeamLoginPortalProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const TeamLoginPortal: React.FC<TeamLoginPortalProps> = ({ users, onLogin }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  const activeUsers = users.filter(u => !u.deactivated);

  const filteredUsers = activeUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.discipline?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyles = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'lead_designer':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'engineer':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getDisciplineBadgeStyles = (discipline?: TaskType) => {
    switch (discipline) {
      case 'architecture':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'structure':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'electric':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'mechanical':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Decorative architectural background mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Top micro bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-150 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-wider text-slate-800 uppercase font-mono">
            Nexus Design Ops
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Design Control Plane Active</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-5xl mx-auto w-full z-10">
        <div className="text-center space-y-3 max-w-xl mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-bold uppercase tracking-wider"
          >
            <Shield className="w-3 h-3" />
            Central Authentication Gateway
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
          >
            Welcome Back to Nexus
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xs sm:text-sm text-slate-500 leading-relaxed"
          >
            Select your professional team profile below to authenticate into your tailored workspace view, access project assets, and manage workflow scopes.
          </motion.p>
        </div>

        {/* Filters and search box */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between"
        >
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search team profiles by name, email or discipline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 hover:border-slate-350 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-xs font-medium text-slate-800 transition-all focus:outline-none"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100/80 p-1 rounded-xl shrink-0">
            {[
              { id: 'all', label: 'All Profiles' },
              { id: 'admin', label: 'Admins' },
              { id: 'lead_designer', label: 'Leads' },
              { id: 'engineer', label: 'Engineers' },
              { id: 'viewer', label: 'Viewers' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleFilter(tab.id)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  selectedRoleFilter === tab.id
                    ? 'bg-white text-slate-800 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Team profiles grid */}
        <div className="w-full">
          <AnimatePresence mode="popLayout">
            {filteredUsers.length > 0 ? (
              <motion.div 
                layout
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filteredUsers.map((user, idx) => {
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', duration: 0.4, delay: idx * 0.04 }}
                      key={user.id}
                      onClick={() => onLogin(user)}
                      className="group bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        {/* Profile Image with status ring */}
                        <div className="relative shrink-0">
                          {user.avatarUrl ? (
                            <img 
                              src={user.avatarUrl} 
                              alt={user.name} 
                              className="w-12 h-12 rounded-full object-cover border-2 border-white ring-2 ring-slate-100 group-hover:ring-indigo-200 transition-all"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold border-2 border-white ring-2 ring-slate-100 group-hover:ring-indigo-200">
                              {user.name[0]}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-3xs border border-slate-100">
                            <span className="block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          </div>
                        </div>

                        {/* Text Detail */}
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {user.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono truncate leading-none">
                            {user.email}
                          </p>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {/* Role badge */}
                            <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 border rounded-md leading-none ${getRoleBadgeStyles(user.role)}`}>
                              {user.role.replace('_', ' ')}
                            </span>
                            {/* Discipline badge if engineer/lead */}
                            {user.discipline && user.discipline !== 'other' && (
                              <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 border rounded-md leading-none ${getDisciplineBadgeStyles(user.discipline)}`}>
                                {user.discipline}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-1 text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                          Access Workspace
                        </span>
                        <div className="flex items-center gap-1 font-semibold">
                          <span>Sign In</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3"
              >
                <div className="p-3 bg-slate-50 text-slate-400 rounded-full inline-block">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No active profiles match your search</h4>
                <p className="text-[11px] text-slate-400">
                  Try adjusting your keywords or clearing the role filters to find your profile.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRoleFilter('all');
                  }}
                  className="px-3.5 py-1.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="px-6 py-4 border-t border-slate-150 bg-white/50 backdrop-blur-md z-10 text-center">
        <p className="text-[10px] text-slate-400 font-medium">
          Nexus Design Ops Portal v2.4.0 • Enterprise Sandbox Workspace • Secured via Local Control Plane
        </p>
      </footer>
    </div>
  );
};
