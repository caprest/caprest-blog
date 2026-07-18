export const siteConfig = {
  name: "Caprest Blog",
  author: "Caprest",
  description: "メモや記事を公開する個人ブログ。",
  locale: "ja_JP",
};

export const withBasePath = (path: string) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}${path}`;
};
