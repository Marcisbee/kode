import {
  Editor,
  Model,
  recommendedPlugins,
} from './kode';
import { statsPlugin } from './plugins/stats';
import './style.css';

const editor = document.querySelector<HTMLDivElement>('#editor')!;

// const stressTest = new Array(2000).fill(`export class Editor {
//   public scroll: number = 0;
//   public input: HTMLInputElement;

//   public editorPlugins: EditorPlugin[] = [];
//   public modelPlugins: ModelPlugin[] = [];
//   public inputPlugins: InputPlugin[] = [];
// }`).join('\n\n');


const model = new Model();

// const model = new Model(`import { Model, ModelSelection } from './model';
// import { autoClosePlugin } from './plugins/auto-close';
// import { footerPlugin } from './plugins/footer';
// import { keyMapPlugin } from './plugins/key-map';
// import { preserveIndent } from './plugins/preserve-indent';
// import { scrollbarPlugin } from './plugins/scrollbar';
// import { selectedIdentifierPlugin } from './plugins/selected-identifier';
// import { selectedLinePlugin } from './plugins/selected-line';
// import { tabPlugin } from './plugins/tab';
// import type {
//   EditorPlugin,
//   EditorPluginConfig,
//   InputPlugin,
//   ModelPlugin,
// } from './plugins/types';
// import { AtomOneDark } from './themes/atom-one-dark';
// import { createInput, measureText } from './utils';

// interface EditorFontConfig {
//   size: number;
//   family: string;
//   lineHeight: number;
// }

// const devicePixelRatio = window.devicePixelRatio || 1;

// export class Editor {
//   public scroll: number = 0;
//   public input: HTMLInputElement;

//   public editorPlugins: EditorPlugin[] = [];
//   public modelPlugins: ModelPlugin[] = [];
//   public inputPlugins: InputPlugin[] = [];

//   private offScreenCanvas = document.createElement('canvas');
//   private realCtx: CanvasRenderingContext2D;
//   public ctx = this.offScreenCanvas.getContext('2d')!;

//   public letterWidth: number;
//   public readonly height!: number;
//   public readonly width!: number;

//   constructor(
//     public canvas: HTMLCanvasElement,
//     public model = new Model(['']),
//     public theme: Record<string, string> = AtomOneDark,
//     public plugins: EditorPluginConfig[] = [
//       selectedLinePlugin(),
//       footerPlugin(),
//       selectedIdentifierPlugin(),
//       autoClosePlugin(),
//       keyMapPlugin(),
//       tabPlugin(),
//       preserveIndent(),
//       scrollbarPlugin(),
//     ],
//     public font: EditorFontConfig = {
//       size: 12,
//       family: '"Menlo", monospace',
//       lineHeight: 12 * 1.5,
//     }
//   ) {
//     this.editorPlugins = plugins
//       .map(({ editor }) => editor)
//       .filter(Boolean) as any;
//     this.modelPlugins = plugins
//       .map(({ model }) => model)
//       .filter(Boolean) as any;
//     this.inputPlugins = plugins
//       .map(({ input }) => input?.(this))
//       .filter(Boolean) as any;

//     const measurements = measureText(
//       'SELECTED',
//       \`\${font.size}px \${font.family}\`
//     );

//     this.letterWidth = measurements.width / 8;

//     this.realCtx = canvas.getContext('2d')!;
//     this.input = createInput(this);

//     this.canvas.style.letterSpacing = '0px';
//     this.offScreenCanvas.style.letterSpacing = '0px';

//     this.input.addEventListener('keydown', this.onInput, false);

//     window.addEventListener('resize', this.onResize, false);
//     window.addEventListener('orientationchange', this.onResize, false);

//     this.canvas.addEventListener('mousewheel', this.onWheel, false);
//     this.canvas.addEventListener('mousedown', this.onMouseDown, false);

//     this.onResize();
//   }

//   private onResize = () => {
//     const w = window.innerWidth;
//     const h = window.innerHeight;
//     const wRatio = w * devicePixelRatio;
//     const hRatio = h * devicePixelRatio;

//     (this.width as any) = w;
//     (this.height as any) = h;

//     this.canvas.width = wRatio;
//     this.canvas.height = hRatio;
//     this.offScreenCanvas.width = wRatio;
//     this.offScreenCanvas.height = hRatio;

