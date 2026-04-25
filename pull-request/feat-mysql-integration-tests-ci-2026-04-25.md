## Title

feat: MySQL 接続実装・DBマイグレーション・統合テスト per-layer 整備・GitHub Actions CI 構築（2026-04-25）

## Summary

2026-04-25 の一日分の作業をまとめた PR。

主な変更は4軸：

1. **MySQL 接続層の実装**：`mysql-client` / `mysql-registry` / `mysql-app-repository` / `mysql-todo-repository` を新規作成し、in-memory 実装に加えて MySQL バックエンドを追加。DBマイグレーション（`migrate.ts` + SQL 3本）も同時実装。
2. **コードレビュー対応**（5件）：UNIQUE INDEX とソフトデリートの競合バグ修正、`catch` ブロックの cause 伝播、`fileURLToPath` による実行ディレクトリ非依存化、`honoApp` の型改善、`as` アサーションへの理由コメント追加。
3. **統合テスト per-layer 分割**：`models / repositories / services / controllers / infrastructure` の5層に17ファイルを新規作成。
4. **GitHub Actions CI 整備**：`push` 時はユニットテストのみ、`PR` 時は統合テストも実行する2段階 CI を導入。

エージェント定義（`CodeReviewAgent` 後の `ReviewResponseAgent` 自動起動・返信フォーマット明確化、`ArticleWriterAgent` / `WorkSummaryAgent` の証拠収集強化）も合わせて更新。

## Related Tasks

TBD（関連 Issue なし）

## What was done

### バックエンド：TDD サイクルで Todo API をフルスクラッチ実装

- `backend/src/app.test.ts`（新規）：全10エンドポイントのテストスイート。正常系・バリデーションエラー（422）・一意制約違反（409）・ソフトデリート・カスケード削除・境界値（name 100/101 文字）を網羅。
- `backend/src/index.ts`（全面書き直し）：Hono ベースの全APIルート実装。インメモリストア（`Map`）による初期実装。

### バックエンド：レイヤードアーキテクチャへの再編

`backend/src/` を Clean Architecture に沿って以下の層に分割：

| 層 | 主要ファイル |
|---|---|
| models | `models/app.ts`, `models/todo.ts`, `models/app-error.ts` |
| repositories | `repositories/app-repository.ts`, `repositories/todo-repository.ts` |
| services | `services/app-interactor.ts`, `services/todo-interactor.ts`, `services/app-usecase.ts`, `services/todo-usecase.ts` |
| controllers | `controllers/app-controller.ts`, `controllers/todo-controller.ts`, `controllers/http-presenter.ts`, `controllers/request-validation.ts` |
| infrastructure | `infrastructure/hono-app.ts`, `infrastructure/in-memory-repositories.ts`, `infrastructure/in-memory-storage.ts`, `infrastructure/registry.ts` |

### バックエンド：MySQL 接続層の新規実装

- `backend/src/infrastructure/mysql-client.ts`：`mysql2/promise` を使った接続ファクトリ
- `backend/src/infrastructure/mysql-registry.ts`：MySQL バックエンド用の DI コンテナ
- `backend/src/infrastructure/mysql-app-repository.ts`：App の CRUD（soft-delete 対応）
- `backend/src/infrastructure/mysql-todo-repository.ts`：Todo の CRUD（appId スコープ・soft-delete 対応）
- `backend/src/infrastructure/migrate.ts`：マイグレーション実行スクリプト（`fileURLToPath` によるパス解決、`\w+` バリデーション付き）
- `backend/migrations/001_create_app_table.sql`：App テーブル定義（`UNIQUE INDEX idx_app_name` は含めず）
- `backend/migrations/002_create_todo_table.sql`：Todo テーブル定義
- `backend/migrations/003_drop_app_name_unique_index.sql`：既存 DB 向けインデックス削除マイグレーション

### コードレビュー対応（`review/mysql-implementation-20260425.md` 全5件対応済み）

| 優先度 | 内容 | 対応内容 |
|---|---|---|
| P1 | `backend/.env` 実パスワードのコミット | false positive（`.gitignore` で追跡対象外であることを確認） |
| P1 | `UNIQUE INDEX` とソフトデリートの競合によるデータ破損 | `001_create_app_table.sql` からインデックスを削除・`003_drop_app_name_unique_index.sql` 追加・`mysql-app-repository.ts` の `save()` を `INSERT ... ON DUPLICATE KEY UPDATE` から `id` 基準の分岐方式に変更 |
| P2 | `hono-app.ts` の `as ContentfulStatusCode` に理由コメントなし | アサーション直前に理由コメントを追加 |
| P2 | `migrate.ts` DB名の直接文字列補間 | `/^\w+$/` バリデーションを `migrate()` 先頭に追加 |
| P2 | `catch` ブロックで元エラーを握り潰している | `AppError` コンストラクタに `options?: ErrorOptions` を追加し、7箇所の `catch (err: unknown)` で `{ cause: err }` を伝播 |
| P3 | `migrate.ts` の `process.cwd()` 依存 | `fileURLToPath(import.meta.url)` + `dirname` に変更 |
| P3 | `index.ts` の `honoApp` 型が MySQL 固有型に固定 | `import type { Hono } from 'hono'` を使った共通型に変更 |

### 統合テスト per-layer 分割（17ファイル新規作成）

`backend/src/tests/integrations/` 以下に5層：

