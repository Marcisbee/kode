import { EditorPlugin } from 'editor/src/plugins/types';
import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const filesContainer = document.getElementById('left')!;

function Files() {
  const [files, setFiles] = useState<{ entry: string, type: 'DIRECTORY' | 'FILE' }[]>([]);

  useEffect(() => {
    Neutralino.filesystem
      .readDirectory(NL_PATH)
      .then(setFiles)
      .catch((e) => {
        console.error(e);
      });
  }, []);

  return (
    h('div', null, [
      h('h2', null, 'Project'),
      h('ul', null, files
        .filter(({ entry }) => entry !== '.' && entry !== '..')
        .map(({ type, entry }) => (
          h('li', null, [
            // JSON.stringify(type),
            entry
          ])
        )
      )),
    ])
  );
}

export function filesPlugin(): EditorPlugin {
  return (editor) => {
    render(
      h(Files, null),
      filesContainer,
    );
  };
}
