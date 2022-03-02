import type { Token } from './lexer';
import { Line, LinesShrink, Model, ModelSelection } from './model';
import { autoClosePlugin } from './plugins/auto-close';
// import { footerPlugin } from './plugins/footer';
import { keyMapPlugin } from './plugins/key-map';
import { preserveIndent } from './plugins/preserve-indent';
import { scrollbarPlugin } from './plugins/scrollbar';
import { selectedIdentifierPlugin } from './plugins/selected-identifier';
import { selectedLinePlugin } from './plugins/selected-line';
// import { statsPlugin } from './plugins/stats';
import { tabPlugin } from './plugins/tab';
import type { EditorPlugin } from './plugins/types';
import { AtomOneDark } from './themes/atom-one-dark';
import { createEvents, createInput, Emitter, getRowByTop } from './utils';
import { selectRegion } from './utils/select-region';

interface EditorFontConfig {
  size: number;
  family: string;
  lineHeight: number;
}

const devicePixelRatio = window.devicePixelRatio || 1;

export interface EditorRenderState {
  autoFoldLines: number;
  height: number;
  position: number;
  lines: (Line | LinesShrink)[],
  [key: string]: any;
};

export const recommendedPlugins: EditorPlugin[] = [
  selectedLinePlugin(),
  // footerPlugin(),
  selectedIdentifierPlugin(),
  autoClosePlugin(),
  keyMapPlugin(),
  tabPlugin(),
  preserveIndent(),
  scrollbarPlugin(),
  // statsPlugin(),
];

interface EditorEvents {
  render(): void;
  model(value: Token, col: number, row: number): void;
  input(e: KeyboardEvent): void;
}

const canvasSettings: CanvasRenderingContext2DSettings = {
  alpha: false,
  // colorSpace: 'display-p3',
};

export class Editor {
  public scroll: number = 0;
  public input: HTMLInputElement;

  private _offScreenCanvas = document.createElement('canvas');
  private _realCtx: CanvasRenderingContext2D;
  private _label: HTMLLabelElement;
  private container?: HTMLElement;

  public canvas!: HTMLCanvasElement;
  public ctx = this._offScreenCanvas.getContext('2d', canvasSettings)!;

  public letterWidth: number;
  public readonly height!: number;
  public readonly width!: number;

  public state!: EditorRenderState;
  public events: Emitter<EditorEvents> = createEvents<EditorEvents>();

  constructor(
    public model = new Model(['']),
    public theme: Record<string, string> = AtomOneDark,
    public plugins: EditorPlugin[] = recommendedPlugins.slice(),
    public font: EditorFontConfig = {
      size: 12,
      family: '"Menlo", monospace',
      lineHeight: 12 * 1.5,
    }
  ) {
    this._resetState();

    this._label = document.createElement('label');

    Object.assign(this._label.style, {
      display: 'block',
      fontSize: 0,
      transform: 'translateZ(0)',
      cursor: 'text',
    });

    this.canvas = document.createElement('canvas');
    this._label.appendChild(this.canvas);

    this.ctx.font = `${this.font.size}px ${this.font.family}`;
    const measurements = this.ctx.measureText('M');

    this.letterWidth = measurements.width;

    // this.container.style.textRendering = 'optimizeSpeed';
    // this._offScreenCanvas.style.textRendering = 'optimizeSpeed';
    // this.canvas.style.textRendering = 'optimizeSpeed';

    this._realCtx = this.canvas.getContext('2d', canvasSettings)!;
    this.input = createInput(this);
  }

  public mount(container: HTMLElement) {
    this.container = container;

    Object.assign(this.container.style, {
      transform: 'translateZ(0)',
      overflow: 'hidden',
      position: 'relative',
    });

    container.appendChild(this._label);

    // this.canvas.style.letterSpacing = '0px';
    // this._offScreenCanvas.style.letterSpacing = '0px';

    this.model._hook(this);

    // Initialize plugins
    this.plugins
      .filter(Boolean)
      .map((fn) => fn?.(this));

    this.input.addEventListener('keydown', this._onInput, false);
    this.input.addEventListener('paste', this._onPaste);

    window.addEventListener('resize', this._onResize, false);
    window.addEventListener('orientationchange', this._onResize, false);

    this.container.addEventListener('wheel', (e) => e.preventDefault(), true);
    this.canvas.addEventListener('wheel', this._onWheel, {
      capture: true,
      passive: true,
    });
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('dblclick', this._onDblClick);

    this._onResize();
  }

  private _onResize = () => {
    const w = this.container!.clientWidth;
    const h = this.container!.clientHeight;
    const wRatio = w * devicePixelRatio;
    const hRatio = h * devicePixelRatio;

    (this.width as any) = w;
    (this.height as any) = h;

    this.canvas.width = wRatio;
    this.canvas.height = hRatio;
    this._offScreenCanvas.width = wRatio;
    this._offScreenCanvas.height = hRatio;

    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this._offScreenCanvas.style.width = `${w}px`;
    this._offScreenCanvas.style.height = `${h}px`;

    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this._realCtx.scale(devicePixelRatio, devicePixelRatio);

    this.renderModel();
  };

  private _onInput = (e: KeyboardEvent) => {
    this.events.emit('input', e);
  };

  private _onPaste = (e: ClipboardEvent) => {
    e.preventDefault();

    const paste = ((e as any).detail || e.clipboardData)?.getData('text');

    if (!paste) {
      return;
    }

    const { selections, text } = this.model;

    for (const selection of selections) {
      const { start } = selection;
      const { x, y } = start;

      const endChunks = paste!.split('\n');
      const lastLineChars = endChunks[endChunks?.length - 1].length;

      const chunks = [
        text[y].substring(0, x),
        paste,
        text[y].substring(x),
      ];

      text.splice(y, 1, ...chunks.join('').split('\n'));
      start.x = endChunks.length > 1 ? lastLineChars : start.x + lastLineChars;
      start.y = endChunks.length === 1 ? start.y : start.y + endChunks.length - 1;
    }

    this.model.refreshContents();
  };

  private _onWheel = (e: Event) => {
    const previousScroll = this.scroll;
    const scrollLimit = this.state.height;

    this.scroll = Math.min(scrollLimit, Math.max(0, this.scroll + (e as WheelEvent).deltaY));

    if (this.scroll === previousScroll) {
      return;
    }

    this.renderModel();

    return false;
  };

  private _onMouseDown = (e: MouseEvent) => {
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
      const y = getRowByTop(this.state, e.offsetY + this.scroll);

      if (y == null) {
        console.log('NOTHING TO SELECT');
        return;
      }

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

  private _onDblClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { text, selections } = this.model;
    const [{ start: { x, y } }] = selections;

    const [sX, eX] = selectRegion(text[y], x);

    selections[0].start = {
      x: sX,
      y,
    };
    selections[0].end = {
      x: eX,
      y,
    };

    this.renderModel();
  };

  private _resetState() {
    this.state = {
      autoFoldLines: 0,
      lines: [],
      position: 0,
      height: 0,
    };
  }

  public renderModel() {
    const {
      ctx,
      _realCtx,
      _offScreenCanvas,
      model,
      canvas,
    } = this;

    ctx.fillStyle = this.theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(0, -this.scroll);

    const plugins = this.events.emit('render').filter(Boolean);

    model.render(this);

    ctx.restore();

    for (let i = 0; i < plugins.length; i++) {
      plugins[i]!();
    }

    _realCtx.drawImage(
      _offScreenCanvas,
      0,
      0,
      canvas.width / devicePixelRatio,
      canvas.height / devicePixelRatio,
    );
  }
}
