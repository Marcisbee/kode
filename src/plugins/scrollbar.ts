import type { EditorPluginConfig } from './types';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

const barWidth = 8;
const barMargin = 4;

export function scrollbarPlugin(): EditorPluginConfig {
  return {
    editor({ ctx, state, height, scroll, width, theme }) {
      return () => {
        const { height: modelHeight } = state;

        const visiblePercentage = Math.min(100, 100 / (modelHeight + height) * height);
        const scrollPercentage = 100 / modelHeight * scroll;
        const barHeight = (Math.max(30, height / 100 * visiblePercentage) - (barMargin * 2));
        const scrollTop = ((height - barHeight) / 100) * scrollPercentage;

        // ctx.fillStyle = 'orange';
        // ctx.fillText(
        //   JSON.stringify({ visiblePercentage }),
        //   500,
        //   20,
        // );
        // ctx.fillText(
        //   JSON.stringify({ scrollPercentage }),
        //   500,
        //   35,
        // );
        // ctx.fillText(
        //   JSON.stringify({ barHeight }),
        //   500,
        //   50,
        // );
        // ctx.fillText(
        //   JSON.stringify({ scrollTop }),
        //   500,
        //   65,
        // );

        ctx.fillStyle = theme.scrollbar;
        roundRect(
          ctx,
          width - barWidth - barMargin,
          scrollTop + barMargin,
          barWidth,
          barHeight,
          barWidth / 2,
        );
      }
    },
  };
}
