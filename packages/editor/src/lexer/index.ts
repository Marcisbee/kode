export { Lexer, typescript } from '@ryusei/light';

export type Token = [string, string, TokenInfo?];

interface TokenInfo {
  /**
   * Depth of a tokenizer state.
   */
  depth: number;

  /**
   * A language ID.
   */
  language: string;

  /**
   * A state name.
   */
  state: string;

  /**
   * `true` when the token is split into multiline and it is the first token.
   */
  head?: boolean;

  /**
   * `true` when the token is split into multiline and it is the last token.
   */
  tail?: boolean;

  /**
   * Indicates whether the token is split into multiline or not.
   */
  split?: boolean;

  /**
   * The number of lines from this token to the head token.
   */
  distance?: number;
}
