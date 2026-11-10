# @centui/wechat 组件移植规范

本文档是批量移植代理的施工合同。目标：把 `packages/vue`（mand-mobile v2 血统）的每个组件移植为微信小程序原生组件，**功能与样式与 Vue/React 版完全一致**；平台无法等价实现的点必须在组件文件头注释中显式声明差异。

参考实现：`src/components/button`、`src/components/popup`、`src/components/toast`、`src/components/icon`（基建阶段由核心成员完成，是唯一权威范例）。动手前先完整读完对应范例和本规范。

---

## 1. 目录与四件套

每个组件一个目录 `src/components/<name>/`，`<name>` 与 Vue 版组件目录名完全一致（如 `cell-item`、`number-keyboard`）：

| 文件 | 来源 | 说明 |
| --- | --- | --- |
| `index.ts` | 手写 | 组件逻辑（TS，构建期 esbuild 转译为 CJS `index.js`） |
| `index.json` | 手写 | `{"component": true, "styleIsolation": "apply-shared", "usingComponents": {...}}` |
| `index.wxml` | 手写 | 模板 |
| `index.wxss` | **不要手写** | 构建期从 `packages/styles/src/components/<name>.styl` 编译生成 |

样式源缺失时（极少数）在 `packages/styles/src/components/` 补齐 styl（对照 legacy），再走构建。绝不在组件里手写样式。

## 2. 组件声明模板

```ts
import {CuComponent} from '../../shared/component'

CuComponent({
  options: { addGlobalClass: true, virtualHost: true, multipleSlots: true },
  externalClasses: ['cu-class'],
  properties: { /* 见 §3 */ },
  data: {},
  methods: {},
})
```

- `CuComponent` 是 `shared/component.ts` 里对 `Component()` 的轻封装：统一注入 `styleIsolation` 默认值、debug 日志开关；不得绕开它直接调 `Component()`（弹层基类除外，可传第二个参数覆盖）。
- `multipleSlots: true`：只要有具名插槽就开；`virtualHost: true`：所有组件统一开启（消除自定义组件包裹节点，保证 flex 布局与 Vue 版一致）。基础库要求 ≥ 2.28，README 声明。
- 事件命名用 **camelCase**（`triggerEvent('change')`、`triggerEvent('maskClick')`），与 Vue 版 emits 同名同载荷。用户侧 `bind:change` / `bind:maskClick` 均可。

## 3. props / events / slots 映射规则

1. **properties**：与 Vue 版 props 一一同名。类型映射：`Boolean → Boolean`、`Number → Number`、`String → String`、`Array/Object → Object`（构造器限制），`optionalTypes` 可用则用于联合。默认值与 Vue 版 `withDefaults` 严格一致。
2. **双向值**：Vue 的 `v-model`（`modelValue`/`update:modelValue`）映射为 `value` property + `triggerEvent('change', v)`；弹层类 Vue 用 `modelValue` 控制显隐的，映射为 `show` property + `triggerEvent('change', boolean)` + `triggerEvent('maskClick')`。组件内部**绝不**直接改写传入的 property——只 emit，由外部回写（受控优先）；同时支持"非受控"：外部不回写时内部 `data.innerValue` 兜底，逻辑写在 `shared/controlled.ts` 的 `useControlled` 行为里（参照 toast/dialog 用法）。
3. **emits 语义保持**：Vue 版的 `show/hide/beforeShow/beforeHide` 等事件在小程序里 `triggerEvent('show')` 等，触发时机必须与 Vue 版逐一对齐（尤其弹层：before-show 在动画前、show 在动画后）。
4. **slots**：Vue 具名插槽 → `<slot name="xxx"/>`（同名）；默认插槽 → `<slot/>`；作用域插槽（如 scroll-view 的 pull 槽）→ 小程序无作用域插槽，改为通过 `slot` + `props` 传参或暴露 `this.selectComponent` API，文件头注释声明差异。
5. **平台能力事件**：`@click` → `bind:tap`；`touchstart/move/end` → `bind:touchstart` 等（需要 preventDefault 阻滚动穿透的一律用 `catch:touchmove`——小程序 catch 前缀自带 preventDefault 语义，不存在 passive 问题）。

## 4. 样式管线（构建期，代理无需关心细节，但需理解约束）

