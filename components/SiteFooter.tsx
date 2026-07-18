import Link from "next/link";
import { siteConfig, withBasePath } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>© {new Date().getFullYear()} {siteConfig.author}</p>
      <div className="footer-meta">
        <Link href="/about/">About</Link>
        <a href={withBasePath("/rss.xml")}>RSS</a>
      </div>
    </footer>
  );
}
