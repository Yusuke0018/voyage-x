# Voyage プロジェクト概要

## プロジェクトの目的
長期目標を「宝島」、中間目標を「島々」に見立てて、人生の航海を計画・管理するWebアプリケーション。AIによるタスク分解支援とリルート提案により、柔軟で現実的な計画管理を実現する。

## 技術スタック
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4, Radix UI Themes
- **UI Components**: shadcn/ui, Radix UI primitives
- **Database**: SQL.js (SQLite in browser), localforage
- **AI**: OpenAI API (GPT-4)
- **Icons**: Lucide React
- **Date**: date-fns

## プロジェクト構造
```
voyage/
├── app/                # Next.js App Router
│   ├── page.tsx       # ダッシュボード
│   ├── goals/         # 長期目標管理
│   ├── milestones/    # 中間目標管理
│   ├── timeline/      # タイムライン表示
│   ├── review/        # レビュー機能
│   ├── settings/      # 設定画面
│   └── api/ai/        # AI API エンドポイント
├── components/        # React コンポーネント
│   ├── dashboard/     # ダッシュボード用
│   ├── timeline/      # タイムライン表示
│   └── ui/           # 基本UIコンポーネント (shadcn/ui)
├── lib/              # ユーティリティ
│   ├── db/           # データベース関連
│   ├── types.ts      # TypeScript型定義
│   └── utils.ts      # ユーティリティ関数
├── hooks/            # Custom React Hooks
└── public/           # 静的ファイル
```

## 主要機能
1. **目標管理**: 長期目標（Goal）と中間目標（Milestone）の階層構造
2. **タスク管理**: 各中間目標に紐づくタスク（Task）の管理
3. **AI支援**: タスク自動分解、リルート提案、優先度判定
4. **進捗管理**: 今日の羅針盤、感情ログ、週次レビュー
5. **データ管理**: ローカルファースト、PWA対応

## データモデル
- Goal: 長期目標（宝島）
- Milestone: 中間目標（島々）
- Task: 具体的なタスク
- EmotionLog: 感情ログ（天候記録）
- AIProposal: AI提案の記録
- Settings: アプリケーション設定