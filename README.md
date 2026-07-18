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
