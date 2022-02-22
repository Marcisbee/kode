import { getLinePosition } from '../utils';

import type { EditorPluginConfig } from './types';

export function selectedLinePlugin(): EditorPluginConfig {
  return {
    editor({ ctx, model, width, theme, state }) {
      ctx.fillStyle = theme['selected-line'];

      for (const { start, end } of model.selections) {
        if (end) {
          continue;
        }

        const topPosition = getLinePosition(state, start.y);

        // Don't select line that is nota regular line
        if (topPosition == null) {
          continue;
        }

        ctx.fillRect(
          0,
          topPosition.y,
          width,
          topPosition.h
        );
      }
    },
  };
}
