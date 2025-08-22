# Voyage コードスタイルと規約

## TypeScript 規約
- **strict: true** - 厳格な型チェック有効
- **型定義**: lib/types.ts に集約
- **インターフェース命名**: PascalCase（例: Goal, Milestone）
- **型エクスポート**: named export を使用

## React/Next.js 規約
- **コンポーネント**: 関数コンポーネント + TypeScript
- **ファイル名**: kebab-case（例: goal-form.tsx）
- **コンポーネント名**: PascalCase（例: GoalForm）
- **クライアントコンポーネント**: 'use client' ディレクティブを使用
- **サーバーコンポーネント**: デフォルト（ディレクティブなし）

## ディレクトリ構造
- **app/**: ページとルーティング（App Router）
- **components/**: 再利用可能なコンポーネント
  - **ui/**: shadcn/ui 基本コンポーネント
  - **dashboard/**: ダッシュボード専用
  - **timeline/**: タイムライン専用
- **lib/**: ユーティリティとビジネスロジック
  - **db/**: データベース関連
- **hooks/**: カスタムReact Hooks

## スタイリング
- **Tailwind CSS**: ユーティリティファースト
- **shadcn/ui**: コンポーネントライブラリ
- **Radix UI**: アクセシブルなプリミティブ
- **クラス命名**: cn() ヘルパー関数を使用（lib/utils.ts）

## インポート規約
- **絶対パス**: @/ エイリアスを使用
- **順序**:
  1. React/Next.js
  2. 外部ライブラリ
  3. 内部コンポーネント
  4. 内部ユーティリティ
  5. 型定義

## 命名規約
- **変数・関数**: camelCase
- **定数**: UPPER_SNAKE_CASE
- **型・インターフェース**: PascalCase
- **ファイル**: kebab-case
- **CSS クラス**: kebab-case

## コメント
- **JSDoc**: 公開API用
- **インラインコメント**: 複雑なロジックの説明
- **TODO**: 実装予定の機能をマーク

## エラーハンドリング
- **try-catch**: 非同期処理で使用
- **Error Boundary**: コンポーネントレベルで実装
- **ユーザーフィードバック**: トースト通知を使用