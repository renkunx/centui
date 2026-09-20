/**
 * CuIcon 行为清单（自 v2 components/icon spec/源码提取）：
 * 1. 默认渲染 svg sprite（svg=true），class 含 cu-icon / icon-svg / cu-icon-{name} / size
 * 2. svg=false 渲染 icon font（<i>，class 含 icon-font 与 name 本身）
 * 3. name 为空且 svg=false 时不渲染任何元素
 * 4. size/color 分别映射 class 与 style（fill / color）
 * 5. 点击派发 click 事件（svg 与 font 两分支）
 * 6. 首次挂载向 body 注入 svg sprite（幂等），<use> 指向 #name
 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { CuIcon } from '../../src'
import { SPRITE_NODE_ID } from '../../src/components/icon/load-sprite'

describe('CuIcon', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders svg sprite icon by default', () => {
    const wrapper = mount(CuIcon, { props: { name: 'home' } })
    expect(wrapper.element.tagName).toBe('svg')
    expect(wrapper.classes()).toEqual(['cu-icon', 'icon-svg', 'cu-icon-home', 'md'])
    expect(wrapper.html()).toContain('xlink:href="#home"')
  })

  it('renders icon font when svg is false', () => {
    const wrapper = mount(CuIcon, { props: { name: 'arrow', svg: false } })
    expect(wrapper.element.tagName).toBe('I')
    expect(wrapper.classes()).toEqual(['cu-icon', 'icon-font', 'cu-icon-arrow', 'arrow', 'md'])
  })

  it('renders nothing when name is empty in font mode', () => {
    const wrapper = mount(CuIcon, { props: { name: '', svg: false } })
    expect(wrapper.find('i').exists()).toBe(false)
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('maps size to class and color to style', () => {
    const svg = mount(CuIcon, { props: { name: 'home', size: 'lg', color: '#f00' } })
    expect(svg.classes()).toContain('lg')
    expect(svg.attributes('style')).toContain('fill: rgb(255, 0, 0)')

    const font = mount(CuIcon, { props: { name: 'home', svg: false, size: 'sm', color: '#0f0' } })
    expect(font.classes()).toContain('sm')
    expect(font.attributes('style')).toContain('color: rgb(0, 255, 0)')
  })

  it('emits click on svg and font elements', async () => {
    const svg = mount(CuIcon, { props: { name: 'home' } })
    await svg.trigger('click')
    expect(svg.emitted('click')).toHaveLength(1)

    const font = mount(CuIcon, { props: { name: 'home', svg: false } })
    await font.trigger('click')
    expect(font.emitted('click')).toHaveLength(1)
  })

  it('injects svg sprite into body once (idempotent)', () => {
    mount(CuIcon, { props: { name: 'home' } })
    const nodes = document.querySelectorAll(`#${SPRITE_NODE_ID}`)
    expect(nodes).toHaveLength(1)

    mount(CuIcon, { props: { name: 'arrow' } })
    expect(document.querySelectorAll(`#${SPRITE_NODE_ID}`)).toHaveLength(1)
    expect(document.body.querySelector(`#${SPRITE_NODE_ID}`)).not.toBeNull()
  })
})
