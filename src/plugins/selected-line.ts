import type { EditorPluginConfig } from './types';

export function selectedLinePlugin(): EditorPluginConfig {
  return {
    editor({ ctx, model, canvas, font, theme }) {
      ctx.fillStyle = theme['selected-line'];

      for (const { start, end } of model.selections) {
        if (end) {
          continue;
        }

        ctx.fillRect(
          0,
          start.y * font.lineHeight - 2,
          canvas.width,
          font.lineHeight
        );
      }
    },
  };
}
