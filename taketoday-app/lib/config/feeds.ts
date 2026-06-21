// RSS feeds fetched hourly by /api/cron/fetch-feeds.
// Add/remove entries freely — no DB migration needed.
export const RSS_FEEDS = [
  { name: "Reuters",      url: "https://feeds.reuters.com/reuters/topNews" },
  { name: "TechCrunch",  url: "https://techcrunch.com/feed/" },
  { name: "The Verge",   url: "https://www.theverge.com/rss/index.xml" },
  { name: "Inc42",       url: "https://inc42.com/feed/" },
  { name: "YourStory",   url: "https://yourstory.com/feed" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage" },
] as const;
