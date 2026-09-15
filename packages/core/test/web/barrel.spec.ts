import { describe, expect, it } from 'vitest'
import * as core from '../../src/index'
import * as coreWeb from '../../src/web'

describe('入口导出完整性', () => {
  it('主入口导出 DOM-free API', () => {
    for (const name of [
      'noop',
      'debounce',
      'throttle',
      'transformCamelCase',
      'randomId',
      'formatValueByGapRule',
      'formatValueByGapStep',
      'trimValue',
      'easeOutCubic',
      'easeInOutCubic',
      'traverse',
      'extend',
      'inArray',
      'isEmptyObject',
      'compareObjects',
      'warn',
      't',
      'setLocale',
      'getLocale',
      'cascade',
      'buildDateColumns',
      'formatDate',
      'getDateColumnGenerators',
    ]) {
      expect(core, `主入口缺少 ${name}`).toHaveProperty(name)
    }
  })

  it('/web 子入口导出浏览器专属 API', () => {
    for (const name of ['mdDocument', 'mdBody', 'render', 'marginRender', 'getDpr', 'Animate', 'Scroller']) {
      expect(coreWeb, `web 子入口缺少 ${name}`).toHaveProperty(name)
    }
  })

  it('主入口不泄漏 web 专属模块', () => {
    expect(core).not.toHaveProperty('Scroller')
    expect(core).not.toHaveProperty('render')
  })
})
