import satori from "satori";
import type { OGImageConfig } from "./types.js";

// ---------------------------------------------------------------------------
// Font types
// ---------------------------------------------------------------------------

export interface OGFont {
  name: string;
  data: ArrayBuffer;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style?: "normal" | "italic";
}

// ---------------------------------------------------------------------------
// Branding & layout
// ---------------------------------------------------------------------------

export interface OGBranding {
  /** URL to a logo image (will be rendered top-left or top-right depending on layout) */
  logoUrl?: string;
  /** Logo dimensions */
  logoWidth?: number;
  logoHeight?: number;
  /** Brand name text (shown next to the accent bar) */
  brandName?: string;
}

export type OGLayout = "metrics" | "card" | "minimal" | "custom";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface OGImageOptions {
  width?: number;
  height?: number;
  fonts?: OGFont[];
  /** Background color (CSS value). Overridden by gradientBackground. */
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  /** Two-color gradient background. Takes precedence over backgroundColor. */
  gradientBackground?: [string, string];
  /** Branding options (logo, brand name) */
  branding?: OGBranding;
  /** Layout preset. Defaults to "metrics". */
  layout?: OGLayout;
  /**
   * Custom element tree for satori. When provided with layout="custom",
   * this completely replaces the built-in template. It receives the
   * OGImageConfig so you can reference title/subtitle/metrics.
   */
  customTemplate?: (
    config: OGImageConfig,
    colors: { bg: string; text: string; accent: string },
  ) => unknown;
}

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 630;

// ---------------------------------------------------------------------------
// Layout builders
// ---------------------------------------------------------------------------

function buildMetricsLayout(
  config: OGImageConfig,
  colors: { bg: string; text: string; accent: string },
  fonts: OGFont[],
  branding?: OGBranding,
) {
  const metrics = config.metrics?.filter(Boolean) ?? [];
  const fontFamily = fonts[0]?.name ?? "sans-serif";

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        width: "100%",
        height: "100%",
        padding: "60px 80px",
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily,
      },
      children: [
        buildBrandBar(colors.accent, branding),
        buildTitle(config.title, "48px"),
        ...(config.subtitle ? [buildSubtitle(config.subtitle)] : []),
        ...(metrics.length > 0 ? [buildMetricsRow(metrics, colors.accent)] : []),
      ],
    },
  };
}

function buildCardLayout(
  config: OGImageConfig,
  colors: { bg: string; text: string; accent: string },
  fonts: OGFont[],
  branding?: OGBranding,
) {
  const metrics = config.metrics?.filter(Boolean) ?? [];
  const fontFamily = fonts[0]?.name ?? "sans-serif";

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        padding: "60px",
        backgroundColor: colors.bg,
        fontFamily,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: "1000px",
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              padding: "48px 56px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
              color: colors.text,
            },
            children: [
              buildBrandBar(colors.accent, branding),
              buildTitle(config.title, "40px"),
              ...(config.subtitle ? [buildSubtitle(config.subtitle)] : []),
              ...(metrics.length > 0 ? [buildMetricsRow(metrics, colors.accent)] : []),
            ],
          },
        },
      ],
    },
  };
}

function buildMinimalLayout(
  config: OGImageConfig,
  colors: { bg: string; text: string; accent: string },
  fonts: OGFont[],
) {
  const fontFamily = fonts[0]?.name ?? "sans-serif";

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        padding: "80px",
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily,
        textAlign: "center",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: "56px",
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: "900px",
            },
            children: config.title,
          },
        },
        ...(config.subtitle
          ? [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "24px",
                    color: "#6b7280",
                    marginTop: "16px",
                  },
                  children: config.subtitle,
                },
              },
            ]
          : []),
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Shared element builders
// ---------------------------------------------------------------------------

function buildBrandBar(accent: string, branding?: OGBranding) {
  const label = branding?.brandName ?? "Shared";

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "24px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: "8px",
              height: "40px",
              backgroundColor: accent,
              borderRadius: "4px",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "14px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: accent,
            },
            children: label,
          },
        },
      ],
    },
  };
}

function buildTitle(text: string, fontSize: string) {
  return {
    type: "div",
    props: {
      style: {
        fontSize,
        fontWeight: 700,
        lineHeight: 1.2,
        marginBottom: "16px",
        maxWidth: "900px",
      },
      children: text,
    },
  };
}

function buildSubtitle(text: string) {
  return {
    type: "div",
    props: {
      style: {
        fontSize: "24px",
        color: "#6b7280",
        marginBottom: "32px",
      },
      children: text,
    },
  };
}

