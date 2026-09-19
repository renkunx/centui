import { act, fireEvent, render } from '@testing-library/react'
import { it } from 'vitest'
import { MdCaptcha } from '../../src'

it('probe final', async () => {
  const { container, rerender } = render(<MdCaptcha isView maxlength={4} />)
  await act(async () => { await new Promise(r => setTimeout(r, 60)) })
  const input = container.querySelector('form input') as HTMLInputElement
  await act(async () => {
    fireEvent.change(input, { target: { value: '12' } })
  })
  await act(async () => { await new Promise(r => setTimeout(r, 40)) })
  const read = () => [...container.querySelectorAll('.md-codebox-box')].map(b => JSON.stringify(b.textContent)).join(',')
  process.stdout.write(`typed=${read()} inputVal=${input.value}\n`)
  rerender(<MdCaptcha isView maxlength={4} value />)
  await act(async () => { await new Promise(r => setTimeout(r, 150)) })
  const input2 = container.querySelector('form input') as HTMLInputElement
  process.stdout.write(`true-read=${read()} inputVal=${input2.value} filled=${container.querySelectorAll('.md-codebox-box.is-filled').length}\n`)
})
