import type { EditorPlugin } from './types';

export function keyMapPlugin(): EditorPlugin {
  return (editor) => {
    editor.events.on('input', (event) => {
      const { model } = editor;

      if (event.type !== 'keydown') {
        return;
      }

      if (event.key === 'Alt') {
        return;
      }

      if (event.metaKey) {
        if (event.key === 'a') {
          const lastLineNumber = model.text.length - 1;
          const lastLineLength = model.text[lastLineNumber].length;

          model.selections = [{
            start: {
              x: 0,
              y: 0,
            },
            end: {
              x: lastLineLength,
              y: lastLineNumber,
            },
          }];
          return;
        }

        return;
      }

      if (event.key === 'Escape') {
        return;
      }

      for (const selection of model.selections) {
        if (event.shiftKey) {
          // @TODO: Handle selection via shift
          // continue;
        }

        const { start } = selection;
        const { x, y } = start;

        selection.end = undefined;

        if (event.key === 'ArrowRight') {
          const lineLength = model.text[y].length;
          const currentCol = Math.min(x, lineLength);

          if (
            currentCol === lineLength &&
            start.y < model.text.length - 1
          ) {
            start.x = 0;
            start.y += 1;
          } else {
            start.x = Math.min(currentCol + 1, lineLength);
          }
          continue;
        }

        if (event.key === 'ArrowLeft') {
          const lineLength = model.text[y].length;
          const currentCol = Math.min(x, lineLength);

          if (currentCol === 0 && y > 0) {
            start.x = model.text[y - 1].length;
            start.y = Math.max(y - 1, 0);
          } else {
            start.x = Math.max(currentCol - 1, 0);
          }
          continue;
        }

        if (event.key === 'ArrowDown') {
          start.y = Math.min(y + 1, model.text.length - 1);
          // model.x = Math.min(model.x, model.text[model.y].length);
          continue;
        }

        if (event.key === 'ArrowUp') {
          start.y = Math.max(y - 1, 0);
          // model.x = Math.min(model.x, model.text[model.y].length);
          continue;
        }

        if (event.key === 'Enter') {
          const chunks = [];

          chunks.push(model.text[y].substring(0, x));
          chunks.push(model.text[y].substring(x));

          model.text.splice(y, 1, ...chunks);
          start.y += 1;
          start.x = 0;
        }

        if (event.key === 'Backspace') {
          let chunks = [];
          const lineLength = model.text[y].length;
          const currentCol = Math.min(x, lineLength);

          if (currentCol === 0 && y - 1 >= 0) {
            // Should move to previous line
            chunks = model.text.slice(y - 1, y + 1);

            start.x = model.text[y - 1].length;
            model.text.splice(y - 1, 2, chunks.join(''));
            start.y = Math.max(y - 1, 0);
          } else {
            chunks.push(model.text[y].substring(0, x - 1));
            chunks.push(model.text[y].substring(x));

            start.x = Math.max(currentCol - 1, 0);
            model.text.splice(y, 1, chunks.join(''));
          }
        }

        if (event.key?.length === 1) {
          const chunks = [];

          chunks.push(model.text[y].substring(0, x));
          chunks.push(event.key);
          chunks.push(model.text[y].substring(x));

          model.text.splice(y, 1, chunks.join(''));
          start.x = Math.min(x + 1, model.text[y].length);
        }

        model.refreshContents();

        console.log(event);
      }
    })
  };
}
