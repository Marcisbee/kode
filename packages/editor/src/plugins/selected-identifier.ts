import type { Model } from '../model';

import type { EditorPlugin } from './types';

export function selectedIdentifier({ text, selections }: Model): string | void {
  if (selections[0].end) {
    return;
  }

  const x = selections[0].start.x;
  const y = selections[0].start.y;

  const line = text[y];

  if (!line[x]?.trim() && !line[x - 1]?.trim()) {
    return;
  }

  const before = [...line.substring(0, x)].reverse();
  const after = line.substring(x);

  let word = '';
  for (const char of after) {
    if (!/\w/.test(char)) {
      break;
    }

    word += char;
  }

  for (const char of before) {
    if (!/\w/.test(char)) {
      break;
    }

    word = char + word;
  }

  if (!word.length) {
    return;
  }

  return word;
}

export function selectedIdentifierPlugin(): EditorPlugin {
  return (editor) => {
    editor.events.on('model', (token, col) => {
      const { ctx, font, model, letterWidth, theme } = editor;

      const identifier = selectedIdentifier(model);

      if (!identifier) {
        return;
      }

      if (token.types.indexOf('keyword') > -1) {
        return;
      }

      if (token.types.indexOf('string') > -1) {
        return;
      }

      if (token.content.trim() !== identifier) {
        return;
      }

      const leadingSpace = token.content.replace(/[^ \t].*$/, '');

      ctx.fillStyle = theme['match-identifier'];
      ctx.fillRect(
        model.gutterWidth + letterWidth * (col + leadingSpace.length),
        0,
        letterWidth * token.content.trim().length,
        font.lineHeight
      );
    });
  };
}
