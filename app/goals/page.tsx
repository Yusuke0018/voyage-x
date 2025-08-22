'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Target, Calendar, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import type { Goal } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function GoalsPage() {
  const router = useRouter();
  const { isReady, getGoals, createGoal, updateGoal, deleteGoal } = useDatabase();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年後
    vision: ''
  });

  useEffect(() => {
    if (isReady) {
      loadGoals();
    }
  }, [isReady]);

  const loadGoals = async () => {
    const data = await getGoals();
    setGoals(data);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return;
    
    await createGoal(newGoal);
    await loadGoals();
    setIsCreateOpen(false);
    setNewGoal({
      title: '',
      description: '',
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      vision: ''
    });
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('この目標を削除しますか？')) {
      await deleteGoal(id);
      await loadGoals();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (targetDate: Date) => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isReady) {
    return <div className="container mx-auto p-4">読み込み中...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">宝島への航海</h1>
          <p className="text-muted-foreground mt-2">長期目標を設定して、人生の航路を決めましょう</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" /> 新しい目標を設定
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>新しい宝島を設定</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">目標名</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="例: Webアプリをリリースする"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="目標の詳細を入力"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetDate">目標日</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newGoal.targetDate.toISOString().split('T')[0]}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: new Date(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vision">ビジョン（任意）</Label>
                <Textarea
                  id="vision"
                  value={newGoal.vision}
                  onChange={(e) => setNewGoal({ ...newGoal, vision: e.target.value })}
                  placeholder="この目標を達成したときのイメージや動機"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateGoal}>
                目標を作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">まだ目標がありません</h2>
          <p className="text-muted-foreground">最初の宝島を設定して、航海を始めましょう</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map(goal => {
            const daysRemaining = getDaysRemaining(goal.targetDate);
            
            return (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/milestones?goalId=${goal.id}`)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{goal.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {goal.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Edit functionality
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGoal(goal.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(goal.targetDate)}</span>
                    </div>
                    <div className="text-sm">
                      {
                        daysRemaining > 0 
                          ? <span className="text-green-600">残り{daysRemaining}日</span>
                          : <span className="text-red-600">期限切れ</span>
                      }
                    </div>
                    {goal.vision && (
                      <div className="pt-2 text-sm text-muted-foreground italic">
                        &quot;{goal.vision}&quot;
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center text-sm text-primary">
                    <span>マイルストーンを表示</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}