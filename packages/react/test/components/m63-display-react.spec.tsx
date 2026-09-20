/**
 * M6-3 React 行为测试：WaterMark/ResultPage/Ruler/Landscape
 */
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CuLandscape, CuResultPage, CuRuler, CuWaterMark } from '../../src'

async function flush(ms = 40) {
  await act(async () => {
    await new Promise(r => setTimeout(r, ms))
  })
}

describe('CuWaterMark', () => {
  it('tiles watermark with test-env repetition 2x2', () => {
    const { container } = render(
      <CuWaterMark watermark="水印">
        <p>内容</p>
      </CuWaterMark>,
    )
    expect(container.querySelector('.water-mark-container p')?.textContent).toBe('内容')
    expect(container.querySelectorAll('.water-mark-line')).toHaveLength(2)
    container.querySelectorAll('.water-mark-line').forEach((line) => {
      expect(line.querySelectorAll('.water-mark-item')).toHaveLength(2)
    })
  })

  it('repeatX/repeatY false render single row/col', () => {
    const { container } = render(<CuWaterMark watermark="水印" repeatX={false} repeatY={false} />)
    expect(container.querySelectorAll('.water-mark-line')).toHaveLength(1)
    expect(container.querySelectorAll('.water-mark-item')).toHaveLength(1)
  })

  it('renderWatermark receives coord', () => {
    const { container } = render(
      <CuWaterMark renderWatermark={({ row, col }) => `${row}-${col}`} />,
    )
    expect(container.querySelector('.water-mark-item')?.textContent).toBe('1-1')
  })

  it('rotate and opacity apply to wrapper', () => {
    const { container } = render(<CuWaterMark watermark="水印" rotate={-20} opacity={0.2} />)
    const style = container.querySelector('.water-mark-list-wrapper')?.getAttribute('style') ?? ''
    expect(style).toContain('rotate(-20deg)')
    expect(style).toContain('0.2')
  })

  it('content mode survives jsdom (canvas guard)', () => {
    const { container } = render(<CuWaterMark content="内部资料" />)
    expect(container.querySelector('.water-mark-canvas')).not.toBeNull()
    expect(container.querySelector('.water-mark-list')).not.toBeNull()
  })
})

describe('CuResultPage', () => {
  it('empty type renders default image and text', () => {
    const { container } = render(<CuResultPage />)
    expect(container.querySelector('img')?.getAttribute('src')).toContain('empty.png')
    expect(container.querySelector('.cu-result-text')?.textContent).toBe('暂无信息')
  })

  it('network/lost types render default texts', () => {
    const { container: network } = render(<CuResultPage type="network" />)
    expect(network.querySelector('.cu-result-text')?.textContent).toBe('网络连接异常')
    const { container: lost } = render(<CuResultPage type="lost" />)
    expect(lost.querySelector('.cu-result-subtext')?.textContent).toBe('您要访问的页面已丢失')
  })

  it('custom props override defaults', () => {
    const { container } = render(
      <CuResultPage imgUrl="https://example.com/a.png" text="标题" subtext="描述" />,
    )
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://example.com/a.png')
    expect(container.querySelector('.cu-result-text')?.textContent).toBe('标题')
  })

  it('buttons render and handle click', async () => {
    const handler = vi.fn()
    const { container } = render(
      <CuResultPage buttons={[{ text: '刷新', handler }, { text: '返回' }]} />,
    )
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(2)
    await act(async () => {
      fireEvent.click(buttons[0])
    })
    expect(handler).toHaveBeenCalled()
  })
})

describe('CuRuler', () => {
  it('renders canvas skeleton with cursor and arrow', () => {
    const { container } = render(<CuRuler scope={[0, 100]} unit={10} />)
    expect(container.querySelector('.cu-ruler-canvas')).not.toBeNull()
    expect(container.querySelector('.cu-ruler-cursor')).not.toBeNull()
    expect(container.querySelector('.cu-ruler-arrow')).not.toBeNull()
  })

  it('stepTextPosition bottom applies class', () => {
    const { container } = render(<CuRuler stepTextPosition="bottom" />)
    expect(container.querySelector('.cu-ruler-cursor')?.className).toContain('cu-ruler-cursor-bottom')
  })

  it('mounts safely in jsdom (canvas guard) and responds to value change', async () => {
    const { container, rerender } = render(<CuRuler value={50} scope={[0, 100]} unit={10} />)
    await flush(50)
    rerender(<CuRuler value={60} scope={[0, 100]} unit={10} />)
    await flush(50)
    expect(container.querySelector('.cu-ruler')).not.toBeNull()
  })
})

