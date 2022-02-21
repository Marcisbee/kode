import type { Editor } from './editor';
import { tokenize } from './lexer/prism';
import { typescript } from './lexer/languages/typescript';
import { Token, normalizeTokens } from './lexer/normalize-tokens';
import { getLinePosition } from './utils';
// import { typecheck } from './lsp/typescript';

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

export interface ModelDiagnostic {
  /**
   * 0 = Error:
   * 1 = Warning:
   * 2 = Message:
   * 3 = Suggestion:
   */
  category: 0 | 1 | 2 | 3;
  code: number;
  message: string;
  start: {
    x: number;
    y: number;
  };
  end?: {
    x: number;
    y: number;
  };
}

export class Line {
  constructor(
    public row: number,
    public tokens: Token[],
    public height: number,
  ) { }
}

export class LinesShrink {
  constructor(
    public row: number,
    public tokens: Token[][],
    public height: number,
  ) { }
}

export class Model {
  public diagnostics: ModelDiagnostic[] = [];
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
    const { state, ctx, font, input, scroll, modelPlugins, letterWidth, theme } = editor;

    const startX = this.selections[0].start.x;
    const startY = this.selections[0].start.y;
    const fontFamily = `${font.size}px ${font.family}`;
    const inputX =
      this.gutterWidth +
      Math.min(startX, this.text[startY].length) * letterWidth;
    const inputY = getLinePosition(state, startY);

    input.style.transform = `translate(${inputX}px, ${(inputY?.y || 0) - scroll}px)`;

    function resetFontOptions() {
      ctx.font = fontFamily;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }

    this.cachedLineGuide = 0;

    const plugins = modelPlugins.map((fn) => fn(editor)).filter(Boolean);

    let foldedLines: [number, number][] = [];
    if (state.autoFoldLines > 0) {
      foldedLines = [
        // @TODO: Handle empty lines maybe
        // [17 - 1, 19 - 1],
        // [23 - 1, 25 - 1],
        // [25 - 1, 27 - 1],
        [19 - 1, 23 - 1],
        [43 - 1, 62 - 1],
        [62 - 1, 95 - 1],
        [97 - 1, 120 - 1],
        [122 - 1, 132 - 1],
        [134 - 1, 151 - 1],
        [153 - 1, 227 - 1],
        [229 - 1, 235 - 1],
        [237 - 1, 264 - 1],
      ];
    }
    let lastSkipped!: number;

    state.lines = [];
    state.position = 0;
    state.height = 0;

    // Prepare tokens
    tokenLoop:
    for (const rowRaw in this.tokens) {
      const row = parseInt(rowRaw);
      const line = this.tokens[row];

      for (const folds of foldedLines) {
        if (!(row <= folds[0] || row >= folds[1])) {
          lastSkipped = row;

          continue tokenLoop;
        }
      }

      const lastWasSkippedLine = lastSkipped != null && lastSkipped + 1 === row;

      if (lastWasSkippedLine) {
        // @TODO: Push all shrinked lines
        const lineHeight = font.lineHeight * 1.5;
        state.lines.push(new LinesShrink(row, [], lineHeight));
        state.height += lineHeight;
      }

      const lineHeight = font.lineHeight;
      state.lines.push(new Line(row, line, lineHeight));
      state.height += lineHeight;
    }

    state.height -= state.lines[state.lines.length - 1].height;

    // Render
    for (const line of state.lines) {
      const { row } = line;
      let col = 0;

      const shouldRender = state.position + line.height > scroll;

      if (shouldRender && state.position > scroll + editor.height) {
        break;
      }

      if (line instanceof LinesShrink) {
        if (shouldRender) {
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(
            0,
            -2,
            editor.width,
            line.height,
          );

          ctx.fillStyle = theme.punctuation;
          ctx.fillText(
            '...',
            50 + 30,
            0,
          );
        }

        ctx.translate(0, line.height);
        state.position += line.height;

        continue;
      }

      if (shouldRender) {
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

        const tokens = this.tokens[row];

        const firstToken = tokens?.[0];
        if (firstToken?.content) {
          this.cachedLineGuide = 0;
        }

        if (/^[ \t]+/.test(firstToken?.content)) {
          this.cachedLineGuide = Math.ceil(firstToken.content.replace(/[^ \t].*$/, '').length / 2);
        }

        this.renderGuides(editor);

        const diagnosticErrors = this.diagnostics.filter((e) => e.category === 1);

        ctx.fillStyle = 'rgba(255,50,50,0.2)';

        for (const { start, end } of diagnosticErrors) {
          if (!end) {
            continue;
          }

          if (start.y === row && end.y === row) {
            this.renderDiagnosticBackground(editor);
            continue;
          }

          if (start.y === row && end.y > row) {
            this.renderDiagnosticBackground(editor);
            continue;
          }

          if (start.y <= row && end.y > row) {
            this.renderDiagnosticBackground(editor);
            continue;
          }

          if (start.y < row && end.y === row) {
            this.renderDiagnosticBackground(editor);
            continue;
          }
        }

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

        ctx.fillStyle = theme.diagnosticError;

        for (const { message, start, end } of diagnosticErrors) {
          if (!end) {
            continue;
          }

          if (start.y === row && end.y === row) {
            this.renderDiagnostic(editor, message, row, start.x, (end?.x || start.x) - start.x);
            continue;
          }

          if (start.y === row && end.y > row) {
            this.renderDiagnostic(editor, message, row, start.x, this.text[row].length - start.x);
            continue;
          }

          if (start.y <= row && end.y > row) {
            this.renderDiagnostic(editor, message, row, 0, Math.max(1, this.text[row].length));
            continue;
          }

          if (start.y < row && end.y === row) {
            this.renderDiagnostic(editor, message, row, 0, Math.min(end?.x || 0, this.text[row].length));
            continue;
          }
        }
      }

      ctx.translate(0, line.height);
      state.position += line.height;
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

  public renderDiagnosticBackground({ ctx, width, font }: Editor) {
    ctx.fillRect(
      0,
      -2,
      width,
      font.lineHeight
    );
  }

  public renderDiagnostic({ ctx, font, letterWidth }: Editor, message: string, line: number, start: number, end: number) {
    ctx.fillRect(
      this.gutterWidth + letterWidth * start,
      font.lineHeight - 4,
      letterWidth * end,
      2
    );
    ctx.fillText(
      message,
      this.gutterWidth + (this.text[line].length + 5) * letterWidth,
      2,
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
    const code = this.text.join('\n');
    const rawTokens = tokenize(code, typescript) as any;

    this.tokens = normalizeTokens(rawTokens)
      // @TODO: Normalize this beforehand.
      .map((row) => row.filter((t) => !t.empty && !!t.content));

    // const errors = code ? typecheck(code) : [];

    // this.diagnostics = errors
    //   .map((e) => {
    //     const textBefore = code.substring(0, e.start || 0);
    //     const linesBeforeEnd = textBefore.split('\n');
    //     const textAfter = code.substring(0, (e.start || 0) + (e.length || 0));
    //     const linesAfterEnd = textAfter.split('\n');

    //     return ({
    //       category: e.category as any,
    //       code: e.code,
    //       message: e.messageText as string,
    //       start: {
    //         y: linesBeforeEnd.length - 1,
    //         x: (linesBeforeEnd[linesBeforeEnd.length - 1].length || 0),
    //       },
    //       end: {
    //         y: linesAfterEnd.length - 1,
    //         x: (linesAfterEnd[linesAfterEnd.length - 1].length || 0),
    //       },
    //     });
    //   });
  }
}