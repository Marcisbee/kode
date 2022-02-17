import type { Editor } from './editor';

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
