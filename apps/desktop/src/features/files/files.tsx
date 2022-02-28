import { useStore } from 'exome/preact';

import { store } from '../../store';
import { Tree } from '../tree/tree';

import './files.css';

export function Files() {
  const { name, path } = useStore(store.workspace!);

  return (
    <div>
      <h2>{name}</h2>

      <Tree
        key={`tree|${path}/${name}`}
        path={path}
        isOpen
      />
    </div>
  );
}
