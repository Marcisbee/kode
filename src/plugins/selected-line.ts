import { THEME } from '../constants';

import type { EditorPluginConfig } from './types';

export function selectedLinePlugin(): EditorPluginConfig {
  return {
    editor({ ctx, model, canvas, font }) {
      ctx.fillStyle = THEME.SELECTED_LINE_BG;

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
