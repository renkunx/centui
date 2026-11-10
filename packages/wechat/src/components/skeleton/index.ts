/**
 * Source: packages/vue/src/components/skeleton/Skeleton.vue
 *
 * 映射：
 *  props    loading(true), avatar(false), row(3), title(false),
 *           titleWidth('40%'，Number|string), rowWidth('100%'，Number|string|Array),
 *           avatarSize(md，lg/sm 档)
 *  events   无
 *  slots    默认插槽（loading=false 时渲染，对齐 Vue v-else 分支）
 *
 * 平台差异：
 *  1. title 的 h4 与 row 的 div 以 view 承载（类名样式与 Vue 一致，h4 的 UA 样式差异
 *     由全局 scoped-reset 对齐）。
 *  2. rowWidth/titleWidth 联合类型经 optionalTypes 声明；Vue onMounted 一次性的
 *     titleWidthStyle 计算改为 observer 驱动（响应属性变化，行为为超集）。
 */
import {CuComponent} from '../../shared/component'
import {rowStyleAt, titleWidthStyle} from './logic'

type RowWidth = number | string | Array<number | string>

CuComponent({
  options: {virtualHost: true},

  properties: {
    loading: {type: Boolean, value: true},
    avatar: {type: Boolean, value: false},
    row: {type: Number, value: 3},
    title: {type: Boolean, value: false},
    titleWidth: {type: String, optionalTypes: [Number], value: '40%'},
    rowWidth: {type: String, optionalTypes: [Number, Array], value: '100%'},
    avatarSize: {type: String, value: 'md'},
  },

  data: {
    titleStyle: '',
    rows: [] as number[],
    rowStyles: [] as string[],
  },

  observers: {
    'row, rowWidth'(row: number, rowWidth: RowWidth) {
      const rows: number[] = []
      const rowStyles: string[] = []
      for (let i = 1; i <= row; i++) {
        rows.push(i)
        rowStyles.push(rowStyleAt(rowWidth, i - 1, row))
      }
      this.setData({rows, rowStyles})
    },
    titleWidth(titleWidth: string | number) {
      this.setData({titleStyle: titleWidthStyle(titleWidth)})
    },
  },

  lifetimes: {
    attached() {
      // observer 在初始化时即触发，此处兜底（空 steps 场景等）
      if (!this.data.rows.length && this.data.row > 0) {
        const row = this.data.row
        const rows: number[] = []
        const rowStyles: string[] = []
        for (let i = 1; i <= row; i++) {
          rows.push(i)
          rowStyles.push(rowStyleAt(this.data.rowWidth as RowWidth, i - 1, row))
        }
        this.setData({rows, rowStyles, titleStyle: titleWidthStyle(this.data.titleWidth)})
      }
    },
  },
})
