import type { EditorPluginConfig } from './types';

export function footerPlugin(): EditorPluginConfig {
  const footer = document.createElement('div');
  footer.id = 'footer';

  document.getElementById('app')!.appendChild(footer);

  const stats = document.createElement('span');

  footer.appendChild(stats);

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

        stats.textContent = `${selections.join(' | ')} | rendered in ${(t1 - t0).toFixed(2)}ms`;
      };
    },
  };
}
