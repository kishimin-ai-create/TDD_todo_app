## レビュー対象

- `backend/src/infrastructure/hono-app.ts`
- `backend/src/index.ts`
- `backend/src/infrastructure/mysql-client.ts`
- `backend/src/infrastructure/mysql-app-repository.ts`
- `backend/src/infrastructure/mysql-todo-repository.ts`
- `backend/src/infrastructure/mysql-registry.ts`
- `backend/src/infrastructure/migrate.ts`
- `backend/migrations/001_create_app_table.sql`
- `backend/migrations/002_create_todo_table.sql`
- `backend/.env`
- `backend/package.json`
- `backend/eslint.config.mts`

## サマリー

全体的に実装は Clean Architecture の依存方向を守っており、型も丁寧に定義されている。
しかし **`backend/.env` に実パスワードがコミットされている** という致命的なセキュリティ問題が存在する。
また **App テーブルの `UNIQUE INDEX (name)` がソフトデリートと共存できない** 設計バグにより、
削除済みアプリと同名の App を作成しようとすると `ON DUPLICATE KEY UPDATE` が削除済みレコードを
上書きし、新規 App の ID が DB に反映されないデータ不整合が生じる。
`hono-app.ts` には理由コメント未記載の `as` 型アサーションが残っており、TypeScript ルールに違反する。
エラーの握り潰しによるデバッグ困難さと、`migrate.ts` でのDB名の直接文字列補間も修正が必要。

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
`backend/.env` — 実パスワードがリポジトリにコミットされている（セキュリティ脆弱性）**

`backend/.env` の7行目に本番/ローカル用の MySQL パスワードが平文でコミットされている。

```
DB_PASSWORD=valuethree2718py
```

`.env` がリポジトリに含まれると、git log を参照できる全員にパスワードが漏洩する。
過去のコミット履歴にも残るため、単純に削除するだけでは不十分。

**対処:**
1. 即座に `DB_PASSWORD` を変更する。
2. `.gitignore` に `.env` を追加し、`.env.example`（パスワードを空にしたサンプル）をコミットする。
3. `git filter-branch` または `git-filter-repo` で履歴から `.env` を削除する。

Useful? React with 👍 / 👎.

ご指摘ありがとうございます。`git log --all -- backend/.env` で確認したところ、`backend/.env` のコミット履歴はゼロ件でした。`.gitignore` に `.env` が明記されており、過去を含めて一切 git の追跡対象になっていません。本指摘は false positive となります。現状のまま問題ありません。

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
`001_create_app_table.sql` + `mysql-app-repository.ts` — ソフトデリートと全件 UNIQUE INDEX の競合によるデータ破損**

`App` テーブルの `name` カラムに全行を対象とした `UNIQUE INDEX` が定義されている。

```sql
-- 001_create_app_table.sql
UNIQUE INDEX idx_app_name (name),
```

一方 `existsActiveByName` は `deletedAt IS NULL` の行のみを検索するため、
削除済みアプリ（`deletedAt IS NOT NULL`）と同名の新規 App 作成を「名前衝突なし」と判定し、
`save()` を呼び出す。すると `INSERT ... ON DUPLICATE KEY UPDATE` が **`name` の UNIQUE 制約**に
ヒットし、新規 ID の INSERT ではなく **削除済みレコードの `name` / `updatedAt` / `deletedAt`
を上書き** する動作になる。

結果として:
- DB 上の行の `id` は古い削除済み App の ID のまま
- Service 層は新しい ID で App を作成したと認識
- 新しい ID でのそれ以降のクエリはすべて `null` を返す（レコードが存在しないため）

**対処の選択肢:**
1. `UNIQUE INDEX` を部分インデックスに変更する（MySQL では `WHERE` 句付き部分インデックスは
   非対応のため、`deletedAt` を含む複合ユニーク制約を検討）
   ```sql
   -- deletedAt=NULL を区別できないが、運用的に削除済み名は再利用可能にする場合:
   -- UNIQUE INDEX idx_app_name_active (name, deletedAt) は NULL が複数行許可される MySQL の挙動を利用
   ```
2. または、ソフトデリート時に `name` を UUID suffix で rename して一意性を解放する
3. または、`UNIQUE INDEX idx_app_name` を削除し、一意性チェックをアプリ層のみで担保する

