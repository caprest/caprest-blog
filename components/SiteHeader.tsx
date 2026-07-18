import Link from "next/link";
import { siteConfig, withBasePath } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="site-mark" href="/" aria-label={`${siteConfig.name} ホーム`}>
        {siteConfig.name}
      </Link>
      <nav className="site-nav" aria-label="メインナビゲーション">
        <Link href="/">Posts</Link>
        <Link href="/about/">About</Link>
        <a href={withBasePath("/rss.xml")}>RSS</a>
      </nav>
    </header>
  );
}
