import type { Model } from '../model';
import { selectRegion } from '../utils/select-region';

import type { EditorPlugin } from './types';

export function selectedIdentifier({ text, selections }: Model): string | void {
  if (selections[0].end) {
    return;
  }

  const { x, y } = selections[0].start;
  const line = text[y];

  return line.substring(...selectRegion(line, x));
}

export function selectedIdentifierPlugin(): EditorPlugin {
  return (editor) => {
    editor.events.on('model', ([tokenType, tokenContent], col) => {
      const { ctx, font, model, letterWidth, theme } = editor;

      const identifier = selectedIdentifier(model);

      if (!identifier) {
        return;
      }

      if (tokenType === 'keyword') {
        return;
      }

      if (tokenType === 'string') {
        return;
      }

      const trimmed = tokenContent.trim();

      if (trimmed !== identifier) {
        return;
      }

      const leadingSpace = tokenContent.replace(/[^ \t].*$/, '');

      ctx.fillStyle = theme['match-identifier'];
      ctx.fillRect(
        model.gutterWidth + letterWidth * (col + leadingSpace.length),
        0,
        letterWidth * trimmed.length,
        font.lineHeight
      );
    });
  };
}
