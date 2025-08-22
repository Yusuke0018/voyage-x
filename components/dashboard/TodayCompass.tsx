'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import type { Task, Goal, Milestone } from '@/lib/types';

export function TodayCompass() {
  const { isReady, getGoals, getMilestonesByGoal, getTasksByMilestone, updateTaskStatus } = useDatabase();
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady) {
      loadTodayTasks();
    }
  }, [isReady]);

  const loadTodayTasks = async () => {
    setLoading(true);
    try {
      const goals = await getGoals();
      const allTasks: Task[] = [];
      
      // すべての目標からタスクを収集
      for (const goal of goals) {
        const milestones = await getMilestonesByGoal(goal.id);
        for (const milestone of milestones) {
          if (!milestone.completed) {
            const tasks = await getTasksByMilestone(milestone.id);
            allTasks.push(...tasks);
          }
        }
      }
      
      // 優先度の高い未完了タスクを3つ選択
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      const statusOrder = { 'in_progress': 0, 'todo': 1, 'postponed': 2, 'done': 3 };
      
      const sortedTasks = allTasks
        .filter(task => task.status !== 'done')
        .sort((a, b) => {
          const statusDiff = statusOrder[a.status] - statusOrder[b.status];
          if (statusDiff !== 0) return statusDiff;
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, 3);
      
      setTodayTasks(sortedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    const task = todayTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTaskStatus(taskId, newStatus);
    await loadTodayTasks();
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Circle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Circle className="w-4 h-4 text-green-500" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        今日の重要タスク
      </div>
      
      {todayTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          今日のタスクはありません
        </div>
      ) : (
        <div className="space-y-2">
          {todayTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={() => toggleTaskStatus(task.id)}
              >
                {task.status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </Button>
              
              <div className="flex-1">
                <div className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getPriorityIcon(task.priority)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}