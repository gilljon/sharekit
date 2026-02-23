import satori from "satori";
import type { OGImageConfig } from "./types.js";

export interface OGImageOptions {
  width?: number;
  height?: number;
  /** Custom fonts to load. If not provided, uses a system sans-serif fallback. */
  fonts?: Array<{
    name: string;
    data: ArrayBuffer;
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    style?: "normal" | "italic";
  }>;
  /** Background color (CSS value) */
  backgroundColor?: string;
  /** Text color (CSS value) */
  textColor?: string;
  /** Accent color for metrics (CSS value) */
  accentColor?: string;
}

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 630;

/**
 * Renders an OG image config to an SVG string using satori.
 *
 * Returns raw SVG that can be converted to PNG via @resvg/resvg-js
 * or served directly for clients that support SVG OG images.
 */
export async function renderOGImage(
  config: OGImageConfig,
  options: OGImageOptions = {},
): Promise<string> {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const bg = options.backgroundColor ?? "#ffffff";
  const text = options.textColor ?? "#111827";
  const accent = options.accentColor ?? "#4338ca";

  const fonts = options.fonts ?? [];
  if (fonts.length === 0) {
    const fallbackFont = await getDefaultFont();
    if (fallbackFont) {
      fonts.push({
        name: "Inter",
        data: fallbackFont,
        weight: 400,
        style: "normal",
      });
    }
  }

  const metrics = config.metrics?.filter(Boolean) ?? [];

  const element = {
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
        backgroundColor: bg,
        color: text,
        fontFamily: fonts[0]?.name ?? "sans-serif",
      },
      children: [
        {
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
                  children: "Shared",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "48px",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "16px",
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
                    marginBottom: "32px",
                  },
                  children: config.subtitle,
                },
              },
            ]
          : []),
        ...(metrics.length > 0
          ? [
              {
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
              },
            ]
          : []),
      ],
    },
  };

  return satori(element as any, { width, height, fonts });
}

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
