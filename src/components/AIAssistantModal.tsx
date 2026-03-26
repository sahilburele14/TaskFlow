import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Loader2, PlusCircle, Check } from 'lucide-react';
import { generateTasksFromPrompt } from "../services/geminiService";

import { useTasks } from '../context/TaskContext';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [addedTasks, setAddedTasks] = useState<Set<number>>(new Set());
  const { addTask } = useTasks();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedTasks([]);
    setAddedTasks(new Set());
    
    try {
      const tasks = await generateTasksFromPrompt(prompt);
      setGeneratedTasks(tasks);
    } catch (error) {
      console.error(error);
      // Handle error (could use toast here)
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTask = async (task: GeneratedTask, index: number) => {
    if (addedTasks.has(index)) return;

    // Add task to context
    await addTask({
      title: task.title,
      description: task.description,
      status: 'To-Do',
      dueDate: new Date().toISOString(),
    });

    setAddedTasks(prev => new Set(prev).add(index));
  };

  const handleAddAll = async () => {
    for (let i = 0; i < generatedTasks.length; i++) {
      if (!addedTasks.has(i)) {
        await handleAddTask(generatedTasks[i], i);
      }
    }
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-200">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">AI Task Breakdown</h2>
          </div>
          <p className="text-slate-600">
            Describe a big goal or project, and Gemini will automatically break it down into actionable tasks.
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <form onSubmit={handleGenerate} className="flex gap-3 mb-8">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Plan a 5-day trip to Tokyo..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {generatedTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Suggested Tasks</h3>
                  <button
                    onClick={handleAddAll}
                    disabled={addedTasks.size === generatedTasks.length}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                  >
                    Add All to List
                  </button>
                </div>
                
                <div className="space-y-3">
                  {generatedTasks.map((task, index) => {
                    const isAdded = addedTasks.has(index);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-xl border transition-colors flex items-start gap-4 ${
                          isAdded ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex-1">
                          <h4 className={`font-medium ${isAdded ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {task.title}
                          </h4>
                          <p className={`text-sm mt-1 ${isAdded ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {task.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddTask(task, index)}
                          disabled={isAdded}
                          className={`shrink-0 p-2 rounded-lg transition-colors ${
                            isAdded 
                              ? 'text-emerald-600 bg-emerald-100' 
                              : 'text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          {isAdded ? <Check className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
