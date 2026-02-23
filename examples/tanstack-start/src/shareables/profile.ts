import { shareable } from "../lib/shareable.js";

export const profileShare = shareable.define("profile", {
  fields: {
    bio: { label: "Bio", default: true },
    followerCount: { label: "Follower Count", default: true },
    earnings: { label: "Earnings", default: false },
    analytics: {
      type: "group",
      label: "Analytics",
      children: {
        viewsOverTime: { label: "Views Over Time", default: true },
        earningsBreakdown: { label: "Earnings Breakdown", default: false, requires: "earnings" },
      },
    },
  },

  getData: async () => {
    return {
      bio: "Trading enthusiast. Building in public.",
      followerCount: 1240,
      earnings: 4200,
      analytics: {
        viewsOverTime: [100, 150, 200, 180, 220],
        earningsBreakdown: { subscriptions: 3000, sponsors: 1200 },
      },
    };
  },

  ogImage: ({ data, visibleFields, ownerName }) => {
    const d = data as Record<string, unknown>;
    const metrics: Array<{ label: string; value: string }> = [];
    if (visibleFields.followerCount && d.followerCount != null) {
      metrics.push({ label: "Followers", value: String(d.followerCount) });
    }
    if (visibleFields.earnings && d.earnings != null) {
      metrics.push({ label: "Earnings", value: `$${d.earnings}` });
    }
    return {
      title: `${ownerName}'s Profile`,
      subtitle: "Shared via ShareKit",
      metrics,
    };
  },
});
