'use client';

import { Progress } from '@/components/ui/progress';

export function ProgressSummary() {
  // Mock data
  const goals = [
    {
      id: '1',
      title: 'Webアプリケーションの完成',
      progress: 65,
      milestonesCompleted: 3,
      milestonesTotal: 5
    },
    {
      id: '2',
      title: 'プログラミングスキル向上',
      progress: 40,
      milestonesCompleted: 2,
      milestonesTotal: 6
    }
  ];

  return (
    <div className="space-y-6">
      {goals.map(goal => (
        <div key={goal.id} className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{goal.title}</h3>
            <span className="text-sm text-muted-foreground">
              {goal.progress}%
            </span>
          </div>
          
          <Progress value={goal.progress} className="h-2" />
          
          <div className="text-sm text-muted-foreground">
            {goal.milestonesCompleted} / {goal.milestonesTotal} マイルストーン達成
          </div>
        </div>
      ))}
    </div>
  );
}