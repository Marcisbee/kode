import { mapDirectory, mapFile } from 'icons';
import 'icons/dist/icons.css';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Fragment } from 'preact/jsx-runtime';

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

interface FileDataset {
  entry: string;
  type: 'DIRECTORY' | 'FILE';
}

const filesToIgnore = [
  '.',
  '..',
  '.DS_Store',
  '.git',
];

export interface TreeProps {
  path: string;
  isOpen?: boolean;
}

export function Tree({
  path,
  isOpen = false,
}: TreeProps) {
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
    if (!path || !isOpen) {
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
  }, [path, isOpen]);

  return (
    <ul>
      {filesFiltered.map(({ type, entry }) => (
        <Fragment key={`file-list|${path}/${entry}`}>
          {type === 'DIRECTORY' ? (
            <TreeDirectory
              path={path}
              entry={entry}
            />
          ) : (
            <TreeFile
              path={path}
              entry={entry}
            />
          )}

        </Fragment>
      ))}
    </ul>
  );
}

export interface TreeDirectoryProps {
  path: string;
  entry: string;
}

function TreeDirectory({ path, entry }: TreeDirectoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  async function onClick() {
    setIsOpen((s) => !s);
  }

  return (
    <li
      class="list-directory"
      onClick={onClick}
    >
      <IconDirectory entry={entry} />

      <span>
        {entry}
      </span>

      {isOpen && (
        <Tree
          path={`${path}/${entry}`}
          isOpen
        />
      )}
    </li>
  );
}

export interface TreeFileProps {
  path: string;
  entry: string;
}

function TreeFile({ path, entry }: TreeFileProps) {
  const { getFile } = store.workspace!;

  async function onClick() {
    getFile(`${path}/${entry}`);
  }

  return (
    <li
      class="list-file"
      onClick={onClick}
    >
      <IconFile entry={entry} />

      <span>
        {entry}
      </span>
    </li>
  );
}
