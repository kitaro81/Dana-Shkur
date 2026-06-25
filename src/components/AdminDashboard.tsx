import React, { useState } from 'react';
import { Project, User, WorkflowStage, UserRole, TaskType, VisualSettings, ReportTemplateSettings, TaskTemplate, Label, Task } from '../types';
import { Shield, Plus, Briefcase, PlusCircle, Trash, RefreshCw, Layers, Edit2, Users, Check, X, Sliders, Settings, FileText, Clock, Tag, Megaphone, Palette, AlertTriangle, Zap, Kanban } from 'lucide-react';
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
  taskTemplates: TaskTemplate[];
  onUpdateTaskTemplates: (templates: TaskTemplate[]) => void;
  labels: Label[];
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onUpdateUserDiscipline: (userId: string, newDiscipline: TaskType) => void;
  onDeleteUser?: (userId: string) => void;
  onToggleDeactivateUser?: (userId: string) => void;
  onInviteUser: (user: Omit<User, 'id' | 'joinedAt'>) => void;
  onUpdateStages: (stages: WorkflowStage[]) => void;
  onDeleteProject?: (projectId: string) => void;
  tasks?: Task[];
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
  taskTemplates,
  onUpdateTaskTemplates,
  labels,
  onAddProject,
  onUpdateUserRole,
  onUpdateUserDiscipline,
  onDeleteUser,
  onToggleDeactivateUser,
  onInviteUser,
  onUpdateStages,
  onDeleteProject,
  tasks = [],
}) => {
  // Tabs: Flow/Stages, Team/Roles, Projects Setup, Preferences, Task Templates
  const [activeSubTab, setActiveSubTab] = useState<'stages' | 'users' | 'projects' | 'preferences' | 'templates'>('stages');

  // --- Project form state ---
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjLoc, setNewProjLoc] = useState('');
  const [newProjDisciplines, setNewProjDisciplines] = useState<TaskType[]>([]);
  const [newProjAssignedUserIds, setNewProjAssignedUserIds] = useState<string[]>([]);

  // --- Invite User state ---
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('engineer');
  const [newUserDiscipline, setNewUserDiscipline] = useState<TaskType>('other');

  // --- Workflow edit state ---
  const [editedStages, setEditedStages] = useState<WorkflowStage[]>([...stages]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#F59E0B');
  const [presetToApply, setPresetToApply] = useState<'waterfall' | 'agile' | 'simple' | null>(null);

  // --- Task template form state ---
  const [newTplName, setNewTplName] = useState('');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newTplDuration, setNewTplDuration] = useState<number>(24);
  const [newTplType, setNewTplType] = useState<TaskType>('architecture');
  const [newTplPriority, setNewTplPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newTplLabelIds, setNewTplLabelIds] = useState<string[]>([]);

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
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('engineer');
    setNewUserDiscipline('other');
    alert('Team member registered in team credentials list!');
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) return;

    const newTemplate: TaskTemplate = {
      id: `tpl-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      name: newTplName.trim(),
      description: newTplDesc.trim(),
      defaultDurationHours: Number(newTplDuration) || 0,
      type: newTplType,
      priority: newTplPriority,
      labelIds: newTplLabelIds,
    };

    onUpdateTaskTemplates([...taskTemplates, newTemplate]);

    setNewTplName('');
    setNewTplDesc('');
    setNewTplDuration(24);
    setNewTplType('architecture');
    setNewTplPriority('medium');
    setNewTplLabelIds([]);
  };

  const handleDeleteTemplate = (tplId: string) => {
    onUpdateTaskTemplates(taskTemplates.filter(t => t.id !== tplId));
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
        <h3 className="text-xs font-semibold text-slate-700 mb-1">Administrator Access Required</h3>
        <p className="text-xs text-slate-500">Only Administrators can manage workspace workflow columns, roles, or add projects. Switch your active profile in the header to gain access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Admin Panel Header & Sub tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Workspace Settings</h2>
          <p className="text-xs text-slate-400">Configure project lanes, custom member roles, and active assignments.</p>
        </div>

        {/* Sub tab selectors */}
        <div className="flex bg-slate-100 p-0.5 rounded border border-slate-250 flex-wrap gap-0.5">
          <button
            onClick={() => setActiveSubTab('stages')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'stages' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Columns
          </button>
          
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'users' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Members
          </button>

          <button
            onClick={() => setActiveSubTab('projects')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'projects' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Add Project
          </button>

          <button
            onClick={() => setActiveSubTab('preferences')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'preferences' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Preferences
          </button>

          <button
            onClick={() => setActiveSubTab('templates')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'templates' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Task Templates
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
            <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs uppercase font-mono font-bold text-slate-700 tracking-wider">Active Board Lane Mappings</h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {editedStages.length} Lanes
                </span>
              </div>

              <div className="space-y-2">
                {editedStages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center gap-3 p-3 bg-slate-55 border border-slate-200 rounded-lg group">
                    {/* Index identifier */}
                    <span className="font-mono text-slate-400 text-xs font-bold w-4">#{index + 1}</span>
                    
                    {/* Color chip */}
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    
                    {/* Name input */}
                    <input
                      type="text"
                      className="flex-1 text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none px-1"
                      value={stage.name}
                      onChange={(e) => {
                        const updated = editedStages.map(s => s.id === stage.id ? { ...s, name: e.target.value } : s);
                        setEditedStages(updated);
                      }}
                    />

                    {/* Order up/down buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          if (index === 0) return;
                          const next = [...editedStages];
                          const tmp = next[index];
                          next[index] = next[index - 1];
                          next[index - 1] = tmp;
                          // fix order integers
                          setEditedStages(next.map((s, i) => ({ ...s, order: i })));
                        }}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-200 text-slate-500 rounded disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        ▲
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
                        className="p-1 hover:bg-slate-200 text-slate-500 rounded disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Delete button (only if not leading to < 2 lanes) */}
                    <button
                      onClick={() => handleDeleteStage(stage.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Destroy lane"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSaveStages}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Synchronize Lanes
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
              <h3 className="text-xs uppercase font-mono font-bold text-slate-700 tracking-wider border-b border-slate-100 pb-2">Corporation Team Roster & Roles</h3>
              
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {users.map(u => (
                  <div key={u.id} className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 border rounded-lg transition-all ${
                    u.deactivated 
                      ? 'bg-rose-50/10 border-dashed border-rose-200 opacity-75' 
                      : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
                        alt={u.name}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
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
                    <p className="text-[10px] text-slate-400 pl-5">Display performance summaries and hour tracking charts.</p>
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

                {/* 6. showHoursCounter */}
                <div className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visualSettings.showHoursCounter}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, showHoursCounter: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Display Task Hours Counters
                    </label>
                    <p className="text-[10px] text-slate-400 pl-5">Display estimated and logged task hours on Kanban board.</p>
                  </div>
                </div>

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
                    <p className="text-[9px] text-slate-400 mt-1 pl-5">Show total tasks, estimations, and hours metrics.</p>
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
                  Rebrand the workspace, choose custom style density, toggle themes, and select primary design colors.
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

            {/* Row 3: Agile & Scrum Management Control Center */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 md:col-span-2 text-left">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Agile Scrum Management Control Center
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Fine-tune your Agile delivery settings, sprint capacity, estimation metrics, and active project sprint health checks.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-850 flex items-center gap-1 font-mono uppercase">
                  ⚡ Scrum Config
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Column 1: Sprint & Goal Configurations */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">1. Sprint Cadence & Goals</h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sprint Iteration Length</label>
                    <select
                      value={visualSettings.agileSprintDurationWeeks || 2}
                      onChange={(e) => onUpdateVisualSettings({ ...visualSettings, agileSprintDurationWeeks: Number(e.target.value) })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white cursor-pointer"
                    >
                      <option value={1}>1 Week (Fast Iterations)</option>
                      <option value={2}>2 Weeks (Standard Scrum)</option>
                      <option value={3}>3 Weeks (Medium Cycle)</option>
                      <option value={4}>4 Weeks (Monthly Sprint)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Active Sprint Goal</label>
                    <textarea
                      value={visualSettings.agileSprintGoal || ''}
                      onChange={(e) => onUpdateVisualSettings({ ...visualSettings, agileSprintGoal: e.target.value })}
                      rows={3}
                      placeholder="e.g., Deliver core blueprints, complete Q/C checkups, and obtain structural engineer stamp."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white resize-none"
                    />
                  </div>
                </div>

                {/* Column 2: Estimation & Strict Validation */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">2. Metrics & Guardrails</h4>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Core Estimation Metric</label>
                    <select
                      value={visualSettings.agileEstimationMetric || 'story_points'}
                      onChange={(e) => onUpdateVisualSettings({ ...visualSettings, agileEstimationMetric: e.target.value as any })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white cursor-pointer"
                    >
                      <option value="story_points">Story Points (Fibonacci: 1, 2, 3, 5, 8, 13)</option>
                      <option value="hours">Man-Hours (Traditional hours)</option>
                      <option value="t_shirt">T-Shirt Sizing (S, M, L, XL)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sprint Backlog Capacity Limit</label>
                    <input
                      type="number"
                      value={visualSettings.agileTargetCapacity || 40}
                      onChange={(e) => onUpdateVisualSettings({ ...visualSettings, agileTargetCapacity: Number(e.target.value) || 0 })}
                      placeholder="e.g. 40"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!visualSettings.agileRequireStoryPoints}
                        onChange={(e) => onUpdateVisualSettings({ ...visualSettings, agileRequireStoryPoints: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      Enforce Mandatory Estimation
                    </label>
                    <p className="text-[9px] text-slate-400 pl-5">Block moving tasks out of backlog stages until they have an estimation value assigned.</p>
                  </div>
                </div>

                {/* Column 3: Live Sprint Health Diagnostic */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between text-left">
                  <div>
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100/85 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      System Diagnosis
                    </span>
                    
                    {/* Calculate Active Sprint metrics across tasks */}
                    {(() => {
                      // Find tasks belonging to "Active Sprint" (or column with ID containing 'sprint' or the 2nd stage)
                      const sprintStageId = stages.find(s => s.id.toLowerCase().includes('sprint') || s.id.toLowerCase().includes('progress'))?.id || stages[1]?.id || 'sprint';
                      const activeSprintTasks = tasks.filter(t => t.stageId === sprintStageId && !t.archived);
                      
                      let currentLoad = 0;
                      let metricName = 'Story Points';
                      
                      if (visualSettings.agileEstimationMetric === 'hours') {
                        currentLoad = activeSprintTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
                        metricName = 'Man-Hours';
                      } else if (visualSettings.agileEstimationMetric === 't_shirt') {
                        const tShirtMapping = { 'S': 1, 'M': 3, 'L': 5, 'XL': 8 };
                        currentLoad = activeSprintTasks.reduce((sum, t) => sum + (tShirtMapping[t.tShirtSize || 'M'] || 3), 0);
                        metricName = 'T-Shirt Weight (pts)';
                      } else {
                        currentLoad = activeSprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                        metricName = 'Story Points';
                      }
                      
                      const targetCapacity = visualSettings.agileTargetCapacity || 40;
                      const percentage = targetCapacity > 0 ? Math.min(100, Math.round((currentLoad / targetCapacity) * 100)) : 0;
                      const isOverloaded = currentLoad > targetCapacity;
                      
                      return (
                        <div className="mt-3.5 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 font-medium">Sprint Lane Status</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${isOverloaded ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'}`}>
                              {isOverloaded ? '⚠️ OVERLOADED' : '🟢 HEALTHY LOAD'}
                            </span>
                          </div>

                          <div className="bg-white border border-slate-150 p-2.5 rounded-lg space-y-2">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-semibold text-slate-700">Sprint Load ({metricName}):</span>
                              <span className="font-bold text-slate-900 font-mono">{currentLoad} / {targetCapacity}</span>
                            </div>
                            
                            {/* Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${isOverloaded ? 'bg-rose-500' : 'bg-indigo-600'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            
                            <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                              <span>0%</span>
                              <span>Target Capacity ({targetCapacity})</span>
                              <span>100%</span>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-500 leading-normal space-y-1">
                            <p>👉 <strong className="text-slate-700 font-bold">Sprint Cadence:</strong> Every <strong className="text-slate-700">{visualSettings.agileSprintDurationWeeks || 2} weeks</strong>.</p>
                            <p>👉 <strong className="text-slate-700 font-bold">Task Count:</strong> <strong className="text-indigo-600 font-semibold">{activeSprintTasks.length} tasks</strong> actively committed.</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <p className="text-[9px] text-slate-400 leading-relaxed mt-2">
                    Tip: Target Capacity is used as a soft guardrail. Moving cards into the active sprint beyond this capacity will trigger a system overload warning.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {activeSubTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column: Form to create a new template */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Task Template</h3>
                </div>

                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Template Name</label>
                    <input
                      type="text"
                      required
                      value={newTplName}
                      onChange={(e) => setNewTplName(e.target.value)}
                      placeholder="e.g., Structural Drawing Review"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Predefined Description</label>
                    <textarea
                      value={newTplDesc}
                      onChange={(e) => setNewTplDesc(e.target.value)}
                      placeholder="Detailed instructions or scope of work for this task..."
                      rows={4}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discipline</label>
                      <select
                        value={newTplType}
                        onChange={(e) => setNewTplType(e.target.value as TaskType)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white cursor-pointer"
                      >
                        <option value="architecture">Architecture</option>
                        <option value="structure">Structure</option>
                        <option value="electric">Electric</option>
                        <option value="mechanical">Mechanical</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Default Duration (Hrs)</label>
                      <input
                        type="number"
                        min={0}
                        value={newTplDuration}
                        onChange={(e) => setNewTplDuration(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                    <select
                      value={newTplPriority}
                      onChange={(e) => setNewTplPriority(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-50/50 focus:border-indigo-400 bg-white cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Predefined Labels</label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      {labels.map((label) => {
                        const isChecked = newTplLabelIds.includes(label.id);
                        return (
                          <label
                            key={label.id}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-white border-slate-350 shadow-2xs text-slate-800'
                                : 'bg-slate-100/50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTplLabelIds([...newTplLabelIds, label.id]);
                                } else {
                                  setNewTplLabelIds(newTplLabelIds.filter((id) => id !== label.id));
                                }
                              }}
                              className="sr-only"
                            />
                            <span
                              className="w-2 h-2 rounded-full inline-block mr-1"
                              style={{ backgroundColor: label.color }}
                            />
                            {label.name}
                          </label>
                        );
                      })}
                      {labels.length === 0 && (
                        <p className="text-[10px] text-slate-400">No workspace labels defined yet.</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-850 text-white font-semibold py-2 px-3 rounded-lg text-xs cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Save Template
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: List of existing templates */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Workspace Task Templates</h3>

                <div className="space-y-3">
                  {taskTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-4 border border-slate-200/80 hover:border-slate-300 rounded-xl bg-gradient-to-r from-white to-slate-50/30 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-800">{tpl.name}</h4>
                          <span
                            className={`text-[9px] capitalize px-1.5 py-0.5 rounded-full font-medium border ${
                              tpl.type === 'architecture'
                                ? 'bg-red-50 text-red-600 border-red-100'
                                : tpl.type === 'structure'
                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : tpl.type === 'electric'
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                : tpl.type === 'mechanical'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}
                          >
                            {tpl.type}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${
                              tpl.priority === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : tpl.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : tpl.priority === 'medium'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            {tpl.priority} priority
                          </span>
                        </div>

                        {tpl.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {tpl.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{tpl.defaultDurationHours} estimated hours</span>
                          </div>

                          {tpl.labelIds && tpl.labelIds.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-slate-400" />
                              <div className="flex gap-1">
                                {tpl.labelIds.map((lId) => {
                                  const lbl = labels.find((l) => l.id === lId);
                                  if (!lbl) return null;
                                  return (
                                    <span
                                      key={lId}
                                      className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold text-white"
                                      style={{ backgroundColor: lbl.color }}
                                    >
                                      {lbl.name}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-end md:self-start cursor-pointer border border-transparent hover:border-red-100"
                        title="Delete Template"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {taskTemplates.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">No custom templates defined yet.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Use the builder form on the left to add templates.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
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

    </div>
  );
};
