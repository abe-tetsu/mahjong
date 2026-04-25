# 麻雀点数計算

ブラウザで動く麻雀の精算点・場代・順位集計ツール。元は Google Sheets + GAS で運用していたものを Web アプリ化した。

公開URL: <https://mahjong.abetetsu.net>

## 機能

- 半荘記録の入力（30 半荘まで、風と点数）
- 精算点の計算（五捨六入 + 順位点 + 誤差調整）
- 場代込みの円換算とチップ精算
- 順位集計と平均順位
- 平均得点・最高得点
- 設定とプレイヤー名は localStorage に自動保存

## ディレクトリ構成

```
mahjong/
├── index.html          エントリ HTML
├── style.css           スタイル
├── js/
│   ├── constants.js    定数
│   ├── calc.js         純粋計算（DOM 非依存）
│   ├── inputs.js       入力収集と半荘テーブル生成
│   ├── render.js       結果描画とプレイヤー名反映
│   ├── storage.js      localStorage 永続化
│   └── main.js         エントリポイント
├── test/
│   └── calc.test.js    calc.js のユニットテスト
├── package.json        type: module 指定とテストスクリプト
├── Dockerfile          nginx で静的ファイル配信
├── nginx.conf          nginx 設定
├── Makefile            ローカル/Docker/デプロイ/テスト
├── .dockerignore
└── .gcloudignore
```

## 必要な環境

| ツール | 用途 |
|--------|------|
| Python 3 | `make local` で静的ファイル配信 |
| Node.js 18+ | `make test` でユニットテスト |
| Docker | `make docker_local` で本番同等環境を確認 |
| gcloud CLI | `make deploy` で Cloud Run にデプロイ |

## ローカル開発

```sh
make local         # http://localhost:8080 で配信
make docker_local  # 本番と同じ nginx コンテナで配信
```

`make local` は `python3 -m http.server` を使う。ファイル変更後はブラウザでリロードする。

## テスト

```sh
make test          # node --test test/*.test.js
```

`calc.js` の純粋計算ロジックを Node 標準テストランナーで検証する。29 ケース。

DOM に依存する `inputs.js` / `render.js` / `storage.js` のテストは未整備。

## デプロイ

```sh
make deploy        # Cloud Run にデプロイ
make logs          # Cloud Run のログを取得
```

GCP プロジェクト・リージョン・サービス名は Makefile の変数で上書きできる。

```sh
make deploy PROJECT_ID=other-project REGION=us-central1
```

### ドメインマッピング

`mahjong.abetetsu.net` は Cloud Run のドメインマッピング機能で `mahjong` サービスにルーティングしている。Cloudflare 側の DNS は `CNAME mahjong → ghs.googlehosted.com`（DNS のみ、プロキシ無効）。

ドメインマッピングを変更する場合:

```sh
gcloud beta run domain-mappings create \
  --service=mahjong \
  --domain=mahjong.abetetsu.net \
  --region=asia-northeast1 \
  --project=subscreen
```

## アーキテクチャ

UI はプレーン HTML/CSS/JS で構成し、ビルド工程を持たない。JS は ES モジュールで分割し、`<script type="module" src="js/main.js">` から読み込む。

依存関係:

```
constants.js ← 全モジュール
calc.js      ← main.js
inputs.js    ← render.js, storage.js, main.js
render.js    ← main.js
storage.js   ← main.js
```

`calc.js` は DOM に触れない純粋関数のみ。テスト容易性と再利用性のため、計算ロジックと DOM 操作を分離している。

## 設定項目

| 項目 | 内容 | デフォルト |
|------|------|-----------|
| 返し | オカ計算の基準点 | 25,000 |
| 順位点 | 1〜4 位への加算ポイント | +30 / +10 / -10 / -30 |
| レート | 1,000 点あたりの円換算 | 50 円 |
| 場代総額 | 1 セッションの卓代 | 3,000 円 |
| 場代債務者 | 場代を立て替えるプレイヤー | 未指定 |
| チップ有無 | チップ精算を行うか | 無効 |
| チップレート | チップ 1 枚あたりの円 | 100 円 |

## 元 GAS 実装との対応

Web アプリ化前は以下の GAS 関数で計算していた。

| GAS 関数 | 移植先 |
|----------|--------|
| `CALCPOINTS` | `calc.js` の `calcPoints` |
| `RENTCOST` | `calc.js` の `rentCost` |
| `COUNTRANK` | `calc.js` の `countRank` |
| `AVERAGEMAXPOINTS` | `calc.js` の `averageMaxPoints` |
| `updateSheet` | 不要（自動再計算のため） |

GAS 実装の制約（同順位処理は 1 ペアまで等）はそのまま引き継いでいる。
