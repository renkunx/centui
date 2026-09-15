/**
 * 惯性滚动引擎（自 v2 _util/scroller.js 迁移，仅 Web 端）。
 *
 * Based on the work of: Scroller
 * http://github.com/zynga/scroller
 * Copyright 2011, Zynga Inc. Licensed under the MIT License.
 *
 * scroll-view / swiper / picker-column / ruler 的滚动、轮播、滚轮物理
 * 全部由此引擎驱动。输入为纯数据（{pageX, pageY} 列表 + 时间戳），
 * 不订阅 DOM 事件，由上层组件桥接触摸事件。
 * 动画循环依赖 ./animate 的调度器。
 */
import { warn } from '../debug'
import Animate, { easeInOutCubic, easeOutCubic } from './animate'
import type { EasingMethod } from './animate'

export interface TouchPoint {
  pageX: number
  pageY: number
}

export interface ScrollValues {
  left: number
  top: number
  zoom: number
}

export interface ScrollMax {
  left: number
  top: number
}

export interface ScrollerOptions {
  scrollingX: boolean
  scrollingY: boolean
  animating: boolean
  animationDuration: number
  inRequestAnimationFrame: boolean
  bouncing: boolean
  locking: boolean
  paging: boolean
  snapping: boolean
  snappingVelocity: number
  zooming: boolean
  minZoom: number
  maxZoom: number
  speedMultiplier: number
  scrollingComplete: () => void
  penetrationDeceleration: number
  penetrationAcceleration: number
}

export type ScrollCallback = (left: number, top: number, zoom: number) => void

const DEFAULT_OPTIONS: ScrollerOptions = {
  scrollingX: true,
  scrollingY: true,
  animating: true,
  animationDuration: 250,
  inRequestAnimationFrame: false,
  bouncing: true,
  locking: true,
  paging: false,
  snapping: false,
  snappingVelocity: 4,
  zooming: false,
  minZoom: 0.5,
  maxZoom: 3,
  speedMultiplier: 1,
  scrollingComplete: () => {},
  penetrationDeceleration: 0.03,
  penetrationAcceleration: 0.08,
}

export class Scroller {
  options: ScrollerOptions
  private _callback: ScrollCallback

  private _isSingleTouch = false
  private _isTracking = false
  private _didDecelerationComplete = false
  private _isDragging = false
  private _isDecelerating: number | false = false
  private _isAnimating: number | false = false
  private _clientLeft = 0
  private _clientTop = 0
  private _clientWidth = 0
  private _clientHeight = 0
  private _contentWidth = 0
  private _contentHeight = 0
  private _snapWidth = 100
  private _snapHeight = 100
  private _refreshHeight: number | null = null
  private _refreshActive = false
  private _refreshActivate: (() => void) | null = null
  private _refreshDeactivate: (() => void) | null = null
  private _refreshStart: (() => void) | null = null
  private _zoomLevel = 1
  private _scrollLeft = 0
  private _scrollTop = 0
  private _maxScrollLeft = 0
  private _maxScrollTop = 0
  private _lastTouchLeft: number | null = null
  private _lastTouchTop: number | null = null
  private _lastTouchMove: number | null = null
  private _positions: number[] = []
  private _minDecelerationScrollLeft: number | null = null
  private _minDecelerationScrollTop: number | null = null
  private _maxDecelerationScrollLeft: number | null = null
  private _maxDecelerationScrollTop: number | null = null
  private _decelerationVelocityX: number | null = null
  private _decelerationVelocityY: number | null = null
  private _interruptedAnimation = false
  private _zoomComplete: (() => void) | null = null
  private _initialTouchLeft = 0
  private _initialTouchTop = 0
  private _lastScale = 1
  private _enableScrollX = false
  private _enableScrollY = false

  constructor(callback: ScrollCallback = () => {}, options?: Partial<ScrollerOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this._callback = callback
  }

