import type { CanvasEngine } from '../canvasEngine'
import type { EventFn, ShapeClassType } from '../types'
import { EventName } from '../types'
import type { TriggerReturnType } from './base'
import { BaseEventHandler } from './base'
import { getCanvasCheckApi } from './helper'

// 这个类是为了实现事件系统的具体实现 (设计风格有点像vue3的reactive)
export class ClickEventHandler extends BaseEventHandler {
  eventName = EventName.click

  constructor(engine: CanvasEngine) {
    super(engine)
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //事件收集函数
   * @date 2022-08-07 10:02
   */
  track(shape: ShapeClassType, cbFn: EventFn): void {
    // 刚进来的时候 先初始化监听 然后排序z-index 并且建立好了
    if (!this.events.length) this.initDomEventListener()
    // 然后调用tirgger函数 这个函数目的是为了得到 事件处理函数
    const fn = this.trigger(shape, cbFn)
    // 然后存放到公用的events中
    this.events.push({
      shape,
      handler: fn,
    })
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description:这个里面也做到了位置是否再里面的判断
   * @date 2022-08-07 10:02
   */
  trigger(shape: ShapeClassType, cbFn: EventFn): TriggerReturnType {
    return (e: MouseEvent) => {
      this.engine.updateCanvasOffset()
      const { clientX, clientY } = e
      const { leftOffset, topOffset } = this.engine.canvasDomInfo
      const { renderMode = 'fill' } = shape.shapeInfo
      const api = getCanvasCheckApi(this.engine.ctx)
      let isIn = false
      const params = {
        x: clientX - leftOffset,
        y: clientY - topOffset,
      }
      if (renderMode === 'fill') isIn = api(shape.path2D, params.x, params.y)
      else if (renderMode === 'stroke') isIn = api(params.x, params.y)
      if (isIn) {
        return {
          shape,
          handler: cbFn.bind(cbFn, e),
        }
      }
      else {
        return false
      }
    }
  }
}
