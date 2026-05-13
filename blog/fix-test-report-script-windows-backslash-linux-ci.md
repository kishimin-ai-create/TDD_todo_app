# `test:report` スクリプトの Windows バックスラッシュが Linux CI で Cannot find module エラーを起こした（frontend / backend 両方）

## エラー概要

GitHub Actions（Ubuntu ランナー）上で `npm run test:report` を実行すると、frontend と backend の両方で同じ種類のエラーが発生していた。

**frontend:**
```
Error: Cannot find module '/home/runner/work/TDD_todo_app/TDD_todo_app/frontend/..scriptsmerge-vitest-reports.cjs'
```

**backend:**
```
Error: Cannot find module '/home/runner/work/TDD_todo_app/TDD_todo_app/backend/..scriptsmerge-vitest-reports.cjs'
```

どちらのパスにも `..scripts` という壊れた文字列が現れており、本来あるべき `../scripts/` のスラッシュが完全に消えている。

## 原因

`frontend/package.json` と `backend/package.json` の両方の `test:report` スクリプトに、Windows のパス区切り文字であるバックスラッシュが使われていた。

```json
// frontend/package.json（修正前）
"test:report": "npm run test:report:small && npm run test:report:medium && node ..\\scripts\\merge-vitest-reports.cjs ..."

// backend/package.json（修正前）
"test:report": "npm run test:report:unit && npm run test:report:integration && node ..\\scripts\\merge-vitest-reports.cjs ..."
```

Windows 環境では `node ..\scripts\merge-vitest-reports.cjs` と解釈されて動作するが、Linux（GitHub Actions）では `\` はパス区切り文字ではなくエスケープ文字として扱われる。その結果、`..\\scripts\\` が展開されると `..scripts` という無効なパスになり、Node.js がモジュールを見つけられずにクラッシュした。

### なぜ `..scripts` になるのか

Linux シェルが `\\s` を `s`、`\\m` を `m` のように各バックスラッシュシーケンスを1文字として処理するため、`..\\scripts\\merge-vitest-reports.cjs` は `..scriptsmerge-vitest-reports.cjs` に潰れてしまう。これがエラーメッセージで見えた壊れたパスの正体だ。

## 修正内容

両ファイルでバックスラッシュをフォワードスラッシュに置き換えた。各ファイルで1行のみの変更。

**frontend/package.json:**
```json
// 修正後
"test:report": "npm run test:report:small && npm run test:report:medium && node ../scripts/merge-vitest-reports.cjs test-result.small.json test-result.medium.json test-result.json --delete-sources"
```

**backend/package.json:**
```json
// 修正後
"test:report": "npm run test:report:unit && npm run test:report:integration && node ../scripts/merge-vitest-reports.cjs test-result.unit.json test-result.integration.json test-result.json --delete-sources"
```

フォワードスラッシュ `/` は Windows・Linux・macOS のすべてで有効なパス区切り文字であるため、この変更でクロスプラットフォーム互換性が確保される。Node.js 自身も内部で `path.resolve` 等を通じてフォワードスラッシュを正規化するため、Windows でも問題なく動作する。

## まとめ

| 項目 | 内容 |
|------|------|
| **発生場所** | `frontend/package.json` および `backend/package.json` の `test:report` スクリプト |
| **症状** | Linux CI で `Cannot find module` エラー |
| **根本原因** | npm スクリプト内のパスに Windows バックスラッシュを使用 |
| **修正** | `..\\scripts\\` → `../scripts/` に置換（各ファイル1行変更） |
| **教訓** | `package.json` のスクリプトに記述するパスは、CI が Linux で動く限りフォワードスラッシュで統一する |

npm スクリプトはシェルを介して実行されるため、パスの記述方法はホスト OS の影響を直接受ける。Windows ローカルで開発して Linux CI に投げる構成では、パス区切り文字の違いが見落とされやすい。frontend だけでなく backend にも同じ問題が潜んでいたように、モノレポ構成では全パッケージの `package.json` を横断的に確認することが重要だ。`package.json` のスクリプトを書くときは、常にフォワードスラッシュを使うことを習慣にしておくとよい。
