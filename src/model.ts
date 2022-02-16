import jsTokens, { Token } from 'js-tokens';

import { KEYWORDS, RENDER_HIDDEN, RESERVED_KEYWORDS, THEME } from './constants';
import type { Editor } from './editor';

export interface ModelSelection {
  start: {
    x: number;
    y: number;
  };
  end?: {
    x: number;
    y: number;
  }
}

export class Model {
  public gutterWidth = 50;
  private cachedTokens: Iterable<Token> = [];
  private key?: string;

  private cacheLineGuide = 0;

  constructor(
    public text: string[] = [''],
    public selections: ModelSelection[] = [
      {
        start: {
          x: 0,
          y: 0,
        },
      },
      // {
      //   start: {
      //     x: 0,
      //     y: 10,
      //   }
      // },
    ],
  ) {}

  get tokens() {
    const key = this.text.join('\n');

    if (this.key === key) {
      return this.cachedTokens;
    }

    return (this.cachedTokens = jsTokens(this.text.join('\n')));
  }

  public render(editor: Editor) {
    const { ctx, font, input, scroll, modelPlugins, letterWidth } = editor;

    const startX = this.selections[0].start.x;
    const startY = this.selections[0].start.y;
    const fontFamily = `${font.size}px ${font.family}`;
    const inputX =
      this.gutterWidth +
      Math.min(startX, this.text[startY].length) * letterWidth;
    const inputY = startY * font.lineHeight;

    input.style.transform = `translate(${inputX}px, ${inputY - scroll}px)`;

    let col = 0;
    let row = 0;

    function resetFontOptions() {
      ctx.font = fontFamily;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }

    this.cacheLineGuide = 0;

    const plugins = modelPlugins.map((fn) => fn(editor)).filter(Boolean);

    for (const token of this.tokens) {
      if (col === 0 && this.selections.length > 0) {
        ctx.fillStyle = THEME.SELECTION;

        for (const { start, end } of this.selections) {
          if (!end) {
            continue;
          }

          if (start.y === row && end.y === row) {
            this.renderSelections(editor, row, start.x, (end?.x || start.x) - start.x);
            continue;
          }

          if (start.y === row && end.y > row) {
            this.renderSelections(editor, row, start.x, this.text[row].length - start.x);
            continue;
          }

          if (start.y <= row && end.y > row) {
            this.renderSelections(editor, row, 0, Math.max(1, this.text[row].length));
            continue;
          }

          if (start.y < row && end.y === row) {
            this.renderSelections(editor, row, 0, Math.min(end?.x || 0, this.text[row].length));
            continue;
          }
        }
      }

      if (
        col === 0 &&
        token.type !== 'WhiteSpace' &&
        token.type !== 'LineTerminatorSequence'
      ) {
        this.cacheLineGuide = 0;
      }

      if (col === 0 && token.type === 'WhiteSpace') {
        this.cacheLineGuide = Math.ceil(token.value.length / 2);
      }

      if (col === 0) {
        this.renderGuides(editor, row);
      }

      resetFontOptions();

      if (token.type === 'MultiLineComment') {
        const lines = token.value.split('\n');

        let sumLines = 0;
        for (const line of lines) {
          sumLines++;

          resetFontOptions();

          ctx.fillStyle = THEME.COMMENT;
          ctx.fillText(
            line,
            this.gutterWidth + letterWidth * col,
            2 + font.lineHeight * row
          );

          col += line.length;

          if (sumLines >= lines.length) {
            continue;
          }

          if (RENDER_HIDDEN) {
            ctx.fillStyle = THEME.HIDDEN;
            ctx.fillText(
              '↵',
              this.gutterWidth + letterWidth * col,
              2 + font.lineHeight * row
            );
          }

          col = 0;
          row += 1;

          this.renderLineNumber(editor, col, row);
        }

        continue;
      }

      if (token.type === 'LineTerminatorSequence') {
        if (RENDER_HIDDEN) {
          ctx.fillStyle = THEME.HIDDEN;
          ctx.fillText(
            '↵',
            this.gutterWidth + letterWidth * col,
            2 + font.lineHeight * row
          );
        }
        col = 0;
        row += 1;

        this.renderLineNumber(editor, col, row);

        continue;
      }

      for (const pluginEnd of plugins) {
        pluginEnd!(token, col, row);
      }

      switch (token.type) {
        case 'IdentifierName': {
          const isReserved = RESERVED_KEYWORDS.indexOf(token.value) > -1;
          if (isReserved) {
            ctx.fillStyle = THEME.RESERVED;
            break;
          }

          const isKeyword = KEYWORDS.indexOf(token.value) > -1;
          if (isKeyword) {
            ctx.fillStyle = THEME.KEYWORD;
            break;
          }

          ctx.fillStyle = THEME.IDENTIFIER;
          break;
        }

        case 'RegularExpressionLiteral': {
          ctx.fillStyle = THEME.REG_EXP;
          break;
        }

        case 'Punctuator': {
          ctx.fillStyle = THEME.PUNCTUATION;
          break;
        }

        case 'SingleLineComment': {
          ctx.fillStyle = THEME.COMMENT;
          break;
        }

        case 'NumericLiteral': {
          ctx.fillStyle = THEME.NUMBER;
          break;
        }

        case 'TemplateTail':
        case 'TemplateHead': {
          ctx.fillStyle = THEME.STRING;
          break;
        }

        case 'StringLiteral': {
          ctx.fillStyle = THEME.STRING;
          break;
        }

        default: {
          ctx.fillStyle = THEME.DEFAULT;
          break;
        }
      }

      ctx.textBaseline = 'top';
      ctx.fillText(
        token.value,
        this.gutterWidth + letterWidth * col,
        font.lineHeight * row + 2
      );

      // Draw line number
      if (col === 0) {
        this.renderLineNumber(editor, col, row);
      }

      col += token.value.length;
    }
  }

  public renderLineNumber(
    { ctx, font, letterWidth }: Editor,
    col: number,
    row: number
  ) {
    const lineNumber = (row + 1).toString();

    ctx.fillStyle = THEME.PUNCTUATION;
    ctx.font = `${font.size * 0.9}px ${font.family}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(
      lineNumber,
      this.gutterWidth - 20 + letterWidth * col,
      2 + font.lineHeight * row
    );
  }

  public renderSelections({ ctx, font, letterWidth }: Editor, row: number, start: number, end: number) {
    ctx.fillRect(
      this.gutterWidth + letterWidth * start,
      font.lineHeight * row - 2,
      letterWidth * end,
      font.lineHeight
    );
  }

  public renderGuides({ ctx, font, letterWidth }: Editor, row: number) {
    if (!this.cacheLineGuide) {
      return;
    }

    ctx.fillStyle = THEME.GUIDE;

    for (let i = 0; i < this.cacheLineGuide; i++) {
      ctx.fillRect(
        this.gutterWidth + letterWidth * (2 * i),
        font.lineHeight * row - 2,
        1,
        font.lineHeight
      );
    }
  }
}
