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
  private cachedTokens: Token[][] = [];
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

    this.key = key;

    const rawTokens = tokenize(key, typescript) as any;
    return this.cachedTokens = normalizeTokens(rawTokens);
  }

  public render(editor: Editor) {
    const { ctx, font, input, scroll, modelPlugins, letterWidth, theme } = editor;

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

    this.cacheLineGuide = 0;

    const plugins = modelPlugins.map((fn) => fn(editor)).filter(Boolean);

    for (const rowRaw in this.tokens) {
      const row = parseInt(rowRaw);
      // @TODO: Normalize this beforehand.
      const tokens = this.tokens[row].filter((t) => !t.empty && !!t.content);
      let col = 0;

      if (row > 0) {
        ctx.translate(0, font.lineHeight);
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

      const firstToken = tokens?.[0];
      if (firstToken?.content) {
        this.cacheLineGuide = 0;
      }

      if (/^[ \t]+/.test(firstToken?.content)) {
        this.cacheLineGuide = Math.ceil(firstToken.content.replace(/[^ \t].*$/, '').length / 2);
      }

      this.renderGuides(editor);
      this.renderLineNumber(editor, col, row);

      for (const token of tokens) {

        resetFontOptions();

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

        ctx.fillStyle = theme[type] || theme.plain;

        if (!theme[type]) {
          console.log(token, type);
        }

        ctx.textBaseline = 'top';
        ctx.fillText(
          token.content,
          this.gutterWidth + letterWidth * col,
          2
        );

        col += token.content.length;
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
    if (!this.cacheLineGuide) {
      return;
    }

    ctx.fillStyle = theme.guide;

    for (let i = 0; i < this.cacheLineGuide; i++) {
      ctx.fillRect(
        this.gutterWidth + letterWidth * (2 * i),
        -2,
        1,
        font.lineHeight
      );
    }
  }
}
