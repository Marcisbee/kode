import type { EditorPluginConfig } from './types';

const autoClosingBrackets: Record<string, string> = {
  '{': '}',
  '[': ']',
  '(': ')',
  '"': '"',
  "'": "'",
};

export function autoClosePlugin(): EditorPluginConfig {
  return {
    input({ model }) {
      return (event) => {
        if (event.type !== 'keydown') {
          return;
        }

        const after = autoClosingBrackets[event.key];

        if (after === undefined) {
          return;
        }

        const line = model.text[model.y];

        const beforeCaret = line.substring(0, model.x);
        const selection = line.substring(model.x, model.x);
        const afterCaret = line.substring(model.x, line.length);

        model.text[model.y] = `${beforeCaret}${selection}${after}${afterCaret}`;

        return;
      };
    },
  };
}
