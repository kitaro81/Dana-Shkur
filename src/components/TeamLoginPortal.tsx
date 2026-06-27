import React, { useState } from 'react';
import { User, UserRole, TaskType, VisualSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Shield, ArrowRight, Key, AlertCircle, Mail, Eye, EyeOff, UserCheck, HelpCircle } from 'lucide-react';

interface TeamLoginPortalProps {
  users: User[];
  onLogin: (user: User) => void;
  visualSettings: VisualSettings;
}

export const TeamLoginPortal: React.FC<TeamLoginPortalProps> = ({ users, onLogin, visualSettings }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoster, setShowRoster] = useState(false);

  const activeUsers = users.filter(u => !u.deactivated);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please enter your username or email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    // Find user by email or name (case-insensitive)
    const normalizedInput = identifier.trim().toLowerCase();
    const matchedUser = activeUsers.find(
      u => u.email.toLowerCase() === normalizedInput || u.name.toLowerCase() === normalizedInput
    );

    if (!matchedUser) {
      setError('No registered account was found matching that name or email address.');
      return;
    }

    const masterPassword = visualSettings.masterPassword || 'admin';
    const isCorrect = password === matchedUser.password || password === masterPassword;

    if (isCorrect) {
      onLogin(matchedUser);
    } else {
      setError('Incorrect password. Please try again or contact your administrator.');
    }
  };

  const handleQuickFill = (user: User) => {
    setIdentifier(user.email);
    setPassword(user.password || '');
    setError(null);
  };

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Grid Pattern Background */}
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

      {/* Header bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-150 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm shadow-indigo-100">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-wider text-slate-800 uppercase font-mono">
            Nexus Design Ops
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Portal Active</span>
        </div>
      </header>

      {/* Main card section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-md">
          {/* Welcome Intro */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              Gateway Verification
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-slate-500">
              Enter the credentials provided by your Administrator to authorize your design session.
            </p>
          </div>

          {/* Login Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6"
          >
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Error Message Box */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Identifier Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Username or Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. name@company.com or Full Name"
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-800"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Access Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer select-none uppercase tracking-wider"
              >
                Verify & Enter Workspace
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Note text */}
            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Passwords are assigned and managed by your workspace Administrator. Contact them if you require access details or need a credential reset.
              </p>
            </div>
          </motion.div>

          {/* Quick Roster Guide Accordion */}
          {activeUsers.length > 0 && (
            <div className="mt-4 border border-slate-200 bg-white rounded-xl overflow-hidden shadow-2xs">
              <button
                onClick={() => setShowRoster(!showRoster)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none"
              >
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  Sandbox: Show Active Accounts Guide
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {showRoster ? 'Hide' : 'Expand'}
                </span>
              </button>

              <AnimatePresence>
                {showRoster && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                  >
                    <div className="p-3.5 space-y-2 max-h-[180px] overflow-y-auto">
                      <p className="text-[10px] text-slate-400 italic">
                        Click on any member profile to pre-fill the login credentials instantly for testing.
                      </p>
                      {activeUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleQuickFill(user)}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-bold border border-slate-100 group-hover:bg-indigo-100">
                              {user.name[0]}
                            </div>
                            <div className="min-w-0 leading-tight">
                              <p className="text-[11px] font-bold text-slate-700 truncate">{user.name}</p>
                              <p className="text-[9px] text-slate-450 truncate font-mono">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <span className={`text-[8px] uppercase tracking-wide font-extrabold px-1.5 py-0.5 border rounded-md leading-none ${getRoleBadgeStyles(user.role)}`}>
                              {user.role.replace('_', ' ')}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="px-6 py-4 border-t border-slate-150 bg-white/50 backdrop-blur-md z-10 text-center select-none">
        <p className="text-[10px] text-slate-400 font-medium">
          Nexus Design Ops Portal v2.5.0 • Secure Gateway Sandbox
        </p>
      </footer>
    </div>
  );
};