//     this.canvas.style.width = \`\${w}px\`;
//     this.canvas.style.height = \`\${h}px\`;
//     this.offScreenCanvas.style.width = \`\${w}px\`;
//     this.offScreenCanvas.style.height = \`\${h}px\`;

//     this.ctx.scale(devicePixelRatio, devicePixelRatio);
//     this.realCtx.scale(devicePixelRatio, devicePixelRatio);

//     this.renderModel();
//   };

//   private onInput = (e: KeyboardEvent) => {
//     e.preventDefault();

//     this.updateCaret();

//     for (const pluginEnd of this.inputPlugins) {
//       pluginEnd!(e);
//     }

//     this.renderModel();
//   };

//   private onWheel = (e: any) => {
//     e.preventDefault();
//     e.stopPropagation();
//     e.stopImmediatePropagation();

//     const previousScroll = this.scroll;
//     const scrollLimit = (this.model.text.length - 1) * this.font.lineHeight;

//     this.scroll = Math.min(scrollLimit, Math.max(0, this.scroll + e.deltaY));

//     if (this.scroll === previousScroll) {
//       return;
//     }

//     this.renderModel();

//     return false;
//   };

//   private onMouseDown = (e: MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();

//     const { text, gutterWidth } = this.model;

//     const selection: ModelSelection = {
//       start: {
//         ...this.model.selections[0].start,
//       },
//     };

//     this.model.selections[0] = selection;

//     let initialX: number;
//     let initialY: number;

//     const onMouseMove = (e: MouseEvent) => {
//       const y = Math.min(
//         text.length,
//         Math.floor((e.offsetY + this.scroll) / this.font.lineHeight)
//       );
//       const x = Math.min(
//         text[y]?.length || text[text.length - 1].length,
//         Math.max(0, Math.round((e.offsetX - gutterWidth) / this.letterWidth))
//       );

//       if (initialX === undefined && initialY === undefined) {
//         initialX = x;
//         initialY = y;
//       }

//       const inverse = (y === initialY && x <= initialX) || (y < initialY);

//       const newStartX = !inverse ? initialX : x;
//       const newStartY = !inverse ? initialY : y;
//       const newEndX = inverse ? initialX : x;
//       const newEndY = inverse ? initialY : y;

//       const sameStart = newStartX === selection.start.x && newStartY === selection.start.y;
//       const sameEnd = newEndX === selection.end?.x && newEndY === selection.end?.y;

//       if (sameStart && sameEnd) {
//         return;
//       }

//       selection.start.x = newStartX;
//       selection.start.y = newStartY;

//       if (initialX !== x || initialY !== y) {
//         if (!selection.end) {
//           selection.end = {} as any;
//         }

//         selection.end!.x = newEndX;
//         selection.end!.y = newEndY;
//       } else {
//         selection.end = undefined;
//       }

//       this.updateCaret();
//       this.renderModel();
//     };

//     onMouseMove(e);

//     window.addEventListener('mousemove', onMouseMove, false);

//     const onMouseUp = () => {
//       window.removeEventListener('mousemove', onMouseMove);
//       this.canvas.removeEventListener('mouseup', onMouseUp);
//     };

//     this.canvas.addEventListener('mouseup', onMouseUp, false);
//   };

//   private updateCaret() {
//     const i = this.input;
//     const anim = i.style.animation;
//     i.style.animation = 'none';
//     i.offsetHeight; /* trigger reflow */
//     i.style.animation = anim;
//   }

//   private renderModel() {
//     const { ctx, realCtx, editorPlugins, model, canvas, offScreenCanvas } =
//       this;

//     ctx.fillStyle = this.theme.bg;
//     ctx.fillRect(0, 0, canvas.width, canvas.height);

//     ctx.save();
//     ctx.translate(0, -this.scroll);

//     const plugins = editorPlugins.map((fn) => fn(this)).filter(Boolean);

//     model.render(this);

//     for (const pluginEnd of plugins) {
//       pluginEnd!();
//     }

//     ctx.restore();

//     realCtx.drawImage(
//       offScreenCanvas,
//       0,
//       0,
//       offScreenCanvas.width / devicePixelRatio,
//       offScreenCanvas.height / devicePixelRatio
//     );
//   }
// }
// `.split('\n'));

const EditorInstance = new Editor(
  model,
  undefined,
  [
    ...recommendedPlugins,
    ...(
      process.env.NODE_ENV === 'production'
        ? [statsPlugin()]
        : []
    ),
  ],
);

EditorInstance.mount(editor);
