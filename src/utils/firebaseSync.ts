import { doc, setDoc, deleteDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { User, Project, WorkflowStage, Task, Comment, Notification, Label, TeamActivity, Message, TeamConversation, VisualSettings, ReportTemplateSettings, FlowPermissions } from '../types';
import { INITIAL_USERS, INITIAL_WORKFLOW_STAGES, INITIAL_LABELS } from '../data/mockData';

// --- Users ---
export async function dbSaveUser(user: User) {
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
  }
}

export async function dbDeleteUser(userId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
  }
}

// --- Projects ---
export async function dbSaveProject(project: Project) {
  try {
    await setDoc(doc(db, 'projects', project.id), project);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `projects/${project.id}`);
  }
}

export async function dbDeleteProject(projectId: string) {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
  }
}

// --- Workflow Stages ---
export async function dbSaveStage(stage: WorkflowStage) {
  try {
    await setDoc(doc(db, 'stages', stage.id), stage);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `stages/${stage.id}`);
  }
}

// --- Tasks ---
export async function dbSaveTask(task: Task) {
  try {
    await setDoc(doc(db, 'tasks', task.id), task);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `tasks/${task.id}`);
  }
}

export async function dbDeleteTask(taskId: string) {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
  }
}

// --- Comments ---
export async function dbSaveComment(comment: Comment) {
  try {
    await setDoc(doc(db, 'comments', comment.id), comment);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `comments/${comment.id}`);
  }
}

export async function dbDeleteComment(commentId: string) {
  try {
    await deleteDoc(doc(db, 'comments', commentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
  }
}

// --- Notifications ---
export async function dbSaveNotification(notification: Notification) {
  try {
    await setDoc(doc(db, 'notifications', notification.id), notification);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `notifications/${notification.id}`);
  }
}

export async function dbDeleteNotification(notificationId: string) {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `notifications/${notificationId}`);
  }
}

// --- Activities ---
export async function dbSaveActivity(activity: TeamActivity) {
  try {
    await setDoc(doc(db, 'activities', activity.id), activity);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `activities/${activity.id}`);
  }
}

// --- Labels ---
export async function dbSaveLabel(label: Label) {
  try {
    await setDoc(doc(db, 'labels', label.id), label);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `labels/${label.id}`);
  }
}

// --- Messages ---
export async function dbSaveMessage(message: Message) {
  try {
    await setDoc(doc(db, 'messages', message.id), message);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `messages/${message.id}`);
  }
}

export async function dbDeleteMessage(messageId: string) {
  try {
    await deleteDoc(doc(db, 'messages', messageId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `messages/${messageId}`);
  }
}

// --- Conversations ---
export async function dbSaveConversation(conversation: TeamConversation) {
  try {
    await setDoc(doc(db, 'teamConversations', conversation.id), conversation);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `teamConversations/${conversation.id}`);
  }
}

export async function dbDeleteConversation(conversationId: string) {
  try {
    await deleteDoc(doc(db, 'teamConversations', conversationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `teamConversations/${conversationId}`);
  }
}

// --- Global Settings Documents ---
export async function dbSaveVisualSettings(settings: VisualSettings) {
  try {
    await setDoc(doc(db, 'visualSettings', 'default'), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'visualSettings/default');
  }
}

export async function dbSaveReportTemplateSettings(settings: ReportTemplateSettings) {
  try {
    await setDoc(doc(db, 'reportTemplateSettings', 'default'), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'reportTemplateSettings/default');
  }
}

export async function dbSaveFlowPermissions(permissions: FlowPermissions) {
  try {
    await setDoc(doc(db, 'flowPermissions', 'default'), permissions);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'flowPermissions/default');
  }
}

// --- Seeding helper ---
export async function dbSeedInitialDataIfNeeded() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log('Seeding initial users...');
      const batch = writeBatch(db);
      INITIAL_USERS.forEach(user => {
        batch.set(doc(db, 'users', user.id), user);
      });
      await batch.commit();
    }

    const stagesSnap = await getDocs(collection(db, 'stages'));
    if (stagesSnap.empty) {
      console.log('Seeding initial stages...');
      const batch = writeBatch(db);
      INITIAL_WORKFLOW_STAGES.forEach(stage => {
        batch.set(doc(db, 'stages', stage.id), stage);
      });
      await batch.commit();
    }

    const labelsSnap = await getDocs(collection(db, 'labels'));
    if (labelsSnap.empty) {
      console.log('Seeding initial labels...');
      const batch = writeBatch(db);
      INITIAL_LABELS.forEach(label => {
        batch.set(doc(db, 'labels', label.id), label);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to seed initial Firestore data:', err);
  }
}
