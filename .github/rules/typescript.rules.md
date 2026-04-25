# TypeScript Rules

## Type Assertions (`as`)

- `as` による型アサーションは**禁止**
- どうしても使う必要がある場合は、**直前の行に理由を説明するコメントを必ず付ける**

```ts
// NG
const el = document.getElementById("app") as HTMLDivElement;

// OK — getElementById は null を返す可能性があるが、index.html で必ず存在することが保証されている
const el = document.getElementById("app") as HTMLDivElement;
```

## `any` 型

- `any` 型の使用は**禁止**
- どうしても使う必要がある場合は、**直前の行に理由を説明するコメントを必ず付ける**

```ts
// NG
function parse(raw: any) { ... }

// OK — 外部ライブラリの型定義が存在しないため一時的に any を使用している。型定義が追加され次第 unknown へ変更する
function parse(raw: any) { ... }
```

## 代替手段

`as` や `any` を使う前に以下を検討すること：

- `as` の代わりに型ガード関数（`instanceof`, `typeof`, カスタム type predicate）を使う
- `any` の代わりに `unknown` を使い、型ガードで絞り込む
- 型が本当に不明な場合は `unknown` → ガード → 具体型の流れで型安全に扱う
