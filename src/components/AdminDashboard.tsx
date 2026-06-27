import React, { useState } from 'react';
import { Project, User, WorkflowStage, UserRole, TaskType, VisualSettings, ReportTemplateSettings, Label, Task, TeamActivity } from '../types';
import { Shield, Plus, Briefcase, PlusCircle, Trash, RefreshCw, Layers, Edit2, Users, Check, X, Sliders, Settings, FileText, Clock, Tag, Megaphone, Palette, AlertTriangle, Zap, Kanban, MessageSquare, Download, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  projects: Project[];
  users: User[];
  stages: WorkflowStage[];
  currentUser: User;
  visualSettings: VisualSettings;
  onUpdateVisualSettings: (settings: VisualSettings) => void;
  reportTemplateSettings: ReportTemplateSettings;
  onUpdateReportTemplateSettings: (settings: ReportTemplateSettings) => void;
  labels: Label[];
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onUpdateProject?: (project: Project) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onUpdateUserDiscipline: (userId: string, newDiscipline: TaskType) => void;
  onDeleteUser?: (userId: string) => void;
  onToggleDeactivateUser?: (userId: string) => void;
  onInviteUser: (user: Omit<User, 'id' | 'joinedAt'>) => void;
  onUpdateStages: (stages: WorkflowStage[]) => void;
  onDeleteProject?: (projectId: string) => void;
  onResetUserPassword?: (userId: string) => void;
  onMessageUser?: (userId: string) => void;
  onSendBulkMessage?: (userIds: string[], message: string) => void;
  tasks?: Task[];
  activities?: TeamActivity[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  projects,
  users,
  stages,
  currentUser,
  visualSettings,
  onUpdateVisualSettings,
  reportTemplateSettings,
  onUpdateReportTemplateSettings,
  labels,
  onAddProject,
  onUpdateProject,
  onUpdateUserRole,
  onUpdateUserDiscipline,
  onDeleteUser,
  onToggleDeactivateUser,
  onInviteUser,
  onUpdateStages,
  onDeleteProject,
  onResetUserPassword,
  onMessageUser,
  onSendBulkMessage,
  tasks = [],
  activities = [],
}) => {
  // Tabs: Flow/Stages, Team/Roles, Projects Setup, Preferences
  const [activeSubTab, setActiveSubTab] = useState<'stages' | 'users' | 'projects' | 'preferences'>('stages');

  // --- Export Audit Log CSV (Last 50 Activities) ---
  const handleExportAuditLog = () => {
    if (!activities || activities.length === 0) {
      alert('No system activities found to export.');
      return;
    }

    // Get the last 50 system-wide activities
    const last50Activities = [...activities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    // CSV header
    const headers = ['Activity ID', 'Timestamp', 'Type', 'Actor ID', 'Actor Name', 'Title', 'Description', 'Project ID', 'Project Name', 'Task ID', 'Task Title'];
    
    // CSV rows
    const rows = last50Activities.map(activity => [
      activity.id,
      activity.createdAt,
      activity.type,
      activity.userId,
      activity.userName,
      activity.title || '',
      activity.description || '',
      activity.projectId || '',
      activity.projectName || '',
      activity.taskId || '',
      activity.taskTitle || ''
    ]);

    // Construct CSV content with safe escaping
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ].join('\n');

    // Create a download link and trigger it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nexus_compliance_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Project form state ---
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjLoc, setNewProjLoc] = useState('');
  const [newProjDisciplines, setNewProjDisciplines] = useState<TaskType[]>([]);
  const [newProjAssignedUserIds, setNewProjAssignedUserIds] = useState<string[]>([]);

  // --- Project editing state ---
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjName, setEditProjName] = useState('');
  const [editProjCode, setEditProjCode] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');
  const [editProjLoc, setEditProjLoc] = useState('');
  const [editProjStatus, setEditProjStatus] = useState<'planning' | 'active' | 'review' | 'completed'>('planning');
  const [editProjDisciplines, setEditProjDisciplines] = useState<TaskType[]>([]);
  const [editProjAssignedUserIds, setEditProjAssignedUserIds] = useState<string[]>([]);

  const handleStartEditProject = (proj: Project) => {
    setEditingProject(proj);
    setEditProjName(proj.name);
    setEditProjCode(proj.code);
    setEditProjDesc(proj.description);
    setEditProjLoc(proj.location || '');
    setEditProjStatus(proj.status);
    setEditProjDisciplines(proj.disciplines || []);
    setEditProjAssignedUserIds(proj.assignedUserIds || []);
  };

  const handleSaveEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editProjName.trim() || !editProjCode.trim()) return;

    if (onUpdateProject) {
      onUpdateProject({
        ...editingProject,
        name: editProjName.trim(),
        code: editProjCode.toUpperCase().replace(/\s+/g, '-'),
        description: editProjDesc.trim(),
        location: editProjLoc.trim() || undefined,
        status: editProjStatus,
        disciplines: editProjDisciplines,
        assignedUserIds: editProjAssignedUserIds,
      });
    }

    setEditingProject(null);
    alert('Project details and team assignments updated successfully.');
  };
  
  // --- Bulk Message State ---
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [bulkMessageText, setBulkMessageText] = useState('');

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  const handleSendBulkMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSendBulkMessage && selectedUserIds.length > 0 && bulkMessageText.trim()) {
      onSendBulkMessage(selectedUserIds, bulkMessageText);
      setBulkMessageText('');
      setSelectedUserIds([]);
      setShowBulkMessageModal(false);
    }
  };

  // --- Invite User state ---
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('engineer');
  const [newUserDiscipline, setNewUserDiscipline] = useState<TaskType>('other');

  // --- Workflow edit state ---
  const [editedStages, setEditedStages] = useState<WorkflowStage[]>([...stages]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#F59E0B');
  const [presetToApply, setPresetToApply] = useState<'waterfall' | 'agile' | 'simple' | null>(null);

  const isAdmin = currentUser.role === 'admin';

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjCode.trim()) return;

    onAddProject({
      name: newProjName.trim(),
      code: newProjCode.toUpperCase().replace(/\s+/g, '-'),
      description: newProjDesc.trim(),
      location: newProjLoc.trim() || undefined,
      status: 'planning',
      disciplines: newProjDisciplines,
      assignedUserIds: newProjAssignedUserIds,
    });

    setNewProjName('');
    setNewProjCode('');
    setNewProjDesc('');
    setNewProjLoc('');
    setNewProjDisciplines([]);
    setNewProjAssignedUserIds([]);
    alert('Project successfully provisioned and added to dashboard.');
  };

  const handleInviteUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    onInviteUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?auto=format&fit=crop&q=80&w=120`,
      discipline: newUserDiscipline,
      phoneNumber: newUserPhone.trim() || undefined,
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserRole('engineer');
    setNewUserDiscipline('other');
    alert('Team member registered in team credentials list!');
  };

  const handleSaveStages = () => {
    onUpdateStages(editedStages);
    alert('Workflow stage definitions synchronized.');
  };

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    const newStage: WorkflowStage = {
      id: `stage-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      name: newStageName.trim(),
      color: newStageColor,
      order: editedStages.length,
    };

    const nextStages = [...editedStages, newStage];
    setEditedStages(nextStages);
    onUpdateStages(nextStages);
    setNewStageName('');
  };

  const handleDeleteStage = (id: string) => {
    if (editedStages.length <= 2) {
      alert('A minimum of two workflow columns is required for a valid design pipeline.');
      return;
    }
    const filtered = editedStages.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx }));
    setEditedStages(filtered);
    onUpdateStages(filtered);
  };
  
  const handleApplyPreset = (presetType: 'waterfall' | 'agile' | 'simple') => {
    setPresetToApply(presetType);
  };

  const confirmApplyPreset = () => {
    if (!presetToApply) return;
    let presetStages: WorkflowStage[] = [];
    if (presetToApply === 'waterfall') {
      presetStages = [
        { id: 'planning', name: 'Planning & Feasibility', color: '#64748b', order: 0 },
        { id: 'design', name: 'Core Drafting & Design', color: '#3b82f6', order: 1 },
        { id: 'peer_review', name: 'Peer & Q/C Review', color: '#f59e0b', order: 2 },
        { id: 'client_approval', name: 'Client Approval', color: '#8b5cf6', order: 3 },
        { id: 'approved', name: 'Issued for Construction', color: '#10b981', order: 4 },
      ];
    } else if (presetToApply === 'agile') {
      presetStages = [
        { id: 'backlog', name: 'Backlog / To Do', color: '#475569', order: 0 },
        { id: 'in_progress', name: 'Active Sprint', color: '#2563eb', order: 1 },
        { id: 'code_review', name: 'QC & Code Review', color: '#db2777', order: 2 },
        { id: 'testing', name: 'Testing & Validation', color: '#ca8a04', order: 3 },
        { id: 'approved', name: 'Done / Delivered', color: '#059669', order: 4 },
      ];
    } else {
      presetStages = [
        { id: 'todo', name: 'Simple Tasks To Do', color: '#64748b', order: 0 },
        { id: 'in_progress', name: 'Under Execution', color: '#3b82f6', order: 1 },
        { id: 'blocked', name: 'Blocked / Delayed', color: '#ef4444', order: 2 },
        { id: 'approved', name: 'Completed / Done', color: '#10b981', order: 3 },
      ];
    }
    setEditedStages(presetStages);
    onUpdateStages(presetStages);
    onUpdateVisualSettings({
      ...visualSettings,
      activeMethodology: presetToApply
    });
    setPresetToApply(null);
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center max-w-sm mx-auto bg-slate-50 border border-slate-200 rounded my-10">
        <Shield className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-none" />
        <h3 className="text-xs font-semibold text-slate-700 mb-1">{visualSettings.language === 'ckb' ? 'چوونەژوورە وەک بەڕێوەبەر پێویستە' : 'Administrator Access Required'}</h3>
        <p className="text-xs text-slate-500">{visualSettings.language === 'ckb' ? 'تەنها بەڕێوەبەرەکان دەتوانن دەستکاری ئەم بەشە بکەن.' : 'Only Administrators can manage workspace workflow columns, roles, or add projects. Switch your active profile in the header to gain access.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Admin Panel Header & Sub tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">{visualSettings.language === 'ckb' ? 'ڕێکخستنەکانی شوێنی کار' : 'Workspace Settings'}</h2>
            <p className="text-xs text-slate-400">{visualSettings.language === 'ckb' ? 'لێرەدا دەتوانیت ڕێکخستنەکانی پڕۆژە و ئەندامان بکەیت.' : 'Configure project lanes, custom member roles, and active assignments.'}</p>
          </div>
          <button
            onClick={handleExportAuditLog}
            className="shrink-0 self-start sm:self-center px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer select-none"
            title="Download CSV containing the last 50 activities for compliance"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit Log
          </button>
        </div>

        {/* Sub tab selectors */}
        <div className="flex bg-slate-100 p-0.5 rounded border border-slate-250 flex-wrap gap-0.5">
          <button
            onClick={() => setActiveSubTab('stages')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'stages' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> {visualSettings.language === 'ckb' ? 'ستوونەکان' : 'Columns'}
          </button>
          
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'users' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> {visualSettings.language === 'ckb' ? 'ئەندامان' : 'Members'}
          </button>

          <button
            onClick={() => setActiveSubTab('projects')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'projects' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> {visualSettings.language === 'ckb' ? 'پڕۆژە' : 'Add Project'}
          </button>

          <button
            onClick={() => setActiveSubTab('preferences')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'preferences' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> {visualSettings.language === 'ckb' ? 'ڕێکخستنی بینین' : 'Preferences'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: FLOW PIPELINE STAGES STYLING */}
        {activeSubTab === 'stages' && (
          <motion.div
            key="stages-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Quick Methodology Presets Selector card */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs text-left space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                  </span>
                  Methodology & Pipeline Presets
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select and enforce a standard project delivery template to populate Kanban columns instantly. Let team members work with optimized stages.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* 1. Waterfall Card */}
                <div 
                  onClick={() => handleApplyPreset('waterfall')}
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col justify-between hover:shadow-sm ${
                    visualSettings.activeMethodology === 'waterfall'
                      ? 'bg-indigo-50/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        🏗️ Waterfall
                      </span>
                      {visualSettings.activeMethodology === 'waterfall' && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal mb-3">
                      Best for structured, linear engineering projects requiring sequential approvals.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Preview Columns:</span>
                    <div className="flex flex-wrap gap-1">
                      {['Planning', 'Design', 'Peer Review', 'Approval', 'Construction'].map(name => (
                        <span key={name} className="text-[8px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Agile Card */}
                <div 
                  onClick={() => handleApplyPreset('agile')}
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col justify-between hover:shadow-sm ${
                    visualSettings.activeMethodology === 'agile'
                      ? 'bg-indigo-50/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        ⚡ Agile Scrum
                      </span>
                      {visualSettings.activeMethodology === 'agile' && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal mb-3">
                      Best for dynamic deliverables, fast feedback loops, and iterative engineering.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Preview Columns:</span>
                    <div className="flex flex-wrap gap-1">
                      {['Backlog', 'Active Sprint', 'QC Review', 'Testing', 'Delivered'].map(name => (
                        <span key={name} className="text-[8px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Simple Card */}
                <div 
                  onClick={() => handleApplyPreset('simple')}
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col justify-between hover:shadow-sm ${
                    visualSettings.activeMethodology === 'simple'
                      ? 'bg-indigo-50/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        📋 Simple Task Force
                      </span>
                      {visualSettings.activeMethodology === 'simple' && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal mb-3">
                      Best for fast, clean operations without complex multistage processes.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Preview Columns:</span>
                    <div className="flex flex-wrap gap-1">
                      {['To Do', 'In Progress', 'Blocked', 'Completed'].map(name => (
                        <span key={name} className="text-[8px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Left form to add stage */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3 text-left">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-slate-400" /> Create Lane
              </h3>
              <p className="text-xs text-slate-400">Insert custom workflow columns into the Kanban board.</p>

              <form onSubmit={handleAddStage} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Stage Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Structural Review"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Color Accent</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-8 h-8 border border-slate-200 bg-white rounded cursor-pointer"
                      value={newStageColor}
                      onChange={(e) => setNewStageColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400"
                      value={newStageColor}
                      onChange={(e) => setNewStageColor(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Create Column
                </button>
              </form>
            </div>

            {/* Right side editable list of current pipeline stages */}
            <div className="flex-1 bg-white border border-slate-200 p-4 rounded-lg space-y-3 w-full">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs uppercase font-bold text-slate-600">Active Board Lane Mappings</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {editedStages.length} Lanes
                </span>
              </div>

              <div className="space-y-2">
                {editedStages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded hover:border-slate-200 transition-all">
                    {/* Index & Color identifier */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400 text-[10px] font-bold w-4">{index + 1}</span>
                      <div className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: stage.color }} />
                    </div>
                    
                    {/* Name input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        className="w-full text-xs font-semibold text-slate-700 bg-transparent border-none p-0 focus:ring-0"
                        value={stage.name}
                        onChange={(e) => {
                          const updated = editedStages.map(s => s.id === stage.id ? { ...s, name: e.target.value } : s);
                          setEditedStages(updated);
                        }}
                      />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (index === 0) return;
                          const next = [...editedStages];
                          const tmp = next[index];
                          next[index] = next[index - 1];
                          next[index - 1] = tmp;
                          setEditedStages(next.map((s, i) => ({ ...s, order: i })));
                        }}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <Sliders className="w-3.5 h-3.5 rotate-90" />
                      </button>
                      <button
                        onClick={() => {
                          if (index === editedStages.length - 1) return;
                          const next = [...editedStages];
                          const tmp = next[index];
                          next[index] = next[index + 1];
                          next[index + 1] = tmp;
                          setEditedStages(next.map((s, i) => ({ ...s, order: i })));
                        }}
                        disabled={index === editedStages.length - 1}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <Sliders className="w-3.5 h-3.5 -rotate-90" />
                      </button>

                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                        title="Delete lane"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSaveStages}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded cursor-pointer"
                >
                  Synchronize Lanes
                </button>
              </div>
            </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: TEAM ROLES AND SIMULATED MEMBERS INVIATON */}
        {activeSubTab === 'users' && (
          <motion.div
            key="users-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Invite Form */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
              <h3 className="text-xs uppercase font-mono font-bold text-slate-700 tracking-wider flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-slate-500" /> Invite Team Professional
              </h3>
              <p className="text-xs text-slate-500">Provide name, email, and designated security roles to invite engineers to input design logs.</p>

              <form onSubmit={handleInviteUserSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Richard Rogers"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Corporation Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. richard@design-engineering.com"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Assigned Discipline Role</label>
                  <select
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  >
                    <option value="engineer">Engineer (Assignee/Contributor)</option>
                    <option value="lead_designer">Lead Designer (Creations & Edits)</option>
                    <option value="viewer">Viewer (Read-only / Client representation)</option>
                    <option value="admin">Admin (System level permissions)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Primary Discipline Focus</label>
                  <select
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    value={newUserDiscipline}
                    onChange={(e) => setNewUserDiscipline(e.target.value as TaskType)}
                  >
                    <option value="architecture">Architecture</option>
                    <option value="structure">Structure</option>
                    <option value="electric">Electrical</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="other">Other / General</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs tracking-wide transition-colors cursor-pointer"
                >
                  Invite Professional
                </button>
              </form>
            </div>

            {/* User List and Role Toggle panel */}
            <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs uppercase font-mono font-bold text-slate-700 tracking-wider">Corporation Team Roster & Roles</h3>
                
                <div className="flex items-center gap-2">
                  {selectedUserIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBulkMessageModal(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Bulk Message ({selectedUserIds.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSelectAllUsers}
                    className="px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {selectedUserIds.length === users.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {users.map(u => (
                  <div key={u.id} className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 border rounded-lg transition-all ${
                    u.deactivated 
                      ? 'bg-rose-50/10 border-dashed border-rose-200 opacity-75' 
                      : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                  } ${selectedUserIds.includes(u.id) ? 'ring-2 ring-indigo-500/20 border-indigo-200 bg-indigo-50/20' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => toggleUserSelection(u.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-slate-200">
                          {u.name[0]}
                        </div>
                      </div>
                      <div className="min-w-0 cursor-pointer" onClick={() => toggleUserSelection(u.id)}>
                        <div className="flex items-center gap-2 font-mono">
                          <p className={`text-xs font-bold text-slate-800 truncate ${u.deactivated ? 'line-through text-slate-400 font-normal' : ''}`}>{u.name}</p>
                          {u.id === currentUser.id && (
                            <span className="text-[8px] uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold px-1.5 py-0.2 rounded-xs">YOU</span>
                          )}
                          {u.deactivated && (
                            <span className="text-[8px] uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-200 font-bold px-1.5 py-0.2 rounded-xs">DEACTIVATED</span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-400">{u.email}</p>
                        {u.phoneNumber && (
                          <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{u.phoneNumber}</span>
                          </p>
                        )}
                        {u.discipline && (
                          <span className={`text-[9.5px] uppercase tracking-wide px-1.5 py-0.2 rounded font-semibold border inline-block mt-1 ${
                            u.discipline === 'architecture' ? 'bg-red-50 text-red-600 border-red-100' :
                            u.discipline === 'structure' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            u.discipline === 'electric' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            u.discipline === 'mechanical' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {u.discipline}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Role allocation */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Role:</span>
                        
                        {u.id === currentUser.id ? (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-200 text-slate-700 rounded-md uppercase font-mono">
                            {u.role.replace('_', ' ')}
                          </span>
                        ) : (
                          <select
                            disabled={u.deactivated}
                            className="text-xs font-semibold font-mono text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 cursor-pointer disabled:opacity-50"
                            value={u.role}
                            onChange={(e) => onUpdateUserRole(u.id, e.target.value as UserRole)}
                          >
                            <option value="admin">ADMIN</option>
                            <option value="lead_designer">LEAD DESIGNER</option>
                            <option value="engineer">ENGINEER</option>
                            <option value="viewer">VIEWER</option>
                          </select>
                        )}
                      </div>

                      {/* Discipline allocation */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Discipline:</span>
                        <select
                          disabled={u.deactivated}
                          className="text-xs font-semibold font-mono text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-400 cursor-pointer disabled:opacity-50"
                          value={u.discipline || 'other'}
                          onChange={(e) => onUpdateUserDiscipline(u.id, e.target.value as TaskType)}
                        >
                          <option value="architecture">ARCHITECTURE</option>
                          <option value="structure">STRUCTURE</option>
                          <option value="electric">ELECTRICAL</option>
                          <option value="mechanical">MECHANICAL</option>
                          <option value="other">OTHER</option>
                        </select>
                      </div>

                      {/* Member actions */}
                      {u.id !== currentUser.id && (
                        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                          {onToggleDeactivateUser && (
                            <button
                              type="button"
                              onClick={() => onToggleDeactivateUser(u.id)}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors cursor-pointer ${
                                u.deactivated
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              }`}
                              title={u.deactivated ? "Reactivate member account" : "Deactivate member account"}
                            >
                              {u.deactivated ? 'Activate' : 'Deactivate'}
                            </button>
                          )}
                          {onMessageUser && (
                            <button
                              type="button"
                              onClick={() => onMessageUser(u.id)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer border border-transparent hover:border-indigo-100"
                              title="Send Message"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onResetUserPassword && (
                            <button
                              type="button"
                              onClick={() => onResetUserPassword(u.id)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer border border-transparent hover:border-indigo-100"
                              title="Reset user password to master key"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteUser && (
                            <button
                              type="button"
                              onClick={() => onDeleteUser(u.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                              title="Delete user permanently"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: PROJECT SETUP MANAGER */}
        {activeSubTab === 'projects' && (
          <motion.div
            key="projects-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Create Project Form */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
              <h3 className="text-xs uppercase font-mono font-bold text-slate-700 tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-500" /> Provision Design Project
              </h3>
              <p className="text-xs text-slate-500">Initiate a brand new design target with designated blueprints, building identifiers, and locations.</p>

              <form onSubmit={handleCreateProject} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skyline Skyscraper Phase II"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Project Identifier Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PRJ-SKY-02"
                      className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                      value={newProjCode}
                      onChange={(e) => setNewProjCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase mb-0.5">Physical Location</label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco"
                      className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                      value={newProjLoc}
                      onChange={(e) => setNewProjLoc(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Engineering Summary / Details</label>
                  <textarea
                    required
                    placeholder="Provide a general description of the physical structure, MEP targets, and carbon footprint objectives..."
                    rows={4}
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                  />
                </div>

                {/* Project Disciplines select checklists */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Disciplines (Select Multiple)</label>
                  <div className="flex flex-wrap gap-3 p-2 bg-white border border-slate-200 rounded-lg">
                    {(['architecture', 'structure', 'electric', 'mechanical', 'other'] as TaskType[]).map(disc => {
                      const isChecked = newProjDisciplines.includes(disc);
                      return (
                        <label key={disc} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setNewProjDisciplines(prev => 
                                prev.includes(disc) 
                                  ? prev.filter(d => d !== disc) 
                                  : [...prev, disc]
                              );
                            }}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <span className="capitalize">{disc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Project Assignees select checklists */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Team Members (Select Multiple)</label>
                  <div className="grid grid-cols-2 gap-2 p-2 bg-white border border-slate-200 rounded-lg max-h-[110px] overflow-y-auto">
                    {users.filter(u => !u.deactivated).map(u => {
                      const isChecked = newProjAssignedUserIds.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded transition-colors text-[11px] text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setNewProjAssignedUserIds(prev => 
                                prev.includes(u.id) 
                                  ? prev.filter(id => id !== u.id) 
                                  : [...prev, u.id]
                              );
                            }}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <span className="truncate" title={u.name}>{u.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs tracking-wide transition-colors cursor-pointer"
                >
                  Spin-up Project Database
                </button>
              </form>
            </div>

            {/* Active Projects Ledger Column */}
            <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-xl space-y-4">
              <h3 className="text-xs uppercase font-mono font-bold text-slate-700 tracking-wider border-b border-slate-100 pb-2">Active Engineering Assets</h3>
              
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {projects.map(p => (
                  <div key={p.id} className="p-3 bg-slate-10 border border-slate-200 rounded-lg flex flex-col gap-2 relative hover:border-slate-300 transition-all">
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="text-[9px] font-mono tracking-wider font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-1.5 py-0.5 uppercase">
                        STATE: {p.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEditProject(p)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer border border-transparent hover:border-indigo-100"
                        title="Edit Project & Team"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteProject && (
                        <button
                          type="button"
                          onClick={() => onDeleteProject(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                          title="Delete Project permanently"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="min-w-0 pr-32">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200 px-1.5 py-0.2 rounded-xs">{p.code}</span>
                        <h4 className="text-xs font-extrabold text-slate-900 truncate">{p.name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Location: {p.location || 'N/A'} | Provisioned {p.createdAt}</p>
                      <p className="text-[11px] text-slate-600 line-clamp-3 mt-1.5 leading-relaxed">{p.description}</p>

                      {/* Project Disciplines */}
                      {p.disciplines && p.disciplines.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.disciplines.map(disc => (
                            <span key={disc} className="text-[8.5px] uppercase tracking-wide px-1.5 py-0.5 rounded font-extrabold border bg-slate-50 text-slate-500 border-slate-100">
                              {disc}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Project Team Members */}
                      {p.assignedUserIds && p.assignedUserIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-2.5 pt-2 border-t border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Team:</span>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {p.assignedUserIds.map(userId => {
                              const u = users.find(user => user.id === userId);
                              if (!u) return null;
                              return (
                                <div
                                  key={userId}
                                  className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-indigo-50 text-indigo-700 flex items-center justify-center text-[8px] font-bold"
                                  title={`${u.name} (${u.role})`}
                                >
                                  {u.name[0]}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: PREFERENCES & TEMPLATES */}
        {activeSubTab === 'preferences' && (
          <motion.div
            key="preferences-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid md:grid-cols-2 gap-6 text-left"
          >
            {/* Column 1: Visual Features Configuration */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  Toggle Workspace Visual Features
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Configure which sections and elements are visible across the entire application interface.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* 1. showCalendarTab */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visualSettings.showCalendarTab}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, showCalendarTab: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Enable Calendar & Scheduling
                    </label>
                    <p className="text-[10px] text-slate-400 pl-5">Show the integrated monthly Calendar scheduling module.</p>
                  </div>
                </div>

                {/* 2. showReportsTab */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visualSettings.showReportsTab}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, showReportsTab: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Enable Analytics & Reports
                    </label>
                    <p className="text-[10px] text-slate-400 pl-5">Display performance summaries and charts.</p>
                  </div>
                </div>

                {/* 3. showArchiveTab */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visualSettings.showArchiveTab}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, showArchiveTab: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Enable Completed Archive View
                    </label>
                    <p className="text-[10px] text-slate-400 pl-5">Let team members inspect completed and archived tasks list.</p>
                  </div>
                </div>

                {/* 4. showTaskPriorityBadge */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visualSettings.showTaskPriorityBadge}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, showTaskPriorityBadge: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Show Task Priority Badges
                    </label>
                    <p className="text-[10px] text-slate-400 pl-5">Render critical, high, medium, low tags on cards.</p>
                  </div>
                </div>

                {/* 5. showOverdueHighlight */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visualSettings.showOverdueHighlight}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, showOverdueHighlight: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Highlight Overdue Cards
                    </label>
                    <p className="text-[10px] text-slate-400 pl-5">Add warning icons and flash red ribbon highlights on late cards.</p>
                  </div>
                </div>

                {/* 6. showHoursCounter REMOVED */}
                
                {/* 7. showTaskTypeIcon */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visualSettings.showTaskTypeIcon}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, showTaskTypeIcon: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Display Task Discipline Badges
                    </label>
                    <p className="text-[10px] text-slate-400 pl-5">Show specialized design/discipline badges on card faces.</p>
                  </div>
                </div>

                {/* 8. enlargeIconSize */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!visualSettings.enlargeIconSize}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, enlargeIconSize: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Enlarge Icon Sizes
                    </label>
                    <p className="text-[10px] text-slate-400 pl-5">Increase the physical scaling/size of Lucide icons across panels for accessibility.</p>
                  </div>
                </div>

                {/* 9. compactMode */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!visualSettings.compactMode}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, compactMode: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Enable Compact Layout Mode
                    </label>
                    <p className="text-[10px] text-slate-400 pl-5">Switch global workspace display to a tighter, higher-density compact layout (reduces card sizes, paddings, and margins) instead of spacious layout.</p>
                  </div>
                </div>

                {/* 10. autoArchiveApprovedTasks */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!visualSettings.autoArchiveApprovedTasks}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, autoArchiveApprovedTasks: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Auto-Archive Approved Tasks (30+ Days)
                    </label>
                    <p className="text-[10px] text-slate-400 pl-5">Automatically archive tasks that have remained in the 'Approved' stage for more than 30 days to keep the board clean.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Export Template Modification */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  Report Print & Export Template Settings
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Customize the look, sections, details, and branding of the printed PDF/HTML design report.
                </p>
              </div>

              <div className="space-y-3.5">
                {/* 1. reportTitle */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Custom Report Header Title</label>
                  <input
                    type="text"
                    value={reportTemplateSettings.reportTitle}
                    onChange={(e) => onUpdateReportTemplateSettings({ ...reportTemplateSettings, reportTitle: e.target.value })}
                    placeholder="e.g. Engineering Design Report"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white"
                  />
                </div>

                {/* 2. companyName */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company / Organization Label</label>
                  <input
                    type="text"
                    value={reportTemplateSettings.companyName}
                    onChange={(e) => onUpdateReportTemplateSettings({ ...reportTemplateSettings, companyName: e.target.value })}
                    placeholder="e.g. AEC DESIGN STUDIO"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white"
                  />
                </div>

                {/* 3. accentColor */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Report Theme Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={reportTemplateSettings.accentColor}
                      onChange={(e) => onUpdateReportTemplateSettings({ ...reportTemplateSettings, accentColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                    />
                    <span className="text-xs font-mono font-medium text-slate-600 bg-slate-50 px-2.5 py-1 border border-slate-150 rounded">{reportTemplateSettings.accentColor.toUpperCase()}</span>
                    
                    {/* Color Presets */}
                    <div className="flex gap-1.5">
                      {['#0f172a', '#4f46e5', '#0891b2', '#059669', '#dc2626'].map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => onUpdateReportTemplateSettings({ ...reportTemplateSettings, accentColor: col })}
                          className="w-4.5 h-4.5 rounded-full border border-slate-200 cursor-pointer transition-transform hover:scale-110 active:scale-95 shadow-3xs"
                          style={{ backgroundColor: col }}
                          title={col}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* 4. includeStatCards */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={reportTemplateSettings.includeStatCards}
                        onChange={(e) => onUpdateReportTemplateSettings({ ...reportTemplateSettings, includeStatCards: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Include Stat Summaries
                    </label>
                    <p className="text-[9px] text-slate-400 mt-1 pl-5">Show total tasks and estimation metrics.</p>
                  </div>

                  {/* 5. includeDisciplineBreakdown */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={reportTemplateSettings.includeDisciplineBreakdown}
                        onChange={(e) => onUpdateReportTemplateSettings({ ...reportTemplateSettings, includeDisciplineBreakdown: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Include Discipline breakdown
                    </label>
                    <p className="text-[9px] text-slate-400 mt-1 pl-5">Show breakdown chart counts for each design tier.</p>
                  </div>
                </div>

                {/* 6. includeTaskDescription */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={reportTemplateSettings.includeTaskDescription}
                      onChange={(e) => onUpdateReportTemplateSettings({ ...reportTemplateSettings, includeTaskDescription: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    Include Full Task Scope Descriptions
                  </label>
                  <p className="text-[9px] text-slate-400 mt-1 pl-5">Render complete task specification text within printed lists.</p>
                </div>

                {/* 7. footerText */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Custom Report Footer Boilerplate</label>
                  <textarea
                    value={reportTemplateSettings.footerText}
                    onChange={(e) => onUpdateReportTemplateSettings({ ...reportTemplateSettings, footerText: e.target.value })}
                    rows={2}
                    placeholder="Legal footnote or summary disclaimer..."
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Row 2, Section 1: Workspace Branding & Styling Customization */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 md:col-span-2 text-left">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  Workspace Branding & Custom Theme Settings
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Rebrand the workspace, choose custom style density, and select primary design colors.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-1">
                {/* Custom Workspace Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Workspace Organization Name</label>
                  <input
                    type="text"
                    value={visualSettings.workspaceName || ''}
                    onChange={(e) => onUpdateVisualSettings({ ...visualSettings, workspaceName: e.target.value })}
                    placeholder="e.g. Nexus Design Ops"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white"
                  />
                  <p className="text-[9px] text-slate-400">Updates the workspace name across the header, portals, and reports.</p>
                </div>

                {/* Master Password Setting */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    Team Master Password
                  </label>
                  <input
                    type="password"
                    value={visualSettings.masterPassword || ''}
                    onChange={(e) => onUpdateVisualSettings({ ...visualSettings, masterPassword: e.target.value })}
                    placeholder="Enter global master password"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white"
                  />
                  <p className="text-[9px] text-slate-400">Allows any team member to sign in. Admins can override personal passwords using this key.</p>
                </div>

                {/* Primary Brand Accent Color */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Primary Accent Color</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { id: 'indigo', hex: '#4f46e5', name: 'Indigo' },
                      { id: 'emerald', hex: '#10b981', name: 'Emerald' },
                      { id: 'amber', hex: '#f59e0b', name: 'Amber' },
                      { id: 'rose', hex: '#f43f5e', name: 'Rose' },
                      { id: 'violet', hex: '#8b5cf6', name: 'Violet' },
                      { id: 'cyan', hex: '#06b6d4', name: 'Cyan' },
                    ].map(col => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => onUpdateVisualSettings({ ...visualSettings, primaryColor: col.id as any })}
                        className={`w-7 h-7 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all ${
                          (visualSettings.primaryColor || 'indigo') === col.id ? 'border-slate-800 scale-110 shadow-sm' : 'border-slate-200 hover:scale-105'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      >
                        {(visualSettings.primaryColor || 'indigo') === col.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400">Select the primary theme color for dynamic visual branding elements.</p>
                </div>

                {/* Kanban Card Compactness */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Kanban Card Grid Density</label>
                  <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 mt-1">
                    {[
                      { id: 'compact', label: 'Compact' },
                      { id: 'comfortable', label: 'Comfortable' },
                      { id: 'spacious', label: 'Spacious' },
                    ].map(sz => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => onUpdateVisualSettings({ ...visualSettings, cardCompactness: sz.id as any })}
                        className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          (visualSettings.cardCompactness || 'comfortable') === sz.id
                            ? 'bg-white text-slate-800 shadow-3xs border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400">Adjust padding, sizes, and spacing of tasks inside columns.</p>
                </div>

                {/* Custom Footer Text */}
                <div className="space-y-1.5 col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Global Footer Text</label>
                  <input
                    type="text"
                    value={visualSettings.footerText || ''}
                    onChange={(e) => onUpdateVisualSettings({ ...visualSettings, footerText: e.target.value })}
                    placeholder="e.g. © 2026 Nexus Design Ops. Standard workflow management."
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white"
                  />
                  <p className="text-[9px] text-slate-400">Updates the copyright and info signature text displayed in the footer across all panels.</p>
                </div>
              </div>
            </div>

            {/* Row 2, Section 2: Welcome Modal & Broadcast Announcement Settings */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 md:col-span-2 text-left">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-indigo-500" />
                  Custom "Welcome" Broadcast Modals & Notifications
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Configure an announcement splash modal that appears for all users upon application load. Use this to highlight internal design deadlines, vacation office closures, or new design standard alerts.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Configuration form */}
                <div className="md:col-span-2 space-y-4 text-left">
                  <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!visualSettings.welcomeModalEnabled}
                          onChange={(e) => onUpdateVisualSettings({ ...visualSettings, welcomeModalEnabled: e.target.checked })}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        Broadcast Modal Active
                      </label>
                      <p className="text-[10px] text-slate-400 pl-5.5">When checked, all team members will see the modal on load until acknowledged.</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${visualSettings.welcomeModalEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {visualSettings.welcomeModalEnabled ? '● BROADCASTING' : 'OFFLINE'}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Modal Title Accent</label>
                      <input
                        type="text"
                        value={visualSettings.welcomeModalTitle || ''}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, welcomeModalTitle: e.target.value })}
                        placeholder="e.g. Critical Milestone Announcement"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dismiss Button Text</label>
                      <input
                        type="text"
                        value={visualSettings.welcomeModalButtonText || ''}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, welcomeModalButtonText: e.target.value })}
                        placeholder="e.g. Acknowledge & Proceed"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Announcement Body Description</label>
                    <textarea
                      value={visualSettings.welcomeModalContent || ''}
                      onChange={(e) => onUpdateVisualSettings({ ...visualSettings, welcomeModalContent: e.target.value })}
                      rows={4}
                      placeholder="Enter detailed broadcast messages, guidelines, or announcements here..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white resize-none"
                    />
                  </div>
                </div>

                {/* Simulated Preview Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between text-left">
                  <div>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-full uppercase tracking-wider">Live Preview</span>
                    <div className="mt-3 bg-white border border-slate-200 rounded-lg p-3 shadow-xs space-y-2.5 text-left">
                      <div className="flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-indigo-600" />
                        <h5 className="text-[11px] font-bold text-slate-800 truncate">{visualSettings.welcomeModalTitle || 'Default Welcome Title'}</h5>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {visualSettings.welcomeModalContent || 'Nexus Design Ops coordinates our engineering and design deliverables.'}
                      </p>
                      <button
                        type="button"
                        disabled
                        className="w-full text-[9px] py-1 bg-slate-900 text-white rounded font-semibold text-center opacity-70"
                      >
                        {visualSettings.welcomeModalButtonText || 'Acknowledge & Proceed'}
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal mt-3">Changes to the modal contents are immediately propagated. Deselect the "Active" toggle to disable it.</p>
                </div>
              </div>
            </div>



          </motion.div>
        )}

      </AnimatePresence>
      
      {/* Bulk Message Modal */}
      <AnimatePresence>
        {showBulkMessageModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkMessageModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Send Bulk Message</h3>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wider">RECIPIENTS: {selectedUserIds.length} SELECTED MEMBERS</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkMessageModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendBulkMessageSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Message Content</label>
                  <textarea
                    required
                    value={bulkMessageText}
                    onChange={(e) => setBulkMessageText(e.target.value)}
                    placeholder="Type your announcement or unified message here..."
                    className="w-full h-40 text-sm px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none bg-slate-50/30"
                  />
                  <p className="text-[10px] text-slate-400">This message will be sent individually to all selected team members.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkMessageModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!bulkMessageText.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-100 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Dispatch Messages
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preset Application Overwrite Confirmation Modal (In-App) */}
      <AnimatePresence>
        {presetToApply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPresetToApply(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden p-6 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full shrink-0">
                  <Layers className="w-6 h-6 animate-none" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                    Confirm Methodology Change
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Applying the <span className="font-semibold text-indigo-600 uppercase font-mono bg-indigo-50/50 px-1 py-0.5 rounded">{presetToApply}</span> preset will <span className="font-semibold text-rose-600">permanently overwrite</span> your current pipeline configuration.
                  </p>
                  <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                    "This replaces existing Kanban columns with standard stages designed for the selected delivery methodology."
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setPresetToApply(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmApplyPreset}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-sm"
                >
                  Yes, Overwrite & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Project Modal */}
      <AnimatePresence>
        {editingProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProject(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Edit Project Details</h3>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wider">PROJECT: {editingProject.code}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditProject} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skyline Skyscraper Phase II"
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    value={editProjName}
                    onChange={(e) => setEditProjName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project Identifier Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PRJ-SKY-02"
                      className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                      value={editProjCode}
                      onChange={(e) => setEditProjCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Physical Location</label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco"
                      className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                      value={editProjLoc}
                      onChange={(e) => setEditProjLoc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Delivery Status</label>
                    <select
                      className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                      value={editProjStatus}
                      onChange={(e) => setEditProjStatus(e.target.value as any)}
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Engineering Summary / Details (Add Detail)</label>
                  <textarea
                    required
                    placeholder="Provide a general description..."
                    rows={4}
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    value={editProjDesc}
                    onChange={(e) => setEditProjDesc(e.target.value)}
                  />
                </div>

                {/* Project Disciplines select checklists */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Disciplines (Select Multiple)</label>
                  <div className="flex flex-wrap gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {(['architecture', 'structure', 'electric', 'mechanical', 'other'] as TaskType[]).map(disc => {
                      const isChecked = editProjDisciplines.includes(disc);
                      return (
                        <label key={disc} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setEditProjDisciplines(prev => 
                                prev.includes(disc) 
                                  ? prev.filter(d => d !== disc) 
                                  : [...prev, disc]
                              );
                            }}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <span className="capitalize">{disc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Project Assignees select checklists */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Team Members (Add Team)</label>
                  <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-[140px] overflow-y-auto">
                    {users.filter(u => !u.deactivated).map(u => {
                      const isChecked = editProjAssignedUserIds.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-1.5 p-1 hover:bg-slate-100 rounded transition-colors text-[11px] text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setEditProjAssignedUserIds(prev => 
                                prev.includes(u.id) 
                                  ? prev.filter(id => id !== u.id) 
                                  : [...prev, u.id]
                              );
                            }}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <span className="truncate" title={u.name}>{u.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-100 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
                  >
                    Save Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
