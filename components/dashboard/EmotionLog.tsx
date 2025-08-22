'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function EmotionLog() {
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');

  const moodEmojis = ['😢', '😔', '😐', '🙂', '😄'];
  const energyEmojis = ['🔋', '🔋🔋', '🔋🔋🔋', '🔋🔋🔋🔋', '⚡'];

  const saveLog = async () => {
    const log = {
      date: new Date().toISOString().split('T')[0],
      mood,
      energy,
      note,
      createdAt: new Date().toISOString()
    };
    
    // TODO: Save to database
    console.log('Saving emotion log:', log);
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

      <Button onClick={saveLog} className="w-full">
        記録する
      </Button>
    </div>
  );
}