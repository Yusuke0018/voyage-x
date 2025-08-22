'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDatabase } from '@/hooks/useDatabase';

export function EmotionLog() {
  const { isReady, saveEmotionLog, getEmotionLogs } = useDatabase();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');
  const [todayLog, setTodayLog] = useState(null);
  const [saved, setSaved] = useState(false);

  const moodEmojis = ['😢', '😔', '😐', '🙂', '😄'];
  const energyEmojis = ['🔋', '🔋🔋', '🔋🔋🔋', '🔋🔋🔋🔋', '⚡'];

  useEffect(() => {
    if (isReady) {
      loadTodayLog();
    }
  }, [isReady]);

  const loadTodayLog = async () => {
    const logs = await getEmotionLogs(1);
    const today = new Date().toISOString().split('T')[0];
    const todayLogData = logs.find(log => 
      new Date(log.date).toISOString().split('T')[0] === today
    );
    
    if (todayLogData) {
      setMood(todayLogData.mood);
      setEnergy(todayLogData.energy);
      setNote(todayLogData.note || '');
      setTodayLog(todayLogData);
    }
  };

  const saveLog = async () => {
    await saveEmotionLog({
      date: new Date(),
      mood,
      energy,
      note
    });
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await loadTodayLog();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">気分</label>
        <div className="flex gap-2 mt-2">
          {moodEmojis.map((emoji, index) => (
            <Button
              key={index}
              variant={mood === index + 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMood(index + 1)}
              className="text-xl"
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">エネルギー</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {energyEmojis.map((emoji, index) => (
            <Button
              key={index}
              variant={energy === index + 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEnergy(index + 1)}
              className="text-sm"
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">メモ</label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="今日の感情や出来事を記録"
          className="mt-2"
          rows={3}
        />
      </div>

      <Button onClick={saveLog} className="w-full" disabled={!isReady}>
        {todayLog ? '更新する' : '記録する'}
      </Button>
      
      {saved && (
        <div className="text-center text-sm text-green-600">
          保存しました
        </div>
      )}
    </div>
  );
}