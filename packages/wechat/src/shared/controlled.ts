/**
 * 受控/非受控双模的标准姿势（小程序没有 v-model，双方协议如下）：
 *
 *   组件内部状态 current 由 property observer 同步；
 *   用户交互时「乐观更新 + emit」——非受控方（不监听 change）也能看到即时效果，
 *   受控方回写 property 后 observer 以最终值为准覆盖乐观值。
 *
 *   // methods:
 *   onTap() {
 *     const next = ...
 *     optimisticUpdate(this, {current: next}, 'change', {value: next})
 *   }
 *   // observers:
 *   value(v) { this.setData({current: v}) }
 */
type Ctx = {
  setData(patch: Record<string, unknown>): void
  triggerEvent(name: string, payload?: unknown): void
}

export function optimisticUpdate(
  ctx: Ctx,
  dataPatch: Record<string, unknown>,
  event: string,
  payload: unknown,
): void {
  ctx.setData(dataPatch)
  ctx.triggerEvent(event, payload)
}
