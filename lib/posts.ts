import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDirectory = path.join(process.cwd(), "content/posts");

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  displayDate: string;
  tags: string[];
  readingTime: string;
  content?: string;
};

function readingTime(content: string) {
  const characters = content.replace(/\s/g, "").length;
  return `${Math.max(1, Math.ceil(characters / 500))}分で読めます`;
}

function toDisplayDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

export function getAllPosts(): Post[] {
  return fs
    .readdirSync(postsDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(postsDirectory, fileName), "utf8");
      const { data, content } = matter(raw);

      return {
        slug,
        title: String(data.title),
        description: String(data.description),
        date: String(data.date),
        displayDate: toDisplayDate(String(data.date)),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        readingTime: readingTime(content),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string): Promise<Post | null> {
  const filePath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const processed = await remark().use(html).process(content);

  return {
    slug,
    title: String(data.title),
    description: String(data.description),
    date: String(data.date),
    displayDate: toDisplayDate(String(data.date)),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingTime: readingTime(content),
    content: processed.toString(),
  };
}

export function getAllTags() {
  return [...new Set(getAllPosts().flatMap((post) => post.tags))].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
}
