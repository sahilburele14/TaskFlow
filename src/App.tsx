import React, { useState } from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { TaskGraph } from './components/TaskGraph';
import { AIAssistantModal } from './components/AIAssistantModal';
import { CheckSquare, List, Network, Sparkles, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReactFlowProvider } from '@xyflow/react';
import { Toaster } from 'sonner';
import { signInWithGoogle, logout } from './firebase';

function AppContent() {
  const [view, setView] = useState<'list' | 'graph' | 'form'>('list');
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>(undefined);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const { user, isAuthReady } = useTasks();

  const handleNewTask = () => {
    setEditingTaskId(undefined);
    setView('form');
  };

  const handleEditTask = (id: string) => {
    setEditingTaskId(id);
    setView('form');
  };

  const handleBack = () => {
    setView('list');
    setEditingTaskId(undefined);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <CheckSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">TaskFlow</h1>
          <p className="text-slate-500 mb-8">Sign in to manage your tasks, track dependencies, and stay productive.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" richColors />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <CheckSquare className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">TaskFlow</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {view !== 'form' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setView('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => setView('graph')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    view === 'graph' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Network className="h-4 w-4" />
                  Graph
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="hidden sm:block text-sm text-slate-600">
                {user.email}
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Your Tasks</h2>
                  <p className="mt-2 text-slate-500">Manage your work, track dependencies, and stay productive.</p>
                </div>
                <button
                  onClick={() => setIsAIAssistantOpen(true)}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium shadow-sm border border-indigo-200"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Breakdown
                </button>
              </div>
              <TaskList onNewTask={handleNewTask} onEditTask={handleEditTask} />
            </motion.div>
          ) : view === 'graph' ? (
            <motion.div
              key="graph"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dependency Graph</h2>
                  <p className="mt-2 text-slate-500">Visualize task relationships and blocking paths.</p>
                </div>
                <button
                  onClick={handleNewTask}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow"
                >
                  <CheckSquare className="h-4 w-4" />
                  New Task
                </button>
              </div>
              <ReactFlowProvider>
                <TaskGraph onEditTask={handleEditTask} />
              </ReactFlowProvider>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <TaskForm onBack={handleBack} taskId={editingTaskId} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isAIAssistantOpen && (
            <AIAssistantModal
              isOpen={isAIAssistantOpen}
              onClose={() => setIsAIAssistantOpen(false)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}
