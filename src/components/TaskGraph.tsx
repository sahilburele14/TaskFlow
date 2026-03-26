import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useTasks } from '../context/TaskContext';
import { Task, TaskStatus } from '../types';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle2, AlertCircle, X, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; bg: string }> = {
  'To-Do': { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' },
  'In Progress': { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  'Done': { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
};

// Custom Node Component
const TaskNode = ({ data }: NodeProps) => {
  const task = data.task as Task;
  const isHighlighted = data.isHighlighted as boolean;
  const isDimmed = data.isDimmed as boolean;
  const isSelected = data.isSelected as boolean;
  const StatusIcon = statusConfig[task.status].icon;

  return (
    <div
      className={cn(
        'relative w-64 rounded-xl border p-4 bg-white shadow-sm transition-all duration-300',
        isSelected ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' : 'border-slate-200',
        isDimmed ? 'opacity-40 grayscale' : 'opacity-100',
        isHighlighted && !isSelected ? 'border-blue-300 shadow-md' : ''
      )}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-400" />
      
      <div className="flex flex-col gap-2">
        <h3 className={cn("font-semibold text-slate-900 line-clamp-2 text-sm", task.status === 'Done' && 'line-through text-slate-500')}>
          {task.title}
        </h3>
        
        <div className="flex items-center justify-between mt-1">
          <div className={cn('flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', statusConfig[task.status].bg, statusConfig[task.status].color)}>
            <StatusIcon className="h-3 w-3" />
            {task.status}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-400" />
    </div>
  );
};

const nodeTypes = {
  taskNode: TaskNode,
};

const nodeWidth = 260;
const nodeHeight = 100;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 60 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

interface TaskGraphProps {
  onEditTask: (id: string) => void;
}

export const TaskGraph: React.FC<TaskGraphProps> = ({ onEditTask }) => {
  const { tasks, getTaskById } = useTasks();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Calculate paths for highlighting
  const getConnectedTaskIds = useCallback((taskId: string) => {
    const connected = new Set<string>();
    connected.add(taskId);

    // Find all upstream (tasks that block this one)
    const findUpstream = (id: string) => {
      const task = tasks.find(t => t.id === id);
      if (task?.blockedBy && !connected.has(task.blockedBy)) {
        connected.add(task.blockedBy);
        findUpstream(task.blockedBy);
      }
    };

    // Find all downstream (tasks blocked by this one)
    const findDownstream = (id: string) => {
      const blockedTasks = tasks.filter(t => t.blockedBy === id);
      blockedTasks.forEach(t => {
        if (!connected.has(t.id)) {
          connected.add(t.id);
          findDownstream(t.id);
        }
      });
    };

    findUpstream(taskId);
    findDownstream(taskId);

    return connected;
  }, [tasks]);

  useEffect(() => {
    const connectedIds = selectedTaskId ? getConnectedTaskIds(selectedTaskId) : new Set<string>();

    const initialNodes: Node[] = tasks.map((task) => {
      const isSelected = task.id === selectedTaskId;
      const isHighlighted = connectedIds.has(task.id);
      const isDimmed = selectedTaskId !== null && !isHighlighted;

      return {
        id: task.id,
        type: 'taskNode',
        position: { x: 0, y: 0 }, // Will be set by dagre
        data: { task, isSelected, isHighlighted, isDimmed },
      };
    });

    const initialEdges: Edge[] = tasks
      .filter((task) => task.blockedBy)
      .map((task) => {
        const isHighlighted = connectedIds.has(task.id) && connectedIds.has(task.blockedBy!);
        const isDimmed = selectedTaskId !== null && !isHighlighted;

        return {
          id: `e-${task.blockedBy}-${task.id}`,
          source: task.blockedBy!,
          target: task.id,
          animated: isHighlighted,
          style: {
            strokeWidth: isHighlighted ? 3 : 2,
            stroke: isHighlighted ? '#3b82f6' : '#cbd5e1',
            opacity: isDimmed ? 0.3 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isHighlighted ? '#3b82f6' : '#cbd5e1',
          },
        };
      });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [tasks, selectedTaskId, getConnectedTaskIds, setNodes, setEdges]);

  const onNodeClick = useCallback((_, node: Node) => {
    setSelectedTaskId(node.id === selectedTaskId ? null : node.id);
  }, [selectedTaskId]);

  const onPaneClick = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;
  const blockingTask = selectedTask?.blockedBy ? getTaskById(selectedTask.blockedBy) : null;

  return (
    <div className="relative w-full h-[600px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex">
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background color="#e2e8f0" gap={16} />
          <Controls className="bg-white border-slate-200 shadow-sm rounded-lg" />
          <MiniMap 
            nodeColor={(n) => {
              if (n.data?.isSelected) return '#3b82f6';
              if (n.data?.isHighlighted) return '#93c5fd';
              return '#e2e8f0';
            }}
            maskColor="rgba(248, 250, 252, 0.7)"
            className="bg-white border-slate-200 shadow-sm rounded-lg"
          />
        </ReactFlow>
      </div>

      {/* Side Panel for Selected Task */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-slate-200 bg-slate-50 overflow-hidden flex flex-col h-full"
          >
            <div className="p-5 flex-1 overflow-y-auto w-[320px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900">Task Details</h3>
                <button 
                  onClick={() => setSelectedTaskId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 leading-tight mb-2">
                    {selectedTask.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', statusConfig[selectedTask.status].bg, statusConfig[selectedTask.status].color)}>
                      {React.createElement(statusConfig[selectedTask.status].icon, { className: "h-3.5 w-3.5" })}
                      {selectedTask.status}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(selectedTask.dueDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h5>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedTask.description || <span className="text-slate-400 italic">No description provided.</span>}
                    </p>
                  </div>
                </div>

                {blockingTask && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <h5 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Blocked By
                    </h5>
                    <p className="text-sm font-medium text-amber-900">
                      {blockingTask.title}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Status: {blockingTask.status}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-200 bg-white w-[320px]">
              <button
                onClick={() => onEditTask(selectedTask.id)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <Edit2 className="h-4 w-4" />
                Edit Task
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
