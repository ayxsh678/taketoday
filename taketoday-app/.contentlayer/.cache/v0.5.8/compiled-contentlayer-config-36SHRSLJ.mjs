// contentlayer.config.ts
import { defineDocumentType, defineNestedType, makeSource } from "contentlayer2/source-files";
import readingTime from "reading-time";
var Author = defineNestedType(() => ({
  name: "Author",
  fields: {
    name: { type: "string", required: true },
    type: {
      type: "enum",
      options: ["Organization", "Person"],
      required: true
    }
  }
}));
var Article = defineDocumentType(() => ({
  name: "Article",
  filePathPattern: "articles/**/*.mdx",
  contentType: "mdx",
  fields: {
    slug: { type: "string", required: true },
    title: { type: "string", required: true },
    deck: { type: "string", required: true },
    category: {
      type: "enum",
      options: ["AI", "Finance", "Tech", "Startups", "Briefings"],
      required: true
    },
    format: {
      type: "enum",
      options: ["QuickNews", "SmartBreakdown", "DeepDive", "SocialPost"],
      required: true
    },
    // Kept as string to preserve ISO-8601 format (not converted to Date).
    publishedAt: { type: "string", required: true },
    updatedAt: { type: "string", required: false },
    author: { type: "nested", of: Author, required: true },
    quickTake: { type: "string", required: true },
    whyItMatters: { type: "string", required: true },
    // Contentlayer doesn't support tuples; we enforce the 3-item constraint
    // at runtime in the loader via Zod validation.
    takeaways: { type: "list", of: { type: "string" }, required: true }
  },
  computedFields: {
    /** Mirrors the formatReadTime logic in the old loader. */
    readTime: {
      type: "string",
      resolve: (doc) => {
        const minutes = readingTime(doc.body.raw).minutes;
        const m = Math.max(1, Math.ceil(minutes));
        return `${m} min read`;
      }
    }
  }
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "content",
  documentTypes: [Article],
  disableImportAliasWarning: true
});
export {
  Article,
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-36SHRSLJ.mjs.map