- `scripts/build-styles.mjs` 用 stylus 渲染 `packages/styles/src/components/<name>.styl`（注入 theme.components/basic/util/variable 四个 mixin，与主包 build 一致），编译产物做 `px → rpx` **恒等换算**（token 体系是 750px 设计稿，rpx 也是 750 屏宽，1px = 1rpx；`0px`、百分比、`vh/vw` 不动）。
- 产物头部自动注入 `@import "../../styles/tokens.wxss";`（CSS 变量默认值）。**组件 wxss 内不得再写颜色/字号字面量**，一律使用 token 变量名（stylus 源里已经如此）。
- `:root` 在小程序无效，构建期替换为 `page`。CSS 变量可穿透组件样式隔离继承——主题定制方式与 Vue/React 版一致（页面覆盖 `--color-primary` 等）。
- 过渡类（`cu-slide-up-*` 等 Vue transition 约定）由 `transition.styl` 提供，弹层组件通过 `shared/transition.ts` 的状态机驱动（§5），这些类会随组件样式一起编译进用到的组件。
- 组件间依赖样式（如 button 内嵌 activity-indicator 的 `.cu-activity-indicator-svg`）：构建期把被依赖组件的 styl 一并编入（`scripts/build-styles.mjs` 里有 DEP_STYLES 表，新增依赖时同步登记）。

## 5. 弹层与过渡：shared/transition.ts 状态机（关键）

小程序没有 `<transition>`/`transitionend`。统一用 `shared/transition.ts`（popup 范例即用例）：

```
enter:  加 `cu-<name>-enter cu-<name>-enter-active` → 双 rAF 后移除 `-enter` →
        时长定时器（从构建生成的 styles/transition-meta.js 查表）后清理全部类 → triggerEvent('show')
leave:  加 `cu-<name>-leave-to cu-<name>-leave-active` → 定时器后隐藏节点、清类 → triggerEvent('hide')
```

铁律（React 版 P0 事故的教训）：
1. **时长定时器是唯一的真源**，不依赖任何 end 事件；无动画（duration 0）时立即触发。
2. 动画锁 `isAnimation` 期间再次 show 走 50ms 重试（对齐 Vue 版）；定时器在 `detached` 全部清理。
3. `before-show/before-hide` 在启动过渡时触发，`show/hide` 在定时器回调里触发。
4. 遮罩滚动穿透用 `catchtouchmove`（wxml 遮罩节点）+ `wx.pageScrollTo` 不需要；不要试图监听页面滚动。
5. 弹层根节点用 `position: fixed` + `z-index`（token `popup-zindex` 等），**不再有 teleport**——组件渲染在页面内。z-index 层级表集中在 tokens（`--cu-z-*`），不得散写数字。
6. **relations 一律用 `descendant`/`ancestor`，禁用 `child`**：基础库 3.8 实测，`child` 在「子组件由页面模板引用」（父子不在同一 usingComponents 声明树）时 relation 匹配使渲染层静默崩溃（整页空白、无报错）；`descendant` 语义覆盖且无此问题。
7. **具名插槽不可放在 `wx:for` 内**：单实例同名 slot 非法（基础库逐项告警且仅首个生效）。逐项定制场景改走 `custom` 布尔 + 默认插槽整树替换（steps 先例）。

## 6. 命令式 API（Toast / Dialog / ActionSheet / Tip）

小程序无法动态挂载组件，采用 Vant Weapp 惯例（toast 范例）：

```ts
import {Toast} from '../../components/toast/index'
Toast.info(this, '已保存')            // this = 页面/组件实例
Toast.loading(this, '加载中')
Toast.clear(this)
```

- 约定页面 wxml 放置 `<cu-toast id="cu-toast" />`（默认 selector `#cu-toast`），工厂函数第一参数为 context（页面或任一组件实例，用于 `selectComponent`），可传 `{context, selector}` 覆盖。
- `Dialog.confirm(context, options): Promise<void>`、`Dialog.alert(context, options)`、`ActionSheet.create(context, options): Promise<{index, text}|{cancel:true}>`——Promise 语义与 Vue 版一致。
- 组件必须暴露 `show/hide` 方法（`this.selectComponent('#cu-dialog').show(opts)` 直用也是一等 API）。

## 7. 父子组件关系（field/field-item、check-group、radio-list、steps、tabs 等）

Vue 的 provide/inject 登记 → 小程序 `relations`：

```ts
// 父
relations: {'../field-item/index': {type: 'descendant', linked(t){...}, unlinked(t){...}}}
// 子
relations: {'../field/index': {type: 'ancestor'}}
```

- 子组件登记顺序、index 分配、父控子（如 check-group 的 toggleAll、steps 的 progress 分发）语义与 Vue 版一致；子被销毁（detached）必须解除登记。
- 跨层（爷爷孙）关系不要用 relations 传递，改由父组件收集后再分发给直接子级。

## 8. 平台能力映射表

