import { KEYWORDS, RESERVED_KEYWORDS, THEME } from '../constants';
import type { Model } from '../model';

import type { EditorPluginConfig } from './types';

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

export function selectedIdentifierPlugin(): EditorPluginConfig {
  return {
    model({ ctx, font, model, letterWidth }) {
      const identifier = selectedIdentifier(model);

      if (!identifier) {
        return;
      }

      return (token, col) => {
        if (token.type !== 'IdentifierName') {
          return;
        }

        if (token.value !== identifier) {
          return;
        }

        if (RESERVED_KEYWORDS.indexOf(token.value) > -1) {
          return;
        }

        if (KEYWORDS.indexOf(token.value) > -1) {
          return;
        }

        ctx.fillStyle = THEME.MATCH_IDENTIFIER_BG;
        ctx.fillRect(
          model.gutterWidth + letterWidth * col,
          -2,
          letterWidth * token.value.length,
          font.lineHeight
        );
      };
    },
  };
}
