/**
 * Component() 统一封装：
 * - 默认 addGlobalClass: true（≈ styleIsolation: 'apply-shared'，页面样式可作用到组件内部）
 * - 统一 externalClasses: ['cu-class']（调用方覆盖类名的唯一通道）
 *
 * 泛型签名镜像官方 Component.Constructor（Options 顶层交叉 ThisType<Instance>，
 * 保证 methods/observers/lifetimes 里 this.setData/triggerEvent 的类型推断与裸 Component() 一致）。
 */

export function CuComponent<
  TData extends WechatMiniprogram.Component.DataOption,
  TProperty extends WechatMiniprogram.Component.PropertyOption,
  TMethod extends WechatMiniprogram.Component.MethodOption,
  TBehavior extends WechatMiniprogram.Component.BehaviorOption = [],
  TCustomInstanceProperty extends Record<string, unknown> = Record<string, never>,
>(
  options: WechatMiniprogram.Component.Options<
    TData,
    TProperty,
    TMethod,
    TBehavior,
    TCustomInstanceProperty
  >,
): void {
  options.options = {addGlobalClass: true, ...(options.options ?? {})}
  options.externalClasses = ['cu-class', ...(options.externalClasses ?? [])]
  Component(options)
}
