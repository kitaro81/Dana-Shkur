import { Project, Task, User, WorkflowStage, Comment, Label, TeamActivity, Message, TeamConversation, Notification } from '../types';

export interface AppSyncData {
  projects: Project[];
  tasks: Task[];
  users: User[];
  comments: Comment[];
  activities: TeamActivity[];
  stages: WorkflowStage[];
  labels: Label[];
  messages: Message[];
  teamConversations: TeamConversation[];
}

const TABS = [
  'Projects',
  'Tasks',
  'Users',
  'Comments',
  'Activities',
  'Stages',
  'Labels',
  'Messages',
  'Channels'
];

// Helper to convert array of objects into spreadsheet row arrays
function serializeRows<T extends Record<string, any>>(headers: string[], items: T[]): any[][] {
  const result: any[][] = [headers];
  
  for (const item of items) {
    const row = headers.map(header => {
      const val = item[header];
      if (val === undefined || val === null) {
        return '';
      }
      if (typeof val === 'object') {
        return JSON.stringify(val);
      }
      return val;
    });
    result.push(row);
  }
  
  return result;
}

// Helper to convert spreadsheet rows back into objects
function deserializeRows<T>(rows: any[][]): T[] {
  if (!rows || rows.length <= 1) return [];
  const headers = rows[0] as string[];
  const dataRows = rows.slice(1);

  return dataRows.map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      let val = row[index];
      if (val === undefined || val === null) {
        val = '';
      }
      
      // Parse stringified JSON arrays/objects
      const strVal = String(val).trim();
      if ((strVal.startsWith('[') && strVal.endsWith(']')) || (strVal.startsWith('{') && strVal.endsWith('}'))) {
        try {
          val = JSON.parse(strVal);
        } catch (e) {
          // fallback to original string
        }
      } else if (strVal === 'true') {
        val = true;
      } else if (strVal === 'false') {
        val = false;
      } else if (strVal !== '' && !isNaN(Number(strVal)) && header !== 'id' && header !== 'code' && !header.endsWith('Id')) {
        val = Number(strVal);
      }
      
      obj[header] = val;
    });
    return obj as T;
  });
}

// Create a spreadsheet with all sheets/tabs
export async function createNewSpreadsheet(accessToken: string, title: string): Promise<string> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      },
      sheets: TABS.map(tab => ({
        properties: {
          title: tab
        }
      }))
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create spreadsheet: ${errorText}`);
  }

  const result = await response.json();
  return result.spreadsheetId;
}

// List all spreadsheets from Google Drive that match mimeType
export async function findSpreadsheets(accessToken: string): Promise<{ id: string; name: string }[]> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'+and+trashed=false&fields=files(id,name)&orderBy=modifiedTime+desc`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to find spreadsheets: ${errorText}`);
  }

  const result = await response.json();
  return result.files || [];
}

// Push all state data into Google Sheets in a single batch update
export async function pushToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  data: AppSyncData
): Promise<void> {
  const headersMap: Record<string, string[]> = {
    'Projects': ['id', 'name', 'code', 'description', 'location', 'status', 'createdAt', 'archived', 'disciplines', 'assignedUserIds'],
    'Tasks': ['id', 'projectId', 'title', 'description', 'type', 'stageId', 'priority', 'assignedTo', 'dueDate', 'createdAt', 'updatedAt', 'archived', 'labelIds', 'dependencies', 'quickNote', 'assignedUserIds', 'disciplines', 'storyPoints', 'tShirtSize'],
    'Users': ['id', 'name', 'email', 'password', 'role', 'avatarUrl', 'joinedAt', 'discipline', 'deactivated', 'phoneNumber'],
    'Comments': ['id', 'taskId', 'userId', 'userName', 'text', 'createdAt'],
    'Activities': ['id', 'type', 'userId', 'userName', 'userAvatar', 'title', 'description', 'projectId', 'projectName', 'taskId', 'taskTitle', 'createdAt'],
    'Stages': ['id', 'name', 'color', 'order'],
    'Labels': ['id', 'name', 'color'],
    'Messages': ['id', 'senderId', 'receiverId', 'text', 'createdAt', 'read'],
    'Channels': ['id', 'name', 'description', 'createdAt', 'createdBy']
  };

  const serializedData = [
    { range: 'Projects!A1', values: serializeRows(headersMap['Projects'], data.projects) },
    { range: 'Tasks!A1', values: serializeRows(headersMap['Tasks'], data.tasks) },
    { range: 'Users!A1', values: serializeRows(headersMap['Users'], data.users) },
    { range: 'Comments!A1', values: serializeRows(headersMap['Comments'], data.comments) },
    { range: 'Activities!A1', values: serializeRows(headersMap['Activities'], data.activities) },
    { range: 'Stages!A1', values: serializeRows(headersMap['Stages'], data.stages) },
    { range: 'Labels!A1', values: serializeRows(headersMap['Labels'], data.labels) },
    { range: 'Messages!A1', values: serializeRows(headersMap['Messages'], data.messages) },
    { range: 'Channels!A1', values: serializeRows(headersMap['Channels'], data.teamConversations) }
  ];

  // We want to clear the cells first to prevent leftover rows from previous smaller runs
  // A simple way is to clear ranges, or just overwrite since headers are static.
  // Clearing is safer. Let's send a batchClear request first.
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ranges: TABS.map(tab => `${tab}!A1:Z5000`)
    })
  });

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: serializedData
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to push data to Google Sheets: ${errorText}`);
  }
}

// Pull and parse all data from Google Sheets in a single batch get
export async function pullFromGoogleSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<AppSyncData> {
  const rangesQuery = TABS.map(tab => `ranges=${tab}!A1:Z5000`).join('&');
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to pull data from Google Sheets: ${errorText}`);
  }

  const result = await response.json();
  const valueRanges = result.valueRanges || [];

  const tabDataMap: Record<string, any[][]> = {};
  valueRanges.forEach((vr: any) => {
    // Range comes as "Projects!A1:Z5000"
    const tabName = vr.range.split('!')[0].replace(/'/g, ''); // strip single quotes if spreadsheet API returns 'Sheet Name'!A1
    tabDataMap[tabName] = vr.values || [];
  });

  return {
    projects: deserializeRows<Project>(tabDataMap['Projects']),
    tasks: deserializeRows<Task>(tabDataMap['Tasks']),
    users: deserializeRows<User>(tabDataMap['Users']),
    comments: deserializeRows<Comment>(tabDataMap['Comments']),
    activities: deserializeRows<TeamActivity>(tabDataMap['Activities']),
    stages: deserializeRows<WorkflowStage>(tabDataMap['Stages']),
    labels: deserializeRows<Label>(tabDataMap['Labels']),
    messages: deserializeRows<Message>(tabDataMap['Messages']),
    teamConversations: deserializeRows<TeamConversation>(tabDataMap['Channels'])
  };
}
