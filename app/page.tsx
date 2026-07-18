import { PostCard } from "@/components/PostCard";
import { getAllPosts, getAllTags } from "@/lib/posts";
import Link from "next/link";

export default function Home() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <>
      <section className="intro">
        <h1>Blog</h1>
        <p>メモや記事を公開しています。</p>
      </section>

      <section className="archive" aria-labelledby="latest-heading">
        <div className="section-heading">
          <h2 id="latest-heading">Posts</h2>
          <p>{posts.length}件</p>
        </div>
        <div className="post-list">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <aside className="tag-cloud" aria-labelledby="tags-heading">
        <h2 id="tags-heading">Tags</h2>
        <div>
          {tags.map((tag) => (
            <Link key={tag} href={`/tags/${encodeURIComponent(tag)}/`}>#{tag}</Link>
          ))}
        </div>
      </aside>
    </>
  );
}