  /**
   * 配置外层（可视区）与内层（内容）尺寸；falsy 值忽略保留旧值。
   */
  setDimensions(
    clientWidth: number,
    clientHeight: number,
    contentWidth: number,
    contentHeight: number,
  ): void {
    // Only update values which are defined
    if (clientWidth === +clientWidth) {
      this._clientWidth = clientWidth
    }
    if (clientHeight === +clientHeight) {
      this._clientHeight = clientHeight
    }
    if (contentWidth === +contentWidth) {
      this._contentWidth = contentWidth
    }
    if (contentHeight === +contentHeight) {
      this._contentHeight = contentHeight
    }

    // Refresh maximums
    this._computeScrollMax()

    // Refresh scroll position
    this.scrollTo(this._scrollLeft, this._scrollTop, true)
  }

  /**
   * 设置外层元素相对文档的坐标。
   */
  setPosition(left: number, top: number): void {
    this._clientLeft = left || 0
    this._clientTop = top || 0
  }

  /**
   * 配置吸附尺寸（snapping 开启时生效）。
   */
  setSnapSize(width: number, height: number): void {
    this._snapWidth = width
    this._snapHeight = height
  }

  /**
   * 返回滚动位置与缩放值。
   */
  getValues(): ScrollValues {
    return {
      left: this._scrollLeft,
      top: this._scrollTop,
      zoom: this._zoomLevel,
    }
  }

  /**
   * 返回最大滚动值。
   */
  getScrollMax(): ScrollMax {
    return {
      left: this._maxScrollLeft,
      top: this._maxScrollTop,
    }
  }

  /**
   * 激活下拉刷新。
   */
  activatePullToRefresh(
    height: number,
    activateCallback: () => void,
    deactivateCallback: () => void,
    startCallback: () => void,
  ): void {
    this._refreshHeight = height
    this._refreshActivate = activateCallback
    this._refreshDeactivate = deactivateCallback
    this._refreshStart = startCallback
  }

  /**
   * 手动触发下拉刷新。
   */
  triggerPullToRefresh(): void {
    // Use publish instead of scrollTo to allow scrolling to out of boundary position
    // We don't need to normalize scrollLeft, zoomLevel, etc. here because we only y-scrolling when pull-to-refresh is enabled
    this._publish(this._scrollLeft, -this._refreshHeight!, this._zoomLevel, true)

    this._refreshStart?.()
  }

  /**
   * 下拉刷新结束信号。
   */
  finishPullToRefresh(): void {
    this._refreshActive = false

    this._refreshDeactivate?.()

    this.scrollTo(this._scrollLeft, this._scrollTop, true)
  }

  /**
   * 滚动到指定位置，自动处理边界与吸附。
   */
  scrollTo(left: number, top: number, animate = false, zoom = 1): void {
    // Stop deceleration
    if (this._isDecelerating) {
      Animate.stop(this._isDecelerating)
      this._isDecelerating = false
    }

    // Correct coordinates based on new zoom level
    if (zoom != null && zoom !== this._zoomLevel) {
      if (!this.options.zooming) {
        warn('Zooming is not enabled!')
      }
      zoom = zoom ? zoom : 1
      left *= zoom
      top *= zoom

      // Recompute maximum values while temporary tweaking maximum scroll ranges
      this._computeScrollMax(zoom)
    } else {
      // Keep zoom when not defined
      zoom = this._zoomLevel
    }

    if (!this.options.scrollingX) {
      left = this._scrollLeft
    } else {
      if (this.options.paging) {
        left = Math.round(left / this._clientWidth) * this._clientWidth
      } else if (this.options.snapping) {
        left = Math.round(left / this._snapWidth) * this._snapWidth
      }
    }

    if (!this.options.scrollingY) {
      top = this._scrollTop
    } else {
      if (this.options.paging) {
        top = Math.round(top / this._clientHeight) * this._clientHeight
      } else if (this.options.snapping) {
        top = Math.round(top / this._snapHeight) * this._snapHeight
      }
    }

    // Limit for allowed ranges
    left = Math.max(Math.min(this._maxScrollLeft, left), 0)
    top = Math.max(Math.min(this._maxScrollTop, top), 0)

    // Don't animate when no change detected, still call publish to make sure
    // that rendered position is really in-sync with internal data
    if (left === this._scrollLeft && top === this._scrollTop) {
      animate = false
    }
    // Publish new values
    if (!this._isTracking) {
      this._publish(left, top, zoom, animate)
    }
  }

