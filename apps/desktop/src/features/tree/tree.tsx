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

function IconDirectory({ entry, isOpen }: { entry: string, isOpen: boolean }) {
  return (
    <i
      class={`icon dir-icon ${!isOpen ? mapDirectory(entry) : mapDirectory('directory-open')}`}
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

function filterFiles({ entry }: FileDataset) {
  return filesToIgnore.indexOf(entry) === -1;
}

function sortFiles(a: FileDataset, b: FileDataset) {
  if (a.type === b.type) {
    return a.entry > b.entry ? 1 : -1;
  }

  return a.type === 'FILE' ? 1 : -1;
}

export interface TreeProps {
  path: string;
  isOpen?: boolean;
  depth?: number;
}

export function Tree({
  path,
  isOpen = false,
  depth = 0,
}: TreeProps) {
  const [files, setFiles] = useState<FileDataset[]>([]);

  const filesFiltered = useMemo(() => (
    files
      .filter(filterFiles)
      .sort(sortFiles)
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
              depth={depth}
            />
          ) : (
            <TreeFile
              path={path}
              entry={entry}
              depth={depth}
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
  depth: number;
}

function TreeDirectory({
  path,
  entry,
  depth,
}: TreeDirectoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  async function onClick() {
    setIsOpen((s) => !s);
  }

  return (
    <li
      class="list-directory"
      data-is-open={isOpen}
    >
      <button
        onClick={onClick}
        style={{ paddingLeft: (depth * 10) + 20 }}
      >
        <svg class="dir-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>

        <IconDirectory entry={entry} isOpen={isOpen} />

        <span>
          {entry}
        </span>
      </button>

      {isOpen && (
        <Tree
          path={`${path}/${entry}`}
          isOpen
          depth={depth + 1}
        />
      )}
    </li>
  );
}

export interface TreeFileProps {
  path: string;
  entry: string;
  depth: number;
}

function TreeFile({
  path,
  entry,
  depth,
}: TreeFileProps) {
  const { getFile } = store.workspace!;

  async function onClick() {
    getFile(`${path}/${entry}`);
  }

  return (
    <li
      class="list-file"
    >
      <button
        onClick={onClick}
        style={{ paddingLeft: (depth * 10) + 20 }}
      >
        <IconFile entry={entry} />

        <span>
          {entry}
        </span>
      </button>
    </li>
  );
}
