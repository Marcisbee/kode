import type { Editor } from './editor';
import { type Token, Lexer, typescript } from './lexer';
import { createEvents, Emitter } from './utils';
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

interface LineRenderer {
  height: number;

  draw(editor: Editor, col: number): void;
}

export class Line implements LineRenderer {
  constructor(
    public row: number,
    public tokens: Token[],
    public height: number,
  ) { }

  public draw({ events, ctx, theme, model, letterWidth }: Editor, col: number) {
    for (let tokenIndex = 0; tokenIndex < this.tokens.length; tokenIndex++) {
      const token = this.tokens[tokenIndex];
      const [type, content] = token;

      if (type === 'lb') {
        // if (RENDER_HIDDEN) {
        //   ctx.fillStyle = theme.hidden;
        //   ctx.fillText(
        //     '↵',
        //     model.gutterWidth + letterWidth * col,
        //     2
        //   );
        // }

        continue;
      }

      if (type === 'space') {
        col += content.length;
        continue;
      }

      events.emit('model', token, col, this.row);

      const color = theme[type];
      if (color && type !== 'space') {
        ctx.fillStyle = color;
      }

      ctx.fillText(
        content,
        model.gutterWidth + letterWidth * col,
        2
      );

      col += content.length;

      if (!color && content.trim()) {
        console.warn('unhandled', type);
      }
    }
  }
}

export class LinesShrink implements LineRenderer {
  constructor(
    public row: number,
    public tokens: Token[][],
    public height: number,
  ) { }

  public draw({ ctx, width }: Editor) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(
      0,
      0,
      width,
      this.height,
    );

    ctx.fillStyle = 'black';
    ctx.fillText(
      '...',
      50 + 30,
      0,
    );
  }
}

interface ModelEvents {
  update(code: string): void;
}

