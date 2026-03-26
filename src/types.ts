export type TaskStatus = 'To-Do' | 'In Progress' | 'Done';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string
  status: TaskStatus;
  blockedBy?: string | null; // ID of another task
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TaskDraft extends Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'> {
  id?: string; // Optional for new tasks
}