  /**
   * 缩放到指定级别，无坐标时以视口中心为原点。
   */
  zoomTo(
    level: number,
    animate = false,
    originLeft?: number,
    originTop?: number,
    callback?: () => void,
  ): void {
    if (!this.options.zooming) {
      warn('Zooming is not enabled!')
    }

    // Add callback if exists
    if (callback) {
      this._zoomComplete = callback
    }

    // Stop deceleration
    if (this._isDecelerating) {
      Animate.stop(this._isDecelerating)
      this._isDecelerating = false
    }

    const oldLevel = this._zoomLevel

    // Normalize input origin to center of viewport if not defined
    if (originLeft == null) {
      originLeft = this._clientWidth / 2
    }
    if (originTop == null) {
      originTop = this._clientHeight / 2
    }

    // Limit level according to configuration
    level = Math.max(Math.min(level, this.options.maxZoom), this.options.minZoom)

    // Recompute maximum values while temporary tweaking maximum scroll ranges
    this._computeScrollMax(level)

    // Recompute left and top coordinates based on new zoom level
    let left = ((originLeft + this._scrollLeft) * level) / oldLevel - originLeft
    let top = ((originTop + this._scrollTop) * level) / oldLevel - originTop

    // Limit x-axis
    if (left > this._maxScrollLeft) {
      left = this._maxScrollLeft
    } else if (left < 0) {
      left = 0
    }

    // Limit y-axis
    if (top > this._maxScrollTop) {
      top = this._maxScrollTop
    } else if (top < 0) {
      top = 0
    }

    // Push values out
    this._publish(left, top, level, animate)
  }

  doTouchStart(touches: TouchPoint[], timeStamp: number | Date): void {
    // Array-like check is enough here
    if (touches?.length == null) {
      warn(`Invalid touch list: ${touches}`)
    }
    if (timeStamp instanceof Date) {
      timeStamp = timeStamp.valueOf()
    }
    if (typeof timeStamp !== 'number') {
      warn(`Invalid timestamp value: ${timeStamp}`)
    }

    // Reset interruptedAnimation flag
    this._interruptedAnimation = true

    // Stop deceleration
    if (this._isDecelerating) {
      Animate.stop(this._isDecelerating)
      this._isDecelerating = false
      this._interruptedAnimation = true
    }

    // Stop animation
    if (this._isAnimating) {
      Animate.stop(this._isAnimating)
      this._isAnimating = false
      this._interruptedAnimation = true
    }

    // Use center point when dealing with two fingers
    const isSingleTouch = touches.length === 1
    let currentTouchLeft: number, currentTouchTop: number

    if (isSingleTouch) {
      currentTouchLeft = touches[0].pageX
      currentTouchTop = touches[0].pageY
    } else {
      currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2
      currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2
    }

    // Store initial positions
    this._initialTouchLeft = currentTouchLeft
    this._initialTouchTop = currentTouchTop

    // Store initial touch positions
    this._lastTouchLeft = currentTouchLeft
    this._lastTouchTop = currentTouchTop

    // Store initial move time stamp
    this._lastTouchMove = timeStamp as number

    // Reset initial scale
    this._lastScale = 1

    // Reset locking flags
    this._enableScrollX = !isSingleTouch && this.options.scrollingX
    this._enableScrollY = !isSingleTouch && this.options.scrollingY

    // Reset tracking flag
    this._isTracking = true

    // Reset deceleration complete flag
    this._didDecelerationComplete = false

    // Dragging starts directly with two fingers, otherwise lazy with an offset
    this._isDragging = !isSingleTouch

    // Some features are disabled in multi touch scenarios
    this._isSingleTouch = isSingleTouch

    // Clearing data structure
    this._positions = []
  }

