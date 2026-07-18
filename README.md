# Caprest Blog

Next.jsで作った、GitHub Pages向けの静的ブログです。

## ローカルで確認

```bash
npm install
npm run dev
```

## 記事を追加

`content/posts/` にMarkdownファイルを追加します。

```md
---
title: "記事タイトル"
description: "一覧とSNSに表示する短い説明"
date: "2026-07-18"
tags: [日記, 制作]
---

ここから本文です。
```

ブログ名・著者名・説明文は `lib/site.ts` で変更できます。

## GitHub Pagesへ公開

1. この変更を `main` ブランチへマージします。
2. GitHubの **Settings → Pages → Build and deployment** で Source を **GitHub Actions** にします。
3. `Deploy blog to GitHub Pages` ワークフローを実行します。

プロジェクトPagesと `ユーザー名.github.io` の両方に対応し、パスはワークフロー内で自動設定されます。

## 執筆スキル

日本語記事の執筆・推敲用に、[k16shikano](https://github.com/k16shikano)氏の次のスキルを収録しています。

- [cognitive-rhythm-writing](https://gist.github.com/k16shikano/eb2929f13ed19c97188393d297be8432)
- [japanese-tech-writing](https://gist.github.com/k16shikano/fd287c3133457c4fd8f5601d34aa817d)

作者による[公開Gistのライセンス宣言](https://gist.github.com/k16shikano/67625f2a7d96e3bbdfae8d571a936063)に基づき、The Unlicenseで収録しています。詳細は [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) を参照してください。
