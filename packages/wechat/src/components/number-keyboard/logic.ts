/**
 * number-keyboard 纯逻辑（对照 Vue 版 KeyboardBoard.vue + KeyboardKey.vue + NumberKeyboard.vue）
 */

export type KeyKind = 'number' | 'dot' | 'empty' | 'slidedown' | 'delete' | 'confirm'

/** 渲染用键位视图（KeyboardKey.vue 归一化） */
export interface KeyCell {
  /** 显示文案（空为图形键：delete/slidedown/empty） */
  value: string
  kind: KeyKind
  /** 附加类：no-bg / delete / slidedown / large-item */
  cls: string
  /** 无障碍标签（KeyboardKey ariaLabel，功能键必须显式提供） */
  ariaLabel: string
  /** true = touchstart 触发 press（Vue 无 no-touch）；false = tap 触发（no-touch 键） */
  touch: boolean
}

/**
 * KeyboardBoard.generateKeyNumber：baseStack [1..9, 0]；disorder 时随机取样拼接。
 * Vue textRender 无平台等价（函数不可经 setData 传递），键值统一字符串化。
 */
export function generateKeyNumberList(disorder: boolean, random: () => number = Math.random): string[] {
  const baseStack = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
  const baseStackTmp = [...baseStack]
  return baseStack.map(item => {
    const val = disorder
      ? (baseStackTmp.splice(Math.floor(random() * baseStackTmp.length), 1)[0] ?? 0)
      : item
    return String(val)
  })
}

export interface BoardOptions {
  type: string
  keyNumberList: string[]
  hideDot: boolean
  duplicateZero: boolean
  isView: boolean
}

/**
 * KeyboardBoard 模板的 keyboard-number 键区布局：
 * professional：9 数字 + (dot/00 组合) + 收起键(isView 时为空占位)；
 * simple：9 数字 + 空位(no-bg) + 0 + 删除键(no-bg delete)。
 */
export function buildNumberKeys(opts: BoardOptions): KeyCell[] {
  const {type, keyNumberList, hideDot, duplicateZero, isView} = opts
  const professional = type !== 'simple'
  const cells: KeyCell[] = []

  for (let i = 0; i < 9; i++) {
    cells.push({
      value: keyNumberList[i] ?? '',
      kind: 'number',
      cls: '',
      ariaLabel: String(keyNumberList[i] ?? ''),
      touch: true,
    })
  }

  if (professional) {
    if (!hideDot) {
      cells.push({
        value: duplicateZero ? '0' : '.',
        kind: 'dot',
        cls: '',
        ariaLabel: duplicateZero ? '0' : '小数点',
        touch: true,
      })
    }
    cells.push({
      value: duplicateZero ? '00' : (keyNumberList[9] ?? '0'),
      kind: 'number',
      cls: hideDot ? 'large-item' : '',
      ariaLabel: duplicateZero ? '00' : String(keyNumberList[9] ?? '0'),
      touch: true,
    })
    if (duplicateZero) {
      cells.push({value: '.', kind: 'dot', cls: '', ariaLabel: '小数点', touch: true})
    }
    if (!duplicateZero) {
      cells.push(
        isView
          ? {value: '', kind: 'empty', cls: '', ariaLabel: '', touch: false}
          : {value: '', kind: 'slidedown', cls: 'slidedown', ariaLabel: '收起键盘', touch: false},
      )
    }
  } else {
    cells.push({value: '', kind: 'empty', cls: 'no-bg', ariaLabel: '', touch: false})
    cells.push({
      value: keyNumberList[9] ?? '0',
      kind: 'number',
      cls: '',
      ariaLabel: String(keyNumberList[9] ?? '0'),
      touch: true,
    })
    cells.push({value: '', kind: 'delete', cls: 'no-bg delete', ariaLabel: '删除', touch: true})
  }

  return cells
}

/** professional 操作列：删除键 + 确认键（KeyboardBoard keyboard-operate） */
export function buildOperateKeys(okText: string): KeyCell[] {
  return [
    {value: '', kind: 'delete', cls: 'delete', ariaLabel: '删除', touch: true},
    {value: okText, kind: 'confirm', cls: 'confirm', ariaLabel: String(okText), touch: false},
  ]
}

/** locale 默认（对齐 @centui/core lang/zh-CN md.number_keyboard.confirm） */
export const NUMBER_KEYBOARD_CONFIRM_TEXT = '确定'