| Vue/Web 版 | 小程序版 |
| --- | --- |
| `v-html`（Dialog.content、ActionSheet 项文本等） | `<rich-text nodes="{{html}}"/>`（nodes 接受 HTML 字符串）；纯文本场景直接插值 |
| Icon SVG sprite + `<use>` | **iconfont**（icon.styl 自带 Mand-Mobile-Icon 码点表；字体 base64 内嵌进 icon.wxss——@font-face 的 src 里 var() 不解析且渲染层不支持 mask-image，均为实测结论）；`svg` prop 保留但成为 no-op，注释声明 |
| `window`/`document`/`getComputedStyle` | 禁用。尺寸用 `createSelectorQuery().in(this)`，节点信息异步获取并缓存；几何计算同步完成的假设必须消除（Swiper React 版教训：mount 时先量真实尺寸再定位） |
| 滚动物理引擎 `@centui/core/web` Scroller | **禁止直接使用**（依赖 DOM）。picker/ruler/swiper 用 `shared/drag-ticker` 惯性内核（逻辑层模拟，setData 节流 16ms）或 `scroll-view`（enhanced）实现；动量参数尽量对齐 core（decelerationRate 0.95/帧），差异在文件头注释声明 |
| `Animate`（数值动画） | `shared/ticker.ts`（逻辑层 rAF 模拟，`wx.nextTick` + setTimeout 16ms），供 amount/progress/steps 用 |
| localStorage / 内存单例 | `wx.setStorageSync`/内存；命令式单例（Toast 容器表）按 context 弱缓存 |
| 图片选择（image-reader） | `wx.chooseMedia` + `wx.compressImage`；回调载荷字段名与 Vue 版一致（name/file/url/base64），base64 用 `wx.getFileSystemManager().readFile(encoding:'base64')` |
| Canvas（water-mark/chart） | Canvas 2D 新接口（`type="2d"`），`createSelectorQuery().in(this).select('#cv').fields({node,size})`；dpr 取 `wx.getWindowInfo().pixelRatio` |
| 计时器 | 统一走 `shared/timer.ts` 包装（登记/清理），`detached` 必须全量清理——与 Vue/React 版修复后的标准一致 |
| IME 组合（input-item/textarea-item） | `bind:compositionstart/end`（input 组件支持），组字期不格式化不回写，对齐 Vue 版修复 |

## 9. 禁止事项

- 禁止 `require('@centui/core')` 运行时引用——core 由构建期打进 `dist/common/`；组件源码里 `import {formatValue} from '@centui/core'` 构建脚本会改写为相对路径（esbuild alias），代理照常 import 即可，但**只准用 DOM-free 主入口**（`@centui/core`），`/web` 子入口一律禁用。
- 禁止在 wxss 手写颜色/尺寸字面量、z-index 数字（用 token）。
- 禁止 `setData` 传函数、大对象（>256KB）、每帧全量 data；滚动类高频 setData 只传 `transform` 所需的最小字段，并 16ms 节流。
- 禁止在 properties observer 里做重活（几何测量等移到 lifetimes ready 之后的异步链）。
- 禁止 git commit；禁止改动 packages/wechat 之外的任何文件（styles 源缺失补 styl 的情形除外，须在报告注明）。

## 10. 每个组件的完成定义（DoD）

1. 四件套齐全，`index.ts` 文件头有块注释：`Source: packages/vue/src/components/<name>/<X>.vue`、映射的 props/events/slots 清单、已知差异（无差异写"无"）。
2. props 默认值、事件名与载荷、插槽语义与 Vue 版逐一对照过（读 Vue 源核对，不凭记忆）。
3. 过 Vue/React 版相关单测覆盖的行为点（如 amount 格式化边界、stepper clamp），在小程序侧有 `tests/logic/<name>.spec.ts` 纯逻辑测试（可测部分：格式化、状态机、键盘布局、clamp）。
4. 本地跑 `node scripts/verify.mjs --only <name>` 通过：四件套齐全、json 合法、wxml 标签配平、wxml 绑定的 properties/methods 在 ts 中存在、事件 triggerEvent 声明与文档一致、wxss 无 px 残留/无字面量颜色、require 路径可解析。
5. 在报告中列出：组件名、文件清单、与 Vue 版的差异点（或"无"）、测试数。

## 11. 批次与风险分层

- **低风险（展示类）**：tag、agree、activity-indicator、progress、skeleton、detail-item、bill、action-bar、notice-bar、landscape、steps、field、cell-item、field-item、detail-item、icon、button
- **中风险（表单/受控）**：check、radio、radio-list、switch、stepper、input-item、textarea-item、codebox、agree、selector、drop-menu、image-viewer、tab-picker
- **高风险（弹层/命令式）**：popup、dialog、toast、action-sheet、tip、captcha、cashier、number-keyboard、license-plate
- **最高风险（滚动/平台）**：picker、date-picker、scroll-view、swiper、tabs、slider、ruler、image-reader、water-mark、chart、transition（工具型，包装 shared/transition）

拿不准的实现选择，按"Vue 版行为 > 平台惯例"裁决，并在文件头差异注释里说明。
