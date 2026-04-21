# testingLibrary is not definedがeslint.config.jsで出たときの原因

## エラー

`npm run lint` 実行時に、frontend の `eslint.config.js` で `ReferenceError: testingLibrary is not defined` が発生しました。

## 原因

`eslint.config.js` のテスト用設定で `...testingLibrary.configs["flat/react"]` を使っていた一方で、`testingLibrary` 自体の import がありませんでした。  
つまり設定の参照だけ先に存在していて、変数定義が追いついていない状態でした。

## ユーザーの考え

> const testingLibrary = require('eslint-plugin-testing-library');
> これをesm importにしてから追加お願いします

この考え方は正しく、やるべきことは「`testingLibrary` を使うなら、CommonJS ではなく ESM の `import` で明示的に読み込む」ことでした。

## 修正

- `frontend/eslint.config.js` に  
  `import testingLibrary from "eslint-plugin-testing-library";`  
  を追加
- 既存の `...testingLibrary.configs["flat/react"]` とつながる形にした

## 対策

Flat Config では、設定オブジェクト内で使う plugin や config は、**参照前に必ず import されていること**を確認するべきです。  
特に ESLint 設定は実行時に評価されるため、未定義変数はそのまま即失敗につながります。

## ユーザーが身につけるべきこと

- ESLint 設定ファイルも通常の JavaScript と同じく、未定義変数を参照すると落ちる
- `...plugin.configs[...]` を使うなら、その plugin の import が必要
- 設定変更では「どこで使っているか」と「どこで読み込んでいるか」をセットで見ると切り分けしやすい
