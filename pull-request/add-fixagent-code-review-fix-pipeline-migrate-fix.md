## Title

FixAgent 追加・CodeReview→Fix 自動パイプライン・.github/ 英語化・npm run migrate 修正・handleControllerError ユニットテスト追加

---

## Summary

本 PR はバックエンドおよび AI エージェント層に対する 8 件のコミットをまとめたものです。

1. **FixAgent 追加** — `RefactorAgent`（非破壊的品質改善に限定）とは別に、バグ・欠陥を外科的に修正する新エージェントを追加
2. **コードレビュー自動パイプライン** — `CodeReviewAgent` 完了後に `ReviewResponseAgent → FixAgent` が自動チェーンし、1 回の `@CodeReviewAgent` 呼び出しでレビュー・回答・修正サイクルを完結させる
3. **`.github/` ファイルの英語化** — エージェント定義・ルールファイル・プロンプトテンプレート・CI テンプレートをすべて英語化（`blog/` `diary/` の出力言語は日本語を維持）
4. **`npm run migrate` バグ修正と改善** — `.env` 未ロードによる `ER_ACCESS_DENIED_ERROR` を `--env-file` フラグで修正し、続いて `.env` 不在時に例外となる問題を `--env-file-if-exists` フラグで改善
5. **`handleControllerError` のリファクタリングとユニットテスト追加** — コントローラー間の重複関数を `http-presenter.ts` に集約し、未カバーだった `AppError` パス・unknown error パスのユニットテストを追加

---

## Related Tasks

TBD

---

## What was done

### 1. FixAgent 追加 (`4d23fe3`)

`.github/agents/FixAgent.agent.md` を新規作成。`RefactorAgent` をベースに、以下の点が異なる。

| 観点 | RefactorAgent | FixAgent |
|---|---|---|
| 目的 | 内部構造の改善 | 誤った動作の修正 |
| 外部ふるまいの変更 | ❌ 禁止 | ✅ 必要に応じて許可 |
| テストの変更 | ❌ 不可 | ✅ 仕様上の誤りが確認された場合に許可 |
| コミットプレフィックス | `refactor:` | `fix:` |
| `user-invocable` | `false` | `true` |

いずれのエージェントも「1 変更ずつ検証→コミット→繰り返し」の方式を採用。

あわせて `RefactorAgent` の Thinking Rules に存在していたルール 5 の重複を修正（6〜11 に採番し直し）。

### 2. CodeReview→ReviewResponse→Fix 自動パイプライン (`b4b92ff`)

2 つのエージェントファイルの `Post-Completion Required Steps` を更新。

- **`CodeReviewAgent`** — レビューファイル書き出し後に `@ReviewResponseAgent` を呼び出す
- **`ReviewResponseAgent`** — 返答ドラフト完成後に `@FixAgent` を呼び出す

完全な自動チェーン:
```
@CodeReviewAgent
    → @ReviewResponseAgent
        → @FixAgent
            → @ArticleWriterAgent + @WorkSummaryAgent
```

### 3. `.github/` ファイルを英語に翻訳 (`d0fe133`)

19 ファイル変更（166 挿入 / 166 削除 — 純粋な翻訳、ロジック変更なし）。

| カテゴリ | ファイル |
|---|---|
| エージェント定義 | `.github/agents/*.agent.md` 全 13 ファイル |
| ルールファイル | `typescript.rules.md` |
| プロンプトテンプレート | `prompts/write-article.prompt.md`、`prompts/summarize-work.prompt.md` |
| CI ワークフローテンプレート | `backend.yaml`、`frontend.yaml` PR コメント本文 |
| コマンドリファレンス | `CUSTOM_COMMANDS.md` |

### 4. blog/diary 出力言語を日本語に戻す (`402f7a5`)

手順 3 の翻訳で `ArticleWriterAgent` と `WorkSummaryAgent` の出力言語が英語に変わってしまったため、出力言語設定のみ日本語に差し戻し（エージェント定義の本文は英語を維持）。

差し戻し対象: `ArticleWriterAgent.agent.md`、`WorkSummaryAgent.agent.md`、`prompts/write-article.prompt.md`、`prompts/summarize-work.prompt.md`。

### 5. `npm run migrate` の ER_ACCESS_DENIED_ERROR 修正 (`49e333d`)

**根本原因:** `backend/package.json` の migrate スクリプトが `.env` をロードせずに `tsx src/infrastructure/migrate.ts` を呼び出していた。`migrate.ts` の `??''` フォールバックにより `DB_PASSWORD` が空文字列に解決され、MySQL が "using password: NO" で接続を拒否していた。

