import type { EditorPluginConfig } from './types';

export function keyMapPlugin(): EditorPluginConfig {
  return {
    input({ model }) {
      return (event) => {
        if (event.metaKey) {
          // @TODO: Select all model
          if (event.key === 'a') {
            return;
          }

          return;
        }

        if (event.key === 'Escape') {
          return;
        }

        if (event.key === 'ArrowRight') {
          const x = Math.min(model.x, model.text[model.y].length);
          if (
            x === model.text[model.y].length &&
            model.y < model.text.length - 1
          ) {
            model.x = 0;
            model.y += 1;
          } else {
            model.x = Math.min(x + 1, model.text[model.y].length);
          }
        }

        if (event.key === 'ArrowLeft') {
          const x = Math.min(model.x, model.text[model.y].length);
          if (x === 0 && model.y > 0) {
            model.x = model.text[model.y - 1].length;
            model.y = Math.max(model.y - 1, 0);
          } else {
            model.x = Math.max(x - 1, 0);
          }
        }

        if (event.key === 'ArrowDown') {
          model.y = Math.min(model.y + 1, model.text.length - 1);
          // model.x = Math.min(model.x, model.text[model.y].length);
        }

        if (event.key === 'ArrowUp') {
          model.y = Math.max(model.y - 1, 0);
          // model.x = Math.min(model.x, model.text[model.y].length);
        }

        if (event.key === 'Enter') {
          const chunks = [];

          chunks.push(model.text[model.y].substring(0, model.x));
          chunks.push(model.text[model.y].substring(model.x));

          model.text.splice(model.y, 1, ...chunks);
          model.y += 1;
          model.x = 0;
        }

        if (event.key?.length === 1) {
          const chunks = [];

          chunks.push(model.text[model.y].substring(0, model.x));
          chunks.push(event.key);
          chunks.push(model.text[model.y].substring(model.x));

          model.text.splice(model.y, 1, chunks.join(''));
          model.x = Math.min(model.x + 1, model.text[model.y].length);
        }

        if (event.key === 'Backspace') {
          let chunks = [];
          const x = Math.min(model.x, model.text[model.y].length);

          if (x === 0 && model.y - 1 >= 0) {
            // Should move to previous line
            chunks = model.text.slice(model.y - 1, model.y + 1);

            model.x = model.text[model.y - 1].length;
            model.text.splice(model.y - 1, 2, chunks.join(''));
            model.y = Math.max(model.y - 1, 0);
          } else {
            chunks.push(model.text[model.y].substring(0, model.x - 1));
            chunks.push(model.text[model.y].substring(model.x));

            model.x = Math.max(x - 1, 0);
            model.text.splice(model.y, 1, chunks.join(''));
          }
        }

        console.log(event);
      };
    },
  };
}
