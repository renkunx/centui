/**
 * 轻量 i18n（自 v2 _locale 迁移，不依赖任何 i18n 框架）。
 * v2 契约：路径用 '.' 分段、顶层命名空间固定为 'md'（迁移兼容承诺，不做改名）；
 * {$1} 之类的非 \w 占位符不做插值。
 */
import defaultLang from './lang/zh-CN'

export type LocaleMessage = { [key: string]: string | LocaleMessage }
export type LocalePack = { md: LocaleMessage }

/** 内置语言包：经包主入口导出，setLocale(enUS) 即可切换，无需手写语言包 */
export { default as zhCN } from './lang/zh-CN'
export { default as enUS } from './lang/en-US'
export { default as esMX } from './lang/es-MX'

let lang: LocalePack = defaultLang

function template(str: string, option: Record<string, string | number> | undefined): string {
  if (!str || !option) {
    return str
  }
  return str.replace(/\{(\w+)\}/g, (match, key: string) => {
    return String(option[key] ?? match)
  })
}

/**
 * 翻译指定路径。
 * 返回类型：字符串叶子返回插值后的 string；路径命中非字符串子树时按 v2 契约
 * 原样返回该子树（LocaleMessage）；路径不存在返回 ''。
 */
export const t = (path: string, option?: Record<string, string | number>): string | LocaleMessage => {
  let value: string | LocaleMessage | undefined
  const array = path.split('.')
  let current: LocaleMessage | LocalePack = lang
  for (let i = 0, j = array.length; i < j; i++) {
    const property = array[i]
    value = (current as LocaleMessage)[property]
    if (i === j - 1) {
      if (typeof value === 'string') {
        return template(value, option)
      }
      // v2 契约：非字符串叶子（整个子树）原样返回
      return value == null ? '' : value
    }
    if (value == null) {
      return ''
    }
    current = value as LocaleMessage
  }
  return ''
}

export const setLocale = (locale?: LocalePack): void => {
  if (locale) {
    lang = locale
  }
}

export const getLocale = (): LocalePack => lang

export default { setLocale, t }