  doTouchMove(touches: TouchPoint[], timeStamp: number | Date, scale?: number): void {
    // Array-like check is enough here
    if (touches?.length == null) {
      warn(`Invalid touch list: ${touches}`)
    }
    if (timeStamp instanceof Date) {
      timeStamp = timeStamp.valueOf()
    }
    if (typeof timeStamp !== 'number') {
      warn(`Invalid timestamp value: ${timeStamp}`)
    }

    // Ignore event when tracking is not enabled (event might be outside of element)
    if (!this._isTracking) {
      return
    }

    let currentTouchLeft: number, currentTouchTop: number

    // Compute move based around of center of fingers
    if (touches.length === 2) {
      currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2
      currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2
    } else {
      currentTouchLeft = touches[0].pageX
      currentTouchTop = touches[0].pageY
    }

    const positions = this._positions

    // Are we already in dragging mode?
    if (this._isDragging) {
      // Compute move distance
      const moveX = currentTouchLeft - (this._lastTouchLeft as number)
      const moveY = currentTouchTop - (this._lastTouchTop as number)

      // Read previous scroll position and zooming
      let scrollLeft = this._scrollLeft
      let scrollTop = this._scrollTop
      let level = this._zoomLevel

      // Work with scaling
      if (scale != null && this.options.zooming) {
        const oldLevel = level

        // Recompute level based on previous scale and new scale
        level = (level / this._lastScale) * scale

        // Limit level according to configuration
        level = Math.max(Math.min(level, this.options.maxZoom), this.options.minZoom)

        // Only do further computation when change happened
        if (oldLevel !== level) {
          // Compute relative event position to container
          const currentTouchLeftRel = currentTouchLeft - this._clientLeft
          const currentTouchTopRel = currentTouchTop - this._clientTop

          // Recompute left and top coordinates based on new zoom level
          scrollLeft = ((currentTouchLeftRel + scrollLeft) * level) / oldLevel - currentTouchLeftRel
          scrollTop = ((currentTouchTopRel + scrollTop) * level) / oldLevel - currentTouchTopRel

          // Recompute max scroll values
          this._computeScrollMax(level)
        }
      }

      if (this._enableScrollX) {
        scrollLeft -= moveX * this.options.speedMultiplier
        const maxScrollLeft = this._maxScrollLeft

        if (scrollLeft > maxScrollLeft || scrollLeft < 0) {
          // Slow down on the edges
          if (this.options.bouncing) {
            scrollLeft += (moveX / 2) * this.options.speedMultiplier
          } else if (scrollLeft > maxScrollLeft) {
            scrollLeft = maxScrollLeft
          } else {
            scrollLeft = 0
          }
        }
      }

      // Compute new vertical scroll position
      if (this._enableScrollY) {
        scrollTop -= moveY * this.options.speedMultiplier
        const maxScrollTop = this._maxScrollTop
        if (scrollTop > maxScrollTop || scrollTop < 0) {
          // Slow down on the edges
          if (this.options.bouncing) {
            scrollTop += (moveY / 2) * this.options.speedMultiplier
            // Support pull-to-refresh (only when only y is scrollable)
            if (!this._enableScrollX && this._refreshHeight != null) {
              if (!this._refreshActive && scrollTop <= -this._refreshHeight) {
                this._refreshActive = true
                this._refreshActivate?.()
              } else if (this._refreshActive && scrollTop > -this._refreshHeight) {
                this._refreshActive = false
                this._refreshDeactivate?.()
              }
            }
          } else if (scrollTop > maxScrollTop) {
            scrollTop = maxScrollTop
          } else {
            scrollTop = 0
          }
        }
      }

      // Keep list from growing infinitely (holding min 10, max 20 measure points)
      if (positions.length > 60) {
        positions.splice(0, 30)
      }

      // Track scroll movement for deceleration
      positions.push(scrollLeft, scrollTop, timeStamp as number)

      // Sync scroll position
      this._publish(scrollLeft, scrollTop, level)
    } else {
      // Otherwise figure out whether we are switching into dragging mode now.
      const minimumTrackingForScroll = this.options.locking ? 3 : 0
      const minimumTrackingForDrag = 5

      const distanceX = Math.abs(currentTouchLeft - this._initialTouchLeft)
      const distanceY = Math.abs(currentTouchTop - this._initialTouchTop)

      this._enableScrollX = this.options.scrollingX && distanceX >= minimumTrackingForScroll
      this._enableScrollY = this.options.scrollingY && distanceY >= minimumTrackingForScroll

      positions.push(this._scrollLeft, this._scrollTop, timeStamp as number)

      this._isDragging =
        (this._enableScrollX || this._enableScrollY) &&
        (distanceX >= minimumTrackingForDrag || distanceY >= minimumTrackingForDrag)
      if (this._isDragging) {
        this._interruptedAnimation = false
      }
    }

    // Update last touch positions and time stamp for next event
    this._lastTouchLeft = currentTouchLeft
    this._lastTouchTop = currentTouchTop
    this._lastTouchMove = timeStamp as number
  }

