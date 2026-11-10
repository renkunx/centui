/**
 * Source: packages/vue/src/components/steps/Steps.vue
 *
 * 映射：
 *  props    steps(StepItem[]), current(0), direction(horizontal/vertical),
 *           transition(false), verticalAdaptive(false), custom(false)
 *  events   无（Vue 版无 emits）
 *  slots    默认插槽（custom=true 时整树替换，Vue :steps 作用域参数不传——差异声明）。
 *           ★ 差异声明：Vue 的 icon/reached/current/unreached/content 为逐项作用域
 *           插槽（:index/:current-index/:step），小程序具名插槽不可在 wx:for 内重复
 *           渲染（单实例同名 slot 非法，基础库告警且仅首个生效）——移除逐项具名
 *           插槽，逐项定制统一走 custom + 默认插槽整树替换通道，循环内恒渲染默认
 *           节点（视觉与 Vue 未传插槽时一致）。
 *
 * 实现说明：
 *  - Vue 版为 parent 自渲染（无 step 子组件、无 provide/inject），故不使用 relations，
 *    progress 数组分发即 Vue 的 sliceProgress 逐段状态（shared 步进动画经
 *    doTransition 的 setTimeout 链复刻，timer 全量登记、detached 清理）。
 *  - progress 分发与 index 对齐 Vue：steps.slice(0, length-1) 段、len ∈ [0,1]、
 *    time = |Δlen| * 0.3；含运行时 steps 变长守卫（length 变化后按当前 currentLength
 *    重算 progress，与 Vue watch(steps.length) 一致）与 barInnerStyle 缺段兜底。
 *  - current 的过渡：transition=true 时 100ms 延时后逐段 walk（对齐 Vue），
 *    currentLength 随 walk 递进更新（含小数，驱动 no-current 类与 reached/current 态）。
 *  - 垂直非 adaptive 的 bar 高度度量（Vue initStepSize 的 querySelectorAll）改为
 *    createSelectorQuery 异步批量度量，纯计算在 logic.computeStepSizes。
 */
