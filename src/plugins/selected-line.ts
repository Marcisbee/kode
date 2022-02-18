import type { EditorPluginConfig } from './types';

export function selectedLinePlugin(): EditorPluginConfig {
  return {
    editor({ ctx, model, width, font, theme }) {
      ctx.fillStyle = theme['selected-line'];

      for (const { start, end } of model.selections) {
        if (end) {
          continue;
        }

        ctx.fillRect(
          0,
          start.y * font.lineHeight - 2,
          width,
          font.lineHeight
        );
      }
    },
  };
}
