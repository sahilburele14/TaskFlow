import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Task, TaskDraft } from '../types';
import { differenceInHours, isFuture } from 'date-fns';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface TaskContextType {
  tasks: Task[];
  draft: TaskDraft | null;
  isLoading: boolean;
  user: User | null;
  isAuthReady: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setDraft: (draft: TaskDraft | null) => void;
  getTaskById: (id: string) => Task | undefined;
  isTaskBlocked: (task: Task) => boolean;
  reorderTasks: (newTasks: Task[]) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const DRAFT_STORAGE_KEY = 'taskflow_draft';

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraftState] = useState<TaskDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (storedDraft) {
      try {
        setDraftState(JSON.parse(storedDraft));
      } catch (e) {
        console.error('Failed to parse draft from local storage', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      setTasks([]);
      return;
    }

    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });
      // Sort by order if available, else by createdAt
      tasksData.sort((a, b) => {
        const orderA = (a as any).order ?? 0;
        const orderB = (b as any).order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setTasks(tasksData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  // Notification logic for tasks due soon
  useEffect(() => {
    if (tasks.length === 0) return;

    const checkDueTasks = () => {
      const notifiedTasksStr = localStorage.getItem('taskflow_notified_tasks') || '[]';
      let notifiedTasks: string[] = [];
      try {
        notifiedTasks = JSON.parse(notifiedTasksStr);
      } catch (e) {
        notifiedTasks = [];
      }

      let newNotified = false;

      tasks.forEach(task => {
        if (task.status === 'Done') return;
        if (notifiedTasks.includes(task.id)) return;

        const dueDate = new Date(task.dueDate);
        
        if (isFuture(dueDate)) {
          const hoursUntilDue = differenceInHours(dueDate, new Date());
          if (hoursUntilDue <= 24 && hoursUntilDue >= 0) {
            toast.warning(`Task Due Soon: ${task.title}`, {
              description: `Due in ${hoursUntilDue} hours.`,
              duration: 10000,
            });
            notifiedTasks.push(task.id);
            newNotified = true;
          }
        } else {
          toast.error(`Task Overdue: ${task.title}`, {
            description: `Was due on ${dueDate.toLocaleDateString()}`,
            duration: 10000,
          });
          notifiedTasks.push(task.id);
          newNotified = true;
        }
      });

      if (newNotified) {
        localStorage.setItem('taskflow_notified_tasks', JSON.stringify(notifiedTasks));
      }
    };

    checkDueTasks();
    const interval = setInterval(checkDueTasks, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  const setDraft = useCallback((newDraft: TaskDraft | null) => {
    setDraftState(newDraft);
    if (newDraft) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(newDraft));
    } else {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) {
      toast.error('You must be logged in to add tasks.');
      return;
    }
    setIsLoading(true);
    try {
      const newDocRef = doc(collection(db, 'tasks'));
      const newTask: Task = {
        ...taskData,
        id: newDocRef.id,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(newDocRef, newTask);
      setDraft(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      if (draft?.id === id) {
        setDraft(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      // First, find any tasks blocked by this one and remove the block
      const blockedTasks = tasks.filter(t => t.blockedBy === id);
      const batch = writeBatch(db);
      
      blockedTasks.forEach(task => {
        const ref = doc(db, 'tasks', task.id);
        batch.update(ref, { blockedBy: null, updatedAt: new Date().toISOString() });
      });

      const taskRef = doc(db, 'tasks', id);
      batch.delete(taskRef);
      
      await batch.commit();

      if (draft?.id === id) {
        setDraft(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const getTaskById = useCallback((id: string) => {
    return tasks.find(t => t.id === id);
  }, [tasks]);

  const isTaskBlocked = useCallback((task: Task) => {
    if (!task.blockedBy) return false;
    const blockingTask = getTaskById(task.blockedBy);
    return blockingTask ? blockingTask.status !== 'Done' : false;
  }, [getTaskById]);

  const reorderTasks = async (newTasks: Task[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      newTasks.forEach((task, index) => {
        const ref = doc(db, 'tasks', task.id);
        batch.update(ref, { order: index, updatedAt: new Date().toISOString() });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'tasks');
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        draft,
        isLoading,
        user,
        isAuthReady,
        addTask,
        updateTask,
        deleteTask,
        setDraft,
        getTaskById,
        isTaskBlocked,
        reorderTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