import {CuComponent} from '../../shared/component'
import {createTimerRegistry, type TimerRegistry} from '../../shared/timer'
import {
  barInnerStyle,
  barOuterStyle,
  computeStepSizes,
  formatValue,
  isNoCurrent,
  sliceProgress,
  stepStatusClass,
  type ProgressSeg,
  type StepItem,
} from './logic'

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    steps: {type: Object, value: [] as StepItem[]},
    current: {type: Number, value: 0},
    /** horizontal | vertical */
    direction: {type: String, value: 'horizontal'},
    transition: {type: Boolean, value: false},
    verticalAdaptive: {type: Boolean, value: false},
    custom: {type: Boolean, value: false},
  },

  data: {
    currentLength: 0,
    noCurrent: false,
    stepStatus: [] as string[],
    barStyles: [] as string[],
    barInnerStyles: [] as string[],
    progress: [] as ProgressSeg[],
    stepsSize: [] as number[],
  },

  observers: {
    current(_val: number, oldVal: number | undefined) {
      const state = stepsState(this)
      if (!state.inited) {
        return // 初始化赋值由 attached 承担（Vue watch 无 immediate）
      }
      this.__onCurrentChange(_val, oldVal as number)
    },
    steps(steps: StepItem[]) {
      const state = stepsState(this)
      const list = Array.isArray(steps) ? steps : []
      if (list.length === state.lastStepsLength) {
        return
      }
      state.lastStepsLength = list.length
      if (!state.inited) {
        return
      }
      // Vue watch(steps.length)：按当前 currentLength 重算 progress，保持段数一致
      state.progress = sliceProgress(state.currentLength, list, state.progress)
      this.__syncViewState()
      // onUpdated → nextTick → initStepSize 等价
      wx.nextTick(() => this.__initStepSize())
    },
    'direction, verticalAdaptive'() {
      this.__initStepSize()
    },
  },

  lifetimes: {
    attached() {
      const state = stepsState(this)
      const steps = (Array.isArray(this.data.steps) ? this.data.steps : []) as StepItem[]
      state.lastStepsLength = steps.length
      // Vue created 语义：立即初始化进度
      const currentStep = formatValue(this.data.current, steps.length)
      state.currentLength = currentStep
      state.progress = sliceProgress(currentStep, steps, [])
      state.inited = true
      this.__syncViewState()
    },
    ready() {
      this.__initStepSize()
    },
    detached() {
      timers(this).clearAll()
    },
  },

  methods: {
    /** Vue watch(current)（非首次）：transition 走 100ms 延时逐段 walk，否则直接落地 */
    __onCurrentChange(val: number, oldVal: number) {
      const state = stepsState(this)
      const steps = (Array.isArray(this.data.steps) ? this.data.steps : []) as StepItem[]
      const currentStep = formatValue(val, steps.length)
      const newProgress = sliceProgress(currentStep, steps, state.progress)
      if (this.data.transition) {
        const isAdd = currentStep >= oldVal
        state.timers.clearTimeout(state.mainTimer)
        state.mainTimer = null
        for (const t of state.walkTimers) {
          state.timers.clearTimeout(t)
        }
        state.walkTimers = []
        state.mainTimer = state.timers.setTimeout(() => {
          state.mainTimer = null
          this.__doTransition(newProgress, isAdd)
        }, 100)
      } else {
        state.progress = newProgress
        state.currentLength = currentStep
        this.__syncViewState()
      }
    },

    /** Vue doTransition：递归 setTimeout 链逐段推进 progress 与 currentLength */
    __doTransition(newProgress: ProgressSeg[], isAdd: boolean) {
      const state = stepsState(this)
      let current = isAdd ? 0 : state.currentLength
      const walk = (index: number) => {
        if (index < newProgress.length && index > -1 && newProgress[index]) {
          if (isAdd) {
            current += newProgress[index].len
          } else {
            current -= state.progress[index]!.len - newProgress[index].len
          }
          state.walkTimers.push(
            state.timers.setTimeout(() => {
              walk(isAdd ? index + 1 : index - 1)
              state.currentLength = current
              this.__syncViewState()
            }, newProgress[index].time * 1000),
          )
        }
        state.progress[index] = newProgress[index]
        this.__syncViewState()
      }
      walk(isAdd ? 0 : newProgress.length - 1)
    },

    /** 由 currentLength/progress/stepsSize 推导全部视图数据 */
    __syncViewState() {
      const state = stepsState(this)
      const steps = (Array.isArray(this.data.steps) ? this.data.steps : []) as StepItem[]
      const count = Math.max(steps.length, state.progress.length + 1)
      const stepStatus: string[] = []
      const barStyles: string[] = []
      const barInnerStyles: string[] = []
      for (let index = 0; index < count; index++) {
        stepStatus.push(stepStatusClass(state.currentLength, index))
        barStyles.push(
          barOuterStyle(index, this.data.direction, this.data.verticalAdaptive, state.stepsSize),
        )
        barInnerStyles.push(barInnerStyle(state.progress[index], this.data.direction))
      }
      this.setData({
        currentLength: state.currentLength,
        noCurrent: isNoCurrent(state.currentLength),
        stepStatus,
        barStyles,
        barInnerStyles,
        progress: state.progress,
      })
    },

    /** Vue initStepSize：垂直非 adaptive 时度量 text/icon 高度差算 bar 高 */
    __initStepSize() {
      if (this.data.direction !== 'vertical' || this.data.verticalAdaptive) {
        return
      }
      const query = this.createSelectorQuery()
      query.selectAll('.cu-steps .text-wrapper').boundingClientRect()
      query.selectAll('.cu-steps .icon-wrapper').boundingClientRect()
      query.exec((res: Array<Array<{height: number}> | null>) => {
        const texts = (res && res[0]) || []
        const icons = (res && res[1]) || []
        if (!texts.length) {
          return
        }
        const sizes = computeStepSizes(
          texts.map((r) => r.height),
          icons.map((r) => r.height),
        )
        const state = stepsState(this)
        if (sizes.toString() !== state.stepsSize.toString()) {
          state.stepsSize = sizes
          this.__syncViewState()
        }
      })
    },
  },
})

interface StepsState {
  timers: TimerRegistry
  inited: boolean
  lastStepsLength: number
  currentLength: number
  progress: ProgressSeg[]
  stepsSize: number[]
  mainTimer: number | null
  walkTimers: number[]
}

function stepsState(ctx: unknown): StepsState {
  const self = ctx as {__stepsState?: StepsState}
  if (!self.__stepsState) {
    self.__stepsState = {
      timers: createTimerRegistry(ctx),
      inited: false,
      lastStepsLength: 0,
      currentLength: 0,
      progress: [],
      stepsSize: [],
      mainTimer: null,
      walkTimers: [],
    }
  }
  return self.__stepsState
}

function timers(ctx: unknown): TimerRegistry {
  return stepsState(ctx).timers
}
