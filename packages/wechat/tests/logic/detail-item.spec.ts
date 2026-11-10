import {describe, it, expect, beforeAll} from 'vitest'

/**
 * detail-item 为纯展示组件（title/content/bold，类名与插槽兜底在 wxml 层），
 * 无独立纯函数——这里在桩 Component() 下加载真实组件定义，
 * 锁定 props 默认值与类型映射（对照 Vue withDefaults：title ''、content ''、bold false）。
 */

interface CapturedOptions {
  properties?: Record<string, {type: unknown; optionalTypes?: unknown[]; value: unknown}>
  options?: Record<string, unknown>
  externalClasses?: string[]
  methods?: Record<string, unknown>
}

const captured: CapturedOptions = {}

beforeAll(async () => {
  ;(globalThis as Record<string, unknown>).Component = (opts: CapturedOptions) => {
    Object.assign(captured, opts)
  }
  await import('../../src/components/detail-item/index')
})

describe('detail-item 契约（对齐 Vue DetailItem.vue）', () => {
  it('props 默认值与 Vue withDefaults 严格一致', () => {
    const props = captured.properties ?? {}
    expect(props.title).toMatchObject({type: String, value: ''})
    expect(props.content).toMatchObject({type: String, value: ''})
    expect(props.content.optionalTypes).toContain(Number) // Vue content: string | number
    expect(props.bold).toMatchObject({type: Boolean, value: false})
  })

  it('无 events、无 methods（Vue 版无 emits/方法）', () => {
    expect(captured.methods ?? {}).toEqual({})
  })

  it('CuComponent 统一默认：addGlobalClass + cu-class 外部类', () => {
    expect(captured.options?.addGlobalClass).toBe(true)
    expect(captured.externalClasses).toContain('cu-class')
  })
})