function squashPlugin(editor: Editor) {
  const { model } = editor;

  const update = () => {
    const { state, font } = editor;

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
    state.height = 0;

    const tokens: Token[][] = (model as any).tokens;

    // Prepare tokens
    tokenLoop:
    for (let row = 0; row < tokens.length; row++) {
      const line = tokens[row];

      for (let i = 0; i < foldedLines.length; i++) {
        const folds = foldedLines[i];
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
  }

  editor.events.on('input', (event) => {
    if (event.type !== 'keydown') {
      return;
    }

    if (event.key !== 'Alt') {
      return;
    }

    editor.state.autoFoldLines = 1;

    function resetHandler() {
      editor.state.autoFoldLines = 0;
      window.removeEventListener('keyup', handler);

      update();
      editor.renderModel();
    }

    function handler(e: KeyboardEvent) {
      if (e.type !== 'keyup') {
        return;
      }

      if (e.key !== 'Alt') {
        return;
      }

      resetHandler();
    }

    window.addEventListener('keyup', handler, false);
    window.addEventListener('blur', resetHandler, false);

    update();
  });

  model.events.on('update', update);
}

// function typecheckPlugin(editor: Editor) {
//   const { model } = editor;

//   function update(code: string) {
//     const errors = code ? typecheck(code) : [];

//     model.diagnostics = errors
//       .map((e) => {
//         const textBefore = code.substring(0, e.start || 0);
//         const linesBeforeEnd = textBefore.split('\n');
//         const textAfter = code.substring(0, (e.start || 0) + (e.length || 0));
//         const linesAfterEnd = textAfter.split('\n');

//         return ({
//           category: e.category as any,
//           code: e.code,
//           message: e.messageText as string,
//           start: {
//             y: linesBeforeEnd.length - 1,
//             x: (linesBeforeEnd[linesBeforeEnd.length - 1].length || 0),
//           },
//           end: {
//             y: linesAfterEnd.length - 1,
//             x: (linesAfterEnd[linesAfterEnd.length - 1].length || 0),
//           },
//         });
//       });
//   }

//   model.events.on('update', update);
// }

export class Model {
  public diagnostics: ModelDiagnostic[] = [];
  public gutterWidth = 50;
  private tokens: Token[][] = [];
  private _cachedLineGuide = 0;

  public events: Emitter<ModelEvents> = createEvents<ModelEvents>();

  private _lexer = new Lexer(typescript());

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
    this._updateTokens();
  }

  public setText(text: string[]) {
    this.text = text;
    this._resetSelection();
    this._updateTokens();
  }

  public refreshContents() {
    this._updateTokens();
  }

  public render(editor: Editor) {
    const { state, ctx, font, scroll, theme } = editor;

    const fontFamily = `${font.size}px ${font.family}`;

    ctx.font = fontFamily;
    ctx.textBaseline = 'top';

    function resetFontOptions() {
      ctx.textAlign = 'left';
    }

    this._cachedLineGuide = 0;

    state.position = 0;

    // Render
    for (let lineIndex = 0; lineIndex < state.lines.length; lineIndex++) {
      const line = state.lines[lineIndex];
      const { row } = line;

      const shouldRender = state.position + line.height > scroll;

      if (shouldRender && state.position > scroll + editor.height) {
        break;
      }

      if (line instanceof LinesShrink) {
        if (shouldRender) {
          line.draw(editor);
        }

        ctx.translate(0, line.height);
        state.position += line.height;

        continue;
      }

      if (shouldRender) {
        if (this.selections.length > 0) {
          ctx.fillStyle = theme.selection;

          for (let selectionIndex = 0; selectionIndex < this.selections.length; selectionIndex++) {
            const { start, end } = this.selections[selectionIndex];

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

        const [firstTokenType, firstToken] = tokens?.[0] || [];
        if (firstTokenType !== 'lb') {
          this._cachedLineGuide = 0;
        }

        if (firstTokenType === 'space') {
          this._cachedLineGuide = Math.ceil(firstToken.replace(/[^ \t].*$/, '').length / 2);
        }

        this.renderGuides(editor);

        const diagnosticErrors = this.diagnostics.filter((e) => e.category === 1);

        if (diagnosticErrors.length) {
          ctx.fillStyle = 'rgba(255,50,50,0.2)';

          for (let diagnosticIndex = 0; diagnosticIndex < diagnosticErrors.length; diagnosticIndex++) {
            const { start, end } = diagnosticErrors[diagnosticIndex];

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
        }

        this.renderLineNumber(editor, row);
        resetFontOptions();

        line.draw(editor, 0);

        this.renderCaret(editor, row);

        if (diagnosticErrors.length) {
          ctx.fillStyle = theme.diagnosticError;

          for (let diagnosticIndex = 0; diagnosticIndex < diagnosticErrors.length; diagnosticIndex++) {
            const { message, start, end } = diagnosticErrors[diagnosticIndex];

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
      }

      ctx.translate(0, line.height);
      state.position += line.height;
    }
  }

  public renderLineNumber(
    { ctx, font, theme }: Editor,
    row: number
  ) {
    const lineNumber = (row + 1).toString();

    const lastFontStyle = ctx.font;

    ctx.fillStyle = theme['line-number'];
    ctx.font = `${font.size * 0.9}px ${font.family}`;
    ctx.textAlign = 'right';
    ctx.fillText(
      lineNumber,
      this.gutterWidth - 20,
      3 + font.lineHeight * 0
    );

    ctx.font = lastFontStyle;
  }

  public renderDiagnosticBackground({ ctx, width, font }: Editor) {
    ctx.fillRect(
      0,
      0,
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
      0,
      letterWidth * end,
      font.lineHeight
    );
  }

  public renderGuides({ ctx, font, letterWidth, theme }: Editor) {
    if (!this._cachedLineGuide) {
      return;
    }

    ctx.fillStyle = theme.guide;

    for (let i = 0; i < this._cachedLineGuide; i++) {
      ctx.fillRect(
        this.gutterWidth + letterWidth * (2 * i),
        0,
        1,
        font.lineHeight
      );
    }
  }

  public renderCaret({ ctx, font, letterWidth, theme }: Editor, row: number) {
    if (this.selections.length > 1) {
      return;
    }

    const s = this.selections[0].start;
    if (s.y === row) {
      ctx.fillStyle = theme.caret;
      ctx.fillRect(
        this.gutterWidth + letterWidth * Math.min(this.text[s.y].length , s.x),
        0,
        2,
        font.lineHeight
      );
    }
  }

  public _hook(editor: Editor) {
    squashPlugin(editor);
    // typecheckPlugin(editor);

    this.events.on('update', () => {
      editor.renderModel();
    });

    this._updateTokens();
  }

  private _resetSelection() {
    this.selections = [
      {
        start: {
          x: 0,
          y: 0,
        },
      },
    ];
  }

  private _updateTokens() {
    const code = this.text.join('\n');

    console.time('Lexer');
    this.tokens = this._lexer.tokenize(code);
    console.timeEnd('Lexer');

    this.events.emit('update', code);
  }
}
