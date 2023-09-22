import type { EditorPlugin } from './types';

export function autoHeightPlugin(): EditorPlugin {
  return (editor) => {
    const { container } = editor;

    if (!container) {
      return;
    }

    let lastHeight = editor.state.height;

    editor.events.on('render', () => {
      const { font, state, _onResize } = editor;

      const newHeight = font.lineHeight + state.height;

      if (lastHeight === newHeight) {
        return;
      }

      lastHeight = newHeight;
      container.style.height = `${newHeight}px`;

      requestAnimationFrame(_onResize);
    });
  };
}
