import Link from "next/link";
import type { Post } from "@/lib/posts";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      <div className="post-meta">
        <time dateTime={post.date}>{post.displayDate}</time>
        <span>{post.readingTime}</span>
      </div>
      <h2><Link href={`/posts/${post.slug}/`}>{post.title}</Link></h2>
      <p>{post.description}</p>
      <ul className="tag-list" aria-label="タグ">
        {post.tags.map((tag) => (
          <li key={tag}><Link href={`/tags/${encodeURIComponent(tag)}/`}>#{tag}</Link></li>
        ))}
      </ul>
    </article>
  );
}
