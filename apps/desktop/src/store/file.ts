import { Exome, registerLoadable } from 'exome';

export class File extends Exome {
  public get name() {
    return (this.path || '').split('/').pop() || 'unnamed';
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
