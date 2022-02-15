import {
  Editor,
  Model,
} from './entry';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

const model = new Model(
  `import { THEME } from './constants';
import { Model } from './model';
import { autoClosePlugin } from './plugins/auto-close';
import { footerPlugin } from './plugins/footer';
import { keyMapPlugin } from './plugins/key-map';
import { preserveIndent } from './plugins/preserve-indent';
import { selectedIdentifierPlugin } from './plugins/selected-identifier';
import { selectedLinePlugin } from './plugins/selected-line';
import { tabPlugin } from './plugins/tab';
import type {
  EditorPlugin,
  EditorPluginConfig,
  InputPlugin,
  ModelPlugin,
} from './plugins/types';
import { createInput } from './utils';

interface EditorFontConfig {
  size: number;
  family: string;
  lineHeight: number;
}

const devicePixelRatio = window.devicePixelRatio || 1;

export class Editor {
  public scroll: number = 0;
  public input: HTMLInputElement;

  public editorPlugins: EditorPlugin[] = [];
  public modelPlugins: ModelPlugin[] = [];
  public inputPlugins: InputPlugin[] = [];

  private offScreenCanvas = document.createElement('canvas');
  private realCtx: CanvasRenderingContext2D;
  public ctx = this.offScreenCanvas.getContext('2d')!;

  constructor(
    public canvas: HTMLCanvasElement,
    public model = new Model(['']),
    public plugins: EditorPluginConfig[] = [
      selectedLinePlugin(),
      footerPlugin(),
      selectedIdentifierPlugin(),
      autoClosePlugin(),
      keyMapPlugin(),
      tabPlugin(),
      preserveIndent(),
    ],
    public font: EditorFontConfig = {
      size: 13,
      family: 'monospace',
      lineHeight: 14 * 1.3,
    }
  ) {
    this.editorPlugins = plugins
      .map(({ editor }) => editor)
      .filter(Boolean) as any;
    this.modelPlugins = plugins
      .map(({ model }) => model)
      .filter(Boolean) as any;
    this.inputPlugins = plugins
      .map(({ input }) => input?.(this))
      .filter(Boolean) as any;

    this.realCtx = canvas.getContext('2d')!;
    this.input = createInput(this);

    this.canvas.style.letterSpacing = '0px';
    this.offScreenCanvas.style.letterSpacing = '0px';

    this.input.addEventListener('keydown', this.onInput, false);

    window.addEventListener('resize', this.onResize, false);
    window.addEventListener('orientationchange', this.onResize, false);

    this.canvas.addEventListener('mousewheel', this.onWheel, false);

    this.onResize();
  }

  private onResize = () => {
    this.canvas.width = window.innerWidth * devicePixelRatio;
    this.canvas.height = window.innerHeight * devicePixelRatio;

    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';

    // Off-screen canvas
    this.offScreenCanvas.width = window.innerWidth * devicePixelRatio;
    this.offScreenCanvas.height = window.innerHeight * devicePixelRatio;

    this.offScreenCanvas.style.width = window.innerWidth + 'px';
    this.offScreenCanvas.style.height = window.innerHeight + 'px';

    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.realCtx.scale(devicePixelRatio, devicePixelRatio);

    this.renderModel();
  };

  private onInput = (e: KeyboardEvent) => {
    e.preventDefault();

    const anim = this.input.style.animation;
    this.input.style.animation = 'none';
    this.input.offsetHeight; /* trigger reflow */
    this.input.style.animation = anim;

    for (const pluginEnd of this.inputPlugins) {
      pluginEnd!(e);
    }

    this.renderModel();
  };

  private onWheel = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const previousScroll = Math.max(0, this.scroll);

    this.scroll = Math.max(0, this.scroll + e.deltaY);

    if (this.scroll === previousScroll) {
      return;
    }

    this.renderModel();

    return false;
  };

  private renderModel() {
    this.ctx.fillStyle = THEME.BG;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(0, -this.scroll);

    const plugins = this.editorPlugins.map((fn) => fn(this)).filter(Boolean);

    this.model.render(this);

    for (const pluginEnd of plugins) {
      pluginEnd!();
    }

    this.ctx.restore();

    this.realCtx.drawImage(
      this.offScreenCanvas,
      0,
      0,
      this.offScreenCanvas.width / devicePixelRatio,
      this.offScreenCanvas.height / devicePixelRatio
    );
  }
}
`.split('\n')
);

new Editor(canvas, model);