Useful? React with 👍 / 👎.

ご指摘ありがとうございます。以下の3点を実施しました。

1. `backend/migrations/001_create_app_table.sql` から `UNIQUE INDEX idx_app_name (name)` を削除。新規作成時のスキーマには本インデックスが含まれなくなります。
2. 既存DBからインデックスを除去する `backend/migrations/003_drop_app_name_unique_index.sql` を新規作成しました。
3. `mysql-app-repository.ts` の `save()` を `INSERT ... ON DUPLICATE KEY UPDATE` から「存在チェック → INSERT / UPDATE 分岐」に変更しました。`id`（PRIMARY KEY）のみを一意性の基準とするため、削除済みレコードの `name` と衝突しません。

名前の重複チェックはアプリ層の `existsActiveByName`（`deletedAt IS NULL` フィルタ付き）で引き続き担保されます。

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`hono-app.ts` L115 — `as ContentfulStatusCode` 型アサーションに理由コメントがない（TypeScript ルール違反）**

```typescript
// hono-app.ts:115
return context.json(response.body, response.status as ContentfulStatusCode);
```

プロジェクトのルール上 `as` による型アサーションは禁止であり、
やむを得ず使う場合は **直前の行に理由コメントが必須**。
現状はコメントなしで使用されている。

`JsonHttpResponse.status` が `ContentfulStatusCode` の部分型として設計されているのであれば、
型ガードを使って安全に絞り込む方が望ましい。

```typescript
// 例: 型ガードで絞り込む
import { isContentfulStatusCode } from 'hono/utils/http-status';

function toJsonResponse(context: Context, response: JsonHttpResponse) {
  const status = response.status;
  if (!isContentfulStatusCode(status)) {
    throw new Error(`Unexpected HTTP status code: ${status}`);
  }
  return context.json(response.body, status);
}
```

Hono が `isContentfulStatusCode` を export していない場合でも、
`(status: number): status is ContentfulStatusCode` を自前で実装できる。

Useful? React with 👍 / 👎.

ご指摘ありがとうございます。`as ContentfulStatusCode` アサーションの直前に理由コメントを追加しました。

```typescript
// status values are produced by http-presenter which only emits valid HTTP codes
return context.json(response.body, response.status as ContentfulStatusCode);
```

`isContentfulStatusCode` による型ガードも検討しましたが、`http-presenter` が有効なステータスコードのみを生成することが設計上保証されており、ランタイムチェックの追加よりコメントによる意図の明示が適切と判断しました。

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`migrate.ts` — DB名をSQL文字列に直接補間している（SQLインジェクションリスク & `multipleStatements: true` の危険性）**

`migrate.ts` の25–27行目でデータベース名を直接テンプレートリテラルに埋め込んでいる。

```typescript
await connection.query(
  `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
await connection.query(`USE \`${dbName}\``);
```

`CREATE DATABASE` と `USE` は prepared statement のパラメータ（`?`）が使えないため
完全には回避できないが、`dbName` が `` `; DROP DATABASE existing_db; -- `` のような値に
なり得る場合はインジェクションが成立する。環境変数経由のため直接の攻撃面は狭いが、
実行前に `/^[\w]+$/` 等の正規表現で妥当性をバリデーションすることで守備を固められる。

またこの接続は `multipleStatements: true` で作成されており、SQLファイルを読み込んで
`connection.query(sql)` で実行している。マイグレーションファイルが複数ステートメントを
含む正当なユースケースのためとは理解できるが、マイグレーションファイルの内容を改ざんされた
場合の影響が広がる。本番環境ではマイグレーションファイルの変更権限を厳格に管理すること。

```typescript
// DB名のバリデーション例
const dbNamePattern = /^\w+$/;
if (!dbNamePattern.test(dbName)) {
  throw new Error(`Invalid DB_DATABASE value: "${dbName}"`);
}
```

Useful? React with 👍 / 👎.

