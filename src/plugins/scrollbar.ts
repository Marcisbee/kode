import type { EditorPluginConfig } from './types';

export function scrollbarPlugin(): EditorPluginConfig {
  return {
    editor({ ctx, model, scroll, height, width, font, theme }) {
      const modelHeight = model.text.length * font.lineHeight;
      const visiblePercentage = Math.min(100, 100 / (modelHeight + height) * height);
      const scrollPercentage = 100 / modelHeight * scroll;
      const barHeight = Math.max(30, height / 100 * visiblePercentage);
      const scrollTop = ((height - barHeight) / 100) * scrollPercentage;

      ctx.fillStyle = theme.scrollbar;
      ctx.fillRect(
        width - 14,
        scroll + (scrollTop),
        width,
        barHeight
      );
    },
  };
}
