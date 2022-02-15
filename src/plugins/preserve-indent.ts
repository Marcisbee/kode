import type { EditorPluginConfig } from './types';

const autoIndentBetween: [string, string][] = [
  ['{', '}'],
  ['[', ']'],
  ['(', ')'],
];

export function preserveIndent(tabCharacter = '  '): EditorPluginConfig {
  return {
    input({ model }) {
      return (event) => {
        if (event.key !== 'Enter') {
          return;
        }

        const lineBefore = model.text[model.y - 1];
        const line = model.text[model.y];

        if (!lineBefore) {
          return;
        }

        const matchesSpacing = /^\s+/.exec(lineBefore);

        const leadingChar = lineBefore[lineBefore.length - 1];
        const trailingChar = line[0];

        for (const [before, after] of autoIndentBetween) {
          if (leadingChar === before && trailingChar === after) {
            const spacing = (matchesSpacing?.[0] || '') + tabCharacter;
            const chunks = [
              line.substring(0, model.x),
              spacing,
              '\n' + (matchesSpacing?.[0] || ''),
              line.substring(model.x),
            ];

            model.text.splice(model.y, 1, ...chunks.join('').split('\n'));
            model.x = Math.min(
              model.x + spacing.length,
              model.text[model.y].length
            );
            return;
          }
        }

        if (!matchesSpacing) {
          return;
        }

        const chunks = [
          line.substring(0, model.x),
          matchesSpacing[0],
          line.substring(model.x),
        ];

        model.text.splice(model.y, 1, chunks.join(''));
        model.x = Math.min(
          model.x + matchesSpacing[0].length,
          model.text[model.y].length
        );
      };
    },
  };
}
