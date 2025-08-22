'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Key, Save, Eye, EyeOff } from 'lucide-react';

import { DataExport } from '@/components/features/DataExport';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
  const [weeklyReviewDay, setWeeklyReviewDay] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 設定を読み込み
    const savedApiKey = localStorage.getItem('openai_api_key') || '';
    const savedModel = localStorage.getItem('ai_model') || 'gpt-3.5-turbo';
    const savedReviewDay = localStorage.getItem('weekly_review_day') || '0';
    
    setApiKey(savedApiKey);
    setAiModel(savedModel);
    setWeeklyReviewDay(parseInt(savedReviewDay));
  }, []);

  const handleSave = () => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('ai_model', aiModel);
    localStorage.setItem('weekly_review_day', weeklyReviewDay.toString());
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const weekDays = [
    '日曜日', '月曜日', '火曜日', '水曜日', 
    '木曜日', '金曜日', '土曜日'
  ];

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          設定
        </h1>
        <p className="text-muted-foreground mt-2">アプリケーションの設定を管理します</p>
      </div>

      <div className="space-y-6">
        {/* OpenAI API設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              OpenAI API設定
            </CardTitle>
            <CardDescription>
              AI機能を使用するためのAPIキーを設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">APIキー</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                APIキーはブラウザのローカルストレージに保存され、外部には送信されません
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">AIモデル</Label>
              <select
                id="model"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="gpt-4">GPT-4 (高精度)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (高速)</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (経済的)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* レビュー設定 */}
        <Card>
          <CardHeader>
            <CardTitle>週次レビュー設定</CardTitle>
            <CardDescription>
              振り返りを行う曜日を設定します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="reviewDay">レビュー曜日</Label>
              <select
                id="reviewDay"
                value={weeklyReviewDay}
                onChange={(e) => setWeeklyReviewDay(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              >
                {weekDays.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* データ管理 */}
        <Card>
          <CardHeader>
            <CardTitle>🗂️ データ管理</CardTitle>
            <CardDescription>
              データのバックアップとリストア
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataExport />
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            <Save className="h-4 w-4 mr-2" />
            設定を保存
          </Button>
        </div>

        {saved && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            設定を保存しました
          </div>
        )}
      </div>
    </div>
  );
}