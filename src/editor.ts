import { Token } from './lexer/normalize-tokens';
import { Line, LinesShrink, Model, ModelSelection } from './model';
import { autoClosePlugin } from './plugins/auto-close';
import { footerPlugin } from './plugins/footer';
import { keyMapPlugin } from './plugins/key-map';
import { preserveIndent } from './plugins/preserve-indent';
import { scrollbarPlugin } from './plugins/scrollbar';
import { selectedIdentifierPlugin } from './plugins/selected-identifier';
import { selectedLinePlugin } from './plugins/selected-line';
import { tabPlugin } from './plugins/tab';
import type {
  EditorPlugin,
  EditorPluginConfig,
  InputPlugin,
  ModelPlugin,
} from './plugins/types';
import { AtomOneDark } from './themes/atom-one-dark';
import { createInput, measureText } from './utils';

interface EditorFontConfig {
  size: number;
  family: string;
  lineHeight: number;
}

const devicePixelRatio = window.devicePixelRatio || 1;

export interface EditorRenderState {
  autoFoldLines: number;
  height: number;
  lines: (Line | LinesShrink)[],
  // foldedLines: [number, number][];
  linesSkipped: number,
  lastSkipped?: number,
  [key: string]: any;
};

export interface EditorTokenatorResponse {
  row: number;
  rowAdjusted: number;
}

export interface EditorTokenator {
  (tokens: Token[][]): Generator<EditorTokenatorResponse>;
}

export const recommendedPlugins: EditorPluginConfig[] = [
  selectedLinePlugin(),
  footerPlugin(),
  selectedIdentifierPlugin(),
  autoClosePlugin(),
  keyMapPlugin(),
  tabPlugin(),
  preserveIndent(),
  scrollbarPlugin(),
];

export class Editor {
  public scroll: number = 0;
  public input: HTMLInputElement;

  public editorPlugins: EditorPlugin[] = [];
  public modelPlugins: ModelPlugin[] = [];
  public inputPlugins: InputPlugin[] = [];

  private offScreenCanvas = document.createElement('canvas');
  private realCtx: CanvasRenderingContext2D;
  public ctx = this.offScreenCanvas.getContext('2d')!;

  public letterWidth: number;
  public readonly height!: number;
  public readonly width!: number;

  public state!: EditorRenderState;

  constructor(
    public canvas: HTMLCanvasElement,
    public model = new Model(['']),
    public theme: Record<string, string> = AtomOneDark,
    public plugins: EditorPluginConfig[] = recommendedPlugins.slice(),
    public font: EditorFontConfig = {
      size: 12,
      family: '"Menlo", monospace',
      lineHeight: 12 * 1.5,
    }
  ) {
    this.resetState();

    this.editorPlugins = plugins
      .map(({ editor }) => editor)
      .filter(Boolean) as any;
    this.modelPlugins = plugins
      .map(({ model }) => model)
      .filter(Boolean) as any;
    this.inputPlugins = plugins
      .map(({ input }) => input?.(this))
      .filter(Boolean) as any;

    const measurements = measureText(
      'SELECTED',
      `${font.size}px ${font.family}`
    );

    this.letterWidth = measurements.width / 8;

    this.realCtx = canvas.getContext('2d')!;
    this.input = createInput(this);

    this.canvas.style.letterSpacing = '0px';
    this.offScreenCanvas.style.letterSpacing = '0px';

    this.input.addEventListener('keydown', this.onInput, false);

    window.addEventListener('resize', this.onResize, false);
    window.addEventListener('orientationchange', this.onResize, false);

    function debounceRaf(fn: (e: Event) => void) {
      let timeout: number;

      return (e: Event) => {
        e.preventDefault();

        // If there's a timer, cancel it
        if (timeout) {
          window.cancelAnimationFrame(timeout);
        }

        // Setup the new requestAnimationFrame()
        timeout = window.requestAnimationFrame(() => fn(e));
      }
    }

    this.canvas.addEventListener('mousewheel', debounceRaf(this.onWheel), false);
    this.canvas.addEventListener('mousedown', this.onMouseDown, false);

    this.onResize();
  }

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const wRatio = w * devicePixelRatio;
    const hRatio = h * devicePixelRatio;

    (this.width as any) = w;
    (this.height as any) = h;

    this.canvas.width = wRatio;
    this.canvas.height = hRatio;
    this.offScreenCanvas.width = wRatio;
    this.offScreenCanvas.height = hRatio;

    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.offScreenCanvas.style.width = `${w}px`;
    this.offScreenCanvas.style.height = `${h}px`;

    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.realCtx.scale(devicePixelRatio, devicePixelRatio);

