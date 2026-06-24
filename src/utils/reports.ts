import { Task, Project, User, WorkflowStage } from '../types';

/**
 * Filter tasks by duration type helper
 */
export function filterTasksByTimeframe(
  tasks: Task[], 
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all'
): Task[] {
  const now = new Date();
  
  return tasks.filter(task => {
    const taskDate = new Date(task.updatedAt || task.createdAt);
    const diffTime = Math.abs(now.getTime() - taskDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (timeframe === 'daily') {
      return diffDays <= 1;
    } else if (timeframe === 'weekly') {
      return diffDays <= 7;
    } else if (timeframe === 'monthly') {
      return diffDays <= 30;
    }
    return true; // 'all'
  });
}

/**
 * Generates and downloads a CSV report of design tasks
 */
export function exportTasksToCSV(
  tasks: Task[], 
  projects: Project[], 
  users: User[],
  stages: WorkflowStage[],
  title: string
) {
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const userMap = new Map(users.map(u => [u.id, u]));
  const stageMap = new Map(stages.map(s => [s.id, s]));

  const headers = [
    'Task ID',
    'Project Name',
    'Project Code',
    'Task Title',
    'Task Description',
    'Discipline / Type',
    'Workflow Stage',
    'Priority',
    'Assigned To',
    'Est. Hours',
    'Logged Hours',
    'Due Date',
    'Updated At'
  ];

  const rows = tasks.map(task => {
    const project = projectMap.get(task.projectId);
    const user = task.assignedTo ? userMap.get(task.assignedTo) : undefined;
    const stage = stageMap.get(task.stageId);

    return [
      `"${task.id}"`,
      `"${project?.name || 'Unknown Project'}"`,
      `"${project?.code || ''}"`,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${task.description.replace(/"/g, '""')}"`,
      `"${task.type.toUpperCase()}"`,
      `"${stage?.name || task.stageId}"`,
      `"${task.priority.toUpperCase()}"`,
      `"${user?.name || 'Unassigned'}"`,
      task.estimatedHours,
      task.loggedHours,
      task.dueDate,
      task.updatedAt.split('T')[0]
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers native browser print with a clean, grid-lined print layout style
 */
export function printReportHTML(
  tasks: Task[],
  project: Project | null,
  users: User[],
  stages: WorkflowStage[],
  timeframeStr: string,
  templateSettings?: {
    reportTitle: string;
    companyName: string;
    accentColor: string;
    includeStatCards: boolean;
    includeDisciplineBreakdown: boolean;
    includeTaskDescription: boolean;
    footerText: string;
  }
) {
  const userMap = new Map(users.map(u => [u.id, u]));
  const stageMap = new Map(stages.map(s => [s.id, s]));
  
  const titleVal = templateSettings?.reportTitle || 'Engineering Design Report';
  const companyVal = templateSettings?.companyName || '';
  const accentColorVal = templateSettings?.accentColor || '#0f172a';
  const showStats = templateSettings?.includeStatCards !== false;
  const showBreakdown = templateSettings?.includeDisciplineBreakdown !== false;
  const showDesc = templateSettings?.includeTaskDescription === true;
  const footerVal = templateSettings?.footerText || 'Design Project Kanban Ledger. Generated automatically.';

  const totalTasks = tasks.length;
  const totalEst = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const totalLog = tasks.reduce((sum, t) => sum + t.loggedHours, 0);
  
  const overdueCount = tasks.filter(t => {
    if (t.stageId === 'approved') return false; 
    return new Date(t.dueDate) < new Date();
  }).length;

  const disciplines = {
    architecture: tasks.filter(t => t.type === 'architecture').length,
    structure: tasks.filter(t => t.type === 'structure').length,
    electric: tasks.filter(t => t.type === 'electric').length,
    mechanical: tasks.filter(t => t.type === 'mechanical').length,
    other: tasks.filter(t => t.type === 'other').length,
  };

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export the print-ready document PDF.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titleVal} - ${timeframeStr}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
          line-height: 1.5;
          padding: 40px;
          margin: 0;
        }
        .header {
          border-bottom: 2px solid ${accentColorVal};
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 5px 0;
          color: ${accentColorVal};
        }
        .subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .stat-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          background-color: #f8fafc;
        }
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 15px;
          border-bottom: 1px solid ${accentColorVal}80;
          padding-bottom: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        th, td {
          text-align: left;
          padding: 10px 12px;
          font-size: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 600;
        }
        .badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .badge-arch { background-color: #fee2e2; color: #991b1b; }
        .badge-struct { background-color: #ebf5ff; color: #1e429f; }
        .badge-elec { background-color: #fef3c7; color: #92400e; }
        .badge-mech { background-color: #eafaf1; color: #03543f; }
        .badge-other { background-color: #f3f4f6; color: #374151; }
        
        @media print {
          body { padding: 20px; }
          .stat-card { background-color: #fff; }
          thead { display: table-header-group; }
        }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 class="title">${titleVal}</h1>
            <p class="subtitle">Scope: ${project ? project.name + ' (' + project.code + ')' : 'All Active Projects'} | Period: ${timeframeStr} | Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          ${companyVal ? `<div style="font-weight: 700; font-size: 12px; text-transform: uppercase; color: ${accentColorVal}; border: 1.5px solid ${accentColorVal}; padding: 6px 12px; border-radius: 6px; letter-spacing: 0.5px; background: #fff;">${companyVal}</div>` : ''}
        </div>
      </div>

      ${showStats ? `
      <div class="grid">
        <div class="stat-card">
          <div class="stat-label">Total Design Tasks</div>
          <div class="stat-value">${totalTasks}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Estimated Hours</div>
          <div class="stat-value">${totalEst} hrs</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Logged Hours</div>
          <div class="stat-value">${totalLog} hrs</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Overdue Tasks</div>
          <div class="stat-value" style="color: ${overdueCount > 0 ? '#b91c1c' : '#0f172a'}">${overdueCount}</div>
        </div>
      </div>
      ` : ''}

      ${showBreakdown ? `
      <h2 class="section-title">Discipline Breakdown</h2>
      <div class="grid" style="grid-template-columns: repeat(5, 1fr); margin-bottom: 40px;">
        <div class="stat-card">
          <div class="stat-label">Architecture</div>
          <div class="stat-value">${disciplines.architecture}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Structure</div>
          <div class="stat-value">${disciplines.structure}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Electrical</div>
          <div class="stat-value">${disciplines.electric}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Mechanical</div>
          <div class="stat-value">${disciplines.mechanical}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Other Tasks</div>
          <div class="stat-value">${disciplines.other}</div>
        </div>
      </div>
      ` : ''}

      <h2 class="section-title">Active Task Registry</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 8%">ID</th>
            <th style="width: 25%">Task Title</th>
            <th style="width: 13%">Discipline</th>
            <th style="width: 14%">Stage</th>
            <th style="width: 15%">Assigned To</th>
            <th style="width: 8%">Est. Hrs</th>
            <th style="width: 8%">Log. Hrs</th>
            <th style="width: 9%">Due Date</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(t => {
            const user = t.assignedTo ? userMap.get(t.assignedTo) : undefined;
            const stage = stageMap.get(t.stageId);
            
            let badgeClass = 'badge-other';
            if (t.type === 'architecture') badgeClass = 'badge-arch';
            if (t.type === 'structure') badgeClass = 'badge-struct';
            if (t.type === 'electric') badgeClass = 'badge-elec';
            if (t.type === 'mechanical') badgeClass = 'badge-mech';

            return `
              <tr>
                <td style="font-family: monospace;">${t.id.slice(5, 10) || t.id}</td>
                <td>
                  <div style="font-weight: 500;">${t.title}</div>
                  ${showDesc && t.description ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${t.description.replace(/\n/g, '<br/>')}</div>` : ''}
                </td>
                <td><span class="badge ${badgeClass}">${t.type}</span></td>
                <td>${stage?.name || t.stageId}</td>
                <td>${user?.name || 'Unassigned'}</td>
                <td>${t.estimatedHours}</td>
                <td>${t.loggedHours}</td>
                <td style="color: ${!t.stageId.includes('approved') && new Date(t.dueDate) < new Date() ? '#b91c1c' : '#1e293b'}">${t.dueDate}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 50px; border-top: 1px dashed #e2e8f0; padding-top: 15px;">
        ${footerVal}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
