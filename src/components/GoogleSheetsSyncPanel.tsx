import React, { useState, useEffect, useRef } from 'react';
import { User, Project } from '../types';
import { initAuth, googleSignIn, logout, getAccessToken } from '../utils/googleAuth';
import {
  createNewSpreadsheet,
  findSpreadsheets,
  pushToGoogleSheets,
  pullFromGoogleSheets,
  AppSyncData
} from '../utils/googleSheetsSync';
import {
  Cloud,
  CloudLightning,
  CheckCircle,
  AlertCircle,
  Database,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Plus,
  RefreshCw,
  Search,
  FileSpreadsheet,
  LogOut,
  Clock,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GoogleSheetsSyncPanelProps {
  localData: AppSyncData;
  onSyncLoaded: (newData: AppSyncData) => void;
  currentUser: User;
  triggerToast: (msg: string, type: 'success' | 'info' | 'alert') => void;
  brand: {
    text: string;
    bg: string;
    bgHover: string;
    bgSoft: string;
    borderSoft: string;
    ring: string;
  };
}

interface SyncLog {
  timestamp: string;
  type: 'push' | 'pull' | 'error' | 'connect';
  message: string;
}

export const GoogleSheetsSyncPanel: React.FC<GoogleSheetsSyncPanelProps> = ({
  localData,
  onSyncLoaded,
  currentUser,
  triggerToast,
  brand
}) => {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Default Master Admin Spreadsheet ID
  const DEFAULT_SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKv1aM93R48CmL9u95K6Ad3_14AQU';

  // Spreadsheet Selection State
  const [spreadsheets, setSpreadsheets] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('gapi_spreadsheet_id') || DEFAULT_SPREADSHEET_ID;
  });
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState('');
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('Nexus Design Ops Database');
  
  // App Operations State
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSearchingSheets, setIsSearchingSheets] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('gapi_auto_sync');
    return saved !== null ? saved === 'true' : true;
  });
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(60); // default 60s
  const [timeToNextSync, setTimeToNextSync] = useState(60);
  
  const [logs, setLogs] = useState<SyncLog[]>(() => {
    const savedLogs = localStorage.getItem('gapi_sync_logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setNeedsAuth(false);
        addLog('connect', `Successfully connected with Google account: ${user.email}`);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch list of spreadsheets if connected
  useEffect(() => {
    if (accessToken) {
      handleSearchSpreadsheets();
    }
  }, [accessToken]);

  // Handle local state logging
  const addLog = (type: 'push' | 'pull' | 'error' | 'connect', message: string) => {
    const newLog: SyncLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50); // limit 50 logs
      localStorage.setItem('gapi_sync_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // Keep selected ID updated in localStorage
  useEffect(() => {
    if (selectedSpreadsheetId) {
      localStorage.setItem('gapi_spreadsheet_id', selectedSpreadsheetId);
    } else {
      localStorage.removeItem('gapi_spreadsheet_id');
    }
  }, [selectedSpreadsheetId]);

  // Periodic Auto-Sync Effect
  useEffect(() => {
    localStorage.setItem('gapi_auto_sync', autoSyncEnabled ? 'true' : 'false');
    
    if (!autoSyncEnabled || !accessToken || !selectedSpreadsheetId) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeToNextSync(autoSyncInterval);

    timerRef.current = setInterval(() => {
      setTimeToNextSync(prev => {
        if (prev <= 1) {
          // Trigger pull and sync merge
          handlePull(true);
          return autoSyncInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoSyncEnabled, accessToken, selectedSpreadsheetId, autoSyncInterval]);

  // Google Sign In
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        triggerToast('Connected to Google Workspace successfully!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      addLog('error', `Login failed: ${err.message || err}`);
      triggerToast('Google account connection failed.', 'alert');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Log Out
  const handleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
      setAutoSyncEnabled(false);
      triggerToast('Disconnected from Google account.', 'info');
      addLog('connect', 'Disconnected from Google');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Search existing Google Drive Spreadsheets
  const handleSearchSpreadsheets = async () => {
    setIsSearchingSheets(true);
    try {
      const token = accessToken || (await getAccessToken());
      if (!token) return;

      const files = await findSpreadsheets(token);
      setSpreadsheets(files);
    } catch (err: any) {
      console.error(err);
      addLog('error', `Failed to list spreadsheets: ${err.message || err}`);
    } finally {
      setIsSearchingSheets(false);
    }
  };

  // Create a brand new Spreadsheet database
  const handleCreateNewSpreadsheet = async () => {
    if (!newSpreadsheetName.trim()) {
      triggerToast('Please enter a valid spreadsheet database name.', 'alert');
      return;
    }

    setIsCreatingSheet(true);
    try {
      const token = accessToken || (await getAccessToken());
      if (!token) {
        triggerToast('Authentication token unavailable. Please sign in again.', 'alert');
        return;
      }

      const newId = await createNewSpreadsheet(token, newSpreadsheetName.trim());
      setSelectedSpreadsheetId(newId);
      triggerToast(`Database spreadsheet created successfully!`, 'success');
      addLog('connect', `Created database sheet: "${newSpreadsheetName}"`);
      
      // Auto push initial local data to populate
      setIsPushing(true);
      await pushToGoogleSheets(token, newId, localData);
      addLog('push', `Populated database tables inside new spreadsheet`);
      
      // Refresh list
      handleSearchSpreadsheets();
    } catch (err: any) {
      console.error(err);
      addLog('error', `Failed to create database spreadsheet: ${err.message || err}`);
      triggerToast('Database creation failed.', 'alert');
    } finally {
      setIsCreatingSheet(false);
      setIsPushing(false);
    }
  };

  // Push Local Data (Overwrite Sheets)
  const handlePush = async () => {
    if (!selectedSpreadsheetId) {
      triggerToast('Please select or create a spreadsheet database first.', 'alert');
      return;
    }

    const confirmPush = window.confirm(
      'Warning: This will overwrite ALL rows inside your Google Spreadsheet with the current client-side board records. Proceed?'
    );
    if (!confirmPush) return;

    setIsPushing(true);
    try {
      const token = accessToken || (await getAccessToken());
      if (!token) {
        triggerToast('Authentication token expired or unavailable. Reconnect.', 'alert');
        return;
      }

      await pushToGoogleSheets(token, selectedSpreadsheetId, localData);
      triggerToast('Data uploaded & database rows fully synchronized!', 'success');
      addLog('push', `Successfully pushed database updates (Projects: ${localData.projects.length}, Tasks: ${localData.tasks.length})`);
    } catch (err: any) {
      console.error(err);
      addLog('error', `Failed to upload data: ${err.message || err}`);
      triggerToast('Data upload failed. Check spreadsheet permissions.', 'alert');
    } finally {
      setIsPushing(false);
    }
  };

  // Pull Sheets Data (Overwrite Local)
  const handlePull = async (silent = false) => {
    if (!selectedSpreadsheetId) {
      if (!silent) triggerToast('Please select or create a spreadsheet database first.', 'alert');
      return;
    }

    if (!silent) {
      const confirmPull = window.confirm(
        'Warning: This will replace your local browser database state with all records from the linked Google Spreadsheet. Local un-pushed changes will be overwritten. Proceed?'
      );
      if (!confirmPull) return;
    }

    setIsPulling(true);
    try {
      const token = accessToken || (await getAccessToken());
      if (!token) {
        if (!silent) triggerToast('Authentication token expired or unavailable.', 'alert');
        return;
      }

      const pulledData = await pullFromGoogleSheets(token, selectedSpreadsheetId);
      
      // Save data back to parents
      onSyncLoaded(pulledData);
      if (!silent) triggerToast('Successfully pulled latest records from Google Sheets!', 'success');
      addLog('pull', `Pulled spreadsheet records (Projects: ${pulledData.projects.length}, Tasks: ${pulledData.tasks.length})`);
    } catch (err: any) {
      console.error(err);
      addLog('error', `Failed to pull records: ${err.message || err}`);
      if (!silent) triggerToast('Pull failed. Confirm spreadsheet exists and is configured.', 'alert');
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-120px)] p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
            <Cloud className="w-3.5 h-3.5" />
            Decentralized Database Sync
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Workspace Ledger Integration</h2>
          <p className="text-xs text-slate-550 max-w-2xl">
            Save and fetch database records from a Google Spreadsheet instead of a dedicated server database. This enables your team to stay updated frequently using shared sheets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {needsAuth ? (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              {isLoggingIn ? 'Connecting...' : 'Connect Google Workspace'}
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              {googleUser?.photoURL ? (
                <img src={googleUser.photoURL} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-slate-300" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  {googleUser?.displayName?.[0] || 'G'}
                </div>
              )}
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-800">{googleUser?.displayName || 'Google Account'}</p>
                <p className="text-[10px] text-slate-450 font-mono truncate max-w-[150px]">{googleUser?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
                title="Disconnect Google Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {needsAuth ? (
        /* Not authenticated UI card */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
            <Database className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-sm font-bold text-slate-800">Connection Authorization Required</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Authenticate your account with Google Drive and Sheets access. This enables the application to read and write records securely in your personal or company cloud.
            </p>
          </div>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer select-none transition-all flex items-center gap-2 ${brand.bg} ${brand.bgHover}`}
          >
            <CloudLightning className="w-4 h-4" />
            Authorize Workspace Connection
          </button>
        </div>
      ) : (
        /* Authenticated Main Sync Interface Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Database Configuration and Actions */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Linking a Spreadsheet */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full ${brand.bgSoft} border ${brand.borderSoft} ${brand.text} flex items-center justify-center text-[10px] font-bold`}>1</span>
                Link Spreadsheet Database
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Existing */}
                <div className="space-y-2 p-4 bg-slate-50 border border-slate-150 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">Select Existing Ledger</label>
                    <button
                      onClick={handleSearchSpreadsheets}
                      disabled={isSearchingSheets}
                      className={`text-[10px] font-bold ${brand.text} hover:opacity-80 transition-colors flex items-center gap-1 cursor-pointer`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isSearchingSheets ? 'animate-spin' : ''}`} />
                      Refresh List
                    </button>
                  </div>
                  
                  <select
                    value={selectedSpreadsheetId}
                    onChange={(e) => setSelectedSpreadsheetId(e.target.value)}
                    className={`w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 ${brand.ring} ${brand.borderFocus}`}
                  >
                    <option value="">-- Choose a spreadsheet --</option>
                    {spreadsheets.map(sheet => (
                      <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Find and link spreadsheets previously created in your Google Drive.
                  </p>
                </div>

                {/* Create New */}
                <div className="space-y-2 p-4 bg-slate-50 border border-slate-150 rounded-xl flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Create New Database</label>
                    <input
                      type="text"
                      placeholder="Database spreadsheet name"
                      className={`w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 ${brand.ring} ${brand.borderFocus}`}
                      value={newSpreadsheetName}
                      onChange={(e) => setNewSpreadsheetName(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleCreateNewSpreadsheet}
                    disabled={isCreatingSheet}
                    className={`w-full mt-3 py-2 px-3 border ${brand.borderBrandSoft} ${brand.bgSoftHover} ${brand.text} bg-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isCreatingSheet ? 'Creating spreadsheet...' : 'Initialize New Database'}
                  </button>
                </div>
              </div>

              {/* Direct ID Link */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Paste manual Google Spreadsheet ID..."
                  className={`flex-1 px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 ${brand.ring} ${brand.borderFocus}`}
                  value={customSpreadsheetId}
                  onChange={(e) => setCustomSpreadsheetId(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (customSpreadsheetId.trim()) {
                      setSelectedSpreadsheetId(customSpreadsheetId.trim());
                      setCustomSpreadsheetId('');
                      triggerToast('Linked manual spreadsheet ID.', 'success');
                    }
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Link ID
                </button>
              </div>

              {selectedSpreadsheetId && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-emerald-800 text-[11px] font-medium leading-tight">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span>Linked Database ID: </span>
                      <span className="font-mono bg-white/60 px-1.5 py-0.5 rounded border border-emerald-150 text-[10px]">{selectedSpreadsheetId}</span>
                    </div>
                  </div>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${selectedSpreadsheetId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold underline hover:text-emerald-950 flex items-center gap-0.5"
                  >
                    Open Sheet
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Step 2: Push and Pull operations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full ${brand.bgSoft} border ${brand.borderSoft} ${brand.text} flex items-center justify-center text-[10px] font-bold`}>2</span>
                Database Records Synchronization
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Push updates */}
                <div className="p-4 border border-slate-150 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-amber-500" />
                      Push to Google Sheets
                    </h4>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Overwrite the cloud spreadsheet with your current workspace data. Useful when you have completed modifications and wish to lock them into the central team repository.
                    </p>
                  </div>
                  <button
                    onClick={handlePush}
                    disabled={isPushing || !selectedSpreadsheetId}
                    className={`w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
                  >
                    {isPushing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                    Push Database Rows
                  </button>
                </div>

                {/* Pull updates */}
                <div className="p-4 border border-slate-150 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ArrowDownLeft className={`w-4 h-4 ${brand.text}`} />
                      Pull from Google Sheets
                    </h4>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Download the latest records from the spreadsheet, overwriting local client-side states. Ideal when other team members have updated the database spreadsheet.
                    </p>
                  </div>
                  <button
                    onClick={() => handlePull(false)}
                    disabled={isPulling || !selectedSpreadsheetId}
                    className={`w-full py-2.5 px-4 ${brand.bg} ${brand.bgHover} text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
                  >
                    {isPulling ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                    Pull Database Rows
                  </button>
                </div>
              </div>

              {/* Automatic frequent synchronization setup */}
              <div className={`p-4 ${brand.bgSoft}/40 border ${brand.borderSoft} rounded-xl space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className={`w-4 h-4 ${brand.text}`} />
                      Frequent Team Auto-Sync (Real-Time Pull)
                    </h4>
                    <p className="text-[11px] text-slate-500 max-w-lg">
                      Enable periodic background pulls to auto-refresh your local workspace tables with updates pushed by other collaborators.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={autoSyncEnabled}
                      onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                      disabled={!selectedSpreadsheetId}
                    />
                    <div className={`w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:${brand.bg}`}></div>
                  </label>
                </div>

                {autoSyncEnabled && (
                  <div className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] ${brand.textSoft}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Auto-Sync running. Syncing in: <strong className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded">{timeToNextSync}s</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Sync Interval:</span>
                      <select
                        value={autoSyncInterval}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAutoSyncInterval(val);
                          setTimeToNextSync(val);
                        }}
                        className={`bg-white border ${brand.borderBrandSoft || 'border-slate-200'} rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-1 ${brand.ring}`}
                      >
                        <option value="15">15s (Ultra Fast)</option>
                        <option value="30">30s (Frequent)</option>
                        <option value="60">1m (Standard)</option>
                        <option value="180">3m (Relaxed)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Stats Summary & Logs */}
          <div className="space-y-6">
            {/* Database summary card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-400" />
                Local Database Audit
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg leading-tight">
                  <p className="text-slate-450 font-bold text-[9px] uppercase">Projects</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{localData.projects.length}</p>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg leading-tight">
                  <p className="text-slate-450 font-bold text-[9px] uppercase">Tasks</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{localData.tasks.length}</p>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg leading-tight">
                  <p className="text-slate-450 font-bold text-[9px] uppercase">Comments</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{localData.comments.length}</p>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg leading-tight">
                  <p className="text-slate-450 font-bold text-[9px] uppercase">Activities</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{localData.activities.length}</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
                <p>
                  These numbers represent your local offline browser storage. When pushing or pulling, all table states will synchronize dynamically.
                </p>
              </div>
            </div>

            {/* Sync activity log */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-[320px] overflow-hidden">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between shrink-0">
                <span>Operation Sync History</span>
                <button
                  onClick={() => {
                    setLogs([]);
                    localStorage.removeItem('gapi_sync_logs');
                  }}
                  className="text-[9px] text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Clear Logs
                </button>
              </h3>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                    <p className="text-[11px] italic">No operations logged yet.</p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="p-2 rounded-lg bg-slate-50/50 border border-slate-100 text-[10px] flex items-start gap-2">
                      <span className="font-mono text-slate-400 select-none shrink-0">{log.timestamp}</span>
                      <div className="space-y-0.5 leading-tight">
                        <p className={`font-bold uppercase text-[8px] ${
                          log.type === 'push' ? 'text-amber-600' :
                          log.type === 'pull' ? brand.text :
                          log.type === 'error' ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {log.type}
                        </p>
                        <p className="text-slate-650">{log.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
