import { EventHandler } from './EventHandlers'
import type { BaseShape } from './Shapes/base'
import type { Rect } from './Shapes/rect'
import type { EventFn, EventName } from './types/event'
import type { ShapeClassType } from './types/shape'

// todo
// 移动元素
// 切换图层

export interface CanvasEngineProps {
  w?: string
  h?: string
  canvasTarget?: string | HTMLCanvasElement
}

export interface DrawDependencyGraphMap {
  id: symbol
  path2D: Path2D
  shapeInfo: BaseShape<unknown, unknown>
}

export interface RenderOptions {
  options: {
    color?: string
    mode?: 'fill' | 'stroke'
  }
  cb: (...args: any[]) => unknown
}

export interface CanvasDomInfo {
  canvasHeight: number
  canvasWidth: number
  leftOffset: number
  topOffset: number
}

export class CanvasEngine {
  private maxZIndex = -1

  public canvasDomInfo: CanvasDomInfo = {
    canvasHeight: 0,
    canvasWidth: 0,
    leftOffset: 0,
    topOffset: 0,
  }

  // 绘画图
  private drawDependencyGraphsMap: Map<symbol, ShapeClassType> = new Map()

  // canvas dom
  private rawCanvasDom!: HTMLCanvasElement
  // canvas ctx
  public ctx!: CanvasRenderingContext2D
  // 事件map
  public eventsMap: Map<string, Set<EventFn>> = new Map()
  // 渲染队列
  private renderQueue: {
    graphical: BaseShape<unknown, unknown>
    options: RenderOptions
  }[] = []

  isRender = false

  private eventHandler

  constructor(public options: CanvasEngineProps) {
    // 这一步就是初始化canvas的大小 还有偏移量
    this.initCanvasSize(options)
    // 获取操作canvas2d上下文的环境
    this.initCtx()
    // 这个是核心 初始化事件系统 这个this就是实例本身了
    this.eventHandler = new EventHandler(this)
  }

  // 初始化canvas大小
  private initCanvasSize(options: CanvasEngineProps) {
    const { w, h, canvasTarget } = options
    const canvasDom
      = typeof canvasTarget === 'string'
        ? (document.querySelector(
            canvasTarget || '#canvas',
          ) as HTMLCanvasElement)
        : canvasTarget

    if (canvasDom) {
      canvasDom.setAttribute('width', w || '500')
      canvasDom.setAttribute('height', h || '500')
    }
    else {
      throw new Error('请选择正确的 canvas id 获取dom元素')
    }
    this.rawCanvasDom = canvasDom
    this.initCanvasDomInfo(options, canvasDom)
  }

  // 初始化canvasDom信息
  private initCanvasDomInfo(options: CanvasEngineProps, _: HTMLCanvasElement) {
    const { w, h } = options
    this.canvasDomInfo.canvasWidth = Number(w || '500')
    this.canvasDomInfo.canvasHeight = Number(h || '500')
    this.updateCanvasOffset()
  }

  // 更新canvas的偏移量
  public updateCanvasOffset() {
    const { left, top } = this.rawCanvasDom.getClientRects()[0]
    this.canvasDomInfo.leftOffset = left
    this.canvasDomInfo.topOffset = top
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //排序一下渲染队列 根据zIndex属性
   * @date 2022-08-07 10:55
   */
  private sortRenderQueue() {
    this.renderQueue.sort((a, b) => {
      return a.graphical.zIndex - b.graphical.zIndex
    })
  }

  // 获取2d的上下文环境
  private initCtx() {
    this.ctx = this.rawCanvasDom.getContext('2d') as CanvasRenderingContext2D
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //TODO
   * @date 2022-08-07 11:20
   */
  private renderingQueue() {
    // 先按照z-index排序
    this.sortRenderQueue()
    this.renderQueue.forEach((render) => {
      // 这里是为了保证有个最上面的图层
      render.graphical.innerZIndex = ++this.maxZIndex
      // 渲染前做的事 这个没有写呢
      render.graphical.beforeRender(this, render.options)
      // 真正开始渲染
      render.graphical.render(this, render.options)
    })
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //TODO
   * @date 2022-08-07 11:21
   */
  public getCanvasDom(): HTMLCanvasElement {
    return this.rawCanvasDom
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //渲染模块入口函数
   * @date 2022-08-07 11:18
   */
  public render(
    graphical: ShapeClassType,
    options: RenderOptions['options'],
    cb: RenderOptions['cb'] = () => {},
  ) {
    this.drawDependencyGraphsMap.set(graphical.id, graphical)
    this.renderQueue.push({
      graphical,
      options: {
        options,
        cb,
      },
    })
    this.runRenderTask()
  }

  /**
   * @author Zhao YuanDa
   * @parms: 事件的作用目标图形 事件名 事件处理函数
   * @description: //TODO
   * @date 2022-08-07 10:59
   */
  public addEventListener(
    graphical: ShapeClassType,
    eventType: EventName,
    fn: EventFn,
  ) {
    return this.eventHandler.pushEvent(graphical, eventType, fn)
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //TODO
   * @date 2022-08-07 11:21
   */
  public clear(graphical: ShapeClassType) {
    const index = this.renderQueue.findIndex(
      it => it.graphical.id === graphical.id,
    )
    if (index === -1) return
    this.renderQueue.splice(index, 1)
    this.emptyEvents(graphical)
    this.runRenderTask()
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //TODO
   * @date 2022-08-07 11:21
   */
  public emptyEvents(graphical: ShapeClassType) {
    const { events } = graphical
    Object.keys(events).forEach((eventName) => {
      this.clearEvents(graphical, eventName as EventName)
    })
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //TODO
   * @date 2022-08-07 11:21
   */
  public clearEvents(graphical: ShapeClassType, eventType: EventName) {
    this.eventHandler.removeListener(graphical, eventType)
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //加载函数（包括重新加载）
   * @date 2022-08-07 11:21
   */
  public reload() {
    this.clearView()
    this.renderingQueue()
  }

  public clearView() {
    const { canvasWidth, canvasHeight } = this.canvasDomInfo
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  }

  public modifyShapeLayer(graphical: Rect, zIndex: number) {
    graphical.zIndex = zIndex
    this.runRenderTask()
  }

  /**
   * @author Zhao YuanDa
   * @parms:
   * @description: //异步渲染 跟vue3 里面nextTick类似
   * @date 2022-08-07 10:57
   */
  private runRenderTask() {
    if (!this.isRender) {
      this.isRender = true
      Promise.resolve().then(() => {
        this.reload()
        this.isRender = false
      })
    }
  }

  public getCtx() {
    return this.ctx
  }
}
