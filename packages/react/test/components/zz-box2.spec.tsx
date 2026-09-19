import { act, fireEvent, render } from '@testing-library/react'
import { it } from 'vitest'
import { MdCaptcha } from '../../src'

it('probe clear with wiring', async () => {
  const { container, rerender } = render(<MdCaptcha isView maxlength={4} />)
  await act(async () => { await new Promise(r => setTimeout(r, 60)) })
  const input = container.querySelector('form input') as HTMLInputElement
  await act(async () => {
    fireEvent.change(input, { target: { value: '12' } })
  })
  await act(async () => { await new Promise(r => setTimeout(r, 40)) })
  const read = () => [...container.querySelectorAll('.md-codebox-box')].slice(0, 4).map(b => JSON.stringify(b.textContent)).join(',')
  process.stdout.write(`typed=${read()} inputVal=${(input as HTMLInputElement).value}\n`)
  rerender(<MdCaptcha isView={false} maxlength={4} />)
  await act(async () => { await new Promise(r => setTimeout(r, 60)) })
  process.stdout.write(`false=${read()}\n`)
  rerender(<MdCaptcha isView maxlength={4} />)
  await act(async () => { await new Promise(r => setTimeout(r, 120)) })
  process.stdout.write(`true=${read()} inputVal=${(container.querySelector('form input') as HTMLInputElement).value}\n`)
})
