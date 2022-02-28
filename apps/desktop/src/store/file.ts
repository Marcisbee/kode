import { Exome, registerLoadable } from 'exome';

import { memoize } from '../util/memoize';

const getFileName = memoize<(path: string) => string>(
  (p) => (p.split('/').pop() || 'unnamed')
);

export class File extends Exome {
  public get name() {
    return getFileName(this.path);
  }

  constructor(
    public path: string,
    public text: string[] = [''],
    public type: 'const' | 'let' | 'pin' = 'let',
    public isSaved: boolean = false,
  ) {
    super();
  }
}

registerLoadable({ File });
