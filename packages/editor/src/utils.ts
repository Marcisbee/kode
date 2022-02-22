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
