## Title

PR下書き生成フローとPRテンプレート運用を整備

## Summary

リポジトリの変更内容から PR 下書きを作成する `PullRequestWriterAgent` を追加し、PR テンプレート運用も合わせて整備しました。あわせて、GitHub が認識する PR テンプレート名への修正、関連参照の更新、テンプレート先頭への `## Title` 追加を行い、`pull-request/` 配下で一貫した PR ドラフトを管理できるようにしています。

## Related Tasks

TBD

## What was done

- `.github/agents/PullRequestWriterAgent.agent.md` を追加し、PR 下書きを作成するカスタムエージェントを定義
- 変更ファイル、diff、spec、tests、task context をもとに PR 本文を組み立てる方針を定義
- 出力先を `pull-request/` 配下の Markdown に固定
- `.github/pull_request_template.md` を PR テンプレートとして整備し、GitHub が認識するファイル名にそろえるため `.github/pull-request_template.md` からリネーム
- 関連参照を `.github/pull_request_template.md` に更新
- テンプレートに `## Title` セクションを追加
- `.github/pull_request_template.md` の見出し構成に合わせて、`Title` / `Summary` / `Related Tasks` / `What was done` / `What is not included` / `Impact` / `Testing` / `Notes` を使うルールを定義
- 出力ファイル名を、実装内容を表す PR タイトルから生成するルールに更新
- 関連する記録として `diary/20260423.md` と `blog/実装内容を反映したPR下書きを作るPullRequestWriterAgentを整備した.md`、`blog/GitHubのPRテンプレート認識をファイル名修正でそろえた.md` を追加

## What is not included

- 実際の GitHub Pull Request の作成や送信
- 既存の他エージェントの挙動変更
- このエージェントを使った運用結果の評価や追加改善
- PR テンプレート構成以外のレビュー運用変更

## Impact

- PR 説明文の下書きを、リポジトリ内の実装文脈に沿って一定の形式で作成しやすくなります
- GitHub の PR テンプレート認識と、エージェント・記録ファイル側の参照先が一致します
- `pull-request/` 配下のファイル名から内容を把握しやすくなります
- 影響範囲は主にドキュメント生成フロー、PR テンプレート、およびカスタムエージェント定義です

## Testing

テスト実行はこの変更範囲からは確認できていないため、TBD

## Notes

- PR テンプレートは `.github/pull_request_template.md` を基準にしています
- 関連ファイルは `.github/agents/PullRequestWriterAgent.agent.md`、`.github/pull_request_template.md`、`diary/20260423.md`、`blog/実装内容を反映したPR下書きを作るPullRequestWriterAgentを整備した.md`、`blog/GitHubのPRテンプレート認識をファイル名修正でそろえた.md` です
