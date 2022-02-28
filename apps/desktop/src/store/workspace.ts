import { Exome, registerLoadable } from 'exome';

import { memoize } from '../util/memoize';

import { File } from './file';

const getDirectoryName = memoize<(path: string) => string>(
  (p) => (p.split('/').pop() || 'unnamed')
);

export class Workspace extends Exome {
  public files: File[] = [];

  public get name() {
    return getDirectoryName(this.path);
  }

  constructor(
    public path: string,
  ) {
    super();
  }
}

registerLoadable({ Workspace });
