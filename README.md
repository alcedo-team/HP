# Alcedo ポートフォリオサイト

慶應理工発ハッカソンチーム「Alcedo（アルケド）」のサイト。静的な HTML / CSS / JS だけで動く（ビルド不要）。

## 見る

```bash
python3 -m http.server 8787
```

ブラウザで http://localhost:8787/ を開く。`file://` で開くと `fetch` 等は使っていないので表示はできるが、動作確認は http サーバー経由で行う。

## 構成

| パス | 内容 |
|---|---|
| `index.html` | ページ本体（単一ページ） |
| `css/style.css` | 色・書体はすべて `:root` の CSS 変数 |
| `js/data.js` | **メンバー・年表・作品の数字・メール**。差し替えはここだけ |
| `js/hero.js` | 開いたときのカワセミの飛翔 |
| `js/main.js` | ナビ・出現・新幹線・Works・Journey・カウント・メール |
| `assets/char/` | キャラクター画像（下記） |
| `assets/works/` | 作品のスクリーンショット |
| `docs/design-brief.md` | デザイン方針と仕様（正本） |
| `docs/screenshots/` | 動作確認の全画面画像（1440 / 390） |

## データの直し方（`js/data.js`）

- メンバー: `members` 配列。`role` と `note` を空文字にすると画面に出ない。`links` に `{ label, url }` を足すとリンクが出る
- 年表: `journey` 配列。`next: true` の要素が「次の駅」
- メール: `mail: ["ローカル部", "ドメイン"]`（bot 収集を避けるため分割）

## 画像について

- `assets/char/original.jpg` はメンバーが描いた原画
- `flying.png` / `question.png` / `exclaim.png` / `train.png` は、その原画をもとに画像生成（Codex の画像生成ツール）で別の向き・姿勢に派生させたもの
- 作品のスクリーンショットは各リポジトリから流用

## 公開（GitHub Pages）

リポジトリの Settings → Pages で、ブランチ `main` の `/ (root)` を指定する。相対パスだけで組んであるので、サブパス配信でも動く。
