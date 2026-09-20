/**
 * CuSkeleton 行为清单（自 v2 components/skeleton spec/源码提取）：
 * 1. loading=true 渲染骨架（avatar + title + row 行）；false 渲染默认插槽
 * 2. avatarSize lg/sm 修饰类
 * 3. titleWidth 数字→百分比、字符串原样
 * 4. rowWidth 数字/字符串/数组（数字→百分比），最后一行固定 60%
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { CuSkeleton } from '../../src'

describe('CuSkeleton', () => {
  it('renders skeleton rows when loading and slot otherwise', async () => {
    const wrapper = mount(CuSkeleton, {
      props: { loading: true, row: 3 },
      slots: { default: '<p>内容</p>' },
    })
    expect(wrapper.findAll('.cu-skeleton-row')).toHaveLength(3)
    expect(wrapper.find('p').exists()).toBe(false)

    await wrapper.setProps({ loading: false })
    expect(wrapper.find('.cu-skeleton').exists()).toBe(false)
    expect(wrapper.find('p').text()).toBe('内容')
  })

  it('renders avatar with size modifiers', () => {
    const lg = mount(CuSkeleton, { props: { avatar: true, avatarSize: 'lg' } })
    expect(lg.find('.cu-skeleton-avatar-large').exists()).toBe(true)

    const sm = mount(CuSkeleton, { props: { avatar: true, avatarSize: 'sm' } })
    expect(sm.find('.cu-skeleton-avatar-small').exists()).toBe(true)
  })

  it('renders title with numeric or string width', () => {
    const numeric = mount(CuSkeleton, { props: { title: true, titleWidth: 60 } })
    expect(numeric.find('.cu-skeleton-title').attributes('style')).toContain('width: 60%')

    const str = mount(CuSkeleton, { props: { title: true, titleWidth: '120px' } })
    expect(str.find('.cu-skeleton-title').attributes('style')).toContain('width: 120px')
  })

  it('renders row widths with last row fixed at 60%', () => {
    const wrapper = mount(CuSkeleton, {
      props: { row: 3, rowWidth: [100, '80%', 30] },
    })
    const rows = wrapper.findAll('.cu-skeleton-row')
    expect(rows[0].attributes('style')).toContain('width: 100%')
    expect(rows[1].attributes('style')).toContain('width: 80%')
    expect(rows[2].attributes('style')).toContain('width: 60%')
  })

  it('falls back to 100% for unprovided array entries except last row', () => {
    const wrapper = mount(CuSkeleton, { props: { row: 3, rowWidth: ['50%'] } })
    const rows = wrapper.findAll('.cu-skeleton-row')
    expect(rows[0].attributes('style')).toContain('width: 50%')
    expect(rows[1].attributes('style')).toContain('width: 100%')
    expect(rows[2].attributes('style')).toContain('width: 60%')
  })
})
