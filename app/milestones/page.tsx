'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Milestone as MilestoneIcon, Calendar, CheckCircle, Circle, Sparkles } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import type { Goal, Milestone } from '@/lib/types';

function MilestonesContent() {
  const searchParams = useSearchParams();
  const goalId = searchParams.get('goalId');
  
  const { isReady, getGoals, getMilestonesByGoal, createMilestone } = useDatabase();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3ヶ月後
  });

  useEffect(() => {
    if (isReady && goalId) {
      loadData();
    }
  }, [isReady, goalId]);

  const loadData = async () => {
    if (!goalId) return;
    
    const goals = await getGoals();
    const currentGoal = goals.find(g => g.id === goalId);
    if (currentGoal) {
      setGoal(currentGoal);
      const milestonesData = await getMilestonesByGoal(goalId);
      setMilestones(milestonesData);
    }
  };

  const handleCreateMilestone = async () => {
    if (!newMilestone.title.trim() || !goalId) return;
    
    await createMilestone({
      goalId,
      title: newMilestone.title,
      description: newMilestone.description,
      targetDate: newMilestone.targetDate,
      completed: false,
      order: milestones.length
    });
    
    await loadData();
    setIsCreateOpen(false);
    setNewMilestone({
      title: '',
      description: '',
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
  };

  const handleAIDecompose = async (milestone: Milestone) => {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      alert('OpenAI APIキーを設定してください');
      return;
    }
    
    try {
      const response = await fetch('/api/ai/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone, apiKey })
      });
      
      const data = await response.json();
      console.log('AI分解結果:', data);
      // TODO: タスクを保存
    } catch (error) {
      console.error('AI分解エラー:', error);
    }
  };

  if (!isReady) {
    return <div className="container mx-auto p-4">読み込み中...</div>;
  }

  if (!goal) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">目標が選択されていません</h2>
          <p className="text-muted-foreground">目標ページから目標を選択してください</p>
          <Button className="mt-4" onClick={() => window.location.href = '/goals'}>
            目標ページへ
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <a href="/goals" className="hover:text-primary">目標</a>
          <span>/</span>
          <span>{goal.title}</span>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{goal.title}への航路</h1>
            <p className="text-muted-foreground mt-2">宝島にたどり着くまでの島々を設定しましょう</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" /> マイルストーンを追加
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>新しいマイルストーン</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">マイルストーン名</Label>
                  <Input
                    id="title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    placeholder="例: 基本機能の実装"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    placeholder="このマイルストーンの詳細"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetDate">目標日</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={newMilestone.targetDate.toISOString().split('T')[0]}
                    onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: new Date(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreateMilestone}>
                  作成
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {milestones.length === 0 ? (
        <Card className="p-12 text-center">
          <MilestoneIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">まだマイルストーンがありません</h2>
          <p className="text-muted-foreground">最初の中間目標を設定しましょう</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <Card key={milestone.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {
                      milestone.completed 
                        ? <CheckCircle className="h-6 w-6 text-green-600" />
                        : <Circle className="h-6 w-6" />
                    }
                    <div>
                      <CardTitle>{milestone.title}</CardTitle>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIDecompose(milestone)}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      AI分解
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {new Date(milestone.targetDate).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MilestonesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">読み込み中...</div>}>
      <MilestonesContent />
    </Suspense>
  );
}