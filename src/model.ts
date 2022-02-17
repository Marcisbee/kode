import type { Editor } from './editor';
import { tokenize } from './lexer/prism';
import { typescript } from './lexer/languages/typescript';
import { Token, normalizeTokens } from './lexer/normalize-tokens';

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
  private tokens: Token[][] = [];
  private cachedLineGuide = 0;

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
  ) {
    this.updateTokens();
  }

  public refreshContents() {
    this.updateTokens();
  }

  public render(editor: Editor) {
    const { canvas, ctx, font, input, scroll, modelPlugins, letterWidth, theme } = editor;

    const startX = this.selections[0].start.x;
    const startY = this.selections[0].start.y;
    const fontFamily = `${font.size}px ${font.family}`;
    const inputX =
      this.gutterWidth +
      Math.min(startX, this.text[startY].length) * letterWidth;
    const inputY = startY * font.lineHeight;

    input.style.transform = `translate(${inputX}px, ${inputY - scroll}px)`;

    function resetFontOptions() {
      ctx.font = fontFamily;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }

    this.cachedLineGuide = 0;

    const plugins = modelPlugins.map((fn) => fn(editor)).filter(Boolean);

    const visibleLines = [
      Math.floor(scroll / font.lineHeight),
      Math.floor((canvas.height + scroll) / font.lineHeight),
    ]

    for (const rowRaw in this.tokens) {
      const row = parseInt(rowRaw);
      let col = 0;

      if (row > 0) {
        ctx.translate(0, font.lineHeight);
      }

      if (row < visibleLines[0] || row > visibleLines[1]) {
        continue;
      }

      if (this.selections.length > 0) {
        ctx.fillStyle = theme.selection;

        for (const { start, end } of this.selections) {
          if (!end) {
            continue;
          }

          if (start.y === row && end.y === row) {
            this.renderSelections(editor, start.x, (end?.x || start.x) - start.x);
            continue;
          }

          if (start.y === row && end.y > row) {
            this.renderSelections(editor, start.x, this.text[row].length - start.x);
            continue;
          }

          if (start.y <= row && end.y > row) {
            this.renderSelections(editor, 0, Math.max(1, this.text[row].length));
            continue;
          }

          if (start.y < row && end.y === row) {
            this.renderSelections(editor, 0, Math.min(end?.x || 0, this.text[row].length));
            continue;
          }
        }
      }

      // @TODO: Normalize this beforehand.
      const tokens = this.tokens[row].filter((t) => !t.empty && !!t.content);

      const firstToken = tokens?.[0];
      if (firstToken?.content) {
        this.cachedLineGuide = 0;
      }

      if (/^[ \t]+/.test(firstToken?.content)) {
        this.cachedLineGuide = Math.ceil(firstToken.content.replace(/[^ \t].*$/, '').length / 2);
      }

      this.renderGuides(editor);
      this.renderLineNumber(editor, col, row);

      for (const token of tokens) {
        // if (token.type === 'LineTerminatorSequence') {
        //   if (RENDER_HIDDEN) {
        //     ctx.fillStyle = THEME.HIDDEN;
        //     ctx.fillText(
        //       '↵',
        //       this.gutterWidth + letterWidth * col,
        //       2
        //     );
        //   }
        //   col = 0;
        //   row += 1;

        //   continue;
        // }

        for (const pluginEnd of plugins) {
          pluginEnd!(token, col, row);
        }

        const [type] = token.types.slice(-1);

        resetFontOptions();
        ctx.fillStyle = theme[type] || theme.plain;
        ctx.fillText(
          token.content,
          this.gutterWidth + letterWidth * col,
          2
        );

        col += token.content.length;

        if (!theme[type]) {
          console.log('unhandled', token, type);
        }
      }
    }
  }

  public renderLineNumber(
    { ctx, font, letterWidth, theme }: Editor,
    col: number,
    row: number
  ) {
    const lineNumber = (row + 1).toString();

    ctx.fillStyle = theme.punctuation;
    ctx.font = `${font.size * 0.9}px ${font.family}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(
      lineNumber,
      this.gutterWidth - 20 + letterWidth * col,
      3 + font.lineHeight * 0
    );
  }

  public renderSelections({ ctx, font, letterWidth }: Editor, start: number, end: number) {
    ctx.fillRect(
      this.gutterWidth + letterWidth * start,
      -2,
      letterWidth * end,
      font.lineHeight
    );
  }

  public renderGuides({ ctx, font, letterWidth, theme }: Editor) {
    if (!this.cachedLineGuide) {
      return;
    }

    ctx.fillStyle = theme.guide;

    for (let i = 0; i < this.cachedLineGuide; i++) {
      ctx.fillRect(
        this.gutterWidth + letterWidth * (2 * i),
        -2,
        1,
        font.lineHeight
      );
    }
  }

  private updateTokens() {
    const key = this.text.join('\n');
    const rawTokens = tokenize(key, typescript) as any;

    this.tokens = normalizeTokens(rawTokens);
  }
}
