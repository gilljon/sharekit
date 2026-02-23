import { shareable } from "../lib/shareable.js";

export const blogPostShare = shareable.define("blog-post", {
  fields: {
    content: { label: "Content", default: true },
    authorBio: { label: "Author Bio", default: true },
    comments: { label: "Comments", default: true },
    stats: {
      type: "group",
      label: "Stats",
      children: {
        viewCount: { label: "View Count", default: true },
        likeCount: { label: "Like Count", default: true },
      },
    },
  },

  getData: async ({ params }) => {
    const _postId = (params as { postId: string }).postId;
    return {
      content: "This is the blog post content. Share with privacy controls.",
      authorBio: "Writer and developer. Building in public.",
      comments: [
        { id: "1", author: "Alice", text: "Great post!" },
        { id: "2", author: "Bob", text: "Thanks for sharing." },
      ],
      stats: {
        viewCount: 1250,
        likeCount: 89,
      },
    };
  },

  ogImage: ({ data, visibleFields, ownerName }) => {
    const d = data as Record<string, unknown>;
    const metrics: Array<{ label: string; value: string }> = [];
    if (visibleFields["stats.viewCount"] && (d.stats as any)?.viewCount != null) {
      metrics.push({ label: "Views", value: String((d.stats as any).viewCount) });
    }
    if (visibleFields["stats.likeCount"] && (d.stats as any)?.likeCount != null) {
      metrics.push({ label: "Likes", value: String((d.stats as any).likeCount) });
    }
    return {
      title: "Blog Post",
      subtitle: `Shared by ${ownerName}`,
      metrics,
    };
  },
});
