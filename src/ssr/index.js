// Server-side rendering: the punica elements of an HTML fragment get their
// shadow root as Declarative Shadow DOM (<template shadowrootmode="open">),
// so the browser draws them styled before the script arrives, or without
// it, and nothing moves when they upgrade. Node only; renders in happy-dom
// (an optional peer dependency) inside a worker thread.
import { Worker } from 'node:worker_threads';

/**
 * Starts a renderer. Keep it for the life of the server; each `render` takes
 * a few milliseconds once it has started.
 * @param {{ library?: string | URL }} [options] the module that defines the
 *   elements; `@punica/components` by default (every element)
 * @returns {Promise<{ render(html: string): Promise<string>, close(): Promise<number> }>}
 */
export async function createRenderer(options = {}) {
  const library = String(options.library ?? new URL('../esm/index.js', import.meta.url));
  const worker = new Worker(new URL('./worker.js', import.meta.url), { workerData: { library } });
  await new Promise((resolve, reject) => {
    worker.once('error', reject);
    worker.once('message', (message) => {
      if (message.ready) resolve();
      else reject(new Error(message.failed || 'The renderer did not start.'));
    });
  });

  let next = 0;
  const pending = new Map();
  worker.on('message', ({ id, html, error }) => {
    const call = pending.get(id);
    if (!call) return;
    pending.delete(id);
    if (error) call.reject(new Error(error));
    else call.resolve(html);
  });
  worker.on('error', (error) => {
    for (const call of pending.values()) call.reject(error);
    pending.clear();
  });

  return {
    render(html) {
      const id = ++next;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        worker.postMessage({ id, html: String(html) });
      });
    },
    close: () => worker.terminate()
  };
}

/**
 * Renders one fragment with a renderer started and closed for it. A server
 * that renders many pages keeps one from `createRenderer` instead.
 * @param {string} html
 * @param {{ library?: string | URL }} [options]
 * @returns {Promise<string>}
 */
export async function renderToString(html, options) {
  const renderer = await createRenderer(options);
  try {
    return await renderer.render(html);
  } finally {
    await renderer.close();
  }
}
