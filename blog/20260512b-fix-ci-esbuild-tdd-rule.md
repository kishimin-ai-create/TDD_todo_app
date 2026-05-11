# CI 修正・TDD ルール整備・パスワード autocomplete 対応 — 2026-05-12 作業まとめ

## 対象読者

- GitHub Actions で `npm ci` が突然落ちて困っている TypeScript プロジェクトの開発者
- vitest / vite のバージョンアップ追従で esbuild の peer dependency エラーに遭遇した方
- kysely を最新版にアップグレードしようとしている方
- TDD を「新機能だけ」に適用している状況を見直したい方
- ブラウザのパスワード自動入力 (autofill) を正しく制御したい方

---

## 変更の全体像

本日 (2026-05-12) は以下 3 つのコミットと 1 つの作業中変更を扱いました。

| コミット / 作業 | 内容 |
|---|---|
| `4f7d475` | CI の Node.js を 20 → 22 に変更 |
| `330a6a9` | esbuild を `^0.25.12` → `^0.28.0` に変更 |
| `81ef1f3` | TDD 適用範囲をバグ修正・リファクタリングにも拡大するルールを追加 |
| 作業中 (未コミット) | `UserProfilePage.tsx` のパスワード欄 `autoComplete="off"` を正しい値に修正 |

---

## 1. Node.js 20 → 22 へのアップグレード (`4f7d475`)

### 背景

`kysely@0.29.0` の `package.json` には `"engines": { "node": ">=22" }` が設定されています。CI の Node.js バージョンが 20 のままだったため、lock ファイル再生成後の `npm ci` がこの制約と衝突しました。

### 変更内容

3 つの CI ワークフロー (`.github/workflows/ci.yml`, `ci-pr.yml`, `ci-nightly.yml`) で Node.js バージョンを一律に変更しました。

```yaml
# Before
- uses: actions/setup-node@v4
  with:
    node-version: '20'

# After
- uses: actions/setup-node@v4
  with:
    node-version: '22'
```

あわせて `backend/package-lock.json` と `frontend/package-lock.json` を Node 22 環境で再生成し、lock ファイルと実行環境の整合性を取っています。

### ポイント

kysely のようにエンジン要件を厳格に宣言するパッケージは、メジャーバージョンが上がるたびに Node.js の最小バージョンが引き上げられることがあります。CI の Node.js バージョンは `package.json` の `engines` フィールドや依存パッケージの要件と定期的に照合しておくのが安全です。

---

## 2. esbuild `^0.25.12` → `^0.28.0` へのアップグレード (`330a6a9`)

### 症状

Node.js を 22 に変更して lock ファイルを再生成した後も、CI が以下のエラーで落ちることがありました。

```
npm error Missing: esbuild@0.28.0 from lock file
```

### 根本原因

依存関係の連鎖が原因です。

```
vitest@4.1.4
  └─ vite@8.0.10
       └─ peerDependencies: esbuild "^0.27.0 || ^0.28.0"
```

`vite@8.0.10` は peer dependency として `esbuild` の `^0.27.0 || ^0.28.0` を要求します。しかし `backend/package.json` に直接指定していた esbuild のバージョンは `^0.25.12` であり、この範囲は `^0.27.0 || ^0.28.0` を**満たしません**。

npm は peer dependency を解決する際、ルートの lock ファイルに該当バージョンが存在することを求めます。`esbuild@0.25.x` がロックされているだけでは `esbuild@0.28.0` が lock ファイルに含まれないため、`npm ci` が「lock ファイルに esbuild@0.28.0 が存在しない」というエラーを出力していました。

### 修正

`backend/package.json` の esbuild バージョン指定を引き上げました。

```diff
# backend/package.json
-    "esbuild": "^0.25.12",
+    "esbuild": "^0.28.0",
```

これにより lock ファイルの再生成時に `esbuild@0.28.x` がルートに含まれ、vite の peer dependency 要件を満たすようになりました。

### ポイント

`npm ci` はローカルの `npm install` と異なり、lock ファイルと `node_modules` を厳格に一致させます。peer dependency の要件が変わる minor / patch アップグレードでも lock ファイルが追いつかず CI だけで落ちるケースがあります。エラーメッセージに **"Missing from lock file"** とあれば、該当パッケージを直接 devDependencies に追加して lock ファイルを再生成するのが最短の解決策です。

---

## 3. TDD ルールの適用範囲拡大 (`81ef1f3`)

### 変更内容

