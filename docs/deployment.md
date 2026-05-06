# Render デプロイガイド

## 概要

このリポジトリは Render Blueprint を使ってデプロイします。リポジトリ直下の `render.yaml` に以下の 2 サービスを定義しています。

- フロントエンド: `tdd-todo-app-frontend`（Static Site）
- バックエンド: `tdd-todo-app-backend`（Node Web Service）

Render は Blueprint を読み取り、`main` ブランチへの更新をもとに自動デプロイします。

## Render Dashboard での初期設定

1. Render にログインします。
2. Dashboard で **New +** → **Blueprint** を選びます。
3. この GitHub リポジトリを接続します。
4. Blueprint としてリポジトリ直下の `render.yaml` を読み込ませます。
5. Preview を確認し、フロントエンドとバックエンドの 2 サービスが作成されることを確認して作成を実行します。

## 環境変数の設定

バックエンドサービス `tdd-todo-app-backend` では最低限以下を設定してください。

- `NODE_ENV=production`
- `DATABASE_URL`（Render の MySQL など接続先の接続文字列）

`DATABASE_URL` は Render Dashboard のバックエンドサービス画面から **Environment** を開いて登録します。Blueprint では `DATABASE_URL` を `sync: false` にしているため、値は GitHub に保存されず Render 側で安全に管理されます。

必要に応じて CORS や外部 API 用の追加環境変数も同じ画面で設定してください。

## 自動デプロイの仕組み

- GitHub リポジトリを Render に接続すると、`main` ブランチへの push が自動デプロイの対象になります。
- フロントエンドは `frontend` で `npm ci && npm run build` を実行し、`frontend/dist` を公開します。
- バックエンドは `backend` で `npm ci && npm run build` を実行し、`npm start` で起動します。
- 変更が push されるたびに Render が最新コミットを取得して再デプロイします。

## 手動デプロイ

手動で再デプロイしたい場合は Render Dashboard から対象サービスを開き、**Manual Deploy** を選択します。Blueprint 全体を再同期したい場合は Blueprint の画面から最新コミットを再適用してください。