- **models/**（3）：AppError 伝播・AppEntity / TodoEntity の shape・round-trip
- **repositories/**（2）：AppRepository / TodoRepository の契約（save / listActive / findActiveById / existsActiveByName / soft-delete / マルチアプリ分離）
- **services/**（4）：App / Todo Interactor の CRUD・cascade delete・`ensureAppExists`・Usecase インターフェース契約
- **controllers/**（4）：全 HTTP ステータスコード・DTO 変換（`deletedAt` 隠蔽）・バリデーションエラー形式・文字数境界
- **infrastructure/**（4）：Hono ルーティング結線・DI コンテナ出線・shared storage シナリオ・malformed body フォールバック

### GitHub Actions CI の整備

- `.github/workflows/backend-ci.integration.yaml`（新規）：`backend/**` パスフィルタ付き。`push` → lint + typecheck + unit tests のみ、`pull_request` → unit + integration を追加実行。
- `backend/vitest.unit.config.ts`（新規）：`src/tests/integrations/**` を除外
- `backend/vitest.integration.config.ts`（新規）：`src/tests/integrations/**/*.test.ts` のみをインクルード
- `backend/package.json`：`test:unit` / `test:integration` スクリプトを追加

### エージェント定義の改善

- `.github/agents/CodeReviewAgent.agent.md`：レビュー完了後に `@ReviewResponseAgent` を自動起動するよう更新
- `.github/agents/ReviewResponseAgent.agent.md`：返信フォーマット・レビュー回答の必須項目を明確化
- `.github/agents/ArticleWriterAgent.agent.md`：`git diff` / `git log` による証拠収集ステップを強化
- `.github/agents/WorkSummaryAgent.agent.md`：`git diff` / `git log` による証拠収集ステップを強化

### その他ルール・ドキュメント

- `.github/rules/typescript.rules.md`（新規）：`as` / `any` 原則禁止・使用時は理由コメント必須
- `.github/rules/backend.rules.md`（新規）：Clean Architecture ディレクトリ構造・テスト配置ルール
- `.github/rules/frontend.rules.md`（新規）：コンポーネント設計・テストのベストプラクティス
- `.github/rules/git.rules.md`（新規）：コミットメッセージ・PR テンプレート運用
- `.github/rules/human-interface-guideline.rules.md`（新規）：UI 設計原則
- `.github/agents/` 配下全エージェント：確認待ちを禁止する `Prohibited Actions` ルールを追加（`fd5b4b0`）
- `.github/agents/UIDesignAgent.agent.md`（新規）
- `.github/agents/RegressionTestAgent.agent.md`（新規）
- `.github/workflows/copilot-setup-steps.yml`（新規）：Copilot セットアップ手順
- 技術記事 10 本（`blog/` 配下）

## What is not included

- **テストの実際の実行確認**：環境に PowerShell 7+ がないため `npm run test:unit` / `npm run test:integration` をローカルで実行できておらず、静的解析レベルでの整合確認にとどまる。
- **MySQL 統合テスト**：`mysql-app-repository.ts` / `mysql-todo-repository.ts` のテストは未作成。実 DB 接続が必要な E2E テストは別途実装が必要。
- **旧スタブファイルの削除**：`backend/src/tests/integrations/app.test.ts` / `index.test.ts` は不活性化（`// @ts-nocheck` + no-op `describe`）されているが、明示的な削除は未実施。
- **旧 CI ファイルの整理**：`backend.yaml`（旧 CI）と `backend-ci.integration.yaml`（新 CI）が共存しており、PR 時に同種ジョブが並走する可能性がある。廃止 or 役割整理は別 PR。
- **フロントエンド変更**：今回の変更対象は `backend/` および `.github/` のみ。

## Impact

- **`backend/src/` のディレクトリ構造が変更**：`models/` / `repositories/` / `services/` / `controllers/` / `infrastructure/` への再編により、既存の `import` パスが変わっている。`index.ts` は registry 経由の薄い入口として再設計済み。
- **`AppError` コンストラクタのシグネチャ変更**：第3引数に `options?: ErrorOptions` を追加。既存の呼び出しは全て2引数のため後方互換性あり。
- **`mysql-app-repository.ts` の `save()` 挙動変更**：`INSERT ... ON DUPLICATE KEY UPDATE` から `id` 基準の存在チェック → INSERT / UPDATE 分岐に変更。`name` の UNIQUE 制約をアプリ層のみで担保する設計に統一。
- **CI の実行タイミング変更**：`push` 時の統合テストが省略され、フィードバックが高速化する。`pull_request` 時は統合テストが追加実行されるため、CI 実行時間が増加する。
- **エージェント挙動の変更**：`CodeReviewAgent` 完了後に `ReviewResponseAgent` が自動起動するようになる（未対応の環境では動作変化なし）。

## Testing

- `npm run typecheck`（`backend/`）：`fileURLToPath` 変更後に型エラーのないことを確認済み（`migrate.ts`）。
- 静的解析：全テストファイルおよび実装ファイルの型整合を TypeScript コンパイラで確認済み（ローカル実行は未実施）。
- ローカルでの実行確認が必要なコマンド：
  ```bash
  cd backend
  npm run test:unit
  npm run test:integration
  npm run typecheck
  npm run lint
  ```

## Notes

- `backend/.env` は `.gitignore` で追跡対象外であることを `git log --all -- backend/.env` で確認済み（P1 レビュー指摘は false positive）。
- MySQL 接続実装はローカル MySQL（`127.0.0.1:3306`）前提。CI 環境での統合テスト実行には MySQL サービスの準備が別途必要。
- 技術記事 10 本（`blog/` 配下）は今日の作業知見のまとめ。PR の機能的変更には含まれない。
- コミット数が多く（45件超）、複数のリファクタリングコミットが "Refactor code structure for improved readability and maintainability" という汎用メッセージで記録されている点に注意。
