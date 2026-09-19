import { act, fireEvent, render } from '@testing-library/react'
import { it } from 'vitest'
import { MdCodebox } from '../../src'

it('codebox sync probe', async () => {
  const { container, rerender } = render(<MdCodebox maxlength={4} value="" justify isView autofocus={false} />)
  await act(async () => { await new Promise(r => setTimeout(r, 40)) })
  const input = container.querySelector('form input') as HTMLInputElement
  await act(async () => {
    fireEvent.change(input, { target: { value: '12' } })
  })
  await act(async () => { await new Promise(r => setTimeout(r, 30)) })
  const read = () => [...container.querySelectorAll('.md-codebox-box')].map(b => JSON.stringify(b.textContent)).join(',')
  process.stdout.write(`typed=${read()} input=${input.value}\n`)
  rerender(<MdCodebox maxlength={4} value="" justify isView autofocus={false} />)
  await act(async () => { await new Promise(r => setTimeout(r, 40)) })
  process.stdout.write(`cleared=${read()} input=${(container.querySelector('form input') as HTMLInputElement).value}\n`)
})
