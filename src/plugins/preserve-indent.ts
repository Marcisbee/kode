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
        if (event.type !== 'keydown') {
          return;
        }

        if (event.key !== 'Enter') {
          return;
        }

        for (const { start } of model.selections) {
          const { x, y } = start;

          const lineBefore = model.text[y - 1];
          const line = model.text[y];

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
                line.substring(0, x),
                spacing,
                `\n${matchesSpacing?.[0] || ''}`,
                line.substring(x),
              ];

              model.text.splice(y, 1, ...chunks.join('').split('\n'));
              start.x = Math.min(
                x + spacing.length,
                model.text[y].length
              );
              model.refreshContents();
              return;
            }
          }

          if (!matchesSpacing) {
            return;
          }

          const chunks = [
            line.substring(0, x),
            matchesSpacing[0],
            line.substring(x),
          ];

          model.text.splice(y, 1, chunks.join(''));
          start.x = Math.min(
            x + matchesSpacing[0].length,
            model.text[y].length
          );
          model.refreshContents();
        }
      };
    },
  };
}
