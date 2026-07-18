import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { getAllPosts, getAllTags } from "@/lib/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const posts = getAllPosts().filter((post) => post.tags.includes(decodeURIComponent(tag)));

  return (
    <section className="archive tag-archive">
      <Link className="back-link" href="/">← すべての記事</Link>
      <div className="section-heading">
        <h1>#{decodeURIComponent(tag)}</h1>
        <p>{posts.length}件</p>
      </div>
      <div className="post-list">
        {posts.map((post) => <PostCard key={post.slug} post={post} />)}
      </div>
    </section>
  );
}
