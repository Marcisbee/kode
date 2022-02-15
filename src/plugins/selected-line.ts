import { THEME } from '../constants';

import type { EditorPluginConfig } from './types';

export function selectedLinePlugin(): EditorPluginConfig {
  return {
    editor(editor) {
      editor.ctx.fillStyle = THEME.SELECTED_LINE_BG;
      editor.ctx.fillRect(
        0,
        editor.model.y * editor.font.lineHeight - 2,
        editor.canvas.width,
        editor.font.lineHeight
      );
    },
  };
}
