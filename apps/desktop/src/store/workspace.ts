import { Editor } from 'editor';
import { Exome, registerLoadable } from 'exome';

import { File } from './file';

export class Workspace extends Exome {
  public editor: Editor;
  public files: File[] = [];
  public currentFile?: File;

  public get name() {
    return (this.path || '').split('/').pop() || 'unnamed';
  }

  constructor(
    public path: string,
  ) {
    super();

    this.editor = new Editor();
  }

  public setPath(path: string) {
    this.path = path;
  }

  public async getFile(path: string) {
    const text = await Neutralino.filesystem.readFile(path);
    const textData = text.split('\n');

    this.currentFile = new File(path, textData);
    this.editor.model.setText(textData);
  }
}

registerLoadable({ Workspace });
