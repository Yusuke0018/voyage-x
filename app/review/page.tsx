'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, CheckCircle2, Clock, TrendingUp, TrendingDown, BarChart3, Sparkles } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import type { Goal, Milestone, Task, EmotionLog } from '@/lib/types';

export default function ReviewPage() {
  const { isReady, getGoals, getMilestonesByGoal, getTasksByMilestone, getEmotionLogs } = useDatabase();
  const [weekData, setWeekData] = useState({
    completedTasks: 0,
    totalTasks: 0,
    completedMilestones: 0,
    averageMood: 0,
    averageEnergy: 0,
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reflection, setReflection] = useState('');
  const [nextWeekPlan, setNextWeekPlan] = useState('');
  const [emotionLogs, setEmotionLogs] = useState<EmotionLog[]>([]);

  useEffect(() => {
    if (isReady) {
      loadWeekData();
    }
  }, [isReady]);

  const loadWeekData = async () => {
    // 目標とタスクのデータ取得
    const goalsData = await getGoals();
    setGoals(goalsData);
    
    let completedTasks = 0;
    let totalTasks = 0;
    let completedMilestones = 0;
    
    for (const goal of goalsData) {
      const milestones = await getMilestonesByGoal(goal.id);
      completedMilestones += milestones.filter(m => m.completed).length;
      
      for (const milestone of milestones) {
        const tasks = await getTasksByMilestone(milestone.id);
        totalTasks += tasks.length;
        completedTasks += tasks.filter(t => t.status === 'done').length;
      }
    }
    
    // 感情ログデータ取得（過去7日間）
    const logs = await getEmotionLogs(7);
    setEmotionLogs(logs);
    
    const averageMood = logs.length > 0 
      ? logs.reduce((sum, log) => sum + log.mood, 0) / logs.length 
      : 0;
    const averageEnergy = logs.length > 0
      ? logs.reduce((sum, log) => sum + log.energy, 0) / logs.length
      : 0;
    
    setWeekData({
      completedTasks,
      totalTasks,
      completedMilestones,
      averageMood,
      averageEnergy,
    });
  };

  const handleAIReview = async () => {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      alert('設定画面でOpenAI APIキーを設定してください');
      return;
    }
    
    // TODO: AIレビュー生成API実装
    alert('AI振り返り機能は開発中です');
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const taskCompletionRate = weekData.totalTasks > 0 
    ? Math.round((weekData.completedTasks / weekData.totalTasks) * 100)
    : 0;

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😔', '😐', '😊', '😄'];
    return emojis[Math.round(mood) - 1] || '😐';
  };

  const getEnergyLevel = (energy: number) => {
    const levels = ['とても低い', '低い', '普通', '高い', 'とても高い'];
    return levels[Math.round(energy) - 1] || '普通';
  };

  if (!isReady) {
    return <div className="container mx-auto p-4">読み込み中...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">週次レビュー</h1>
        <p className="text-muted-foreground mt-2">今週の振り返りと次週の計画を立てましょう</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 週間サマリー */}
        <div className="lg:col-span-2 space-y-6">
          {/* 進捗統計 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                今週の実績
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {weekData.completedTasks}
                  </div>
                  <div className="text-sm text-muted-foreground">完了タスク</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getProgressColor(taskCompletionRate)}`}>
                    {taskCompletionRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">達成率</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {weekData.completedMilestones}
                  </div>
                  <div className="text-sm text-muted-foreground">達成マイルストーン</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl">
                    {getMoodEmoji(weekData.averageMood)}
                  </div>
                  <div className="text-sm text-muted-foreground">平均気分</div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>週間進捗</span>
                  <span>{taskCompletionRate}%</span>
                </div>
                <Progress value={taskCompletionRate} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* 振り返り */}
          <Card>
            <CardHeader>
              <CardTitle>今週の振り返り</CardTitle>
              <CardDescription>
                達成できたこと、課題、学びを記録しましょう
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="今週の振り返りを入力...\n\n良かったこと:\n- \n\n課題:\n- \n\n学び:\n- "
                rows={8}
              />
              <Button onClick={handleAIReview} variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                AIで振り返りを生成
              </Button>
            </CardContent>
          </Card>

          {/* 次週の計画 */}
          <Card>
            <CardHeader>
              <CardTitle>次週の計画</CardTitle>
              <CardDescription>
                次週の重点目標と改善点を設定しましょう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={nextWeekPlan}
                onChange={(e) => setNextWeekPlan(e.target.value)}
                placeholder="次週の計画を入力...\n\n重点目標:\n1. \n2. \n\n改善したいこと:\n- "
                rows={6}
              />
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 感情トレンド */}
          <Card>
            <CardHeader>
              <CardTitle>今週の感情トレンド</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>平均気分</span>
                    <span>{getMoodEmoji(weekData.averageMood)} {weekData.averageMood.toFixed(1)}/5</span>
                  </div>
                  <Progress value={weekData.averageMood * 20} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>平均エネルギー</span>
                    <span>{getEnergyLevel(weekData.averageEnergy)}</span>
                  </div>
                  <Progress value={weekData.averageEnergy * 20} className="h-2" />
                </div>
              </div>
              
              {emotionLogs.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium mb-2">日別記録</div>
                  <div className="space-y-2">
                    {emotionLogs.slice(0, 7).map(log => (
                      <div key={log.id} className="flex justify-between text-sm">
                        <span>{new Date(log.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</span>
                        <span>{getMoodEmoji(log.mood)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 目標リマインダー */}
          <Card>
            <CardHeader>
              <CardTitle>アクティブな目標</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {goals.slice(0, 3).map(goal => {
                  const daysRemaining = Math.ceil(
                    (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div key={goal.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{goal.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        残り{daysRemaining}日
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}