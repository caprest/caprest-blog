const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const siteConfig = {
  name: "Caprest Blog",
  author: "Caprest",
  description: "メモや記事を公開する個人ブログ。",
  locale: "ja_JP",
  url: siteUrl,
};

export const absoluteUrl = (pathname = "/") =>
  `${siteConfig.url}${pathname === "/" ? "" : `/${pathname.replace(/^\/+/, "")}`}`;

export const withBasePath = (path: string) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}${path}`;
};
