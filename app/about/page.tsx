import Link from "next/link";

export const metadata = {
  title: "About",
  description: "このブログについて。",
};

export default function AboutPage() {
  return (
    <section className="about-page">
      <h1>About</h1>
      <div className="about-copy">
        <p>Caprestの個人ブログです。</p>
        <p>このページの内容は <code>app/about/page.tsx</code> で変更できます。</p>
        <Link className="text-link" href="/">記事一覧へ</Link>
      </div>
    </section>
  );
}
