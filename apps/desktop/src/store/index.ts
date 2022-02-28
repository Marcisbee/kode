import { Exome, registerLoadable } from 'exome';
import { Workspace } from './workspace';

export class Store extends Exome {
  public workspace?: Workspace;

  public setWorkspace(workspace: Workspace) {
    this.workspace = workspace;
  }
}

registerLoadable({ Store });

export const store = new Store();
