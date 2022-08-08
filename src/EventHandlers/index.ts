import type { CanvasEngine } from '../canvasEngine'
import type { EventFn, EventName, ShapeClassType } from '../types'
import type { BaseEventHandler } from './base'
import { ClickEventHandler } from './click'

// 索引形式 TODO:书写key:事件名 value：事件的操作
type HandlerInstanceCache = {
  [key in EventName]: BaseEventHandler;
}

export class EventHandler {
  engine: CanvasEngine
  handlerInstances!: HandlerInstanceCache

  constructor(engine: CanvasEngine) {
    // 这个engine就是从canvasEngine那里传递过来的实例对象
    this.engine = engine
    // 初始化操作这个实例对象的一些配置
    this.initHandlerInstance(this.engine)
  }

  /**
   * @author Zhao YuanDa
   * @parms: canvasEngine引擎对象
   * @description: 初始化事件系统（入口函数）
   * @date 2022-08-07 09:58
   */
  initHandlerInstance(engine: CanvasEngine) {
    this.handlerInstances = {
      click: new ClickEventHandler(engine),
      dblclick: new ClickEventHandler(engine),
    }
  }

  /**
   * @author Zhao YuanDa
   * @parms: 作用的图形 事件名 事件回调函数
   * @description: //TODO
   * @date 2022-08-07 09:59
   */
  pushEvent(shape: ShapeClassType, eventName: EventName, cbFn: EventFn) {
    const handlerInstance = this.handlerInstances[eventName]
    // 收集一下依赖 这会events就应该有值了
    handlerInstance.track(shape, cbFn)
    // 让 shape 也存在此 listener 的缓存
    let shapeEvents = shape.events[eventName]
    if (!shapeEvents) shapeEvents = shape.events[eventName] = new Set()
    shapeEvents.add(cbFn)
    return () => {
      handlerInstance.removeListener(cbFn)
    }
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //TODO
   * @date 2022-08-07 10:00
   */
  removeListener(shape: ShapeClassType, evtName: EventName): void {
    const eventSet = shape.events[evtName]
    if (!eventSet) return
    const handlerInstance = this.handlerInstances[evtName]
    handlerInstance.events = handlerInstance.events.filter(
      e => e.shape.id !== shape.id,
    )
    eventSet.clear()
    handlerInstance.checkEmpty()
  }
}
