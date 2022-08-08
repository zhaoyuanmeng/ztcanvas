import type { baseShape } from '../types'

/**
 * @author Zhao YuanDa
 * @parms:
 * @description:
 * @date 2022-08-07 11:11
 */
export function getCanvasCheckApi(
  ctx: CanvasRenderingContext2D,
  renderMode: baseShape['renderMode'] = 'fill',
) {
  const mapping = {
    fill: ctx.isPointInPath,
    stroke: ctx.isPointInStroke,
  }
  return mapping[renderMode].bind(ctx)
}
