import { describe, expect, it } from "vitest";
import {
  filterData,
  flattenSchema,
  getDefaults,
  getDependencyWarnings,
  getGroups,
  getToggleConfig,
  resolveDependencies,
} from "./privacy.js";
import type { FieldSchema } from "./types.js";

const schema: FieldSchema = {
  followerCount: { label: "Follower Count", default: true },
  earnings: { label: "Earnings", default: false },
  email: { label: "Email", default: false },
  topPosts: { label: "Top Posts", default: true },
  analytics: {
    label: "Analytics",
    type: "group",
    children: {
      earningsBreakdown: { label: "Earnings Breakdown", default: true, requires: "earnings" },
      viewsOverTime: { label: "Views Over Time", default: true },
    },
  },
};

describe("flattenSchema", () => {
  it("flattens top-level and group fields", () => {
    const flat = flattenSchema(schema);
    expect(flat).toHaveLength(6);
    expect(flat.map((f) => f.path)).toEqual([
      "followerCount",
      "earnings",
      "email",
      "topPosts",
      "analytics.earningsBreakdown",
      "analytics.viewsOverTime",
    ]);
  });

  it("marks group children with their parent group", () => {
    const flat = flattenSchema(schema);
    const eb = flat.find((f) => f.path === "analytics.earningsBreakdown");
    expect(eb?.group).toBe("analytics");
    expect(eb?.requires).toBe("earnings");
  });
});

describe("getDefaults", () => {
  it("returns the default visibility for each field", () => {
    const defaults = getDefaults(schema);
    expect(defaults).toEqual({
      followerCount: true,
      earnings: false,
      email: false,
      topPosts: true,
      "analytics.earningsBreakdown": true,
      "analytics.viewsOverTime": true,
    });
  });
});

describe("getGroups", () => {
  it("returns group definitions with children", () => {
    const groups = getGroups(schema);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe("analytics");
    expect(groups[0]?.children).toEqual(["analytics.earningsBreakdown", "analytics.viewsOverTime"]);
  });
});

describe("resolveDependencies", () => {
  it("forces dependent fields off when required field is hidden", () => {
    const visible = {
      followerCount: true,
      earnings: false,
      email: false,
      topPosts: true,
      "analytics.earningsBreakdown": true,
      "analytics.viewsOverTime": true,
    };

    const resolved = resolveDependencies(visible, schema);
    expect(resolved["analytics.earningsBreakdown"]).toBe(false);
    expect(resolved["analytics.viewsOverTime"]).toBe(true);
  });

  it("keeps dependent fields on when required field is visible", () => {
    const visible = {
      followerCount: true,
      earnings: true,
      email: false,
      topPosts: true,
      "analytics.earningsBreakdown": true,
      "analytics.viewsOverTime": true,
    };

    const resolved = resolveDependencies(visible, schema);
    expect(resolved["analytics.earningsBreakdown"]).toBe(true);
  });
});

describe("getDependencyWarnings", () => {
  it("warns when a field is enabled but its dependency is not", () => {
    const visible = {
      followerCount: true,
      earnings: false,
      "analytics.earningsBreakdown": true,
      "analytics.viewsOverTime": true,
    };

    const warnings = getDependencyWarnings(visible, schema);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("Earnings");
    expect(warnings[0]?.message).toContain("Earnings Breakdown");
  });
});

describe("filterData", () => {
  it("removes top-level keys for hidden fields", () => {
    const data = { followerCount: 1200, earnings: 5400, email: "user@test.com", topPosts: ["a", "b"] };
    const visible = { followerCount: true, earnings: false, email: false, topPosts: true };

    const filtered = filterData(data, visible);
    expect(filtered).toEqual({ followerCount: 1200, topPosts: ["a", "b"] });
  });

  it("removes nested keys for dot-path fields", () => {
    const data = {
      followerCount: 1200,
      analytics: { earningsBreakdown: [1, 2, 3], viewsOverTime: [4, 5, 6] },
    };
    const visible = {
      followerCount: true,
      "analytics.earningsBreakdown": false,
      "analytics.viewsOverTime": true,
    };

    const filtered = filterData(data, visible);
    expect(filtered).toEqual({
      followerCount: 1200,
      analytics: { viewsOverTime: [4, 5, 6] },
    });
  });

  it("handles null and primitive values", () => {
    expect(filterData(null, {})).toBeNull();
    expect(filterData(undefined, {})).toBeUndefined();
    expect(filterData(42 as unknown, {})).toBe(42);
  });
});

describe("getToggleConfig", () => {
  it("returns structured toggle items", () => {
    const config = getToggleConfig(schema);
    expect(config).toHaveLength(5);

    const analyticsGroup = config.find((c) => c.path === "analytics");
    expect(analyticsGroup?.type).toBe("group");
    expect(analyticsGroup?.children).toHaveLength(2);
  });
});
