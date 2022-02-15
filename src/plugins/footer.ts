import type { EditorPluginConfig } from './types';

const FOOTER = document.getElementById('footer')!;

export function footerPlugin(): EditorPluginConfig {
  return {
    editor({ model }) {
      const t0 = performance.now();

      return () => {
        const t1 = performance.now();

        FOOTER.innerHTML = `<strong>Line: ${model.y} Col: ${model.x}</strong>`
          + ` | `
          + `<span>rendered in ${(t1 - t0).toFixed(2)}ms</span>`;
      };
    },
  };
}
