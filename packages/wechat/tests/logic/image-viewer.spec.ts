/**
 * image-viewer 纯逻辑测试（对照 Vue 版 ImageViewer.vue imgsInit 归一化）+
 * 组件层（index.ts）：show/isViewerShow 双向回流、attached 初始显隐、swiper 索引事件。
 */
import {describe, it, expect, vi, afterEach} from 'vitest'
import {normalizeList} from '../../src/components/image-viewer/logic'
import {loadComponent, mountDef} from '../helpers/weapp'

const comp = await loadComponent(() => import('../../src/components/image-viewer/index'))

describe('image-viewer/normalizeList（imgsInit）', () => {
  it('字符串项包装为 {url}', () => {
    expect(normalizeList(['https://a.png', 'https://b.png'])).toEqual([
      {url: 'https://a.png'},
      {url: 'https://b.png'},
    ])
  })

  it('对象项透传（url/alt/cls）', () => {
    const list = [{url: 'https://a.png', alt: 'A', cls: 'x'}]
    const result = normalizeList(list)
    expect(result).toEqual(list)
    expect(result[0]).toBe(list[0])
  })

  it('混合与边界：null 项、非数组输入', () => {
    expect(normalizeList(['https://a.png', {url: 'https://b.png'}])).toEqual([
      {url: 'https://a.png'},
      {url: 'https://b.png'},
    ])
    expect(normalizeList([null])).toEqual([{url: ''}])
    expect(normalizeList(undefined)).toEqual([])
    expect(normalizeList('not-array')).toEqual([])
  })
})

/**
 * 组件层（index.ts）：
 * - show observer：复位 initialIndex → 显隐 → wx.nextTick imgsInit；isViewerShow observer
 *   回流 change {value}（update:modelValue 映射）
 * - attached：挂载即打开时同样复位索引并归一化 imgs
 * - onSwiperChange：索引变化派发 change {fromIndex, toIndex}，同帧重复回调去重
 */
describe('image-viewer 组件', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('attached：初始关闭 → isViewerShow false，imgs 不初始化', () => {
    const inst = mountDef(comp.def, {props: {list: ['https://a.png']}})
    inst.attached()
    expect(inst.data.isViewerShow).toBe(false)
    expect(inst.data.imgs).toEqual([])
    expect(inst.events).toEqual([])
  })

  it('attached：挂载即打开 → 复位 initialIndex 并归一化 imgs', () => {
    const inst = mountDef(comp.def, {
      props: {
        show: true,
        initialIndex: 2,
        list: ['https://a.png', {url: 'https://b.png'}, 'https://c.png', null],
      },
    })
    inst.attached()
    expect(inst.data.isViewerShow).toBe(true)
    expect(inst.data.currentImgIndex).toBe(2)
    expect(inst.data.imgs).toEqual([
      {url: 'https://a.png'},
      {url: 'https://b.png'},
      {url: 'https://c.png'},
      {url: ''},
    ])
    // isViewerShow observer 回流 change {value: true}
    expect(inst.eventsOf('change')[0].detail).toEqual({value: true})
  })

  it('show observer：复位索引 → 显隐 → 下一帧 imgsInit（wx.nextTick）', () => {
    vi.useFakeTimers()
    const inst = mountDef(comp.def, {props: {list: ['https://x.png'], initialIndex: 1}})
    inst.setData({show: true})
    expect(inst.data.isViewerShow).toBe(true)
    expect(inst.data.currentImgIndex).toBe(1)
    expect(inst.data.imgs).toEqual([]) // nextTick 尚未执行
    vi.runAllTimers()
    expect(inst.data.imgs).toEqual([{url: 'https://x.png'}])
    expect(inst.eventsOf('change')).toEqual([{name: 'change', detail: {value: true}}])
  })

  it('show observer：关闭 → isViewerShow false 回流 change {value:false}', () => {
    const inst = mountDef(comp.def)
    inst.setData({show: true})
    inst.setData({show: false})
    expect(inst.data.isViewerShow).toBe(false)
    expect(inst.eventsOf('change')[1].detail).toEqual({value: false})
  })

  it('onSwiperChange：索引变化 → setData + change {fromIndex, toIndex}', () => {
    const inst = mountDef(comp.def)
    inst.methods.onSwiperChange.call(inst, {detail: {current: 2}})
    expect(inst.data.currentImgIndex).toBe(2)
    expect(inst.eventsOf('change')).toEqual([
      {name: 'change', detail: {fromIndex: 0, toIndex: 2}},
    ])
  })

  it('onSwiperChange：同帧重复回调（current 未变化）去重', () => {
    const inst = mountDef(comp.def)
    inst.methods.onSwiperChange.call(inst, {detail: {current: 1}})
    inst.methods.onSwiperChange.call(inst, {detail: {current: 1}})
    expect(inst.eventsOf('change')).toHaveLength(1)
  })

  it('onViewerClick：点击任意处关闭（change {value:false} 由 observer 回流）', () => {
    const inst = mountDef(comp.def)
    inst.setData({show: true})
    inst.methods.onViewerClick.call(inst)
    expect(inst.data.isViewerShow).toBe(false)
    expect(inst.eventsOf('change')[1].detail).toEqual({value: false})
  })

  it('noop：可安全调用（wxml 占位处理器）', () => {
    const inst = mountDef(comp.def)
    expect(() => inst.methods.noop.call(inst)).not.toThrow()
  })
})
