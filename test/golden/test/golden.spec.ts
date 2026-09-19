import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { scenarios } from './scenarios'

const GOLDEN_DIR = join(dirname(fileURLToPath(import.meta.url)), '../golden')
const UPDATE = process.env.GOLDEN_UPDATE === '1'

/** 规范化：折叠标签间空白与连续空白；其余由 Vue 2 渲染器确定性保证。
 * input 的 name 属性为 randomId 产物（每次渲染随机），采集与对比均剥离。 */
function normalize(html: string): string {
  return html
    .replace(/(<input[^>]*?)\sname="[^"]*"/g, '$1')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim()
}

describe('L3 golden 基线（mand-mobile@2.7.0 渲染契约）', () => {
  for (const [component, list] of Object.entries(scenarios)) {
    describe(component, () => {
      for (const scenario of list) {
        it(scenario.name, async () => {
          const wrapper = mount(scenario.component as never, {
            propsData: scenario.props,
            slots: scenario.slots as never,
          })
          // 等渲染队列与定时器初始化落定后再截取（与 v3 对比端同语义）
          await new Promise(r => setTimeout(r, 30))
          const html = normalize(wrapper.html())
          const file = join(GOLDEN_DIR, component, `${scenario.name}.html`)

          if (UPDATE || !existsSync(file)) {
            mkdirSync(dirname(file), { recursive: true })
            writeFileSync(file, html + '\n')
            if (UPDATE) {
              return
            }
          }

          expect(html).toBe(readFileSync(file, 'utf8').trim())
        })
      }
    })
  }
})
