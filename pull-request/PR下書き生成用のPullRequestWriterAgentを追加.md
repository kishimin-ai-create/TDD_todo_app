## Summary

リポジトリの変更内容をもとに PR 下書きを作成するカスタムエージェント `PullRequestWriterAgent` を追加しました。あわせて、出力ファイル名を PR タイトル由来にするルールと、参照テンプレートを `.github/pull_request_template.md` にそろえる調整を行い、`pull-request/` 配下で一貫した PR ドラフトを管理できるようにしています。

## Related Tasks

TBD

## What was done

- `.github/agents/PullRequestWriterAgent.agent.md` を追加し、PR 下書きを作成するカスタムエージェントを定義
- 変更ファイル、diff、spec、tests、task context をもとに PR 本文を組み立てる方針を定義
- 出力先を `pull-request/` 配下の Markdown に固定
- `.github/pull_request_template.md` の見出し構成に合わせて、`Summary` / `Related Tasks` / `What was done` / `What is not included` / `Impact` / `Testing` / `Notes` を使うルールを定義
- 出力ファイル名を、実装内容を表す PR タイトルから生成するルールに更新
- テンプレート参照先を `.github/rules/pull-request.rules.md` から `.github/pull_request_template.md` に変更
- 関連する記録として `diary/20260423.md` と `blog/実装内容を反映したPR下書きを作るPullRequestWriterAgentを整備した.md` を追加

## What is not included

- 実際の GitHub Pull Request の作成や送信
- 既存の他エージェントの挙動変更
- このエージェントを使った運用結果の評価や追加改善

## Impact

- PR 説明文の下書きを、リポジトリ内の実装文脈に沿って一定の形式で作成しやすくなります
- `pull-request/` 配下のファイル名から内容を把握しやすくなります
- 影響範囲は主にドキュメント生成フローとカスタムエージェント定義です

## Testing

テスト実行はこの変更範囲からは確認できていないため、TBD

## Notes

- PR テンプレートは `.github/pull_request_template.md` を基準にしています
- 関連ファイルは `.github/agents/PullRequestWriterAgent.agent.md`、`.github/pull_request_template.md`、`diary/20260423.md`、`blog/実装内容を反映したPR下書きを作るPullRequestWriterAgentを整備した.md` です
