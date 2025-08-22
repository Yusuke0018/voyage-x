# 状態管理仕様

## グローバル状態

### データベース状態（SQL.js）
```
ブラウザメモリ内SQLite
│
├── goalsテーブル
├── milestonesテーブル
├── tasksテーブル
├── emotion_logsテーブル
└── ai_proposalsテーブル
```

### LocalStorage状態
```
openai_api_key: string      // APIキー
ai_model: string           // 選択されたモデル
weekly_review_day: string  // レビュー曜日
```

### Service Workerキャッシュ
```
voyage-v1キャッシュ
│
├── 静的リソース
└── 動的コンテンツ（fetch時に追加）
```

## コンポーネントローカル状態

### TodayCompass
```typescript
{
  todayTasks: Task[],       // 今日の重要タスク3つ
  loading: boolean          // 読み込み状態
}
```

### EmotionLog
```typescript
{
  mood: 1-5,                // 今日の気分
  energy: 1-5,              // エネルギーレベル
  note: string,             // メモ
  todayLog: EmotionLog | null,  // 今日の既存ログ
  saved: boolean            // 保存成功フラグ
}
```

### Goalsページ
```typescript
{
  goals: Goal[],            // 全目標リスト
  isCreateOpen: boolean,    // 作成ダイアログ状態
  newGoal: {                // 新規目標入力状態
    title: string,
    description: string,
    targetDate: Date,
    vision: string
  }
}
```

### Milestonesページ
```typescript
{
  goal: Goal | null,        // 選択された目標
  milestones: Milestone[],  // マイルストーンリスト
  tasks: Record<string, Task[]>,  // マイルストーン別タスク
  expandedMilestone: string | null,  // 展開中のマイルストーンID
  isCreateOpen: boolean     // 作成ダイアログ状態
}
```

### Timelineページ
```typescript
{
  goals: Goal[],            // 全目標
  milestones: Record<string, Milestone[]>,  // 目標別マイルストーン
  tasks: Record<string, Task[]>,  // マイルストーン別タスク
  selectedGoal: string | null  // 選択中の目標ID
}
```

### Reviewページ
```typescript
{
  weekData: {
    completedTasks: number,
    totalTasks: number,
    completedMilestones: number,
    averageMood: number,
    averageEnergy: number
  },
  goals: Goal[],
  reflection: string,       // 振り返りテキスト
  nextWeekPlan: string,     // 次週計画
  emotionLogs: EmotionLog[] // 過去7日間のログ
}
```

### Settingsページ
```typescript
{
  apiKey: string,           // OpenAI APIキー
  showApiKey: boolean,      // キー表示状態
  aiModel: string,          // AIモデル
  weeklyReviewDay: number,  // レビュー曜日
  saved: boolean            // 保存成功フラグ
}
```

## 状態更新フロー

### タスク完了フロー
1. ユーザーがタスクをクリック
2. updateTaskStatus(taskId, 'done') 呼び出し
3. DB更新
4. コンポーネント再レンダリング
5. UIに完了状態表示

### AIタスク分解フロー
1. マイルストーンの「AI分解」ボタンクリック
2. APIキー確認（localStorage）
3. /api/ai/decompose エンドポイント呼び出し
4. OpenAI APIでタスク生成
5. 各タスクをDBに保存
6. マイルストーン展開してタスク表示

### 感情ログ保存フロー
1. ユーザーが気分/エネルギー/メモ入力
2. 「記録する」ボタンクリック
3. saveEmotionLog() でDBにUpsert
4. 保存成功メッセージ表示
5. 今日のログを再読み込み

## 次のステップ

### 状態管理の改善点
1. **グローバル状態管理**: Context APIまたはZustand導入検討
2. **オプティミスティック更新**: React Queryでキャッシュ最適化
3. **リアルタイム同期**: 複数デバイス間での同期検討
4. **パフォーマンス**: 仮想スクロールで大量データ対応