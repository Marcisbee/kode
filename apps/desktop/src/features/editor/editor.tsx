import 'editor/src/style.css';
import { useStore } from 'exome/preact';
import { useLayoutEffect, useRef } from 'preact/hooks';

import { store } from '../../store';

// const stressTest = new Array(2000).fill(`export class Editor {
//   public scroll: number = 0;
//   public input: HTMLInputElement;

//   public editorPlugins: EditorPlugin[] = [];
//   public modelPlugins: ModelPlugin[] = [];
//   public inputPlugins: InputPlugin[] = [];
// }`).join('\n\n');

export function EditorComponent() {
  const { editor } = useStore(store.workspace!);
  const editorWrapper = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!editorWrapper.current) {
      return;
    }

    /**
     * Create custom events for Copy/Cut/Paste because of:
     * https://github.com/neutralinojs/webview/issues/9
     */
    editor.input.addEventListener('keydown', (e) => {
      if (e.metaKey && e.key === 'v') {
        e.preventDefault();

        Neutralino.clipboard
          .readText('text', '')
          .then((text) => {
            const customEvent = new CustomEvent('paste', {
              bubbles: true,
              detail: {
                getData: () => text,
              },
            });

            editor.input.dispatchEvent(customEvent);
          });
        return;
      }
    });

    editor.mount(editorWrapper.current);
  }, []);

  return (
    <div id="editorWrapper">
      <div
        id="editor"
        ref={editorWrapper as any}
      />
    </div>
  );
}
