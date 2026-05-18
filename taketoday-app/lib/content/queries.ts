import { allArticles } from "contentlayer/generated";

export function getAllArticles() {
  return allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getFeaturedArticles(count: number) {
  return getAllArticles().slice(0, count);
}

export function getArticleBySlug(slug: string) {
  return allArticles.find((article) => article.slug === slug);
}

export function getArticlesByCategory(category: string) {
  return getAllArticles().filter((article) => article.category?.toLowerCase() === category.toLowerCase());
}