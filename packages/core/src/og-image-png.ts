import type { OGImageConfig } from "./types.js";
import { renderOGImage, type OGImageOptions } from "./og-image.js";

const DEFAULT_WIDTH = 1200;

/**
 * Renders an OG image config to a PNG buffer.
 *
 * Requires `@resvg/resvg-js` as a peer dependency.
 * Throws if `@resvg/resvg-js` is not installed.
 *
 * Import from `@sharekit/core/png` to keep `@resvg/resvg-js` out of
 * client bundles:
 *
 * ```ts
 * import { renderOGImagePng } from '@sharekit/core/png'
 * ```
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