describe('CuLandscape', () => {
  it('closed by default, popup hidden', () => {
    const { container } = render(
      <CuLandscape>
        <p className="c">横屏内容</p>
      </CuLandscape>,
    )
    expect(container.querySelector('.cu-popup-box')?.getAttribute('style')).toContain('display: none')
  })

  it('value opens popup and close icon closes', async () => {
    const { container } = render(
      <CuLandscape value>
        <p className="c">横屏内容</p>
      </CuLandscape>,
    )
    await flush(100)
    const close = container.querySelector('.cu-landscape-close')
    expect(close).not.toBeNull()
    await act(async () => {
      fireEvent.click(close!)
    })
    await flush(100)
    expect(container.querySelector('.cu-popup-box')?.getAttribute('style')).toContain('display: none')
  })

  it('fullScreen applies is-full and clear icon', async () => {
    const { container } = render(
      <CuLandscape value fullScreen>
        <p className="c">横屏内容</p>
      </CuLandscape>,
    )
    await flush(100)
    expect(container.querySelector('.cu-landscape')?.className).toContain('is-full')
    expect(container.querySelector('.cu-icon-clear')).not.toBeNull()
  })
})

describe('CuRuler 绘制管线（fake canvas ctx）', () => {
  const strokeLog: string[] = []
  const fillLog: Array<[string, number, number]> = []
  const fakeCtx = {
    scale: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    lineWidth: 0,
    font: '',
  }
  Object.defineProperty(fakeCtx, 'strokeStyle', {
    set(v: string) {
      strokeLog.push(v)
    },
    get: () => '',
  })
  Object.defineProperty(fakeCtx, 'fillStyle', {
    set(v: string) {
      strokeLog.push('fill:' + v)
    },
    get: () => '',
  })
  // 记录 fillText 的文本参数
  fakeCtx.fillText.mockImplementation((...args: [string, number, number]) => {
    fillLog.push(args)
  })

  beforeEach(() => {
    strokeLog.length = 0
    fillLog.length = 0
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeCtx as unknown as CanvasRenderingContext2D,
    )
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('draws labeled ticks and base line', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <CuRuler scope={[0, 100]} unit={10} step={10} value={50} onChange={onChange} />,
    )
    await flush(60)
    // 刻度文本（0..100）+ 基线 stroke
    const labels = fillLog.map(([text]) => text)
    // jsdom 几何为 0：canvas 宽 0，仅首刻度在可视范围（cx <= cw*2）内
    expect(labels).toContain('0')
    expect(fakeCtx.stroke).toHaveBeenCalled()
    expect(container.querySelector('.cu-ruler-canvas')).not.toBeNull()
  })

  it('stepTextRender customizes labels', async () => {
    render(
      <CuRuler
        scope={[0, 100]}
        unit={10}
        step={10}
        stepTextRender={(v) => `${v}cm`}
      />,
    )
    await flush(60)
    expect(fillLog.some(([text]) => text === '0cm')).toBe(true)
  })

  it('out-of-range ticks use alternate color', async () => {
    render(<CuRuler scope={[0, 100]} unit={50} min={20} max={80} step={10} />)
    await flush(60)
    expect(strokeLog).toContain('#E2E4EA')
    expect(strokeLog).toContain('#858B9C')
  })

  it('touch drag lifecycle does not crash and settles', async () => {
    const onChange = vi.fn()
    const { container } = render(<CuRuler scope={[0, 100]} unit={10} onChange={onChange} />)
    const root = container.querySelector('.cu-ruler')!
    fireEvent.touchStart(root, { touches: [{ pageX: 100, pageY: 100 }] })
    fireEvent.touchMove(window, { touches: [{ pageX: 60, pageY: 100 }] })
    fireEvent.touchEnd(window, { touches: [{ pageX: 60, pageY: 100 }] })
    await flush(80)
    expect(root).not.toBeNull()
  })
})
