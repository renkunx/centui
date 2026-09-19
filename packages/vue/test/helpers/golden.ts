import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** L3 基线根目录：直接复用 test/golden 由 mand-mobile@2.7.0 渲染的契约 */
export const GOLDEN_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../..',
  'test/golden/golden',
)

export function readGolden(component: string, scenario: string): string {
  return readFileSync(join(GOLDEN_ROOT, component, `${scenario}.html`), 'utf8')
}

/**
 * Vue2 → Vue3 已知渲染器差异的等价规范化（对基线与实际输出同样适用）：
 *
 * 1. 注释节点：Vue2 占位渲染 `<!---->`、Vue3 渲染 `<!--v-if-->`，模板注释仅 Vue3 保留 → 一律移除
 * 2. 文本节点与标签边界空白：Vue2 保留单空格、Vue3 condense 策略移除 → 统一剥除
 * 3. boolean attribute 值：Vue2 `disabled="disabled"`、Vue3 `disabled=""`/`checked="true"` → 统一空值
 * 4. 空 style：仅单侧渲染 `style=""` → 统一剥除
 * 5. input 的 value attribute：Vue2 只设 DOM property，Vue3+jsdom 会反射 attribute → 移除（值由 L2 行为测试断言）
 * 6. class 令牌顺序：Vue2 把 fallthrough class 插在静态与绑定 class 之间，Vue3 追加在末尾 → 排序比较
 * 7. 属性顺序：Vue2 将 style/class 后置，Vue3 按模板顺序 → 标签内属性按名排序（HTML 属性顺序无语义）
 * 8. VTU v1 采集 v2 基线时的 <transition-stub> 包装（真实 DOM 无此元素）与 scoped 的
 *    data-v-<hash>（v3 样式走全局 CSS，无 scoped）→ 一律移除
 * 9. input 的 name 属性：v2 基线采集时 randomId 产物为随机值（不可复现）→ 剥离
 */
export function normalizeForCompare(html: string): string {
  return html
    .replace(/<!--.*?-->/g, '')
    .replace(/<\/?transition-stub[^>]*>/g, '')
    .replace(/\s*data-v-[0-9a-f]+=""/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .replace(/>\s+/g, '>')
    .replace(/\s+</g, '<')
    .replace(/([:a-zA-Z-]+)="\1"/g, '$1=""')
    .replace(/([:a-zA-Z-]+)="true"/g, '$1=""')
    .replace(/\s*style=""/g, '')
    .replace(/(<input[^>]*?)\svalue="[^"]*"/g, '$1')
    .replace(/(<input[^>]*?)\sname="[^"]*"/g, '$1')
    // 10. 动态 transform：scroller/进度动画写入的 -webkit-transform / transform 内联声明
    //     属运行时几何状态（jsdom 几何为 0），非结构契约 → 剥离
    .replace(/\s*-webkit-transform:[^;"]*;?/g, '')
    .replace(/([\s;"])transform:[^;"]*;?/g, '$1')
    .replace(/style="([^"]*)"/g, (_m, v: string) => {
      const cleaned = v.replace(/\s+/g, ' ').replace(/^[\s;]+|[\s;]+$/g, '')
      return cleaned ? `style="${cleaned}"` : ''
    })
    .replace(/class="([^"]*)"/g, (_m, cls: string) => {
      const tokens = cls.split(/\s+/).filter(Boolean).sort()
      return `class="${tokens.join(' ')}"`
    })
    .replace(
      /<([a-zA-Z][\w-]*)((?:\s+[:\w-]+="[^"]*")*)\s*(\/?)>/g,
      (_m, tag: string, attrs: string, selfClose: string) => {
        const list: string[] = []
        const re = /([:\w-]+)="([^"]*)"/g
        let match: RegExpExecArray | null
        while ((match = re.exec(attrs))) {
          list.push(`${match[1]}="${match[2]}"`)
        }
        list.sort()
        return `<${tag}${list.length ? ` ${list.join(' ')}` : ''}${selfClose}>`
      },
    )
    .trim()
}
