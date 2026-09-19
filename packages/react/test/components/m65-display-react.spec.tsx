/**
 * M6-5 React 行为测试：Bill/ImageViewer/Captcha
 */
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MdBill, MdCaptcha, MdImageViewer } from '../../src'

async function flush(ms = 60) {
  await act(async () => {
    await new Promise(r => setTimeout(r, ms))
  })
}

describe('MdBill', () => {
  it('renders title and no with default structure', () => {
    const { container } = render(
      <MdBill title="借款电子凭证" no={12345689}>
        <p className="bill-detail">¥30,000</p>
      </MdBill>,
    )
    expect(container.querySelector('.md-bill')).not.toBeNull()
    expect(container.querySelector('.md-bill-title')?.textContent).toBe('借款电子凭证')
    expect(container.querySelector('.md-bill-no')?.textContent).toBe('NO.12345689')
    expect(container.querySelector('.md-bill-neck')).not.toBeNull()
    expect(container.querySelector('.bill-detail')).not.toBeNull()
  })

  it('header slot replaces title/no; footer renders', () => {
    const { container } = render(
      <MdBill header={<div className="custom-header">H</div>} footer={<button className="ftr">刷新</button>}>
        内容
      </MdBill>,
    )
    expect(container.querySelector('.custom-header')).not.toBeNull()
    expect(container.querySelector('.md-bill-title')).toBeNull()
    expect(container.querySelector('.md-bill-footer .ftr')).not.toBeNull()
  })
})

describe('MdImageViewer', () => {
  const list = ['https://example.com/a.png', 'https://example.com/b.png']

  it('closed by default; value opens with items', async () => {
    const { container, rerender } = render(<MdImageViewer list={list} />)
    expect(container.querySelector('.md-image-viewer')?.getAttribute('style')).toContain('display: none')
    rerender(<MdImageViewer list={list} value />)
    await flush(80)
    expect(container.querySelector('.md-image-viewer')?.getAttribute('style')).not.toContain('display: none')
    expect(container.querySelectorAll('.viewer-item-wrap')).toHaveLength(2)
    expect(container.querySelector('.viewer-index')?.textContent).toBe('1/2')
  })

  it('initialIndex sets start position at mount', () => {
    const { container } = render(<MdImageViewer list={list} value initialIndex={1} />)
    void container
    const { container: c2 } = render(<MdImageViewer list={list} value initialIndex={1} />)
    expect(c2.querySelector('.viewer-index')?.textContent).toBe('2/2')
  })

  it('viewer click closes', async () => {
    const { container } = render(<MdImageViewer list={list} value />)
    await flush(80)
    fireEvent.click(container.querySelector('.md-image-viewer')!)
    await flush(40)
    expect(container.querySelector('.md-image-viewer')?.getAttribute('style')).toContain('display: none')
  })

  it('object list items pass url/alt', () => {
    const { container } = render(
      <MdImageViewer value list={[{ url: 'https://example.com/x.png', alt: 'X 图' }]} />,
    )
    const img = container.querySelector('.viewer-item-wrap img')
    expect(img?.getAttribute('src')).toBe('https://example.com/x.png')
    expect(img?.getAttribute('alt')).toBe('X 图')
  })
})

describe('MdCaptcha', () => {
  it('inline mode renders content and codebox', async () => {
    const { container } = render(
      <MdCaptcha isView title="输入验证码" brief="已发送" maxlength={4}>
        短信验证码已发送
      </MdCaptcha>,
    )
    await flush(40)
    expect(container.querySelector('.md-captcha-title')?.textContent).toBe('输入验证码')
    expect(container.querySelector('.md-captcha-message')?.textContent).toBe('短信验证码已发送')
    expect(container.querySelector('.md-codebox')).not.toBeNull()
  })

  it('auto countdown starts and resets', async () => {
    vi.useFakeTimers()
    const { container } = render(
      <MdCaptcha isView count={3} countActiveText="重发({$1}s)" countNormalText="重新发送" />,
    )
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    const btn = container.querySelector('.md-captcha-btn') as HTMLButtonElement
    expect(btn.textContent).toBe('重发(3s)')
    expect(btn.disabled).toBe(true)
    await act(async () => {
      vi.advanceTimersByTime(3100)
    })
    expect(btn.textContent).toBe('重新发送')
    vi.useRealTimers()
  })

  it('submit emits code via keyboard entry', async () => {
    const onSubmit = vi.fn()
    const { container } = render(<MdCaptcha isView maxlength={4} onSubmit={onSubmit} />)
    await flush(40)
    // 通过数字键盘依次输入 1/2/3/4
    const keys = container.querySelectorAll('.md-codebox-keyboard .keyboard-number-item span')
    for (const k of ['1', '2', '3', '4']) {
      const key = [...keys].find(s => s.textContent === k)
      await act(async () => {
        fireEvent.click(key!.parentElement ?? key!)
      })
    }
    await flush(40)
    expect(onSubmit).toHaveBeenCalledWith('1234')
  })

  it('setError shows error message', async () => {
    const ref = { current: null as unknown as { setError: (m: string) => void } }
    const { container } = render(<MdCaptcha isView ref={ref as never} />)
    await flush(40)
    ref.current.setError('验证码错误')
    await flush(40)
    expect(container.querySelector('.md-captcha-error')?.textContent).toBe('验证码错误')
  })

  it('halfScreen mode renders popup title bar', () => {
    const { container } = render(<MdCaptcha type="halfScreen" value />)
    expect(container.querySelector('.md-popup-title-bar')).not.toBeNull()
  })
})
