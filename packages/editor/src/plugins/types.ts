import type { Token } from '../lexer/normalize-tokens';
import type { Editor } from '../editor';

export interface EditorPluginConfig {
  editor?: EditorPlugin;
  model?: ModelPlugin;
  input?: (editor: Editor) => InputPlugin;
}

export interface EditorPlugin {
  (editor: Editor): (() => void) | void;
}

export interface ModelPlugin {
  (editor: Editor): ((value: Token, col: number, row: number) => void) | void;
}

export interface InputPlugin {
  (event: KeyboardEvent): void;
}
