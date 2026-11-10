# @centui/wechat

CentUI 微信小程序版组件库 —— 与 Vue 3 版（`centui`）/ React 版（`@centui/react`）同源：共享 `@centui/styles` 的同一套 stylus 设计令牌与组件样式（构建期编译为 wxss，px→rpx 恒等换算，750 设计稿），组件行为逐一对齐 `packages/vue` 参考实现。

> 移植规范（施工合同）：[PORTING_SPEC.md](./PORTING_SPEC.md)

## 特性

- **51 个组件**与 Vue 版同名同 props 同事件（对账 `packages/vue/src/components` 全量目录，零缺失），另有 10 个结构性支撑组件（check-group/radio-group/check-box/check-list/radio-box/popup-title-bar/swiper-item/tab-pane/license-plate-input/license-plate-keyboard），金融场景完整覆盖
- **同一套设计令牌**：`styles/tokens.wxss` 输出 CSS 变量默认值，页面覆盖 `--color-primary` 等即可换主题（变量可穿透组件样式隔离）
- **750rpx 基准**：与 mand-mobile v2 的 750px 设计稿体系 1:1 对应，跨机型比例与 Web 版一致
- **弹层状态机**：四段类切换 + 定时器真源（不依赖 transitionend），`beforeShow/show/hide` 语义与 Vue 版逐一对齐
- **命令式 API**：`Toast.info(page, '...')`、`Dialog.confirm(page, {...})`、`ActionSheet.create(page, {...})`

## 安装

```bash
npm install @centui/wechat --save
```

小程序开发者工具 → 构建 npm，之后：

```json
{
  "usingComponents": {
    "cu-button": "@centui/wechat/components/button/index",
    "cu-toast": "@centui/wechat/components/toast/index"
  }
}
```

主题定制：在 `app.wxss` 引入一次令牌默认值并覆盖变量：

```css
@import '@centui/wechat/styles/tokens.wxss';
page {
  --color-primary: #ff6b00;
}
```

## 基础库要求

- ≥ 2.28.0（组件启用 `virtualHost`，消除自定义组件包裹节点以保证 flex 布局一致）

## 已知平台差异

各组件 `index.ts` 文件头注释逐条声明（无差异写"无"）。全局层面：

1. 无 SVG DOM：icon 用 iconfont 渲染（Mand-Mobile-Icon 远程字体 + 码点表，颜色走 color 继承）；SMIL 自旋转图标以 CSS 旋转近似。实测开发者工具渲染层不支持 CSS mask-image，故弃用 mask 方案
2. 无 `v-html`：富文本走 `<rich-text nodes>`
3. 无 teleport：弹层渲染在组件位置，`position: fixed` + token 化 z-index
4. 滚动物理为逻辑层 16ms 步进近似（`shared/drag-ticker`），动量参数对齐 core Scroller

## 开发

```bash
pnpm build   # styles → js → verify（四件套/标签配平/wxss 残留/token 同步）
pnpm test    # 逻辑层测试（shared 内核 + 各组件可测逻辑）
```
