# GitHub Copilot CLI向けにリポジトリ専用エージェントと運用ルールを整備した

## 対象読者

- GitHub Copilot CLI をリポジトリ運用に組み込みたい人
- `.github/` 配下で custom agent / prompt / instructions を整理したい人
- レビュー対応、記事作成、OpenAPI 更新のような定型作業を Copilot に寄せたい人

## この記事で扱うこと / 扱わないこと

### 扱うこと

- このリポジトリで追加した Copilot 向け custom agent と prompt
- 設計書、レビューコメント、保護対象ファイルの扱いをどうルール化したか
- Copilot CLI で運用してみて詰まった点と、その回避方法

### 扱わないこと

- GitHub Copilot CLI 自体のインストール手順
- 各エージェントの内部実装をさらに自動化する仕組み
- OpenAPI や記事の本文品質そのものの評価

## 背景

このリポジトリでは、実装だけでなく次のような周辺作業も定期的に発生します。

- 実装内容を技術記事にまとめる
- backend API 変更後に OpenAPI を更新する
- レビューコメントを見て、修正か返信かを判断する
- これまでの作業内容を素早く要約する

これまでは、これらの手順が会話ベースで散らばりやすく、毎回同じ指示を繰り返す必要がありました。そこで `.github/` 配下に **役割ごとの custom agent と運用ルール** を追加して、Copilot がリポジトリ固有の流れを前提に動けるようにしました。

## 今回追加・整理したもの

## 1. 記事作成を任せる `ArticleWriterAgent`

記事化用のエージェントを追加し、出力先を `blog/` に固定しました。

- 記事ファイルの出力先: `blog/`
- エージェント定義: `.github/agents/ArticleWriterAgent.agent.md`
- prompt: `.github/prompts/write-article.prompt.md`

このエージェントには、単に要約を書くのではなく、次のような執筆ルールも持たせています。

- 先にテーマを決める
- 次に記事の段落構成を決める
- 対象読者に応じて説明粒度を変える
- エラー記事は **1つの意味・根本原因につき1記事** にする

記事の書き方ルールは `AGENTS.md` にも反映し、記事専用エージェントだけでなく、全体の振る舞いとしても参照しやすくしました。

## 2. API 実装後の OpenAPI 更新を任せる `OpenApiWriterAgent`

backend 側には API 仕様書があり、さらに `hono-openapi` 依存も入っていました。一方で、「API 実装が終わったあとに OpenAPI を必ず更新する」という運用は明文化されていませんでした。

そこで次を追加しました。

- エージェント定義: `.github/agents/OpenApiWriterAgent.agent.md`
- 既定の出力先: `docs/spec/backend/openapi.yaml`
- 共通ルール: `.github/instructions/copilot-instructions.md`

このエージェントは、実装コード、validator、既存 spec を読み、**実装済みの API 振る舞いを優先して OpenAPI を作る** 前提にしています。

あわせて共通指示側にも、**backend API の変更が入ったら同じタスク内で OpenAPI も更新する** というルールを追加しました。

## 3. 作業の要約を任せる `WorkSummaryAgent`

「ここまで何をやったか」を一覧で見たい場面が多かったので、要約用のエージェントも追加しました。

- エージェント定義: `.github/agents/WorkSummaryAgent.agent.md`

当初は `.github/prompts/summarize-work.prompt.md` を追加して `/summarize-work` のように呼ぶ想定でしたが、Copilot CLI ではこの prompt file がそのまま slash command として認識されず、`Unknown command` になりました。

このため、CLI では確実に使える形として `@WorkSummaryAgent` を追加し、`.github/README.md` でも **Copilot CLI では `@AgentName` を優先する** 方針に修正しました。

ここは今回の作業の中でも、実際にハマったポイントです。

## 4. レビューコメント対応を任せる `ReviewResponseAgent`

レビューコメントを `review/` 配下に置く前提で、修正と返信文作成の両方を担当するエージェントを追加しました。

- エージェント定義: `.github/agents/ReviewResponseAgent.agent.md`
- レビュー入力元: `review/`

このエージェントは、各コメントについて次を判断します。

- コード修正すべきか
- 返信だけでよいか
- 追加確認が必要か

さらに、返信文の出力形式もルール化しました。  
**各修正点や disposition の直下に返信文を書く** ようにして、別セクションに返信だけがまとまらないようにしています。

## 5. 保護対象ファイルと参照先のルール整理

Copilot に毎回自由に触らせるのではなく、触ってほしくないファイルもルール化しました。

- 保護対象一覧: `.github/rules/protected-paths.md`
- 現在の保護対象:
  - `AGENTS.md`
  - `README.md`

また、リポジトリ内の参照先も整理しています。

- 設計書の既定参照先: `docs/design/`
- レビューコメントの既定参照先: `review/`

これらは `.github/instructions/copilot-instructions.md` に明記し、実装・レビュー・ドキュメント作成時にどこを一次参照先にするかをはっきりさせました。

## 6. `.github/README.md` に運用を集約

custom agent や prompt を増やすだけだと、使い方が分からなくなりやすいので、`.github/README.md` を新規作成しました。

ここには次を載せています。

- 使える custom command / custom agent の一覧
- 呼び出し例
- 各機能の役割

加えて、**新しいカスタムコマンドを追加したら、この README に同じタスク内で使い方を追記する** ルールも入れています。

## この構成にした理由

今回の狙いは、Copilot を「なんでも自由に触るアシスタント」にすることではなく、**リポジトリの運用に沿った役割分担を持つ存在にすること** でした。

そのために、以下を分けています。

- **agent**: 役割が明確で、ある程度まとまった仕事をするもの
- **prompt**: 軽量で再利用しやすい指示
- **instructions**: リポジトリ全体の前提ルール
- **rules**: 保護対象や運用の一覧

特に Copilot CLI では、IDE 向けの prompt file の感覚をそのまま持ち込むとズレることがありました。今回の `/summarize-work` のように、**prompt は定義できても CLI の slash command にはならないケースがある** ので、CLI で常用するものは `@AgentName` 前提に寄せた方が扱いやすいと感じました。

## 進めるときに気をつけたこと

- unsupported な仕様を前提にしない
- 設計意図が必要なときは `docs/design/` を先に見る
- レビュー対応では `review/` を一次情報として扱う
- 保護対象ファイルは、明示依頼がない限り編集しない
- README を更新して、運用ルールを後から見返せるようにする

## まとめ

GitHub Copilot CLI をリポジトリに馴染ませるには、モデルの性能に期待するだけでなく、**どの情報を見て、どこまで触ってよくて、どの作業を誰に任せるか** を `.github/` 配下で整理しておくのが重要でした。

今回の変更で、このリポジトリでは少なくとも次の流れを共通化できました。

- 実装内容を記事にする
- API 実装後に OpenAPI を更新する
- 作業内容を要約する
- レビューコメントを修正と返信に落とし込む

Copilot を単なる会話相手ではなく、**リポジトリ運用に合わせた専用エージェント群** として扱いたい場合は、custom agent、instructions、rules、README をセットで整備すると運用しやすくなります。
