# backendでlibをESだけにしたらHonoとVitestの型が大量に落ちたときの整理

## 対象読者

- backend の TypeScript 設定を見直している人
- Hono と Vitest を使ったプロジェクトで `tsconfig.json` の `lib` を調整している人
- レビュー指摘に対応したあと、別の TypeScript エラーが大量に出て困った人

## エラー概要

レビュー指摘を受けて、`backend/tsconfig.json` に `target` / `lib` を追加したあと、`npm run typecheck` で大量の型エラーが発生した。

もともとの意図は、`target` / `lib` 未指定によって TypeScript が ES5 前提で解釈され、`Promise` まわりで失敗する状態を解消することだった。しかし `lib` を `["ES2022"]` にすると、今度は別の型がまとめて見つからなくなった。

実際に出たエラーは次のようなものだった。

```text
Error: node_modules/@vitest/runner/dist/tasks... error TS2304: Cannot find name 'AbortSignal'.
Error: node_modules/@vitest/utils/dist/timers... error TS2304: Cannot find name 'setTimeout'.
Error: node_modules/hono/dist/types/client/types... error TS2304: Cannot find name 'Response'.
Error: node_modules/hono/dist/types/context... error TS2304: Cannot find name 'Request'.
```

今回の状況で重要だったのは、アプリ本体の型エラーではなく、**`vitest` や `hono` の型定義が前提にしているグローバル型が落ちていた** ことだった。

関連ファイル:

- `backend/tsconfig.json`
- `review/Master-20260421.md`

## 原因

原因は、`lib` を **`["ES2022"]` だけにしてしまったこと** だった。

`ES2022` を入れることで `Promise` などの ES 系 API は解決できる。一方で、Hono や Vitest は次のような Web / DOM 系のグローバル型も参照している。

- `AbortSignal`
- `setTimeout`
- `Request`
- `Response`
- `Headers`
- `URLSearchParams`

つまり、`Promise` エラーを直すために ES 系 `lib` を足しただけでは不十分で、**依存ライブラリが必要とする DOM 系 `lib` まで含めて維持する必要があった**。

今回のように `backend` という名前だけを見ると、「DOM は不要そう」と考えがちだが、実際には Hono の型定義や Vitest のタイマー関連定義が Web / DOM 系グローバルを使っているため、単純に削れなかった。

## 結論

`backend/tsconfig.json` の `lib` は、最終的に次の形にした。

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx"
  }
}
```

ポイントは次の 2 つ。

1. `target` を上げることと、必要な `lib` を維持することは別問題
2. Hono / Vitest が参照する型定義まで含めて `tsconfig` を考える必要がある

今回のケースでは、**`ES2022` で Promise 系を解決しつつ、`DOM` / `DOM.Iterable` で Hono と Vitest の前提型を戻す** のが正しい落としどころだった。

## まとめ

レビュー指摘に対応して TypeScript 設定を直すとき、最初のエラーだけを見ると修正が不完全になりやすい。今回も `Promise` エラーは消えたが、その代わりに `Request` や `Response`、`AbortSignal` などの型が大量に落ちた。

この経験から、`tsconfig.json` の `lib` を調整するときは次を意識したい。

- 直したいエラーだけでなく、依存ライブラリの型定義が何を前提にしているかも見る
- backend でも Web / DOM 系 `lib` が必要なケースは普通にある
- 設定変更後は、エラーの件数だけでなく **エラーの種類が切り替わっていないか** を確認する

`target` / `lib` の変更は小さく見えても影響範囲が広いので、依存型定義まで含めて確認する前提で進めるのが安全だった。
