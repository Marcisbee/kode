import { h } from 'preact';
import { EditorComponent } from './editor';

import { Files } from './files';

/**
  <div id="left"></div>
  <div id="content">
    <div id="tabs">
      <ul>
        <li>
          main.ts
        </li>
      </ul>
    </div>
    <div id="editorWrapper">
      <div id="editor"></div>
    </div>
  </div>
 */

export function App() {
  return (
    h('div', null, [
      h('div', { id: 'left' }, [
        h(Files, null),
      ]),
      h('div', { id: 'content' }, [
        h('div', { id: 'tabs' }, [
          h('ul', null, [
            h('li', null, 'main.ts'),
          ]),
        ]),

        h('div', { id: 'editorWrapper' }, [
          h(EditorComponent, null),
        ]),
      ]),
    ])
  );
}
