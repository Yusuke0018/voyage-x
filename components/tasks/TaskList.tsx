'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, X } from 'lucide-react';
import type { Task } from '@/lib/types';

interface TaskListProps {
  milestoneId: string;
  tasks: Task[];
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function TaskList({ milestoneId, tasks, onCreateTask, onUpdateTaskStatus, onRefresh }: TaskListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    await onCreateTask({
      milestoneId,
      title: newTaskTitle,
      status: 'todo',
      priority: newTaskPriority,
    });
    
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setIsAdding(false);
    await onRefresh();
  };

  const handleStatusChange = async (taskId: string, currentStatus: Task['status']) => {
    const statusFlow: Record<Task['status'], Task['status']> = {
      'todo': 'in_progress',
      'in_progress': 'done',
      'done': 'todo',
      'postponed': 'todo'
    };
    
    await onUpdateTaskStatus(taskId, statusFlow[currentStatus]);
    await onRefresh();
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'postponed':
        return <Circle className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    // ステータス優先度: in_progress > todo > postponed > done
    const statusOrder = { 'in_progress': 0, 'todo': 1, 'postponed': 2, 'done': 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // 優先度: high > medium > low
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">タスク一覧</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          タスクを追加
        </Button>
      </div>

      {isAdding && (
        <Card className="p-3">
          <div className="flex gap-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="新しいタスクを入力"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              autoFocus
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
              className="px-3 py-2 border rounded-md"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
            <Button onClick={handleAddTask} size="sm">
              追加
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false);
                setNewTaskTitle('');
              }}
              size="sm"
              variant="ghost"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {sortedTasks.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          タスクがありません
        </Card>
      ) : (
        sortedTasks.map(task => (
          <Card
            key={task.id}
            className={`p-3 transition-opacity ${task.status === 'done' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={() => handleStatusChange(task.id, task.status)}
              >
                {getStatusIcon(task.status)}
              </Button>
              
              <div className="flex-1">
                <div className={`${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </div>
                {task.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {task.description}
                  </div>
                )}
              </div>
              
              <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
              </span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}