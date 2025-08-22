'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Ship, Target, Flag, Calendar, ChevronRight } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import type { Goal, Milestone, Task } from '@/lib/types';

export default function TimelinePage() {
  const { isReady, getGoals, getMilestonesByGoal, getTasksByMilestone } = useDatabase();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady]);

  const loadData = async () => {
    const goalsData = await getGoals();
    setGoals(goalsData);
    
    // 各目標のマイルストーンを取得
    for (const goal of goalsData) {
      const milestonesData = await getMilestonesByGoal(goal.id);
      setMilestones(prev => ({ ...prev, [goal.id]: milestonesData }));
      
      // 各マイルストーンのタスクを取得
      for (const milestone of milestonesData) {
        const tasksData = await getTasksByMilestone(milestone.id);
        setTasks(prev => ({ ...prev, [milestone.id]: tasksData }));
      }
    }
    
    // 最初の目標を選択
    if (goalsData.length > 0) {
      setSelectedGoal(goalsData[0].id);
    }
  };

  const calculateProgress = (goalId: string) => {
    const goalMilestones = milestones[goalId] || [];
    if (goalMilestones.length === 0) return 0;
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    for (const milestone of goalMilestones) {
      const milestoneTasks = tasks[milestone.id] || [];
      totalTasks += milestoneTasks.length;
      completedTasks += milestoneTasks.filter(t => t.status === 'done').length;
    }
    
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const getTimelinePosition = (targetDate: Date, goalTargetDate: Date) => {
    const now = new Date();
    const goalDate = new Date(goalTargetDate);
    const target = new Date(targetDate);
    
    const totalDuration = goalDate.getTime() - now.getTime();
    const elapsed = target.getTime() - now.getTime();
    
    const position = (elapsed / totalDuration) * 100;
    return Math.max(0, Math.min(100, position));
  };

  if (!isReady) {
    return <div className="container mx-auto p-4">読み込み中...</div>;
  }

  const currentGoal = goals.find(g => g.id === selectedGoal);
  const currentMilestones = milestones[selectedGoal || ''] || [];

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">航海タイムライン</h1>
        <p className="text-muted-foreground mt-2">目標までの道のりを俸瞰しましょう</p>
      </div>

      {goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">まだ目標がありません</h2>
          <p className="text-muted-foreground">目標を設定して航海を始めましょう</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 目標リスト */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>目標一覧</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {goals.map(goal => {
                  const progress = calculateProgress(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedGoal === goal.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className="font-medium">{goal.title}</div>
                      <div className="text-sm mt-1">
                        進捗: {progress}%
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* タイムラインビュー */}
          <div className="lg:col-span-3">
            {currentGoal && (
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {currentGoal.title}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    目標日: {new Date(currentGoal.targetDate).toLocaleDateString('ja-JP')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative h-[500px]">
                    {/* タイムラインバー */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-blue-200 to-blue-500 rounded-full" />
                    
                    {/* 現在地点（船） */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                      style={{ left: '10%' }}
                    >
                      <div className="bg-white border-2 border-primary rounded-full p-3 shadow-lg">
                        <Ship className="h-6 w-6 text-primary" />
                      </div>
                      <div className="mt-2 text-xs text-center font-medium">
                        現在地
                      </div>
                    </div>
                    
                    {/* マイルストーン（島々） */}
                    {currentMilestones.map((milestone, index) => {
                      const position = getTimelinePosition(milestone.targetDate, currentGoal.targetDate);
                      const milestoneTasks = tasks[milestone.id] || [];
                      const completedTasks = milestoneTasks.filter(t => t.status === 'done').length;
                      
                      return (
                        <div
                          key={milestone.id}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                          style={{ left: `${position}%` }}
                        >
                          <div className="relative">
                            <div className={`bg-white border-2 ${milestone.completed ? 'border-green-500' : 'border-gray-300'} rounded-full p-2 shadow-md`}>
                              <Flag className={`h-5 w-5 ${milestone.completed ? 'text-green-500' : 'text-gray-500'}`} />
                            </div>
                            <div className="absolute top-full mt-2 w-32 text-center">
                              <div className="text-xs font-medium">{milestone.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {completedTasks}/{milestoneTasks.length} タスク
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(milestone.targetDate).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* 最終目標（宝島） */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                      style={{ left: '95%' }}
                    >
                      <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-700 rounded-full p-4 shadow-xl">
                        <Target className="h-8 w-8 text-white" />
                      </div>
                      <div className="mt-2 text-sm text-center font-bold">
                        宝島
                      </div>
                    </div>
                    
                    {/* 進捗バー */}
                    <div className="absolute bottom-0 left-0 right-0">
                      <div className="mb-2 text-sm font-medium">
                        全体進捗: {calculateProgress(selectedGoal || '')}%
                      </div>
                      <Progress value={calculateProgress(selectedGoal || '')} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}