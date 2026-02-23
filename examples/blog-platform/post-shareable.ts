/**
 * Example: Blog post sharing definition
 *
 * A simpler shareable -- most fields are on by default since blog
 * posts are inherently public, but authors can optionally hide
 * engagement metrics or comments.
 */
import { shareable } from "./shareable.config";

declare function getPostData(userId: string, postId: string): Promise<Record<string, unknown>>;

export const postShare = shareable.define("post", {
  fields: {
    content: { label: "Full Content", default: true },
    comments: { label: "Comments", default: true },
    reactions: { label: "Reactions", default: true },
    viewCount: { label: "View Count", default: false },
    readingTime: { label: "Reading Time", default: true },
  },

  getData: async ({ ownerId, params }) => {
    const postId = params.postId as string;
    return getPostData(ownerId, postId);
  },

  ogImage: ({ data, ownerName }) => {
    const d = data as Record<string, any>;
    return {
      title: d.title ?? "Blog Post",
      subtitle: `by ${ownerName}`,
    };
  },
});
