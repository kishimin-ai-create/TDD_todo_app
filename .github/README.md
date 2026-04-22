# Custom commands

This repository defines reusable Copilot custom commands under `.github/`.

## How to use prompt commands

Prompt files are stored in `.github/prompts/`.

> [!NOTE]
> Prompt files may work in Copilot Chat surfaces that support repository prompt
> files, but they are not guaranteed to appear as `/...` commands in Copilot
> CLI. For Copilot CLI, prefer the `@AgentName` commands documented below.

### `/write-article`

Generate a Japanese technical article from repository changes.

Example:

```text
/write-article Zenn 向けに、直近の frontend の変更を初心者向けに記事化して
```

Behavior:

- Uses `ArticleWriterAgent`
- Saves the generated article under `blog/`
- Reports the generated file path in chat

### `/summarize-work`

Summarize what has been done so far in this repository and the current session.

Example:

```text
/summarize-work this session
```

Other examples:

```text
/summarize-work backend only
/summarize-work recent changes
```

Behavior:

- Summarizes work in Japanese
- Prioritizes current conversation context
- Also checks the current working tree and changed files when needed

## How to use custom agents

Custom agents are stored in `.github/agents/` and are invoked from Copilot Chat
with `@AgentName`.

### `@ArticleWriterAgent`

Create a Japanese technical article from completed work and save it under
`blog/`.

Example:

```text
@ArticleWriterAgent 直近の変更を blog フォルダに記事として出力して
```

### `@OpenApiWriterAgent`

Create or update an OpenAPI document for implemented backend APIs.

Example:

```text
@OpenApiWriterAgent 直近の backend API 変更から OpenAPI を作成して
```

Behavior:

- Writes the spec to `docs/spec/backend/openapi.yaml`
- Uses implemented backend behavior as the source of truth

### `@WorkSummaryAgent`

Summarize what has been done so far in this repository or current session.

Example:

```text
@WorkSummaryAgent this session
```

Other examples:

```text
@WorkSummaryAgent backend only
@WorkSummaryAgent recent changes
```

## Notes

- Prompt commands are best for lightweight repeatable tasks.
- Custom agents are better when the task needs a specialized role or structured
  output.
- If you add a new prompt or agent, document the invocation example here.
- When you add a custom command, always update this file in the same task with
  its usage, invocation example, and output behavior.
