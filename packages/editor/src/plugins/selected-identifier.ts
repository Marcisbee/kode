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
  for (let i = 0; i < after.length; i++) {
    const char = after[i];

    if (!/\w/.test(char)) {
      break;
    }

    word += char;
  }

  for (let i = 0; i < before.length; i++) {
    const char = before[i];

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