**修正:** `backend/package.json` を 1 行変更:
```json
"migrate": "tsx --env-file=.env src/infrastructure/migrate.ts"
```

### 6. `--env-file` を `--env-file-if-exists` に改善 (`ef01c85`)

`--env-file=.env` は `.env` が存在しない場合に `ERR_INVALID_ARG_VALUE` をスローする。`--env-file-if-exists` はファイルがあればロード、なければ何もしない（シェル環境変数のみを使うワークフローを破壊しない）。

Node.js v22.20.0 は `--env-file-if-exists` をサポート（Node.js 22.10+ 以降）。`tsx` は透過的にフラグを渡す。

**最終的な migrate スクリプト:**
```json
"migrate": "tsx --env-file-if-exists=.env src/infrastructure/migrate.ts"
```

### 7. `handleControllerError` を `http-presenter.ts` に集約 (`ebb7e6d`)

`app-controller.ts` と `todo-controller.ts` に同一の `handleControllerError` 関数が重複していた。両コントローラーがすでにインポートしている `http-presenter.ts` に集約し重複を排除。

**変更ファイル:**
- `backend/src/controllers/http-presenter.ts` — `handleControllerError` を export として追加
- `backend/src/controllers/app-controller.ts` — ローカルコピーを削除、`http-presenter` からインポート
- `backend/src/controllers/todo-controller.ts` — ローカルコピーを削除、`http-presenter` からインポート

### 8. `handleControllerError` のユニットテスト追加 (`0a2ed64`)

リファクタリング後も未カバーだった 2 つのパスに対するユニットテストを `http-presenter.test.ts` に追加。

| テストケース | 内容 |
|---|---|
| `AppError` パス | `AppError('NOT_FOUND', ...)` を渡すと `status: 404`・`success: false`・`error.code: 'NOT_FOUND'` を含むレスポンスを返す |
| unknown error パス | `AppError` 以外のエラーを渡すと再スローされる |

**変更ファイル:**
- `backend/src/controllers/http-presenter.test.ts` — 18 行追加（2 テストケース）

---

## What is not included

- API エンドポイントの追加・変更なし
- フロントエンドの変更なし
- `FixAgent` 自体のユニットテストなし（エージェント定義は自動テストの対象外）
- `FixAgent` 呼び出しチェーンの結合テストなし（規約および手動呼び出しによる検証）

---

## Impact

- **バックエンドランタイム:** `backend/package.json`（migrate スクリプト）と `http-presenter.ts` のみランタイム動作に影響。その他のバックエンド変更はリファクタリングであり外部ふるまいの変更なし。
- **エージェント層:** `FixAgent` 追加および CodeReview→Fix チェーンにより、`@CodeReviewAgent` 呼び出し時の AI エージェント連携が変わる。各エージェントの個別手動呼び出しには影響しない。
- **CI:** `backend.yaml`・`frontend.yaml` の PR コメントテンプレート文字列が日本語から英語に変更。CI ロジックの変更なし。
- **互換性:** `--env-file-if-exists` は Node.js 22.10+ が必要。プロジェクトは Node.js v22.20.0 を使用しており問題なし。

---

## Testing

- `npm run migrate` を修正後に実行し `Migration complete.` で正常終了を確認
- `handleControllerError` リファクタリングは `npm run typecheck` および `npm run test` で検証済み（全パス）
- 追加したユニットテスト（`http-presenter.test.ts`）は `npm run test` で全パス
- エージェント定義はファイルの目視確認による検証。自動テストカバレッジなし

---

## Notes

- `blog/` と `diary/` は `.gitignore` 対象のためコミット不可。本セッションで `ArticleWriterAgent` / `WorkSummaryAgent` が書き出した記事・日記エントリはローカルにのみ存在する。
- `RefactorAgent` のルール採番修正（ルール 5 の重複）は本 PR の主目的とは無関係な既存不具合だが、同コミットで便宜上修正済み。
- 「エージェント定義言語 = 英語、出力言語 = 日本語」の分離は意図的な設計判断。英語話者が agent ロジックを理解しやすくしつつ、`blog/` `diary/` の主要読者向けに日本語出力を維持する。
- `--env-file` → `--env-file-if-exists` への変更（`ef01c85`）は、`.env` なし環境（CI など）での `ERR_INVALID_ARG_VALUE` を防ぐための安全策であり、動作上の変更はない。