  doTouchEnd(timeStamp: number | Date): void {
    if (timeStamp instanceof Date) {
      timeStamp = timeStamp.valueOf()
    }
    if (typeof timeStamp !== 'number') {
      warn(`Invalid timestamp value: ${timeStamp}`)
    }
    // Ignore event when tracking is not enabled (no touchstart event on element)
    if (!this._isTracking) {
      return
    }

    // Not touching anymore (when two finger hit the screen there are two touch end events)
    this._isTracking = false

    // Be sure to reset the dragging flag now. Here we also detect whether
    // the finger has moved fast enough to switch into a deceleration animation.
    if (this._isDragging) {
      // Reset dragging flag
      this._isDragging = false

      // Start deceleration
      // Verify that the last move detected was in some relevant time frame
      if (this._isSingleTouch && this.options.animating && timeStamp - (this._lastTouchMove as number) <= 100) {
        // Then figure out what the scroll position was about 100ms ago
        const positions = this._positions
        const endPos = positions.length - 1
        let startPos = endPos

        // Move pointer to position measured 100ms ago
        for (let i = endPos; i > 0 && positions[i] > (this._lastTouchMove as number) - 100; i -= 3) {
          startPos = i
        }

        // If start and stop position is identical in a 100ms timeframe,
        // we cannot compute any useful deceleration.
        if (startPos !== endPos) {
          // Compute relative movement between these two points
          const timeOffset = positions[endPos] - positions[startPos]
          const movedLeft = this._scrollLeft - positions[startPos - 2]
          const movedTop = this._scrollTop - positions[startPos - 1]

          // Based on 50ms compute the movement to apply for each render step
          this._decelerationVelocityX = (movedLeft / timeOffset) * (1000 / 60)
          this._decelerationVelocityY = (movedTop / timeOffset) * (1000 / 60)

          // How much velocity is required to start the deceleration
          const minVelocityToStartDeceleration =
            this.options.paging || this.options.snapping ? this.options.snappingVelocity : 0.01

          // Verify that we have enough velocity to start deceleration
          if (
            Math.abs(this._decelerationVelocityX) > minVelocityToStartDeceleration ||
            Math.abs(this._decelerationVelocityY) > minVelocityToStartDeceleration
          ) {
            // Deactivate pull-to-refresh when decelerating
            if (!this._refreshActive) {
              this._startDeceleration(timeStamp as number)
            }
          } else {
            this.options.scrollingComplete()
          }
        } else {
          this.options.scrollingComplete()
        }
      } else if (timeStamp - (this._lastTouchMove as number) > 100) {
        if (!this.options.snapping) {
          this.options.scrollingComplete()
        }
      }
    }

    // If this was a slower move it is per default non decelerated, but this
    // still means that we want snap back to the bounds which is done here.
    if (!this._isDecelerating) {
      if (this._refreshActive && this._refreshStart) {
        // Use publish instead of scrollTo to allow scrolling to out of boundary position
        this._publish(this._scrollLeft, -this._refreshHeight!, this._zoomLevel, true)

        this._refreshStart()
      } else {
        if (this._interruptedAnimation || this._isDragging) {
          this.options.scrollingComplete()
        }

        this.scrollTo(this._scrollLeft, this._scrollTop, true, this._zoomLevel)
        // Directly signalize deactivation (nothing to do on refresh?)
        if (this._refreshActive) {
          this._refreshActive = false
          this._refreshDeactivate?.()
        }
      }
    }

    // Fully cleanup list
    this._positions.length = 0
  }

