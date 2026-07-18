import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { absoluteUrl, siteConfig } from "@/lib/site";
import "./globals.css";

const defaultSocialImage = {
  url: absoluteUrl("/og/default.png"),
  width: 1200,
  height: 630,
  alt: `${siteConfig.name} — ${siteConfig.description}`,
};

export const metadata: Metadata = {
  // Metadata routes already include Next.js' basePath. Keep metadataBase at the
  // origin so project Pages URLs do not become /repo/repo/...
  metadataBase: new URL(new URL(siteConfig.url).origin),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author }],
  alternates: { canonical: siteConfig.url },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    images: [defaultSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [defaultSocialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <div className="page-shell">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
