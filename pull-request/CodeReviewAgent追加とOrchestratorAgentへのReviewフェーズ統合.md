## Title

CodeReviewAgent 追加と OrchestratorAgent への Review フェーズ統合

## Summary

エージェント基盤の品質管理フローを強化するため、コードレビューを自動化する
`CodeReviewAgent` を新規作成し、既存の `OrchestratorAgent` に Review フェーズ
（Phase 5）を組み込んだ。

これにより TDD サイクルが
`Red → Green → Refactor → Review → Integration & Report`
となり、Refactor 完了後に必ずレビューファイルが `review/` に保存されてから
完了とみなされるようになった。

あわせて以下の 2 点を追加修正した。

1. `OrchestratorAgent` に混入していた PowerShell ヒアドキュメント断片
   （`$content = @'` など）を除去し、YAML frontmatter を正常な形式に修正した。
2. `CodeReviewAgent` に対して、`OrchestratorAgent` から呼ばれた際は
   `{feature-slug}` を kebab-case スラッグに統一するルールを追加した。
   これによりレビューファイルのファイル名一貫性が保証され、
   OrchestratorAgent 側のファイル存在チェックが確実に通るようになった。

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
  - **OrchestratorAgent から呼ばれた場合**: `{feature-slug}` を kebab-case スラッグに統一する。これにより OrchestratorAgent 側のファイル存在チェックと名前が一致することを保証する（例: `Todoリスト取得` → `todo-list-20260424.md`）。
  - 汎用名（`review`、`changes` など）の使用を禁止
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

## What is not included

- 既存エージェントファイル（RedAgent / GreenAgent / RefactorAgent など）への Review フェーズ言及の追加は対象外。
- `CodeReviewAgent` の P1/P2/P3 バッジ基準の独立したドキュメント化（現時点では各エージェント内のルール記述に依存）。
- `OrchestratorAgent` 以外のエージェントファイルへの PowerShell 残骸混入確認・修正。

## Impact

- **`OrchestratorAgent` 呼び出しフローへの変化**: Refactor 完了後に必ず `@CodeReviewAgent` が実行される。既存のワークフローに Phase 5 が追加されるため、1 サイクルあたりの所要ステップが増加する。
- **`review/` ディレクトリへの書き込み**: `OrchestratorAgent` 経由のフローで `review/` にファイルが生成されるようになる。
- **ファイル名の一貫性強化**: OrchestratorAgent が期待する `{feature-slug}` と CodeReviewAgent が生成するファイル名が kebab-case ルールにより一致するようになり、ファイル存在チェックの信頼性が向上する。
- **後方互換性**: `CodeReviewAgent` は新規追加のため、既存エージェントへの破壊的影響はない。`OrchestratorAgent` は Phase 5 追加によりフローが変化するが、既存のテスト・実装ファイル生成ロジックには手を加えていない。

## Testing

- `CodeReviewAgent.agent.md` および `OrchestratorAgent.agent.md` の内容を目視確認し、YAML frontmatter・各セクション・Workflow 定義が意図通りに記述されていることを確認した。
- kebab-case スラッグルールおよびファイル名命名ルールについては、ファイル内の記述レベルで整合性を確認済み。
- 自動テスト（ユニットテスト / CI）はエージェント定義ファイル（Markdown）に対しては未実施。実際のエージェント動作検証は TBD。

## Notes

- `OrchestratorAgent` に混入していた PowerShell 断片は過去の編集ミスと推定される。他エージェントファイルに同様の問題が潜んでいないか、後続で確認することを推奨する。
- `CodeReviewAgent` はスタイル・フォーマット指摘を意図的に除外しているため、既存の linter/formatter 設定との役割分担を明確にしておくと運用が安定する。
- OrchestratorAgent から呼ばれる場合と、ユーザーが直接呼び出す場合でファイル名ルールが異なる。直接呼び出しでは日本語ラベルも許容されるが、OrchestratorAgent 経由では kebab-case スラッグが必須である点に注意。
