# L4 e2e / 视觉回归

Playwright 驱动 `test/visual/app`（`@centui/e2e`）提供的双框架场景页：

- `/vue.html#/<page>` — Vue 3（`centui`）
- `/react.html#/<page>` — React（`@centui/react`）

场景页依赖 workspace dist，运行前先 `pnpm build`（根 build 已包含本包）。

## 结构

- `app/` — 场景页应用（单 vite 服务双入口；freeze.css 把动画压到 1ms 保留生命周期事件）
- `app/src/shared.ts` — 双框架共用的场景清单（stable 截图 / interactive 交互）
- `specs/interaction.spec.ts` — 双框架行为契约（弹层开合、表单回显、事件回调）
- `specs/appearance.spec.ts` — 稳定场景截图基线（0.1% 像素容差）
- `specs/screenshots/` — 基线（变更须随 PR 显式提交，与 L3 golden 同策略）

## 常用命令

```bash
pnpm test:visual                        # 全量（交互 + 截图比对）
npx playwright test interaction         # 仅交互契约
npx playwright test appearance          # 仅截图比对
PLAYWRIGHT_UPDATE=1 npx playwright test appearance --update-snapshots  # 更新基线
```
