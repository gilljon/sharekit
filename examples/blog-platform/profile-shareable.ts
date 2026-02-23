/**
 * Example: Profile stats sharing definition
 *
 * Lets users share a snapshot of their blog profile with granular
 * control over which metrics and content sections are visible.
 */
import { shareable } from "./shareable.config";

declare function getProfileData(
  userId: string,
): Promise<Record<string, unknown>>;

export const profileShare = shareable.define("profile", {
  fields: {
    bio: { label: "Bio", default: true },
    followerCount: { label: "Follower Count", default: true },
    postCount: { label: "Post Count", default: true },
    readTime: { label: "Total Read Time", default: true },
    earnings: { label: "Earnings", default: false },
    topPosts: { label: "Top Posts", default: true },
    analytics: {
      label: "Analytics",
      type: "group" as const,
      children: {
        viewsOverTime: { label: "Views Over Time", default: true },
        readerDemographics: { label: "Reader Demographics", default: false },
        referralSources: { label: "Referral Sources", default: false },
        earningsBreakdown: { label: "Earnings Breakdown", default: false, requires: "earnings" },
      },
    },
  },

  getData: async ({ ownerId }) => {
    return getProfileData(ownerId);
  },

  ogImage: ({ data, visibleFields, ownerName }) => {
    const d = data as Record<string, any>;
    return {
      title: `${ownerName}'s Blog Profile`,
      subtitle: "Shared via BlogPlatform",
      metrics: [
        visibleFields.followerCount &&
          d.followerCount != null && {
            label: "Followers",
            value: d.followerCount.toLocaleString(),
          },
        visibleFields.postCount &&
          d.postCount != null && {
            label: "Posts",
            value: `${d.postCount}`,
          },
        visibleFields.readTime &&
          d.totalReadMinutes != null && {
            label: "Read Time",
            value: `${Math.round(d.totalReadMinutes / 60)}h`,
          },
      ].filter(Boolean),
    };
  },
});
