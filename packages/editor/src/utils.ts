import type { Editor, EditorRenderState } from './editor';
import { Line, LinesShrink } from './model';

export function createInput({ canvas, font, theme }: Editor) {
  const i = document.createElement('input');
  const s = i.style;

  s.background = theme.caret;
  s.height = `${font.lineHeight}px`;
  s.font = `${font.lineHeight}px ${font.family}`;

  canvas.parentElement!.insertBefore(i, canvas);

  return i;
}

export function measureText(text: string, font: string) {
  const el = document.createElement('div');

  document.body.appendChild(el);

  el.style.font = font;
  el.style.position = 'absolute';

  el.innerHTML = text;

  const result = {
    width: el.clientWidth,
    height: el.clientHeight,
  };

  document.body.removeChild(el);

  return result;
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
