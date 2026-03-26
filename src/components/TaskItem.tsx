import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle2, AlertCircle, Trash2, Edit2, GripVertical, Sparkles, Loader2, Info } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { useTasks } from '../context/TaskContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { getTaskTips } from "../services/geminiService";
import Markdown from 'react-markdown';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  searchQuery?: string;
  isReorderable?: boolean;
}

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; bg: string }> = {
  'To-Do': { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' },
  'In Progress': { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  'Done': { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit, searchQuery = '', isReorderable = false }) => {
  const { isTaskBlocked, deleteTask, getTaskById } = useTasks();
  const isBlocked = isTaskBlocked(task);
  const StatusIcon = statusConfig[task.status].icon;
  const blockingTask = task.blockedBy ? getTaskById(task.blockedBy) : null;
  const controls = useDragControls();
  const [isGettingTips, setIsGettingTips] = useState(false);
  const [tips, setTips] = useState<string | null>(null);

  const handleGetTips = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tips) {
      setTips(null);
      return;
    }
    
    setIsGettingTips(true);
    try {
      const result = await getTaskTips(task.title, task.description);
      setTips(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGettingTips(false);
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <mark key={i} className="bg-amber-300 text-amber-950 font-medium rounded-sm px-0.5">{part}</mark> : part
    );
  };

  const cardClasses = cn(
    'group relative flex flex-col gap-3 rounded-xl border p-5 transition-colors duration-500 shadow-sm',
    isBlocked
      ? 'border-slate-200 bg-slate-50 opacity-60 grayscale'
      : task.status === 'Done'
      ? 'border-emerald-100 bg-emerald-50/40'
      : 'border-slate-200 bg-white'
  );

  const hoverEffect = isBlocked ? {} : { 
    scale: 1.02, 
    y: -2,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)" 
  };

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        {isReorderable && (
          <div
            className="cursor-grab active:cursor-grabbing mt-1 text-slate-400 hover:text-slate-600 touch-none"
            onPointerDown={(e) => controls.start(e)}
          >
            <GripVertical className="h-5 w-5" />
          </div>
        )}
        <motion.div 
          className="flex-1 space-y-1"
          animate={{ 
            opacity: task.status === 'Done' ? 0.4 : 1,
            x: task.status === 'Done' ? 4 : 0
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'font-semibold text-slate-900 line-clamp-1 transition-all duration-500',
                task.status === 'Done' && 'text-slate-500 line-through'
              )}
            >
              {highlightText(task.title, searchQuery)}
            </h3>
            <AnimatePresence>
              {task.status === 'Done' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.3, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.3, rotate: 90 }}
                  transition={{ type: "spring", bounce: 0.6, duration: 0.6 }}
                  className="bg-emerald-100 p-0.5 rounded-full"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-sm text-slate-500 line-clamp-2 transition-all duration-500">
            {highlightText(task.description, searchQuery)}
          </p>
        </motion.div>
        
        <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleGetTips}
            disabled={isBlocked || isGettingTips}
            className={cn(
              "rounded-lg p-2 transition-colors disabled:opacity-50",
              tips ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
            )}
            aria-label="Get AI Tips"
            title="Get AI Tips"
          >
            {isGettingTips ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onEdit(task)}
            disabled={isBlocked}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Edit task"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {tips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 mt-2 text-sm text-indigo-900">
              <div className="flex items-center gap-2 mb-2 font-medium text-indigo-700">
                <Sparkles className="h-4 w-4" />
                AI Tips & Info
              </div>
              <div className="prose prose-sm prose-indigo max-w-none">
                <div className="markdown-body">
                  <Markdown>{tips}</Markdown>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium',
            statusConfig[task.status].bg,
            statusConfig[task.status].color
          )}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {task.status}
        </div>

      <div className="flex items-center gap-1.5 text-slate-500">
        <Calendar className="h-3.5 w-3.5" />
        {format(new Date(task.dueDate), 'MMM d, yyyy')}
      </div>

      {isBlocked && blockingTask && (
        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-600">
          <AlertCircle className="h-3.5 w-3.5" />
          Blocked by: {blockingTask.title}
        </div>
      )}
    </div>
    </>
  );

  if (isReorderable) {
    return (
      <Reorder.Item
        value={task}
        dragListener={false}
        dragControls={controls}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={hoverEffect}
        className={cardClasses}
      >
        {content}
      </Reorder.Item>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={hoverEffect}
      className={cardClasses}
    >
      {content}
    </motion.div>
  );
};
