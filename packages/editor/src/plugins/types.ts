import type { Editor } from '../editor';

export interface EditorPlugin {
  (editor: Editor): void;
}
