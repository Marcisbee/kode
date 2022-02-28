import { Exome, registerLoadable } from 'exome';
import { Workspace } from './workspace';

export class Store extends Exome {
  public workspace?: Workspace;
}

registerLoadable({ Store });

export const store = new Store();
