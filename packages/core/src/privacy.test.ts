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
  winRate: { label: "Win Rate", default: true },
  pnl: { label: "P&L Amounts", default: false },
  symbols: { label: "Symbols", default: false },
  streaks: { label: "Streaks", default: true },
  charts: {
    label: "Charts",
    type: "group",
    children: {
      equityCurve: { label: "Equity Curve", default: true, requires: "pnl" },
      calendar: { label: "Calendar", default: true },
    },
  },
};

describe("flattenSchema", () => {
  it("flattens top-level and group fields", () => {
    const flat = flattenSchema(schema);
    expect(flat).toHaveLength(6);
    expect(flat.map((f) => f.path)).toEqual([
      "winRate",
      "pnl",
      "symbols",
      "streaks",
      "charts.equityCurve",
      "charts.calendar",
    ]);
  });

  it("marks group children with their parent group", () => {
    const flat = flattenSchema(schema);
    const ec = flat.find((f) => f.path === "charts.equityCurve");
    expect(ec?.group).toBe("charts");
    expect(ec?.requires).toBe("pnl");
  });
});

describe("getDefaults", () => {
  it("returns the default visibility for each field", () => {
    const defaults = getDefaults(schema);
    expect(defaults).toEqual({
      winRate: true,
      pnl: false,
      symbols: false,
      streaks: true,
      "charts.equityCurve": true,
      "charts.calendar": true,
    });
  });
});

describe("getGroups", () => {
  it("returns group definitions with children", () => {
    const groups = getGroups(schema);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe("charts");
    expect(groups[0]?.children).toEqual(["charts.equityCurve", "charts.calendar"]);
  });
});

describe("resolveDependencies", () => {
  it("forces dependent fields off when required field is hidden", () => {
    const visible = {
      winRate: true,
      pnl: false,
      symbols: false,
      streaks: true,
      "charts.equityCurve": true,
      "charts.calendar": true,
    };

    const resolved = resolveDependencies(visible, schema);
    expect(resolved["charts.equityCurve"]).toBe(false);
    expect(resolved["charts.calendar"]).toBe(true);
  });

  it("keeps dependent fields on when required field is visible", () => {
    const visible = {
      winRate: true,
      pnl: true,
      symbols: false,
      streaks: true,
      "charts.equityCurve": true,
      "charts.calendar": true,
    };

    const resolved = resolveDependencies(visible, schema);
    expect(resolved["charts.equityCurve"]).toBe(true);
  });
});

describe("getDependencyWarnings", () => {
  it("warns when a field is enabled but its dependency is not", () => {
    const visible = {
      winRate: true,
      pnl: false,
      "charts.equityCurve": true,
      "charts.calendar": true,
    };

    const warnings = getDependencyWarnings(visible, schema);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("P&L Amounts");
    expect(warnings[0]?.message).toContain("Equity Curve");
  });
});

describe("filterData", () => {
  it("removes top-level keys for hidden fields", () => {
    const data = { winRate: 65, pnl: 12345, symbols: ["AAPL"], streaks: 5 };
    const visible = { winRate: true, pnl: false, symbols: false, streaks: true };

    const filtered = filterData(data, visible);
    expect(filtered).toEqual({ winRate: 65, streaks: 5 });
  });

  it("removes nested keys for dot-path fields", () => {
    const data = {
      winRate: 65,
      charts: { equityCurve: [1, 2, 3], calendar: [4, 5, 6] },
    };
    const visible = {
      winRate: true,
      "charts.equityCurve": false,
      "charts.calendar": true,
    };

    const filtered = filterData(data, visible);
    expect(filtered).toEqual({
      winRate: 65,
      charts: { calendar: [4, 5, 6] },
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

    const chartsGroup = config.find((c) => c.path === "charts");
    expect(chartsGroup?.type).toBe("group");
    expect(chartsGroup?.children).toHaveLength(2);
  });
});
