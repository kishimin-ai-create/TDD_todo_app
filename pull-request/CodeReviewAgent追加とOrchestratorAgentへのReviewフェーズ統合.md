## Title

CodeReviewAgent 追加・OrchestratorAgent への Review フェーズ統合・TDD ルールへの twada スタイル追記

## Summary

エージェント基盤の品質管理フローを強化するため、以下の 3 本の変更をまとめて実施した。

1. **CodeReviewAgent の新規作成** (`CodeReviewAgent.agent.md`)
   コードレビューを自動化する user-invocable なエージェントを追加。優先度バッジ形式（P1/P2/P3）で `review/` にレビュー結果を出力する。

2. **OrchestratorAgent への Review フェーズ統合** (`OrchestratorAgent.agent.md`)
   壊れていた PowerShell スクリプト残骸を除去し YAML frontmatter を修正。TDD サイクルに Phase 5（Review）を追加し、フローを
   `Red → Green → Refactor → Review → Integration & Report`
   に更新。Refactor 完了後に必ず `@CodeReviewAgent` が実行され、レビューファイルが `review/` に保存されてから完了とみなされるようになった。v1.0.0 → v2.0.0。

3. **TDD ルールファイルへの twada スタイル追記** (`test-driven-development.rules.md`)
   ファイル冒頭に和田卓人（twada）推奨スタイルへの帰属を引用ブロックで明記し、`twada's Key Principles` セクション（6 項目）を新設した。

あわせてレビュー対応として `CodeReviewAgent` に OrchestratorAgent 経由時の kebab-case スラッグ統一ルールを追加し、OrchestratorAgent 側のファイル存在チェックとの整合性を確保した。

## Related Tasks

TBD

## What was done

### 新規作成: `.github/agents/CodeReviewAgent.agent.md`

- コードレビューを実施し結果を `review/` に書き出す user-invocable なエージェントを作成した。
- 指摘事項は優先度バッジ形式（P1 / P2 / P3）で分類して出力する。

  | Priority | Badge 色 | 使用基準 |
  | :------- | :------- | :------- |
  | P1 | orange | バグ・セキュリティ脆弱性・データロスリスク |
  | P2 | yellow | アーキテクチャ違反・エラーハンドリング漏れ・テストカバレッジ不足 |
  | P3 | blue | 軽微なロジック改善・命名・ドキュメント不足 |

- 出力ファイル名は `review/{作業内容}-{YYYYMMDD}.md` に固定し、命名ルールを厳格に定義した。
  - 優先順: ① ブランチ名スラッグ → ② スペック名（OrchestratorAgent 経由時は kebab-case スラッグ必須） → ③ 変更ファイル要約
  - **OrchestratorAgent から呼ばれた場合**: `{feature-slug}` を kebab-case スラッグに統一する。OrchestratorAgent 側のファイル存在チェックとの名前一致を保証する（例: `Todoリスト取得` → `todo-list-20260424.md`）。
  - 汎用名（`review`、`changes` など）の使用を禁止。
- 日付取得コマンドを OS ごとに明記:
  - Windows: `Get-Date -Format "yyyyMMdd"`
  - Unix: `date "+%Y%m%d"`
- レビュー対象: ブランチ / コミット SHA / PR 番号 / ファイルリスト / スペックファイルのいずれかを受け取る。
- 指摘はフォーマット・インデントなどリンターが拾う内容を除外し、実際の問題のみを記載する。

### 修正: `.github/agents/OrchestratorAgent.agent.md`

- **PowerShell 残骸の除去**: `$content = @'` 等の PowerShell ヒアドキュメント断片が混入していたため、正しい YAML frontmatter に整形した。
- **Review フェーズの追加**: TDD サイクルに Phase 5「Review Agent Execution」を追加。
  - Refactor 完了後に `@CodeReviewAgent` を呼び出すことを義務付け。
  - 変更ファイルリストとフィーチャースペックを渡し `review/{feature-slug}-{YYYYMMDD}.md` に保存させる。
  - レビューファイルの存在確認前に最終サマリーへ進むことを禁止。
- **Prohibited Actions に追加**: 「レビューファイル保存前に完了とマークしない」を明記。
- **Definition of Done に追加**: CodeReviewAgent のレビューファイルが `review/{feature-slug}-YYYYMMDD.md` に保存済みであることを完了条件に追加。
- **バージョン更新**: v1.0.0 → v2.0.0。

### 修正: `.github/rules/test-driven-development.rules.md`

