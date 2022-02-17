import {
  Editor,
  Model,
} from './entry';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

// const stressTest = new Array(2000).fill(`export class Editor {
//   public scroll: number = 0;
//   public input: HTMLInputElement;

//   public editorPlugins: EditorPlugin[] = [];
//   public modelPlugins: ModelPlugin[] = [];
//   public inputPlugins: InputPlugin[] = [];
// }`).join('\n\n');

const model = new Model();

new Editor(canvas, model);
