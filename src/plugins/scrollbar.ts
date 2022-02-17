import type { EditorPluginConfig } from './types';

export function scrollbarPlugin(): EditorPluginConfig {
  return {
    editor({ ctx, model, canvas, font, theme }) {
      const modelHeight = model.text.length * font.lineHeight;
      const height = canvas.height / 2;

      ctx.fillStyle = 'pink';
      ctx.fillRect(
        canvas.width / 2 - 14,
        0,
        canvas.width / 2,
        height / 100 * modelHeight
      );
    },
  };
}