- **ファイル冒頭への帰属引用ブロック追加**: 本ルールファイルが twada（和田卓人）推奨の TDD 実践スタイルに基づくこと、および TDD はテスト手法ではなく設計手法であるという位置づけを引用ブロックで明記した。
- **`twada's Key Principles` セクション新設**: `Principles` セクション配下に以下 6 項目を追加した。

  | 原則 | 内容 |
  | :--- | :--- |
  | Baby steps | 一歩が大きいと感じたらさらに細かく分割する |
  | Test list as a TODO list | テストを書く前にシナリオ・ケースを書き出し、一つずつ処理する |
  | Tests are living documentation | テスト名は仕様書であり、読んで意図が伝わる名前にする |
  | Red confirms the test | 必ず失敗（Red）を確認してから Green フェーズに進む |
  | Commit at each Green | 全テストが通過した時点でコミットする習慣をつける |
  | Refactor only on Green | テストが失敗している状態でリファクタリングしてはならない |

  既存の `Principles` セクションを上書きするものではなく、補足追記として整合性を保ちながら追加した。

## What is not included

- 既存エージェントファイル（RedAgent / GreenAgent / RefactorAgent など）への Review フェーズ言及の追加は対象外。
- `CodeReviewAgent` の P1/P2/P3 バッジ基準の独立したドキュメント化（現時点では各エージェント内のルール記述に依存）。
- `OrchestratorAgent` 以外のエージェントファイルへの PowerShell 残骸混入確認・修正。
- `twada's Key Principles` 各項目の具体的なコード例・NG 例を含む補足ドキュメントの整備。

## Impact

- **`OrchestratorAgent` 呼び出しフローへの変化**: Refactor 完了後に必ず `@CodeReviewAgent` が実行される。既存のワークフローに Phase 5 が追加されるため、1 サイクルあたりの所要ステップが増加する。
- **`review/` ディレクトリへの書き込み**: `OrchestratorAgent` 経由のフローで `review/` にファイルが生成されるようになる。
- **ファイル名の一貫性強化**: OrchestratorAgent が期待する `{feature-slug}` と CodeReviewAgent が生成するファイル名が kebab-case ルールにより一致するようになり、ファイル存在チェックの信頼性が向上する。
- **TDD ルール参照時のコンテキスト向上**: `twada's Key Principles` の追加により、TDD サイクルの各フェーズ（特に Red 確認・Green コミット・Refactor only on Green）の根拠が明文化され、OrchestratorAgent のフロー定義との整合性も明確になった。
- **後方互換性**: `CodeReviewAgent` は新規追加のため、既存エージェントへの破壊的影響はない。`OrchestratorAgent` は Phase 5 追加によりフローが変化するが、既存のテスト・実装ファイル生成ロジックには手を加えていない。TDD ルールファイルへの追記は既存ルールを上書きしない。

## Testing

- `CodeReviewAgent.agent.md`・`OrchestratorAgent.agent.md`・`test-driven-development.rules.md` の内容を目視確認し、YAML frontmatter・各セクション・Workflow 定義・引用ブロックが意図通りに記述されていることを確認した。
- kebab-case スラッグルールおよびファイル名命名ルールについては、ファイル内の記述レベルで整合性を確認済み（例: `Todoリスト取得` → `todo-list-20260424.md`）。
- `twada's Key Principles` の 6 項目が既存 `Principles` セクションと矛盾しないことを目視で確認した。
- 自動テスト（ユニットテスト / CI）はエージェント定義ファイル（Markdown）に対しては未実施。実際のエージェント動作検証は TBD。

## Notes

- `OrchestratorAgent` に混入していた PowerShell 断片は過去の編集ミスと推定される。他エージェントファイルに同様の問題が潜んでいないか、後続で確認することを推奨する。
- `CodeReviewAgent` はスタイル・フォーマット指摘を意図的に除外しているため、既存の linter/formatter 設定との役割分担を明確にしておくと運用が安定する。
- OrchestratorAgent から呼ばれる場合と、ユーザーが直接呼び出す場合でファイル名ルールが異なる。直接呼び出しでは日本語ラベルも許容されるが、OrchestratorAgent 経由では kebab-case スラッグが必須である点に注意。
- `twada's Key Principles` の `Refactor only on Green` 原則は OrchestratorAgent の TDD サイクル定義（Refactor 完了後に Review）と直接対応しており、エージェント群とルールファイルの整合性が取れている。今後 twada's Key Principles の各項目にコード例・NG 例を添えた補足ドキュメントを整備すると、チームへの浸透がより促進できる。
