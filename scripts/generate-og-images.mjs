import fs from "node:fs";
import path from "node:path";
import React from "react";
import matter from "gray-matter";
import { ImageResponse } from "next/og.js";

const root = process.cwd();
const postsDirectory = path.join(root, "content/posts");
const outputDirectory = path.join(root, "public/og");
const font = fs.readFileSync(path.join(root, "assets/fonts/NotoSansCJKjp-Regular.otf"));
const latinFont = fs.readFileSync(path.join(root, "assets/fonts/NotoSans-Latin-Regular.ttf"));
const size = { width: 1200, height: 630 };

const colors = {
  background: "#f5f1e8",
  foreground: "#18201d",
  muted: "#69736f",
  accent: "#c84b31",
};

function element(type, props, ...children) {
  return React.createElement(type, props, ...children);
}

function card(title, description) {
  return element(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "76px 84px",
        background: colors.background,
        color: colors.foreground,
        fontFamily: "Noto Sans JP",
      },
    },
    element(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 20, fontSize: 28 } },
      element("div", { style: { width: 54, height: 8, background: colors.accent } }),
      element(
        "div",
        { style: { fontFamily: "Noto Sans Latin", fontWeight: 400, letterSpacing: "0.04em" } },
        "Caprest Blog",
      ),
    ),
    element(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 28 } },
      element(
        "div",
        {
          style: {
            fontSize: title.length > 32 ? 56 : 68,
            fontWeight: 700,
            lineHeight: 1.22,
            letterSpacing: "-0.025em",
          },
        },
        title,
      ),
      element(
        "div",
        { style: { fontSize: 28, lineHeight: 1.45, color: colors.muted } },
        description,
      ),
    ),
    element(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "flex-end",
          fontFamily: "Noto Sans Latin",
          fontSize: 22,
          color: colors.muted,
        },
      },
      "caprest.github.io",
    ),
  );
}

async function writeCard(fileName, title, description) {
  const response = new ImageResponse(card(title, description), {
    ...size,
    fonts: [
      {
        name: "Noto Sans JP",
        data: font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength),
        weight: 400,
        style: "normal",
      },
      {
        name: "Noto Sans Latin",
        data: latinFont.buffer.slice(
          latinFont.byteOffset,
          latinFont.byteOffset + latinFont.byteLength,
        ),
        weight: 400,
        style: "normal",
      },
    ],
  });
  fs.writeFileSync(path.join(outputDirectory, fileName), Buffer.from(await response.arrayBuffer()));
}

fs.mkdirSync(outputDirectory, { recursive: true });
await writeCard("default.png", "Caprest Blog", "メモや記事を公開する個人ブログ。");

for (const fileName of fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".md"))) {
  const slug = fileName.replace(/\.md$/, "");
  const { data } = matter(fs.readFileSync(path.join(postsDirectory, fileName), "utf8"));
  await writeCard(`${slug}.png`, String(data.title), String(data.description));
}
