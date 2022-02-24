import { EditorPlugin } from 'editor/src/plugins/types';
import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const filesContainer = document.getElementById('left')!;

function IconFile({ entry }: { entry: string }) {
  // if (entry === 'package.json') {
  //   return (
  //     h('i', { class: 'icon npm-icon', entry })
  //   );
  // }

  // if (entry.endsWith('.json')) {
  //   return (
  //     h('i', { class: 'icon json-icon', entry })
  //   );
  // }

  return (
    h('i', { class: 'icon file-icon', entry })
  );
}

function IconDirectory({ entry }: { entry: string }) {
  return (
    h('i', { class: 'icon dir-icon', entry })
  );
}

function Files() {
  const [path, setPath] = useState<string>('/private/var/www/private/kode/packages/editor');
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
      h('h2', null, 'Project'),

      h('ul', null, files
        // .filter(({ entry }) => entry !== '.' && entry !== '..')
        .sort((a, b) => a.entry < b.entry ? 1 : -1)
        .sort((a, b) => a.type === 'FILE' ? 1 : -1)
        .map(({ type, entry }) => (
          h('li', {
            onClick: type === 'DIRECTORY' ? () => {
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
