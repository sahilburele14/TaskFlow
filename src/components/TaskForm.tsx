import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TaskDraft, TaskStatus } from '../types';
import { format } from 'date-fns';

interface TaskFormProps {
  onBack: () => void;
  taskId?: string; // If provided, we are editing this task
}

export const TaskForm: React.FC<TaskFormProps> = ({ onBack, taskId }) => {
  const { tasks, draft, setDraft, addTask, updateTask, getTaskById, isLoading } = useTasks();
  
  const [formData, setFormData] = useState<TaskDraft>({
    title: '',
    description: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'To-Do',
    blockedBy: null,
  });

  const [error, setError] = useState('');

  // Initialize form data
  useEffect(() => {
    if (taskId) {
      // Editing existing task
      const existingTask = getTaskById(taskId);
      if (existingTask) {
        // If there's a draft for this specific task, use it, otherwise use the task data
        if (draft && draft.id === taskId) {
          setFormData(draft);
        } else {
          setFormData({
            id: existingTask.id,
            title: existingTask.title,
            description: existingTask.description,
            dueDate: format(new Date(existingTask.dueDate), 'yyyy-MM-dd'),
            status: existingTask.status,
            blockedBy: existingTask.blockedBy,
          });
        }
      }
    } else {
      // Creating new task
      if (draft && !draft.id) {
        setFormData(draft);
      }
    }
  }, [taskId, getTaskById, draft]);

  // Save draft whenever form data changes (debounced or on unmount)
  useEffect(() => {
    // Only save draft if there are actual changes from empty state
    if (formData.title || formData.description) {
      const timer = setTimeout(() => {
        setDraft(formData);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData, setDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.dueDate) {
      setError('Due date is required');
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    if (formData.dueDate < today) {
      setError('Due date cannot be in the past');
      return;
    }

    try {
      if (taskId) {
        await updateTask(taskId, {
          ...formData,
          dueDate: new Date(formData.dueDate).toISOString(),
        });
      } else {
        await addTask({
          title: formData.title,
          description: formData.description,
          dueDate: new Date(formData.dueDate).toISOString(),
          status: formData.status,
          blockedBy: formData.blockedBy,
        });
      }
      onBack();
    } catch (err) {
      setError('An error occurred while saving the task.');
    }
  };

  const wouldCauseCircularDependency = (potentialBlockerId: string) => {
    if (!taskId) return false;
    let currentId: string | null | undefined = potentialBlockerId;
    while (currentId) {
      if (currentId === taskId) return true;
      const task = getTaskById(currentId);
      currentId = task?.blockedBy;
    }
    return false;
  };

  const availableTasksToBlock = tasks.filter(t => t.id !== taskId && !wouldCauseCircularDependency(t.id));

  return (
    <div className="mx-auto max-w-2xl w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">
            {taskId ? 'Edit Task' : 'Create New Task'}
          </h2>
        </div>
        {draft && (
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            Draft saved
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="E.g., Update landing page copy"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
              placeholder="Add more details about this task..."
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                disabled={isLoading}
              >
                <option value="To-Do">To-Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="blockedBy" className="block text-sm font-medium text-slate-700 mb-1">
              Blocked By (Optional)
            </label>
            <select
              id="blockedBy"
              value={formData.blockedBy || ''}
              onChange={(e) => setFormData({ ...formData, blockedBy: e.target.value || null })}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              disabled={isLoading}
            >
              <option value="">None</option>
              {availableTasksToBlock.map(task => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              This task will be greyed out until the blocking task is marked as "Done".
            </p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Task
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
