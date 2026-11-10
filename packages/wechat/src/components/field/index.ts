/**
 * Source: packages/vue/src/components/field/Field.vue
 *
 * 映射：
 *  props    title, brief, disabled, plain
 *  events   无
 *  slots    header / action / 默认（content）/ footer
 *
 * provide('rootField') → relations：向后代 field-item / input-item / textarea-item
 * 分发 disabled（子组件经 relations ancestor 登记，父 observer 变更后逐一推送）。
 *
 * 平台差异：
 *  1. <fieldset>/<legend>/<header>/<footer> 语义标签以 <view> 等价实现（类名不变）。
 *  2. header/footer 包裹节点显隐：title/brief 驱动的分支一致；插槽有无无法同步获知，
 *     ready 时测量后回写（首帧可能闪现空 header/footer，不支持运行中动态增删插槽）。
 */
import {CuComponent} from '../../shared/component'

type Instance = WechatMiniprogram.Component.TrivialInstance

const DESCENDANTS = ['../field-item/index', '../input-item/index', '../textarea-item/index']

function descendantRelations(): Record<string, WechatMiniprogram.Component.RelationOption> {
  const out: Record<string, WechatMiniprogram.Component.RelationOption> = {}
  for (const path of DESCENDANTS) {
    out[path] = {
      type: 'descendant',
      linked(this: {data?: Record<string, unknown>}, target: Instance) {
        fieldChildren(this).push(target)
        if (typeof target.receiveFieldDisabled === 'function') {
          target.receiveFieldDisabled(!!(this.data ?? {}).disabled)
        }
      },
      unlinked(this: unknown, target: Instance) {
        const list = fieldChildren(this)
        const i = list.indexOf(target)
        if (i !== -1) list.splice(i, 1)
      },
    }
  }
  return out
}

function fieldChildren(ctx: unknown): Instance[] {
  const self = ctx as {__fieldChildren?: Instance[]}
  if (!self.__fieldChildren) self.__fieldChildren = []
  return self.__fieldChildren
}

CuComponent({
  options: {virtualHost: true, multipleSlots: true},

  properties: {
    title: {type: String, value: ''},
    brief: {type: String, value: ''},
    disabled: {type: Boolean, value: false},
    plain: {type: Boolean, value: false},
  },

  data: {
    showHeader: true,
    showFooter: true,
  },

  observers: {
    disabled(val: boolean) {
      for (const child of fieldChildren(this)) {
        if (typeof child.receiveFieldDisabled === 'function') {
          child.receiveFieldDisabled(!!val)
        }
      }
    },
    'title, brief'(title: string, brief: string) {
      if (title || brief) this.setData({showHeader: true})
    },
  },

  lifetimes: {
    ready() {
      const query = this.createSelectorQuery()
      query.select('.cu-field-header').boundingClientRect()
      query.select('.cu-field-footer').boundingClientRect()
      query.exec((rects: Array<{height: number} | null> | null) => {
        if (!rects) return
        const patch: Record<string, boolean> = {}
        const [header, footer] = rects
        if (header && !(header.height > 0) && !this.data.title && !this.data.brief) {
          patch.showHeader = false
        }
        if (footer && !(footer.height > 0)) patch.showFooter = false
        if (Object.keys(patch).length > 0) this.setData(patch)
      })
    },
  },

  relations: descendantRelations(),
})
