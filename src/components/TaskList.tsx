import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, X } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from './TaskItem';
import { TaskStatus } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { motion, AnimatePresence, Reorder } from 'motion/react';

interface TaskListProps {
  onNewTask: () => void;
  onEditTask: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ onNewTask, onEditTask }) => {
  const { tasks, reorderTasks } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            task.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, debouncedSearch, statusFilter]);

  const isDragEnabled = !searchQuery && statusFilter === 'All';

  return (
    <div className="mx-auto max-w-3xl w-full space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="To-Do">To-Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <button
            onClick={onNewTask}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            isDragEnabled ? (
              <Reorder.Group axis="y" values={tasks} onReorder={reorderTasks} className="space-y-4">
                {tasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    searchQuery={debouncedSearch}
                    onEdit={() => onEditTask(task.id)} 
                    isReorderable={true}
                  />
                ))}
              </Reorder.Group>
            ) : (
              filteredTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  searchQuery={debouncedSearch}
                  onEdit={() => onEditTask(task.id)} 
                  isReorderable={false}
                />
              ))
            )
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 bg-white border border-slate-200 border-dashed rounded-xl"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No tasks found</h3>
              <p className="text-slate-500">
                {tasks.length === 0 
                  ? "You haven't created any tasks yet." 
                  : "Try adjusting your search or filters."}
              </p>
              {tasks.length === 0 && (
                <button
                  onClick={onNewTask}
                  className="mt-4 text-blue-600 font-medium hover:text-blue-700"
                >
                  Create your first task
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