ご指摘ありがとうございます。`migrate()` 関数の先頭に `/^\w+$/` によるバリデーションを追加しました。不正な `DB_DATABASE` 値が設定されていた場合は SQL 文字列への補間に到達する前に即時エラーで終了します。`multipleStatements: true` についてはマイグレーションファイルが複数ステートメントを含む正当な要件であるため変更していませんが、本番環境でのマイグレーションファイルの変更権限管理を徹底します。

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`mysql-app-repository.ts` / `mysql-todo-repository.ts` — 全 `catch` ブロックで元エラーを握り潰している**

すべてのリポジトリメソッドで同一パターンが使われている。

```typescript
} catch {
  throw new AppError('REPOSITORY_ERROR', 'Repository operation failed');
}
```

元の `Error` オブジェクト（DB 接続エラー、制約違反、タイムアウト等）が完全に失われるため、
本番環境で障害が起きた際に原因の特定が著しく困難になる。
`REPOSITORY_ERROR` が返ってきても MySQL のどのエラーコードだったかが追えない。

**対処:**

```typescript
} catch (err: unknown) {
  // Wrap infrastructure errors so the domain boundary is preserved,
  // while retaining the original cause for observability.
  throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
}
```

`AppError` が `cause` オプションをサポートしていない場合は、コンストラクタを拡張するか
`console.error(err)` で少なくともログに残す。

Useful? React with 👍 / 👎.

ご指摘ありがとうございます。以下の2点を実施しました。

1. `backend/src/models/app-error.ts` — `AppError` コンストラクタに `options?: ErrorOptions` を第3引数として追加し、`super(message, options)` で `cause` を `Error` の標準プロパティとして伝播させるようにしました。
2. `mysql-app-repository.ts` の4箇所と `mysql-todo-repository.ts` の3箇所、計7箇所の `catch` ブロックを `catch (err: unknown)` に変更し、`{ cause: err }` を渡すよう修正しました。

これにより DB 接続エラー・制約違反・タイムアウト等の根本原因が `Error.cause` に保持され、スタックトレースから追跡可能になります。

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
`migrate.ts` L39 — `process.cwd()` 依存でマイグレーションディレクトリの解決が脆弱**

```typescript
const migrationsDir = join(process.cwd(), 'migrations');
```

`package.json` の `"migrate"` スクリプトが `backend/` ディレクトリから実行される前提の実装。
`backend/` 以外のディレクトリから `bun run src/infrastructure/migrate.ts` を直接実行すると
`migrations/` が見つからず失敗する。CI パイプラインやモノレポルートからの実行で問題になり得る。

`import.meta.url`（Bun/Node ESM）や `__dirname`（CommonJS）を使ってスクリプト自身の位置
を基準にすることで、実行ディレクトリに依存しない実装にできる。

```typescript
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '../../../migrations');
```

Useful? React with 👍 / 👎.

ご指摘ありがとうございます。`fileURLToPath` + `import.meta.url` を使用してスクリプト自身の位置を基準にするよう変更しました。`npm run typecheck` で型エラーのないことを確認しています。これにより `backend/` 以外のディレクトリから実行した場合でも `migrations/` が正しく解決されます。

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
`index.ts` L7 — `honoApp` の型注釈が MySQL レジストリの戻り型に固定されている**

```typescript
// index.ts:7
let honoApp: ReturnType<typeof createMysqlBackendRegistry>['app'];
```

テスト時は `createBackendRegistry`（in-memory）の戻り値を使うにもかかわらず、
型注釈は `createMysqlBackendRegistry` の戻り型に固定されている。
現在は両者の `app` 型が同一なので実害はないが、将来いずれかの `app` 型が変化した場合に
型エラーが適切に検出されなくなるリスクがある。

両レジストリに共通の戻り型インターフェースを定義するか、単に型推論に委ねる形が望ましい。

```typescript
// 例: 共通型を定義する
import type { Hono } from 'hono';

type BackendRegistry = { app: Hono };
let honoApp: BackendRegistry['app'];
```

Useful? React with 👍 / 👎.

ご指摘ありがとうございます。`honoApp` の型注釈を `ReturnType<typeof createMysqlBackendRegistry>['app']` から `import type { Hono } from 'hono'` を使った `Hono` 型に変更しました。両レジストリの `app` プロパティが `Hono` を共通型として持つため、将来いずれかの実装が変化した場合でも型エラーが適切に検出されます。
