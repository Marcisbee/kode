import { getLinePosition } from '../utils';

import type { EditorPlugin } from './types';

export function selectedLinePlugin(): EditorPlugin {
  return (editor) => {
    editor.events.on('render', () => {
      const { ctx, model, width, theme, state } = editor;

      ctx.fillStyle = theme['selected-line'];

      for (const { start, end } of model.selections) {
        if (end) {
          continue;
        }

        const topPosition = getLinePosition(state, start.y);

        // Don't select line that is not a regular line
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
    });
  };
}
