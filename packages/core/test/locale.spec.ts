import { afterEach, describe, expect, it } from 'vitest'
import { setLocale, t } from '../src/locale'
import enUS from '../src/locale/lang/en-US'
import zhCN from '../src/locale/lang/zh-CN'

afterEach(() => {
  setLocale(zhCN)
})

describe('locale t()', () => {
  it('translates paths in default zh-CN', () => {
    expect(t('md.date_picker.year')).toBe('年')
    expect(t('md.dialog.confirm')).toBe('确定')
  })

  it('switches language via setLocale', () => {
    setLocale(enUS)
    expect(t('md.date_picker.year')).toBe('Year')
    expect(t('md.dialog.confirm')).toBe('OK')
  })

  it('returns empty string for missing path', () => {
    expect(t('md.not.exist')).toBe('')
    expect(t('md.date_picker')).toBe(zhCN.md.date_picker)
  })

  it('interpolates {key} placeholders with option', () => {
    expect(t('md.captcha.countdown', { $1: 5 })).toBe('{$1}s 后重发') // $ 非 \w，v2 契约不替换
  })

  it('ignores falsy path or option', () => {
    expect(t('')).toBe('')
  })
})
