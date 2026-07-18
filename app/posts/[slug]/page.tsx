import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "@/lib/posts";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const postPath = `/posts/${post.slug}/`;
  const socialImage = {
    url: absoluteUrl(`/og/${post.slug}.png`),
    width: 1200,
    height: 630,
    alt: post.title,
  };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: absoluteUrl(postPath) },
    openGraph: {
      type: "article",
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      title: post.title,
      description: post.description,
      url: absoluteUrl(postPath),
      publishedTime: `${post.date}T00:00:00+09:00`,
      authors: [siteConfig.author],
      tags: post.tags,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [socialImage],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="article-page">
      <header className="article-header">
        <Link className="back-link" href="/">← Posts</Link>
        <div className="article-kicker">
          <time dateTime={post.date}>{post.displayDate}</time>
          <span>{post.readingTime}</span>
        </div>
        <h1>{post.title}</h1>
        <p className="article-description">{post.description}</p>
        <ul className="tag-list" aria-label="タグ">
          {post.tags.map((tag) => (
            <li key={tag}><Link href={`/tags/${encodeURIComponent(tag)}/`}>#{tag}</Link></li>
          ))}
        </ul>
      </header>
      <div className="prose" dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
      <nav className="article-end" aria-label="記事を読み終えた後のナビゲーション">
        <Link href="/">← 記事一覧へ戻る</Link>
      </nav>
    </article>
  );
}
