**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  Guard index drop for fresh databases**

`migrate()` runs SQL files in filename order, so a new environment will execute `001_create_app_table.sql` (which does not create `idx_app_name`) before this statement; on MySQL, dropping a missing index fails and aborts migration, blocking first-time setup and CI bootstrap. Make this migration idempotent by checking index existence (or using `IF EXISTS` where supported) before dropping.

Useful? React with 👍 / 👎.

**[fixed]** `backend/migrations/003_drop_app_name_unique_index.sql` を idempotent な SQL に書き換えました。

MySQL 8.0 は `DROP INDEX IF EXISTS` をサポートしないため、`information_schema.STATISTICS` でインデックスの存在を確認してから動的に `ALTER TABLE App DROP INDEX idx_app_name` を実行するパターンに変更しました。インデックスが存在しない新規環境では `SELECT 1` が実行されるのでマイグレーションがブロックされなくなります。マイグレーションファイルは `multipleStatements: true` で実行されているため、複数ステートメントの記述も問題ありません。

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  Enforce app-name uniqueness atomically**

This pre-check is separated from the subsequent save, so concurrent create/update requests with the same name can both observe `not duplicated` and then persist, resulting in multiple active apps sharing one name instead of returning `409`. Because there is no database-level active-name uniqueness guard in this change set, the API contract is race-prone under parallel traffic unless the check+write is made atomic.

Useful? React with 👍 / 👎.

**[reply only]** ご指摘の通り、`existsActiveByName()` と `save()` が分離しているため race condition が存在します。アトミックに保証するためには `SELECT ... FOR UPDATE` をトランザクション内で実行する必要がありますが、現在の `AppRepository` インターフェースはトランザクションを抽象化していないため、対応するには以下の変更が必要になります。

1. `AppRepository` インターフェースにトランザクション境界を表す型（例: `UnitOfWork`）を追加する
2. `mysql-app-repository.ts` で `pool.getConnection()` → `BEGIN` → `SELECT ... FOR UPDATE` → `INSERT/UPDATE` → `COMMIT/ROLLBACK` を実装する
3. `app-interactor.ts` の `create` / `update` をトランザクション対応に変更する

これらはドメイン層のインターフェース設計変更を伴う大きな変更となるため、本 PR のスコープ外として既知の制限事項（known limitation）とします。低〜中トラフィック環境では実用上の問題は限定的ですが、高並行環境での本番利用前には別 Issue として対応することを推奨します。

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  Enforce app-name uniqueness atomically**

`createAppInteractor.create()` checks `existsActiveByName()` and then writes in a separate call, so concurrent requests with the same name can both pass the pre-check and persist successfully. Because this change set removes DB-level name uniqueness (see `001_create_app_table.sql` / migration 003), the `409` contract is now race-prone under parallel traffic and multiple active apps can end up sharing one name. Please make the check+write atomic (for example with a transaction/lock or equivalent DB constraint).

Useful? React with 👍 / 👎.

> **返信 (Copilot):** ご指摘ありがとうございます。上の同名コメントと同一の root cause です。`existsActiveByName()` → `save()` の分離による race condition を解消するには `AppRepository` インターフェースにトランザクション境界（例: `UnitOfWork`）を追加する必要があり、ドメイン層の設計変更を伴う大きな変更となるため本 PR のスコープ外とします。既知の制限事項として記録し、高並行環境での本番利用前に別 Issue で対応することを推奨します。

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  Make app deletion and todo cascade atomic**

`createAppInteractor.remove()` persists the app soft-delete before cascading to todos, but there is no transaction boundary across these writes. If any later repository call fails (for example during the todo loop), the app remains deleted while some todos stay active; the endpoint returns an error, and retries then hit `NOT_FOUND` on the app, leaving inconsistent orphaned state. This should be wrapped in a single transaction (or otherwise made all-or-nothing) to avoid partial commits.

Useful? React with 👍 / 👎.

> **返信 (Copilot):** ご指摘ありがとうございます。`createAppInteractor.remove()` では app のソフトデリート後に todo のカスケード削除を行っていますが、これらの書き込みをまたぐトランザクション境界がありません。途中で失敗した場合、app が削除済みのまま一部の todo がアクティブに残るという不整合が生じます。アトミックに解決するには `AppRepository` / `TodoRepository` インターフェースに共通のトランザクション境界（例: `UnitOfWork`）を追加し、`remove()` 全体を単一トランザクションでラップする必要があります。これはドメイン層のインターフェース設計変更を伴う大きな変更となるため、本 PR のスコープ外として既知の制限事項（known limitation）とします。別 Issue として対応することを推奨します。
