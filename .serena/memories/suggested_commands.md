# Voyage 開発用コマンド集

## 開発コマンド
```bash
# 開発サーバー起動（Turbopack使用）
npm run dev

# ビルド（Turbopack使用）
npm run build

# プロダクションサーバー起動
npm run start

# リント実行
npm run lint
```

## Git コマンド
```bash
# 状態確認
git status

# 変更を追加
git add .

# コミット
git commit -m "メッセージ"

# プッシュ
git push origin main

# プル
git pull origin main
```

## システムコマンド (macOS/Darwin)
```bash
# ディレクトリ一覧
ls -la

# ファイル検索
find . -name "*.tsx"

# テキスト検索（ripgrep推奨）
rg "検索文字列"

# ファイル内容確認
cat ファイル名

# ディレクトリ移動
cd ディレクトリ名

# ファイル削除
rm ファイル名

# ディレクトリ削除
rm -rf ディレクトリ名
```

## npm パッケージ管理
```bash
# パッケージインストール
npm install パッケージ名

# 開発用パッケージインストール
npm install -D パッケージ名

# パッケージアンインストール
npm uninstall パッケージ名

# パッケージ更新確認
npm outdated

# パッケージ更新
npm update
```

## キャッシュクリア
```bash
# Next.js キャッシュクリア
rm -rf .next

# npm キャッシュクリア
npm cache clean --force

# ブラウザキャッシュ（開発者ツールで Cmd+Shift+R）
```