**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Use feature-slug naming when called by Orchestrator**

`OrchestratorAgent` now requires the review artifact name to be `review/{feature-slug}-{YYYYMMDD}.md` with a kebab-case slug (`.github/agents/OrchestratorAgent.agent.md:66-69`), but this rule tells `CodeReviewAgent` to use the raw spec feature name (example: `Todoリスト取得`). In runs where the spec title is not already kebab-case, `CodeReviewAgent` will save a different filename than Orchestrator expects, so the Review phase’s file-existence check can fail and block the workflow from completing.

Useful? React with 👍 / 👎.

ご指摘ありがとうございます。OrchestratorAgent 経由の呼び出し時は feature 名から kebab-case の slug を使うよう、CodeReviewAgent のファイル命名ルールを更新しました。これで Review フェーズの存在確認と同じ命名規則に揃えています。
