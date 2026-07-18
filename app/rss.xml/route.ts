import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (char) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '\"': "&quot;",
  })[char] ?? char);
}

export function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  const items = getAllPosts().map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/posts/${post.slug}/</link>
      <guid>${siteUrl}/posts/${post.slug}/</guid>
      <pubDate>${new Date(`${post.date}T00:00:00+09:00`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`).join("");

  const body = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0"><channel>
    <title>${siteConfig.name}</title>
    <link>${siteUrl}</link>
    <description>${siteConfig.description}</description>
    <language>ja</language>${items}
  </channel></rss>`;

  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
