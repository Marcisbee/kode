import { KEYWORDS, RESERVED_KEYWORDS, THEME } from '../constants';
import type { Model } from '../model';

import type { EditorPluginConfig } from './types';

export function selectedIdentifier(model: Model): string | void {
  const line = model.text[model.y];

  if (!line[model.x]?.trim() && !line[model.x - 1]?.trim()) {
    return;
  }

  const before = [...line.substring(0, model.x)].reverse();
  const after = line.substring(model.x);

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

      return (token, col, row) => {
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
          font.lineHeight * row - 2,
          letterWidth * token.value.length,
          font.lineHeight
        );
      };
    },
  };
}
