# APIインターフェース仕様

## useDatabase Hook API

### 初期化・状態
```typescript
const {
  isReady: boolean,      // DB初期化完了フラグ
  error: string | null,  // エラーメッセージ
  // ... methods
} = useDatabase();
```

### Goals API
```typescript
// 作成
createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>

// 取得
getGoals(): Promise<Goal[]>

// 更新
updateGoal(id: string, updates: Partial<Goal>): Promise<void>

// 削除
deleteGoal(id: string): Promise<void>
```

### Milestones API
```typescript
// 作成
createMilestone(milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>

// 取得（目標別）
getMilestonesByGoal(goalId: string): Promise<Milestone[]>
```

### Tasks API
```typescript
// 作成
createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>

// 取得（マイルストーン別）
getTasksByMilestone(milestoneId: string): Promise<Task[]>

// ステータス更新
updateTaskStatus(id: string, status: Task['status']): Promise<void>
```

### EmotionLogs API
```typescript
// 保存（Upsert）
saveEmotionLog(log: Omit<EmotionLog, 'id' | 'createdAt'>): Promise<void>

// 取得
getEmotionLogs(limit: number = 30): Promise<EmotionLog[]>
```

## REST API エンドポイント

### AI タスク分解
**POST** `/api/ai/decompose`

**Request Body:**
```json
{
  "milestone": {
    "title": "string",
    "description": "string",
    "targetDate": "ISO 8601 date string"
  },
  "apiKey": "string"
}
```

**Response:**
```json
{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "high | medium | low",
      "dependencies": ["string"]
    }
  ],
  "reasoning": "string"
}
```

### AI リルート提案（未実装）
**POST** `/api/ai/reroute`

**Request Body:**
```json
{
  "goal": "Goal object",
  "milestones": "Milestone[]",
  "currentProgress": "number",
  "apiKey": "string"
}
```

## コンポーネントPropsインターフェース

### TaskList
```typescript
interface TaskListProps {
  milestoneId: string;
  tasks: Task[];
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  onRefresh: () => Promise<void>;
}
```

### EmotionLog
```typescript
// プロップスなし、useDatabaseフックを内部で使用
```

### TodayCompass
```typescript
// プロップスなし、useDatabaseフックを内部で使用
// 自動で優先度の高いタスク3つを選出
```

## LocalStorage インターフェース

### 設定項目
```typescript
// OpenAI APIキー
localStorage.getItem('openai_api_key'): string | null
localStorage.setItem('openai_api_key', value: string)

// AIモデル選択
localStorage.getItem('ai_model'): 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo'
localStorage.setItem('ai_model', value: string)

// 週次レビュー曜日
localStorage.getItem('weekly_review_day'): '0' | '1' | ... | '6'
localStorage.setItem('weekly_review_day', value: string)
```

## Service Worker API

### キャッシュ戦略
```javascript
const CACHE_NAME = 'voyage-v1';
const urlsToCache = [
  '/',
  '/goals',
  '/milestones',
  '/timeline',
  '/review',
  '/settings',
  '/manifest.json'
];
```

### イベント
- `install`: 初回キャッシュ
- `fetch`: キャッシュファースト、ネットワークフォールバック
- `activate`: 古いキャッシュのクリーンアップ