import type { EditorPlugin } from './types';

const autoClosingBrackets: Record<string, string> = {
  '{': '}',
  '[': ']',
  '(': ')',
  '"': '"',
  "'": "'",
};

export function autoClosePlugin(): EditorPlugin {
  return ({ events, model }) => {
    events.on('input', (event) => {
      if (event.type !== 'keydown') {
        return;
      }

      const after = autoClosingBrackets[event.key];

      if (after === undefined) {
        return;
      }

      for (const { start } of model.selections) {
        const line = model.text[start.y];

        const beforeCaret = line.substring(0, start.x);
        const selection = line.substring(start.x, start.x);
        const afterCaret = line.substring(start.x, line.length);

        model.text[start.y] = `${beforeCaret}${selection}${after}${afterCaret}`;
        model.refreshContents();
      }
    });
  };
}
