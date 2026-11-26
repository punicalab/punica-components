/** Options of the renderer. */
export interface RendererOptions {
  /** The module that defines the elements; `@punica/components` (every element) by default. */
  library?: string | URL;
}

/** A renderer started once and kept for the life of the server. */
export interface Renderer {
  /** The fragment with each punica element's shadow root as Declarative Shadow DOM. */
  render(html: string): Promise<string>;
  /** Stops the renderer's worker. */
  close(): Promise<number>;
}

/** Starts a renderer (a worker with happy-dom); needs `happy-dom` installed. */
export function createRenderer(options?: RendererOptions): Promise<Renderer>;

/** Renders one fragment with a renderer started and closed for it. */
export function renderToString(html: string, options?: RendererOptions): Promise<string>;
