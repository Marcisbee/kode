// @ts-ignore
import Stats from 'stats.js';

import type { EditorPluginConfig } from './types';

export function statsPlugin(): EditorPluginConfig {
  const stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  return {
    editor({ model }) {
      stats.begin();
      const t0 = performance.now();

      return () => {
        stats.end();
        const t1 = performance.now();

        const selections = [];

        for (const { start } of model.selections) {
          const { x, y } = start;

          selections.push(`${y}:${x}`);
        }

        stats.textContent = `${selections.join(' | ')} | rendered in ${(t1 - t0).toFixed(2)}ms | ${model.diagnostics.length} issues`;
      };
    },
  };
}
