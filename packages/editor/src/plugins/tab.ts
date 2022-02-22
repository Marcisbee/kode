import type { EditorPlugin } from './types';

export function tabPlugin(tabCharacter = '  '): EditorPlugin {
  return ({ events, model }) => {
    events.on('input', (event) => {
      if (event.type !== 'keydown') {
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      for (const { start } of model.selections) {
        const { x, y } = start;
        const line = model.text[y];

        if (event.shiftKey) {
          const newLine = line.replace(new RegExp(`^${tabCharacter}`), '');

          model.text.splice(y, 1, newLine);
          start.x = Math.min(
            x - (line.length - newLine.length),
            model.text[y].length
          );
          model.refreshContents();
          return;
        }

        const chunks = [
          line.substring(0, x),
          tabCharacter,
          line.substring(x),
        ];

        model.text.splice(y, 1, chunks.join(''));
        start.x = Math.min(
          x + tabCharacter.length,
          model.text[y].length
        );
        model.refreshContents();
      }
    });
  };
}
