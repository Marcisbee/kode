import type { EditorPluginConfig } from './types';

const FOOTER = document.getElementById('footer')!;

export function footerPlugin(): EditorPluginConfig {
  return {
    editor({ model }) {
      const t0 = performance.now();

      return () => {
        const t1 = performance.now();

        const selections = [];

        for (const { start } of model.selections) {
          const { x, y } = start;

          selections.push(`${y}:${x}`);
        }

        FOOTER.innerHTML = `<strong>${selections.join(' | ')}</strong>`
          + ` | `
          + `<span>rendered in ${(t1 - t0).toFixed(2)}ms</span>`;
      };
    },
  };
}
