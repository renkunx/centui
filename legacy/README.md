# legacy — mand-mobile v2 冻结归档

此目录是 mand-mobile 2.x（Vue 2 版本）的完整源码快照，已停止演进，仅作两个用途：

1. **移植参考**：v3（monorepo，Vue 3 + React）迁移组件时对照原始实现与测试意图
2. **v2 安全维护**：如需给已发布的 mand-mobile@2.x 发关键修复，从此目录检出单独分支操作

- 工具链（webpack 3 / gulp 3 / rollup 0.54 / babel 6 / jest 23）依赖旧版 Node，不再保证可安装构建
- v2 迁移完成后（v3 正式发布前）本目录将从主分支移除，需要时可从 git 历史找回
- 迁移的行为契约基线见 `test/golden/`（基于已发布的 mand-mobile@2.7.0 渲染产出）
