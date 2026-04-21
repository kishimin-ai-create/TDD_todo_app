# require is not defined in ES module scopeをeslint設定で踏んだときの整理

## エラー

`npm run lint` 実行時に、frontend の `eslint.config.js` で  
`ReferenceError: require is not defined in ES module scope`  
が発生しました。

## 原因

`frontend/package.json` には `"type": "module"` があり、`eslint.config.js` は ESM として評価されます。  
その状態で `const jsxA11y = require("eslint-plugin-jsx-a11y");` のような CommonJS の `require` を使っていたため、ES module scope では未定義として失敗しました。

## ユーザーの考え

> const jsxA11y = require("eslint-plugin-jsx-a11y");
> これをimport fromで書き直して

この判断は正しく、原因は React や ESLint 本体ではなく、**ESM の設定ファイルに CommonJS の書き方が残っていたこと**でした。

## 修正

- `frontend/eslint.config.js` の  
  `const jsxA11y = require("eslint-plugin-jsx-a11y");`  
  を削除
- 代わりに  
  `import jsxA11y from "eslint-plugin-jsx-a11y";`  
  を追加

## 対策

`"type": "module"` のプロジェクトでは、設定ファイルも基本的に ESM で統一したほうが安全です。  
`require` が残っていないかを lint 設定や build 設定でも確認すると、CI での初回失敗を減らせます。

## ユーザーが身につけるべきこと

- `.js` ファイルでも `"type": "module"` があると ESM として扱われる
- ESM では `require` ではなく `import ... from ...` を使う
- アプリ本体だけでなく、`eslint.config.js` のような設定ファイルも module system の影響を受ける
