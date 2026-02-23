import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetFontCache, renderOGImage } from "./og-image.js";
import type { OGImageConfig } from "./types.js";

vi.mock("satori", () => ({
  default: vi.fn(async (_element: unknown) => "<svg>mock</svg>"),
}));

import satori from "satori";

const satoriMock = satori as ReturnType<typeof vi.fn>;

const baseConfig: OGImageConfig = {
  title: "Test Title",
  subtitle: "Test Subtitle",
  metrics: [
    { label: "Metric A", value: "100" },
    { label: "Metric B", value: "200" },
  ],
};

function getSatoriCall() {
  const call = satoriMock.mock.calls[satoriMock.mock.calls.length - 1];
  return call?.[0] as { type: string; props: Record<string, unknown> };
}

function getChildren(element: { props?: Record<string, unknown> }) {
  const c = element?.props?.children;
  return Array.isArray(c) ? c : c ? [c] : [];
}

function getSatoriOptions() {
  const call = satoriMock.mock.calls[satoriMock.mock.calls.length - 1];
  return call?.[1] as { width: number; height: number; fonts: unknown[] };
}

describe("renderOGImage", () => {
  beforeEach(() => {
    satoriMock.mockClear();
  });

  describe("metrics layout", () => {
    it("builds metrics layout with title, subtitle, and metrics", async () => {
      await renderOGImage(baseConfig, { layout: "metrics", fonts: [] });

      const element = getSatoriCall();
      expect(element.type).toBe("div");
      expect(element.props.style).toMatchObject({
        display: "flex",
        flexDirection: "column",
        padding: "60px 80px",
        backgroundColor: "#ffffff",
      });

      const children = getChildren(element);
      expect(children.length).toBeGreaterThanOrEqual(3);
      const titleChild = children.find(
        (c: unknown) => (c as { props?: { children?: unknown } })?.props?.children === "Test Title",
      );
      expect(titleChild).toBeDefined();
      expect(titleChild?.props?.style?.fontSize).toBe("48px");
    });

    it("omits subtitle when not provided", async () => {
      await renderOGImage({ title: "Only Title", metrics: [] }, { layout: "metrics", fonts: [] });

      const element = getSatoriCall();
      const children = getChildren(element);
      const hasSubtitle = children.some(
        (c: unknown) =>
          (c as { props?: { children?: unknown } })?.props?.children === "Test Subtitle",
      );
      expect(hasSubtitle).toBe(false);
    });

    it("omits metrics row when metrics array is empty", async () => {
      await renderOGImage(
        { title: "Title", subtitle: "Sub", metrics: [] },
        { layout: "metrics", fonts: [] },
      );

      const element = getSatoriCall();
      const children = getChildren(element);
      const hasMetricsRow = children.some(
        (c: unknown) =>
          (c as { props?: { style?: { marginTop?: string } } })?.props?.style?.marginTop === "auto",
      );
      expect(hasMetricsRow).toBe(false);
    });

    it("includes branding when provided", async () => {
      await renderOGImage(baseConfig, {
        layout: "metrics",
        fonts: [],
        branding: { brandName: "MyBrand", logoUrl: "https://example.com/logo.png" },
      });

      const element = getSatoriCall();
      const children = getChildren(element);
      const brandBar = children.find((c: unknown) => {
        const node = c as { props?: { children?: unknown[] } };
        return (
          Array.isArray(node?.props?.children) &&
          node.props.children.some((ch: unknown) => {
            const child = ch as { props?: { children?: unknown } };
            return child?.props?.children === "MyBrand";
          })
        );
      });
      expect(brandBar).toBeDefined();
    });
  });

  describe("card layout", () => {
    it("builds card layout with inner white card", async () => {
      await renderOGImage(baseConfig, { layout: "card", fonts: [] });

      const element = getSatoriCall();
      expect(element.type).toBe("div");
      expect(element.props.style).toMatchObject({
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
      });

      const innerCard = getChildren(element)[0] as { props?: { style?: Record<string, unknown> } };
      expect(innerCard?.props?.style).toMatchObject({
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
      });
    });
  });

  describe("minimal layout", () => {
    it("builds minimal layout with centered title", async () => {
      await renderOGImage(baseConfig, { layout: "minimal", fonts: [] });

      const element = getSatoriCall();
      expect(element.type).toBe("div");
      expect(element.props.style).toMatchObject({
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      });

      const titleChild = getChildren(element)[0] as {
        props?: { children?: unknown; style?: Record<string, unknown> };
      };
      expect(titleChild?.props?.children).toBe("Test Title");
      expect(titleChild?.props?.style?.fontSize).toBe("56px");
    });

    it("includes subtitle when provided", async () => {
      await renderOGImage(baseConfig, { layout: "minimal", fonts: [] });

      const element = getSatoriCall();
      const children = getChildren(element);
      const subtitleChild = children.find(
        (c: unknown) =>
          (c as { props?: { children?: unknown } })?.props?.children === "Test Subtitle",
      );
      expect(subtitleChild).toBeDefined();
    });
  });

  describe("custom layout", () => {
    it("uses customTemplate when layout is custom", async () => {
      const customElement = { type: "span", props: { children: "Custom" } };
      const customTemplate = vi.fn(() => customElement);

      await renderOGImage(baseConfig, {
        layout: "custom",
        customTemplate,
        fonts: [],
      });

      expect(customTemplate).toHaveBeenCalledWith(
        baseConfig,
        expect.objectContaining({
          bg: expect.any(String),
          text: expect.any(String),
          accent: expect.any(String),
        }),
      );

      const element = getSatoriCall();
      expect(element).toBe(customElement);
    });
  });

  describe("gradient wrapping", () => {
    it("wraps element in gradient div when gradientBackground is set", async () => {
      await renderOGImage(baseConfig, {
        layout: "metrics",
        fonts: [],
        gradientBackground: ["#4338ca", "#6366f1"],
      });

      const element = getSatoriCall();
      expect(element.type).toBe("div");
      expect(element.props.style).toMatchObject({
        display: "flex",
        width: "1200px",
        height: "630px",
        backgroundImage: "linear-gradient(135deg, #4338ca, #6366f1)",
      });

      const inner = getChildren(element)[0] as {
        type?: string;
        props?: { style?: Record<string, unknown> };
      };
      expect(inner?.type).toBe("div");
      expect(inner?.props?.style?.display).toBe("flex");
    });
  });

  describe("fonts", () => {
    it("uses provided fonts", async () => {
      const fontData = new ArrayBuffer(8);
      const fonts = [{ name: "CustomFont", data: fontData, weight: 700 as const }];

      await renderOGImage(baseConfig, { fonts });

      const options = getSatoriOptions();
      expect(options.fonts).toHaveLength(1);
      expect(options.fonts[0]).toMatchObject({ name: "CustomFont", weight: 700 });
    });

    it("uses sans-serif when no fonts available and fetch fails", async () => {
      _resetFontCache();
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({ ok: false })),
      );

      await renderOGImage(baseConfig, { fonts: [] });

      const element = getSatoriCall();
      expect(element.props.style?.fontFamily).toBe("sans-serif");

      vi.unstubAllGlobals();
    });

    it("loads default font when none provided", async () => {
      const fontBuffer = new ArrayBuffer(100);
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
          if (url.includes("inter@latest")) {
            return { ok: true, arrayBuffer: async () => fontBuffer };
          }
          return { ok: false };
        }),
      );

      await renderOGImage(baseConfig, {});

      const options = getSatoriOptions();
      expect(options.fonts.length).toBeGreaterThanOrEqual(1);
      expect(options.fonts[0]).toMatchObject({ name: "Inter", weight: 400 });

      vi.unstubAllGlobals();
    });
  });

  describe("options", () => {
    it("passes width and height to satori", async () => {
      await renderOGImage(baseConfig, { width: 800, height: 400, fonts: [] });

      const options = getSatoriOptions();
      expect(options.width).toBe(800);
      expect(options.height).toBe(400);
    });

    it("uses custom colors", async () => {
      await renderOGImage(baseConfig, {
        fonts: [],
        backgroundColor: "#1a1a1a",
        textColor: "#eeeeee",
        accentColor: "#ff0000",
      });

      const element = getSatoriCall();
      expect(element.props.style?.backgroundColor).toBe("#1a1a1a");
      expect(element.props.style?.color).toBe("#eeeeee");
    });

    it("returns SVG string from satori", async () => {
      const result = await renderOGImage(baseConfig, { fonts: [] });
      expect(result).toBe("<svg>mock</svg>");
    });
  });
});
