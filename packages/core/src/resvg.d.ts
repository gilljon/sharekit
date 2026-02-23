declare module "@resvg/resvg-js" {
  interface ResvgRenderResult {
    asPng(): Uint8Array;
  }
  interface ResvgOptions {
    fitTo?: { mode: string; value: number };
  }
  export class Resvg {
    constructor(svg: string, options?: ResvgOptions);
    render(): ResvgRenderResult;
  }
}
