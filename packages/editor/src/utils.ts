import type { Editor, EditorRenderState } from './editor';
import { Line, LinesShrink } from './model';

export function createInput({ canvas, font, theme }: Editor) {
  const i = document.createElement('input');

  Object.assign(i.style, {
    background: theme.caret,
    height: `${font.lineHeight}px`,
    font: `${font.lineHeight}px ${font.family}`,
  });

  canvas.parentElement!.insertBefore(i, canvas);

  return i;
}

export function getLinePosition(state: EditorRenderState, row: number): { y: number, h: number } | void {
  let acc = 0;
  let lastLine: Line | LinesShrink | undefined;

  for (const line of state.lines) {
    lastLine = line;

    if (line.row >= row) {
      break;
    }

    acc += line.height;
  }

  if (!(lastLine instanceof Line)) {
    return;
  }

  return {
    y: acc,
    h: lastLine?.height || 0,
  };
}

export function getRowByTop(state: EditorRenderState, top: number): number | void {
  let height = 0;

  for (const line of state.lines) {
    height += line.height;

    if (height >= top) {
      if (!(line instanceof Line)) {
        return;
      }

      return line.row;
    }
  }
}

/**
 * Modified:
 * https://github.com/ai/nanoevents/blob/main/index.d.ts
 */
interface EventsMap {
  [event: string]: any;
}

interface DefaultEvents extends EventsMap {
  [event: string]: (...args: any) => void;
}

export interface Unsubscribe {
  (): void;
}

export interface Emitter<Events extends EventsMap = DefaultEvents> {
  on<K extends keyof Events>(this: this, event: K, cb: Events[K]): Unsubscribe;
  emit<K extends keyof Events>(
    this: this,
    event: K,
    ...args: Parameters<Events[K]>
  ): (Function | void)[];
}

export interface InnerEmitter<Events extends EventsMap = DefaultEvents> extends Emitter {
  _e: Partial<{ [E in keyof Events]: Events[E][] }>;
}

export function createEvents<
  Events extends EventsMap = DefaultEvents
>(): Emitter<Events> {
  return {
    _e: {},
    emit(event, ...args) {
      return (this._e[event] || [] as any).map((i: Function) => i(...(args as any)))
    },
    on(event, cb) {
      (this._e[event] = this._e[event] || [] as any).push(cb)
      return () =>
        (this._e[event] = (this._e[event] || [] as any).filter((i: Function) => i !== cb))
    },
  } as InnerEmitter<Events>;
}
