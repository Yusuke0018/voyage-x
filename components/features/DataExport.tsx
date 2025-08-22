'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';

export function DataExport() {
  const { getGoals, getMilestonesByGoal, getTasksByMilestone, getEmotionLogs } = useDatabase();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const goals = await getGoals();
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        goals: [] as any[],
        emotionLogs: await getEmotionLogs(365)
      };

      for (const goal of goals) {
        const milestones = await getMilestonesByGoal(goal.id);
        const goalData = {
          ...goal,
          milestones: [] as any[]
        };

        for (const milestone of milestones) {
          const tasks = await getTasksByMilestone(milestone.id);
          goalData.milestones.push({
            ...milestone,
            tasks
          });
        }
        exportData.goals.push(goalData);
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voyage-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: '✅ エクスポート完了',
        description: 'データをダウンロードしました',
      });
    } catch (error) {
      toast({
        title: '❌ エクスポート失敗',
        description: 'データの取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.version !== '1.0') {
          throw new Error('互換性のないバージョンです');
        }

        // TODO: インポート処理の実装
        toast({
          title: '⚠️ インポート機能',
          description: 'インポート処理は次回実装予定です',
        });
      } catch (error) {
        toast({
          title: '❌ インポート失敗',
          description: 'ファイルの読み込みに失敗しました',
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  return (
    <div className="flex gap-4">
      <Button onClick={handleExport} disabled={isExporting}>
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? 'エクスポート中...' : 'データエクスポート'}
      </Button>
      <Button onClick={handleImport} disabled={isImporting} variant="outline">
        <Upload className="mr-2 h-4 w-4" />
        {isImporting ? 'インポート中...' : 'データインポート'}
      </Button>
    </div>
  );
}