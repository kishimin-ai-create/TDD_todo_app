# GitHub Copilot CLI向けにリポジトリ専用エージェントと運用ルールを整備した

## 対象読者

- GitHub Copilot CLI をリポジトリ運用に組み込みたい人
- `.github/` 配下で agent / prompt / instructions / rules を整理したい人
- 記事作成、OpenAPI 更新、レビュー対応のような定型作業を分担したい人

## テーマ

GitHub Copilot CLI を「汎用チャット」ではなく、このリポジトリ専用の作業者として動かすために、役割ごとのエージェントと共通ルールをどう整理したかをまとめます。

## この記事で扱うこと / 扱わないこと

### 扱うこと

- `.github/agents/` に追加・整理した custom agent の役割
- `.github/instructions/` と `.github/rules/` に寄せた運用ルール
- Copilot CLI で使うときに実際に詰まった点

### 扱わないこと

- GitHub Copilot CLI 自体の導入手順
- 各エージェントの内部実装をさらに自動化する仕組み
- OpenAPI や記事本文の品質評価

## 問題背景

このリポジトリでは、実装以外にも次のような作業が繰り返し発生します。

- 実装内容を技術記事にまとめる
- backend の API 実装後に OpenAPI を更新する
- `review/` の指摘を読んで、修正と返信を整理する
- ここまでの作業を日本語で要約する

これらを毎回会話ベースで指示すると、同じ説明を繰り返しやすく、参照先もぶれやすい状態でした。

## 原因または制約

今回の整理では、Copilot CLI 側の制約も考える必要がありました。

- prompt file は定義できても、CLI で必ず `/...` コマンドになるわけではない
- protected path や設計書、レビューコメントの参照先を明示しないと、毎回前提説明が必要になる
- 定型作業ごとに期待する出力形式を決めておかないと、同じ作業でも結果がぶれやすい

実際に `.github/prompts/summarize-work.prompt.md` を置いたあとも、CLI ではそのまま slash command として扱えず、`@WorkSummaryAgent` を優先する構成に寄せています。

## 解決策

役割ごとに custom agent を分け、共通ルールは instructions と rules に集約しました。

- `ArticleWriterAgent`: 技術記事を `blog/` に出力する
- `OpenApiWriterAgent`: backend 実装をもとに `docs/spec/backend/openapi.yaml` を更新する
- `WorkSummaryAgent`: 作業内容を日本語で要約する
- `ReviewResponseAgent`: `review/` を入力に修正方針と返信文をまとめる

そのうえで、共通ルールとして次を `.github/instructions/copilot-instructions.md` と `.github/rules/protected-paths.md` に寄せました。

- protected path は明示依頼がない限り編集しない
- 設計の一次参照先は `docs/design/`
- レビューの一次参照先は `review/`
- backend API の変更時は OpenAPI 更新も同じタスクで扱う

## 実装の要点

### 1. 記事作成の役割を `ArticleWriterAgent` に分離

`.github/agents/ArticleWriterAgent.agent.md` では、記事のテーマ決め、対象読者、構成、`blog/` への出力先まで固定しています。記事を単なる要約ではなく、変更理由と実装意図まで説明する前提にした点が要点です。

### 2. OpenAPI 更新を `OpenApiWriterAgent` に分離

backend には `hono-openapi` 依存があり、仕様書の出力先も `docs/spec/backend/openapi.yaml` に定まっています。そこで「実装済みの API 振る舞いを優先して spec を更新する」役割を agent として切り出しました。

### 3. CLI では `@AgentName` を優先

`.github/CUSTOM_COMMANDS.md` にもある通り、Copilot CLI では prompt file が slash command として出ない場合があります。そのため、継続的に使う機能は `@ArticleWriterAgent` や `@WorkSummaryAgent` のように agent 呼び出しを中心に整理しました。

### 4. 参照先と保護対象をルール化

共通指示側で設計書、レビューコメント、protected path の扱いを定義し、README では呼び出し方をまとめています。これで「どこを見るか」と「どこを触らないか」を会話の外に出せるようになりました。

## 気をつけたいこと

- prompt file を置いただけでは、CLI でそのまま slash command になるとは限りません
- agent を増やしたら `.github/CUSTOM_COMMANDS.md` の呼び出し例も一緒に更新したほうが運用しやすくなります
- protected path の定義は `rules` と `instructions` の両方を見て、運用上の前提を揃える必要があります

## まとめ

今回の変更の中心は、Copilot に自由に触らせることではなく、リポジトリ運用に沿った役割を持たせることでした。

- 作業ごとに agent を分ける
- 共通前提は instructions / rules に寄せる
- CLI で安定して使える呼び出し方を README に残す

この形にしておくと、実装以外の反復作業もリポジトリ固有の前提込みで任せやすくなります。