  private _publish(left: number, top: number, zoom = 1, animate = false): void {
    // Remember whether we had an animation, then we try to continue based on the current "drive" of the animation
    const wasAnimating = this._isAnimating

    if (wasAnimating) {
      Animate.stop(wasAnimating)
      this._isAnimating = false
    }

    if (animate && this.options.animating) {
      const oldLeft = this._scrollLeft
      const oldTop = this._scrollTop
      const oldZoom = this._zoomLevel

      const diffLeft = left - oldLeft
      const diffTop = top - oldTop
      const diffZoom = zoom - oldZoom

      const step = (percent: number, _now: number, render: boolean) => {
        if (render) {
          this._scrollLeft = oldLeft + diffLeft * percent
          this._scrollTop = oldTop + diffTop * percent
          this._zoomLevel = oldZoom + diffZoom * percent
          // Push values out
          this._callback(this._scrollLeft, this._scrollTop, this._zoomLevel)
        }
      }

      const verify = (id: number) => {
        return this._isAnimating === id
      }

      const completed = (_renderedFramesPerSecond: number, animationId: number, wasFinished: boolean) => {
        if (animationId === this._isAnimating) {
          this._isAnimating = false
        }

        if (this._didDecelerationComplete || wasFinished) {
          this.options.scrollingComplete()
        }

        if (this.options.zooming) {
          this._computeScrollMax()
          this._zoomComplete?.()
          this._zoomComplete = null
        }
      }

      const doAnimation = () => {
        // When continuing based on previous animation we choose an ease-out animation instead of ease-in-out
        const easing: EasingMethod = wasAnimating ? easeOutCubic : easeInOutCubic
        this._isAnimating = Animate.start(
          step,
          verify,
          completed,
          this.options.animationDuration,
          easing,
        )
      }

      if (this.options.inRequestAnimationFrame) {
        Animate.requestAnimationFrame(() => {
          doAnimation()
        })
      } else {
        doAnimation()
      }
    } else {
      this._scrollLeft = left
      this._scrollTop = top
      this._zoomLevel = zoom

      // Push values out
      this._callback(left, top, zoom)

      // Fix max scroll ranges
      if (this.options.zooming) {
        this._computeScrollMax()
        this._zoomComplete?.()
        this._zoomComplete = null
      }
    }
  }

  private _computeScrollMax(zoomLevel?: number): void {
    if (zoomLevel == null) {
      zoomLevel = this._zoomLevel
    }

    this._maxScrollLeft = Math.max(this._contentWidth * zoomLevel - this._clientWidth, 0)
    this._maxScrollTop = Math.max(this._contentHeight * zoomLevel - this._clientHeight, 0)
  }

  private _startDeceleration(_timeStamp: number): void {
    if (this.options.paging) {
      const scrollLeft = Math.max(Math.min(this._scrollLeft, this._maxScrollLeft), 0)
      const scrollTop = Math.max(Math.min(this._scrollTop, this._maxScrollTop), 0)
      const clientWidth = this._clientWidth
      const clientHeight = this._clientHeight

      // We limit deceleration not to the min/max values of the allowed range, but to the size of the visible client area.
      // Each page should have exactly the size of the client area.
      this._minDecelerationScrollLeft = Math.floor(scrollLeft / clientWidth) * clientWidth
      this._minDecelerationScrollTop = Math.floor(scrollTop / clientHeight) * clientHeight
      this._maxDecelerationScrollLeft = Math.ceil(scrollLeft / clientWidth) * clientWidth
      this._maxDecelerationScrollTop = Math.ceil(scrollTop / clientHeight) * clientHeight
    } else {
      this._minDecelerationScrollLeft = 0
      this._minDecelerationScrollTop = 0
      this._maxDecelerationScrollLeft = this._maxScrollLeft
      this._maxDecelerationScrollTop = this._maxScrollTop
    }

    // Wrap class method
    const step = (_percent: number, _now: number, render: boolean) => {
      this._stepThroughDeceleration(render)
    }

    // How much velocity is required to keep the deceleration running
    const minVelocityToKeepDecelerating = this.options.snapping ? this.options.snappingVelocity : 0.01

    // Detect whether it's still worth to continue animating steps
    // If we are already slow enough to not being user perceivable anymore, we stop the whole process here.
    const verify = () => {
      const shouldContinue =
        Math.abs(this._decelerationVelocityX as number) >= minVelocityToKeepDecelerating ||
        Math.abs(this._decelerationVelocityY as number) >= minVelocityToKeepDecelerating
      if (!shouldContinue) {
        this._didDecelerationComplete = true
      }
      return shouldContinue
    }

    const completed = (_renderedFramesPerSecond: number, _animationId: number, _wasFinished: boolean) => {
      this._isDecelerating = false

      // Animate to grid when snapping is active, otherwise just fix out-of-boundary positions
      this.scrollTo(this._scrollLeft, this._scrollTop, this.options.snapping)
    }

    // Start animation and switch on flag
    this._isDecelerating = Animate.start(step, verify, completed)
  }

