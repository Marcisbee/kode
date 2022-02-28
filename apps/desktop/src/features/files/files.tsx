import { useState, useEffect, useMemo } from 'preact/hooks';
import 'icons/dist/icons.css';
import { mapFile, mapDirectory } from 'icons/map';

import { MainEditorInstance } from '../editor/editor';

import './files.css';

function IconFile({ entry }: { entry: string }) {
  return (
    <i
      class={`icon file-icon ${mapFile(entry)}`}
    />
  );
}

function IconDirectory({ entry }: { entry: string }) {
  return (
    <i
      class={`icon dir-icon ${mapDirectory(entry)}`}
    />
  );
}

const filesToIgnore = [
  // '.',
  '..',
  '.DS_Store',
  '.git',
];

interface FileDataset {
  entry: string;
  type: 'DIRECTORY' | 'FILE';
}

export function Files() {
  const [path, setPath] = useState<string>('/var/www/dxjs');
  const [files, setFiles] = useState<FileDataset[]>([]);
  const filesFiltered = useMemo(() => (files
    .filter(({ entry }) => filesToIgnore.indexOf(entry) === -1)
    .sort((a, b) => {
      if (a.type === b.type) {
        return a.entry > b.entry ? 1 : -1;
      }

      return a.type === 'FILE' ? 1 : -1;
    })
  ), [files.toString()]);
  const currentDirectoryName = path.split('/').pop();

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

  async function onClick(e: MouseEvent) {
    const { type, entry } = (e.target as any).dataset as FileDataset;

    if (type === 'DIRECTORY') {
      if (entry === '.') {
        setPath((p) => p.split('/').slice(0, -1).join('/'));
        return;
      }

      setPath((p) => `${p}/${entry}`);
      return;
    }

    const text = await Neutralino.filesystem.readFile(`${path}/${entry}`);

    MainEditorInstance.model.setText(text.split('\n'));
  }

  return (
    <div>
      <h2>{currentDirectoryName}</h2>

      <ul>
        {filesFiltered.map(({ type, entry }) => (
          <li
            data-type={type}
            data-entry={entry}
            class={`list-${type === 'DIRECTORY' ? 'directory' : 'file'}`}
            onClick={onClick}
          >
            {type === 'DIRECTORY' ? (
              <IconDirectory entry={entry} />
            ) : (
              <IconFile entry={entry} />
            )}

            <span>
              {entry}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
