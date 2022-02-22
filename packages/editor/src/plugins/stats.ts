// @ts-ignore
import Stats from 'stats.js';

import type { EditorPlugin } from './types';

export function statsPlugin(): EditorPlugin {
  const stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  return (editor) => {
    editor.events.on('render', () => {
      stats.begin();

      return () => {
        stats.end();
      };
    });
  };
}
