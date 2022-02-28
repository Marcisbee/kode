import { useStore } from 'exome/preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import 'icons/dist/icons.css';
import { mapFile, mapDirectory } from 'icons/map';

import './files.css';
import { store } from '../../store';

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
  const { name, path, setPath, getFile } = useStore(store.workspace!);
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
        setPath(path.split('/').slice(0, -1).join('/'));
        return;
      }

      setPath(`${path}/${entry}`);
      return;
    }

    getFile(`${path}/${entry}`);
  }

  return (
    <div>
      <h2>{name}</h2>

      <ul>
        {filesFiltered.map(({ type, entry }) => (
          <li
            key={`file-list|${path}/${entry}`}
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