`.github/rules/test-driven-development.rules.md` に「TDD はすべてのコード変更に適用する」というセクションを追加しました。

```markdown
## Applies to All Code Changes

TDD is **mandatory for every code change** — not only new features.

| Change type | TDD cycle |
|---|---|
| New feature | Red → Green → Refactor |
| Bug fix | Write a failing test that reproduces the bug → Green → Refactor |
| Refactoring | Verify all tests pass first, then refactor (tests must stay Green throughout) |
| Performance / security | Write a test that exposes the gap, then fix |

> Never touch production code without first having a failing test that
> justifies the change. A fix without a failing test is not TDD.
```

### なぜ必要だったか

TDD は新機能開発だけに適用するものと捉えられがちです。しかし「バグ修正時にテストを先に書かない」状態では以下の問題が起きます。

1. **バグの再現条件が確認されない**: 修正が正しいかどうかを検証する手段がない
2. **回帰テストが残らない**: 同じバグが再発したときに検出できない
3. **設計改善の機会を逃す**: テストを書く過程でインターフェースの問題が見えることがある

このルール追加により、バグ修正であっても「先にバグを再現するテストを Red にする → 修正して Green にする → Refactor」のサイクルが明示的に求められるようになりました。

### 実践上の注意点

リファクタリング中はテストを **Green のまま保つ**ことが前提です。テストが落ちている状態でリファクタリングを行うと、「壊したのはリファクタリングか、それとも元々壊れていたのか」の判断ができなくなります。リファクタリングは必ず全テスト Green の状態から始めてください。

---

## 4. パスワードフィールドの `autoComplete` 修正 (作業中)

### 症状

`UserProfilePage.tsx` のパスワード入力欄に `autoComplete="off"` を設定していましたが、Chrome や Safari などのモダンブラウザはパスワードフィールドの `autoComplete="off"` を**意図的に無視**します。ブラウザは「ユーザーの利便性のためにパスワードは保存・補完すべき」と判断するためです。

### 修正

フィールドの用途に合った適切な `autoComplete` 値に変更しました。

```diff
# 新しいパスワード入力欄
- autoComplete="off"
+ autoComplete="new-password"

# 現在のパスワード入力欄
- autoComplete="off"
+ autoComplete="current-password"
```

| `autoComplete` 値 | 意味 | ブラウザの動作 |
|---|---|---|
| `"off"` | 自動補完を無効にしたい | パスワード欄では**無視される** |
| `"new-password"` | 新しいパスワードを設定する欄 | パスワードマネージャーが新規保存を提案する。既存パスワードの補完は行わない |
| `"current-password"` | 現在のパスワードを入力する欄 | パスワードマネージャーが保存済みパスワードを補完する |

### ポイント

パスワードフィールドで自動補完を本当に防ぎたい場合は `autoComplete="off"` ではなく、`autoComplete="new-password"` を使います。多くのブラウザはこの値を「既存パスワードは補完しないが、新規保存は許可する」と解釈します。完全に autofill を抑制したい特殊な要件がなければ、適切な `autoComplete` 値を設定してブラウザとパスワードマネージャーを正しく機能させる方が UX として優れています。

---

## まとめ

| 変更 | 効果 |
|---|---|
| Node.js 20 → 22 | kysely@0.29.0 の `engines: >=22` を満たし、CI が通るようになった |
| esbuild `^0.25.12` → `^0.28.0` | vitest → vite の peer dependency `^0.27.0 \|\| ^0.28.0` を満たし、`npm ci` の "Missing from lock file" エラーが解消された |
| TDD ルール拡大 | バグ修正・リファクタリングにも Red→Green→Refactor サイクルが必須になり、修正の意図をテストで担保できるようになった |
| `autoComplete` 修正 | パスワードフィールドの `autoComplete="off"` を `new-password` / `current-password` に変更し、ブラウザの autofill が正しく機能するようになった |

### 教訓

- **peer dependency エラーは lock ファイルの再生成だけでは解決しないことがある。** 直接依存しているパッケージのバージョンレンジ自体を引き上げる必要がある場合はエラーメッセージを読んで根本原因を特定すること。
- **TDD は新機能開発だけのものではない。** バグ修正時にテストを先に書く習慣がないと、回帰テストが蓄積されず、将来の安全網が薄くなる。
- **`autoComplete="off"` はパスワードフィールドに効かない。** ブラウザの仕様を理解した上で適切な値を使うことが、ユーザーと開発者両方にとって正しい選択。
