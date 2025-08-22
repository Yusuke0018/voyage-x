'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { Task } from '@/lib/types';

export function TodayCompass() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch today's tasks from database
    setLoading(false);
    
    // Mock data for now
    setTodayTasks([
      {
        id: '1',
        milestoneId: 'm1',
        title: 'プロジェクト設計書を作成',
        priority: 'high',
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        milestoneId: 'm1',
        title: 'APIエンドポイントの実装',
        priority: 'medium',
        status: 'todo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        milestoneId: 'm1',
        title: 'テストケース作成',
        priority: 'low',
        status: 'todo',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  }, []);

  const toggleTaskStatus = (taskId: string) => {
    setTodayTasks(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: task.status === 'done' ? 'todo' : 'done' }
          : task
      )
    );
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