import React, { useState, useEffect } from 'react';
import { Task, Project, TeamActivity, User, VisualSettings } from '../types';
import { 
  Download, 
  FileText, 
  Table as TableIcon, 
  FileJson, 
  Check, 
  ChevronRight,
  Settings,
  Filter,
  Columns,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { getBrandClasses } from '../utils/theme';

// Extend jsPDF with autoTable for TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportPanelProps {
  tasks: Task[];
  projects: Project[];
  activities: TeamActivity[];
  users: User[];
  visualSettings?: VisualSettings;
}

type ExportSource = 'tasks' | 'projects' | 'activities';
type ExportFormat = 'pdf' | 'excel' | 'csv';

interface ColumnOption {
  key: string;
  label: string;
  enabled: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ tasks, projects, activities, users, visualSettings }) => {
  const [source, setSource] = useState<ExportSource>('tasks');
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [columns, setColumns] = useState<ColumnOption[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const brand = getBrandClasses(visualSettings?.primaryColor);

  const pdfColorMap: Record<string, [number, number, number]> = {
    indigo: [79, 70, 229],
    emerald: [16, 185, 129],
    amber: [245, 158, 11],
    rose: [244, 63, 94],
    violet: [139, 92, 246],
    cyan: [6, 182, 212]
  };
  const pdfColor = pdfColorMap[visualSettings?.primaryColor || 'indigo'] || [79, 70, 229];

  // Column definitions for each source
  const columnDefinitions: Record<ExportSource, ColumnOption[]> = {
    tasks: [
      { key: 'id', label: 'Task ID', enabled: true },
      { key: 'title', label: 'Title', enabled: true },
      { key: 'description', label: 'Description', enabled: true },
      { key: 'status', label: 'Status', enabled: true },
      { key: 'priority', label: 'Priority', enabled: true },
      { key: 'assignee', label: 'Assignee', enabled: true },
      { key: 'project', label: 'Project', enabled: true },
      { key: 'createdAt', label: 'Created At', enabled: true },
    ],
    projects: [
      { key: 'id', label: 'Project ID', enabled: true },
      { key: 'name', label: 'Name', enabled: true },
      { key: 'description', label: 'Description', enabled: true },
      { key: 'status', label: 'Status', enabled: true },
      { key: 'client', label: 'Client', enabled: true },
      { key: 'createdAt', label: 'Created At', enabled: true },
    ],
    activities: [
      { key: 'id', label: 'Activity ID', enabled: true },
      { key: 'userName', label: 'User', enabled: true },
      { key: 'type', label: 'Type', enabled: true },
      { key: 'title', label: 'Event', enabled: true },
      { key: 'description', label: 'Details', enabled: true },
      { key: 'projectName', label: 'Project', enabled: true },
      { key: 'createdAt', label: 'Timestamp', enabled: true },
    ]
  };

  useEffect(() => {
    setColumns(columnDefinitions[source]);
  }, [source]);

  const toggleColumn = (key: string) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, enabled: !col.enabled } : col
    ));
  };

  const getExportData = () => {
    const enabledColumns = columns.filter(c => c.enabled);
    
    let rawData: any[] = [];
    if (source === 'tasks') rawData = tasks;
    else if (source === 'projects') rawData = projects;
    else if (source === 'activities') rawData = activities;

    return rawData.map(item => {
      const row: any = {};
      enabledColumns.forEach(col => {
        let value = '';
        
        if (source === 'tasks') {
          const t = item as Task;
          if (col.key === 'assignee') {
            const user = users.find(u => u.id === t.assignedTo);
            value = user ? user.name : 'Unassigned';
          } else if (col.key === 'project') {
            const p = projects.find(proj => proj.id === t.projectId);
            value = p ? p.name : 'Unknown';
          } else {
            value = (t as any)[col.key] || '';
          }
        } else {
          value = (item as any)[col.key] || '';
        }

        row[col.label] = value;
      });
      return row;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    const data = getExportData();
    const filename = `${source}_export_${new Date().toISOString().split('T')[0]}`;

    try {
      if (format === 'csv') {
        const headers = columns.filter(c => c.enabled).map(c => c.label);
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
      } else if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, source.toUpperCase());
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else if (format === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text(`${source.toUpperCase()} REPORT`, 14, 15);
        
        const headers = columns.filter(c => c.enabled).map(c => c.label);
        const body = data.map(row => headers.map(h => row[h]));

        doc.autoTable({
          startY: 20,
          head: [headers],
          body: body,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: pdfColor }, // dynamic brand header color
        });

        doc.save(`${filename}.pdf`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${brand.bg} flex items-center justify-center text-white shadow-lg shadow-slate-100`}>
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Export Center</h1>
            <p className="text-sm text-slate-500 font-medium">Download your workspace data in multiple formats</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Configuration Hub</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Source & Format */}
        <div className="space-y-6">
          {/* Source Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Filter className={`w-4 h-4 ${brand.text}`} />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Select Data Source</h2>
            </div>
            <div className="space-y-2">
              {[
                { id: 'tasks', label: 'Tasks & Workflow', count: tasks.length },
                { id: 'projects', label: 'Projects & Clients', count: projects.length },
                { id: 'activities', label: 'Team Activity Feed', count: activities.length }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSource(item.id as ExportSource)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    source === item.id 
                      ? `${brand.bgSoft} ${brand.borderBrandSoft} ${brand.textSoft} shadow-sm` 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    source === item.id ? `${brand.bg} text-white` : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.count} items
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Download className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Export Format</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'excel', label: 'Excel', icon: TableIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { id: 'pdf', label: 'PDF', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' },
                { id: 'csv', label: 'CSV', icon: FileJson, color: 'text-blue-600', bg: 'bg-blue-50' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFormat(item.id as ExportFormat)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    format === item.id 
                      ? `border-slate-800 bg-slate-800 text-white shadow-md` 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${format === item.id ? 'text-white' : item.color}`} />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Column Selection & Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Columns className={`w-4 h-4 ${brand.text}`} />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Customize Template Columns</h2>
              </div>
              <button 
                onClick={() => setColumns(prev => prev.map(c => ({ ...c, enabled: true })))}
                className={`text-[10px] font-bold ${brand.text} ${brand.hoverText} uppercase tracking-wider`}
              >
                Reset to Default
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {columns.map((col) => (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    col.enabled 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 font-medium' 
                      : 'bg-white border-slate-100 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      col.enabled ? `${brand.bg} text-white` : 'bg-slate-100 text-slate-300'
                    }`}>
                      {col.enabled ? <Check className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                    </div>
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  {col.enabled ? <Eye className={`w-4 h-4 ${brand.text}`} /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                </button>
              ))}
            </div>

            <div className="mt-auto p-5 bg-slate-50 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  <span className="font-bold text-slate-800">{columns.filter(c => c.enabled).length}</span> of <span className="font-bold text-slate-800">{columns.length}</span> columns selected for export.
                </div>
                <button
                  onClick={handleExport}
                  disabled={isExporting || columns.filter(c => c.enabled).length === 0}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                    isExporting || columns.filter(c => c.enabled).length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : `${brand.bg} text-white ${brand.bgHover} hover:-translate-y-0.5 active:translate-y-0 shadow-slate-100`
                  }`}
                >
                  {isExporting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isExporting ? 'Preparing File...' : 'Generate Export File'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