function buildMetricsRow(metrics: Array<{ label: string; value: string }>, accent: string) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        gap: "48px",
        marginTop: "auto",
      },
      children: metrics.map((metric) => ({
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  fontSize: "14px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#9ca3af",
                },
                children: metric.label,
              },
            },
            {
              type: "div",
              props: {
                style: {
                  fontSize: "36px",
                  fontWeight: 700,
                  color: accent,
                },
                children: metric.value,
              },
            },
          ],
        },
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Gradient wrapper
// ---------------------------------------------------------------------------

function wrapWithGradient(
  element: unknown,
  gradient: [string, string],
  width: number,
  height: number,
) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      },
      children: [element],
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Renders an OG image config to an SVG string using satori.
 *
 * Supports multiple layouts, branding, gradient backgrounds, and custom templates.
 */
export async function renderOGImage(
  config: OGImageConfig,
  options: OGImageOptions = {},
): Promise<string> {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const bg = options.gradientBackground ? "transparent" : (options.backgroundColor ?? "#ffffff");
  const text = options.textColor ?? "#111827";
  const accent = options.accentColor ?? "#4338ca";
  const layout = options.layout ?? "metrics";
  const colors = { bg, text, accent };

  const fonts = options.fonts ?? [];
  if (fonts.length === 0) {
    const fallbackFont = await getDefaultFont();
    if (fallbackFont) {
      fonts.push({ name: "Inter", data: fallbackFont, weight: 400, style: "normal" });
    }
  }

  let element: unknown;

  if (layout === "custom" && options.customTemplate) {
    element = options.customTemplate(config, colors);
  } else if (layout === "card") {
    element = buildCardLayout(config, colors, fonts, options.branding);
  } else if (layout === "minimal") {
    element = buildMinimalLayout(config, colors, fonts);
  } else {
    element = buildMetricsLayout(config, colors, fonts, options.branding);
  }

  if (options.gradientBackground) {
    element = wrapWithGradient(element, options.gradientBackground, width, height);
  }

  return satori(element as any, { width, height, fonts });
}

/**
 * Renders an OG image config to a PNG buffer.
 *
 * Requires `@resvg/resvg-js` as a peer dependency.
 * Falls back to SVG string if resvg is not available.
 */
export async function renderOGImagePng(
  config: OGImageConfig,
  options: OGImageOptions = {},
): Promise<Uint8Array> {
  const svg = await renderOGImage(config, options);

  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: options.width ?? DEFAULT_WIDTH,
    },
  });
  const rendered = resvg.render();
  return rendered.asPng();
}

// ---------------------------------------------------------------------------
// Font helpers
// ---------------------------------------------------------------------------

let cachedFont: ArrayBuffer | null = null;

async function getDefaultFont(): Promise<ArrayBuffer | null> {
  if (cachedFont) return cachedFont;

  try {
    const response = await fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff",
    );
    if (response.ok) {
      cachedFont = await response.arrayBuffer();
      return cachedFont;
    }
  } catch {
    // Font loading is best-effort
  }

  return null;
}

const googleFontCache = new Map<string, ArrayBuffer>();

/**
 * Loads a Google Font by family name and weight. Returns an ArrayBuffer
 * suitable for passing to OGImageOptions.fonts.
 *
 * ```ts
 * const inter = await loadGoogleFont("Inter", 700);
 * const svg = await renderOGImage(config, {
 *   fonts: [{ name: "Inter", data: inter, weight: 700 }],
 * });
 * ```
 */
export async function loadGoogleFont(family: string, weight = 400): Promise<ArrayBuffer> {
  const cacheKey = `${family}:${weight}`;
  const cached = googleFontCache.get(cacheKey);
  if (cached) return cached;

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;

  const cssResponse = await fetch(cssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!cssResponse.ok) {
    throw new Error(`Failed to load Google Font CSS for "${family}": ${cssResponse.status}`);
  }

  const css = await cssResponse.text();
  const urlMatch = css.match(/src:\s*url\(([^)]+)\)/);
  if (!urlMatch?.[1]) {
    throw new Error(`No font URL found in Google Fonts CSS for "${family}"`);
  }

  const fontResponse = await fetch(urlMatch[1]);
  if (!fontResponse.ok) {
    throw new Error(`Failed to download font file for "${family}": ${fontResponse.status}`);
  }

  const buffer = await fontResponse.arrayBuffer();
  googleFontCache.set(cacheKey, buffer);
  return buffer;
}