  private _stepThroughDeceleration(render: boolean): void {
    //
    // COMPUTE NEXT SCROLL POSITION
    //

    // Add deceleration to scroll position
    let scrollLeft = this._scrollLeft + (this._decelerationVelocityX as number)
    let scrollTop = this._scrollTop + (this._decelerationVelocityY as number)

    //
    // HARD LIMIT SCROLL POSITION FOR NON BOUNCING MODE
    //

    if (!this.options.bouncing) {
      const scrollLeftFixed = Math.max(
        Math.min(this._maxDecelerationScrollLeft as number, scrollLeft),
        this._minDecelerationScrollLeft as number,
      )
      if (scrollLeftFixed !== scrollLeft) {
        scrollLeft = scrollLeftFixed
        this._decelerationVelocityX = 0
      }
      const scrollTopFixed = Math.max(
        Math.min(this._maxDecelerationScrollTop as number, scrollTop),
        this._minDecelerationScrollTop as number,
      )
      if (scrollTopFixed !== scrollTop) {
        scrollTop = scrollTopFixed
        this._decelerationVelocityY = 0
      }
    }

    //
    // UPDATE SCROLL POSITION
    //

    if (render) {
      this._publish(scrollLeft, scrollTop, this._zoomLevel)
    } else {
      this._scrollLeft = scrollLeft
      this._scrollTop = scrollTop
    }

    //
    // SLOW DOWN
    //

    // Slow down velocity on every iteration
    if (!this.options.paging) {
      // This is the factor applied to every iteration of the animation
      // to slow down the process. This should emulate natural behavior where
      // objects slow down when the initiator of the movement is removed
      const frictionFactor = 0.95
      this._decelerationVelocityX = (this._decelerationVelocityX as number) * frictionFactor
      this._decelerationVelocityY = (this._decelerationVelocityY as number) * frictionFactor
    }

    //
    // BOUNCING SUPPORT
    //

    if (this.options.bouncing) {
      let scrollOutsideX = 0
      let scrollOutsideY = 0

      // This configures the amount of change applied to deceleration/acceleration when reaching boundaries
      const penetrationDeceleration = this.options.penetrationDeceleration
      const penetrationAcceleration = this.options.penetrationAcceleration

      // Check limits
      if (scrollLeft < (this._minDecelerationScrollLeft as number)) {
        scrollOutsideX = (this._minDecelerationScrollLeft as number) - scrollLeft
      } else if (scrollLeft > (this._maxDecelerationScrollLeft as number)) {
        scrollOutsideX = (this._maxDecelerationScrollLeft as number) - scrollLeft
      }

      if (scrollTop < (this._minDecelerationScrollTop as number)) {
        scrollOutsideY = (this._minDecelerationScrollTop as number) - scrollTop
      } else if (scrollTop > (this._maxDecelerationScrollTop as number)) {
        scrollOutsideY = (this._maxDecelerationScrollTop as number) - scrollTop
      }

      // Slow down until slow enough, then flip back to snap position
      if (scrollOutsideX !== 0) {
        if (scrollOutsideX * (this._decelerationVelocityX as number) <= 0) {
          this._decelerationVelocityX = (this._decelerationVelocityX as number) + scrollOutsideX * penetrationDeceleration
        } else {
          this._decelerationVelocityX = scrollOutsideX * penetrationAcceleration
        }
      }

      if (scrollOutsideY !== 0) {
        if (scrollOutsideY * (this._decelerationVelocityY as number) <= 0) {
          this._decelerationVelocityY = (this._decelerationVelocityY as number) + scrollOutsideY * penetrationDeceleration
        } else {
          this._decelerationVelocityY = scrollOutsideY * penetrationAcceleration
        }
      }
    }
  }
}
