import {
  Editor,
  Model,
  recommendedPlugins,
} from './kode';
import { statsPlugin } from './plugins/stats';
import { AtomOneDark } from './themes/atom-one-dark';
import './style.css';

const editor = document.querySelector<HTMLDivElement>('#editor')!;

// const stressTest = new Array(2000).fill(`export class Editor {
//   public scroll: number = 0;
//   public input: HTMLInputElement;

//   public editorPlugins: EditorPlugin[] = [];
//   public modelPlugins: ModelPlugin[] = [];
//   public inputPlugins: InputPlugin[] = [];
// }`).join('\n\n');

document.body.style.backgroundColor = AtomOneDark.bg;

const model1 = new Model();

const fontSize = 14;
const lineHeight = 1.6;
const EditorInstance1 = new Editor(
  model1,
  AtomOneDark,
  [
    ...recommendedPlugins,
    ...(
      process.env.NODE_ENV === 'production'
        ? [statsPlugin()]
        : []
    ),
  ],
  {
    size: fontSize,
    family: '"Menlo", monospace',
    lineHeight: fontSize * lineHeight,
  },
);

EditorInstance1.mount(editor);


// const editor2 = document.querySelector<HTMLDivElement>('#editor2')!;
// const model2 = new Model();
// const EditorInstance2 = new Editor(
//   model2,
//   undefined,
//   [
//     ...recommendedPlugins,
//     ...(
//       process.env.NODE_ENV === 'production'
//         ? [statsPlugin()]
//         : []
//     ),
//   ],
//   {
//     size: fontSize,
//     family: '"Menlo", monospace',
//     lineHeight: fontSize * lineHeight,
//   },
// );

// EditorInstance2.mount(editor2);
