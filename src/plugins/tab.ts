import type { EditorPluginConfig } from './types';

export function tabPlugin(tabCharacter = '  '): EditorPluginConfig {
  return {
    input({ model }) {
      return (event) => {
        if (event.key !== 'Tab') {
          return;
        }

        const line = model.text[model.y];

        if (event.shiftKey) {
          const newLine = line.replace(new RegExp(`^${tabCharacter}`), '');

          model.text.splice(model.y, 1, newLine);
          model.x = Math.min(
            model.x - (line.length - newLine.length),
            model.text[model.y].length
          );
          return;
        }

        const chunks = [
          line.substring(0, model.x),
          tabCharacter,
          line.substring(model.x),
        ];

        model.text.splice(model.y, 1, chunks.join(''));
        model.x = Math.min(
          model.x + tabCharacter.length,
          model.text[model.y].length
        );
      };
    },
  };
}