    this.renderModel();
  };

  private onInput = (e: KeyboardEvent) => {
    e.preventDefault();

    this.updateCaret();

    for (const pluginEnd of this.inputPlugins) {
      pluginEnd!(e);
    }

    this.renderModel();
  };

  private onWheel = (e: any) => {
    const previousScroll = this.scroll;
    const scrollLimit = this.state.height;

    this.scroll = Math.min(scrollLimit, Math.max(0, this.scroll + e.deltaY));

    if (this.scroll === previousScroll) {
      return;
    }

    this.renderModel();

    return false;
  };

  private onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { text, gutterWidth } = this.model;

    const selection: ModelSelection = {
      start: {
        ...this.model.selections[0].start,
      },
    };

    this.model.selections[0] = selection;

    let initialX: number;
    let initialY: number;

    const onMouseMove = (e: MouseEvent) => {
      const y = Math.min(
        text.length,
        Math.floor((e.offsetY + this.scroll) / this.font.lineHeight)
      );
      const x = Math.min(
        text[y]?.length || text[text.length - 1].length,
        Math.max(0, Math.round((e.offsetX - gutterWidth) / this.letterWidth))
      );

      if (initialX === undefined && initialY === undefined) {
        initialX = x;
        initialY = y;
      }

      const inverse = (y === initialY && x <= initialX) || (y < initialY);

      const newStartX = !inverse ? initialX : x;
      const newStartY = !inverse ? initialY : y;
      const newEndX = inverse ? initialX : x;
      const newEndY = inverse ? initialY : y;

      const sameStart = newStartX === selection.start.x && newStartY === selection.start.y;
      const sameEnd = newEndX === selection.end?.x && newEndY === selection.end?.y;

      if (sameStart && sameEnd) {
        return;
      }

      selection.start.x = newStartX;
      selection.start.y = newStartY;

      if (initialX !== x || initialY !== y) {
        if (!selection.end) {
          selection.end = {} as any;
        }

        selection.end!.x = newEndX;
        selection.end!.y = newEndY;
      } else {
        selection.end = undefined;
      }

      this.updateCaret();
      this.renderModel();
    };

    onMouseMove(e);

    window.addEventListener('mousemove', onMouseMove, false);

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mouseup', onMouseUp, false);
  };

  private updateCaret() {
    const i = this.input;
    const anim = i.style.animation;
    i.style.animation = 'none';
    i.offsetHeight; /* trigger reflow */
    i.style.animation = anim;
  }

  private resetState() {
    this.state = {
      autoFoldLines: 0,
      lines: [],
      linesSkipped: 0,
      lastSkipped: undefined,
      height: 0,
    };
  }

  public renderModel() {
    console.log('setup');

    const {
      ctx,
      width,
      height,
      scroll,
      realCtx,
      editorPlugins,
      model,
      font,
      canvas,
      theme,
      offScreenCanvas,
    } = this;

    ctx.fillStyle = this.theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(0, -this.scroll);

    const plugins = editorPlugins.map((fn) => fn(this)).filter(Boolean);
    const state = this.state;

    state.height = 0;

    const tokenator: EditorTokenator = function* (tokens) {
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

      const visibleLines = [
        // 0,
        // Infinity,
        Math.floor(scroll / font.lineHeight),
        Math.floor((height + scroll) / font.lineHeight),
      ];

      tokenLoop:
      for (const rowRaw in tokens) {
        const row = parseInt(rowRaw);

        for (const folds of foldedLines) {
          if (!(row <= folds[0] || row >= folds[1])) {
            state.lastSkipped = row;
            state.linesSkipped++;

            continue tokenLoop;
          }
        }

        const lastWasSkippedLine = state.lastSkipped != null && state.lastSkipped + 1 === row;

        if (lastWasSkippedLine) {
          ctx.translate(0, font.lineHeight);
          state.height += font.lineHeight;
        }

        // const rowAdjusted = row - state.linesSkipped + Math.floor(state.offsetAdded / font.lineHeight);

        if (row > 0) {
          ctx.translate(0, font.lineHeight);
          state.height += font.lineHeight;
        }

        // const lastWasSkippedLine = state.lastSkipped != null && state.lastSkipped + 1 === row;

        // if (lastWasSkippedLine) {
        //   ctx.translate(0, font.lineHeight);
        //   // state.offsetAdded += font.lineHeight;
        //   offset += font.lineHeight;
        // }

        // for (const folds of foldedLines) {
        //   if (!(row <= folds[0] || row >= folds[1])) {
        //     state.lastSkipped = row;
        //     state.linesSkipped++;

        //     ctx.textBaseline = 'top';
        //     ctx.fillText(
        //       'asd',
        //       model.gutterWidth,
        //       3 + font.lineHeight * 1
        //     );

        //     // yield {
        //     //   row,
        //     //   rowAdjusted,
        //     //   offset,
        //     // };

        //     continue tokenLoop;
        //   }
        // }

        // if (row > 0) {
        //   ctx.translate(0, font.lineHeight);
        // }

        // const rowAdjusted = row - state.linesSkipped + Math.floor(offset / font.lineHeight);

        // @TODO: Make performance lines hidden
        // if (row < visibleLines[0] || row > visibleLines[1]) {
        //   continue tokenLoop;
        // }

        // if (rowAdjusted > visibleLines[1]) {
        //   break tokenLoop;
        // }

        if (lastWasSkippedLine) {
          // ctx.translate(0, font.lineHeight);
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(
            0,
            -font.lineHeight - 2,
            width,
            font.lineHeight,
          );

          ctx.fillStyle = theme.punctuation;
          ctx.fillText(
            `...`,
            50 + 30,
            -font.lineHeight,
          );
        }

        console.log('render', row + 1);

        yield {
          row,
          // rowAdjusted,
        };
      }
      // yield {
      //   row: 1,
      //   offset: 0,
      // };
    }

    model.render(this, tokenator);

    ctx.restore();

    for (const pluginEnd of plugins) {
      pluginEnd!();
    }

    realCtx.drawImage(
      offScreenCanvas,
      0,
      0,
      offScreenCanvas.width / devicePixelRatio,
      offScreenCanvas.height / devicePixelRatio
    );
  }
}
