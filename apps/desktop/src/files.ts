import { EditorPlugin } from 'editor/src/plugins/types';
import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import 'icons/dist/icons.css';
import { mapFile, mapDirectory } from 'icons/map';

import './assets/file.css';

const filesContainer = document.getElementById('left')!;

function IconFile({ entry }: { entry: string }) {
  return (
    h('i', { class: `icon file-icon ${mapFile(entry)}` })
  );
}

function IconDirectory({ entry }: { entry: string }) {
  return (
    h('i', { class: `icon dir-icon ${mapDirectory(entry)}` })
  );
}

const filesToIgnore = [
  // '.',
  '..',
  '.DS_Store',
  '.git',
];

function Files() {
  const [path, setPath] = useState<string>('/Users/marcisbee/Documents/GitHub/kode/apps/desktop');
  const [files, setFiles] = useState<{ entry: string, type: 'DIRECTORY' | 'FILE' }[]>([]);

  useEffect(() => {
    if (!path) {
      return;
    }

    // Neutralino.filesystem
    //   .getStats('../../')
    //   .then(setStats)
    //   .catch(console.error);

    Neutralino.filesystem
      .readDirectory(path)
      .then(setFiles)
      .catch(console.error);
  }, [path]);

  return (
    h('div', null, [
      h('h2', null, path.split('/').pop()),

      h('ul', null, files
        .filter(({ entry }) => filesToIgnore.indexOf(entry) === -1)
        .sort((a, b) => {
          if (a.type === b.type) {
            return a.entry > b.entry ? 1 : -1;
          }

          return a.type === 'FILE' ? 1 : -1;
        })

        .map(({ type, entry }) => (
          h('li', {
            class: `list-${type === 'DIRECTORY' ? 'directory' : 'file'}`,
            onClick: type === 'DIRECTORY' ? () => {
              if (entry === '.') {
                setPath((p) => p.split('/').slice(0, -1).join('/'));
                return;
              }

              setPath((p) => `${p}/${entry}`);
            } : undefined,
          }, [
            h(
              type === 'DIRECTORY'
                ? IconDirectory
                : IconFile,
              { entry },
            ),
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
