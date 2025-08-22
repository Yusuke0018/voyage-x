# Voyage アーキテクチャドキュメント

## システム概要
Voyageは、長期目標を「宝島」、中間目標を「島々」に見立てた航海メタファーを用いた計画管理PWAアプリケーションです。

## 技術スタック
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons
- **Database**: SQL.js (SQLite in browser), localforage
- **AI Integration**: OpenAI API (GPT-3.5/4)
- **PWA**: Service Worker, Web Manifest

## アーキテクチャレイヤー

### 1. プレゼンテーション層
```
app/
├── page.tsx              # ダッシュボード
├── goals/page.tsx        # 目標管理
├── milestones/page.tsx   # マイルストーン管理
├── timeline/page.tsx     # タイムライン表示
├── review/page.tsx       # 週次レビュー
└── settings/page.tsx     # 設定画面
```

### 2. コンポーネント層
```
components/
├── dashboard/           # ダッシュボード専用
│   ├── TodayCompass.tsx   # DB連携済み
│   ├── EmotionLog.tsx     # DB保存機能付き
│   └── ProgressSummary.tsx
├── tasks/
│   └── TaskList.tsx     # タスクCRUD
├── ui/                  # 共通UIコンポーネント
└── ServiceWorkerRegister.tsx # PWA対応
```

### 3. データアクセス層
```
hooks/
└── useDatabase.ts       # 統一的なDB操作フック

lib/
├── db/
│   ├── client.ts       # SQL.js接続管理
│   └── schema.sql      # テーブル定義
└── types.ts            # TypeScript型定義
```

### 4. API層
```
app/api/
└── ai/
    ├── decompose/      # タスク自動分解
    └── reroute/        # リルート提案（未実装）
```

## データフロー
1. **ローカルファースト**: すべてのデータはブラウザ内SQLiteに保存
2. **リアクティブ更新**: useDatabase フックを通じた状態管理
3. **AI連携**: OpenAI APIキーはlocalStorageに保存、API呼び出しはクライアントサイド
4. **オフライン対応**: Service Workerによるキャッシュ戦略

## 直近の実装内容
- ✅ 完全なCRUD機能（Goal, Milestone, Task）
- ✅ AI タスク分解とDB自動保存
- ✅ タイムラインビュー（視覚的な進捗表示）
- ✅ 週次レビューと感情トレンド分析
- ✅ PWA化とオフライン対応
- ✅ モバイルレスポンシブ対応
- ✅ 今日の羅針盤のDB連携

## 次の実装候補
1. **AIリルート提案**: 計画遅延時の自動調整提案
2. **データエクスポート/インポート**: バックアップ機能
3. **通知機能**: タスクリマインダー
4. **共有機能**: 進捗の共有URL生成
5. **テーマカスタマイズ**: ダークモード切り替え