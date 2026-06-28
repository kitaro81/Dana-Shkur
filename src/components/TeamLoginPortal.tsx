import React, { useState } from 'react';
import { User, UserRole, TaskType, VisualSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Shield, ArrowRight, Key, AlertCircle, Mail, Eye, EyeOff, HelpCircle } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between relative overflow-hidden font-sans text-[#0a0a0a]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay">
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
      <header className="px-8 py-6 flex items-center justify-between border-b border-[#e5e5e5] bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2.5 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-black">
          <span className="w-2.5 h-2.5 bg-black block shrink-0" />
          <span>NCPT // SYSTEM PORTAL</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#737373] uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
          <span>PORTAL ACTIVE</span>
        </div>
      </header>

      {/* Main card section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-md">
          {/* Welcome Intro */}
          <div className="text-center space-y-3 mb-8">
            <span className="meta-label block font-mono text-[10px] uppercase tracking-[0.2em] text-[#737373]">
              SECURE VERIFICATION NODE
            </span>
            <h2 className="font-sans text-4xl md:text-5xl font-light tracking-tight leading-[0.9] text-[#0a0a0a]">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-[#737373] font-sans leading-relaxed max-w-sm mx-auto">
              Please enter valid credentials to establish an authorized secure session for project portfolio actions.
            </p>
          </div>

          {/* Login Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-[#e5e5e5] rounded-lg p-8 space-y-6 shadow-sm"
          >
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Error Message Box */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#737373]">
                  Username or Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#737373]/50 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. name@company.com or Full Name"
                    className="w-full pl-10 pr-4 py-3 text-xs bg-white border border-[#e5e5e5] rounded focus:outline-none focus:border-black transition-all text-[#0a0a0a] font-mono placeholder-slate-400"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#737373]">
                  Access Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#737373]/50 pointer-events-none">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 text-xs bg-white border border-[#e5e5e5] rounded focus:outline-none focus:border-black transition-all text-[#0a0a0a] font-mono placeholder-slate-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#737373]/50 hover:text-black cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-3 py-3 px-4 bg-black hover:bg-[#333333] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 rounded"
              >
                Verify & Enter Workspace
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Note text */}
            <div className="border-t border-[#e5e5e5] pt-4 text-center">
              <p className="text-[10px] text-[#737373] leading-relaxed font-mono">
                Credentials are managed by the admin panel. Please contact your administrator if you require access or a credential reset.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="px-8 py-5 border-t border-[#e5e5e5] bg-white/50 backdrop-blur-md z-10 text-center select-none font-mono text-[9px] uppercase tracking-widest text-[#737373]">
        Nexus Design Ops Portal v2.5.0 • Authorized Sessions Only
      </footer>
    </div>
  );
};
