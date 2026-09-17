import { computed, inject, onBeforeUnmount, onMounted } from 'vue'

/** Check 家族（Check/CheckBox）与 Group 的注入协议 */
export interface CheckRootGroup {
  value: Array<string | number | boolean>
  register: (child: { name: string | number | boolean; disabled?: boolean }) => void
  unregister: (child: { name: string | number | boolean; disabled?: boolean }) => void
  check: (name: string | number | boolean) => void
  uncheck: (name: string | number | boolean) => void
  toggle?: (name: string | number | boolean) => void
  toggleAll?: (checked?: boolean) => void
}

export interface RadioRootGroup {
  value: string | number | boolean
  check: (name: string | number | boolean) => void
}

/**
 * Check 家族共享逻辑（自 v2 check/index.vue 与 check/box.vue 的重复实现提取）：
 * 选中态判定 + 点击分支（布尔名取反 / 已选反选 / 选中上报组）。
 */
export function useCheckDelegate(
  props: {
    name: string | number | boolean
    modelValue: string | number | boolean
    disabled: boolean
  },
  emit: (e: 'update:modelValue', value: string | number | boolean) => void,
) {
  const rootGroup = inject<CheckRootGroup | null>('rootGroup', null)

  const isChecked = computed(
    () =>
      props.modelValue === props.name ||
      (!!rootGroup && rootGroup.value.indexOf(props.name) !== -1),
  )

  // 注册信息携带响应式 getter，供 Group.toggleAll 读取 disabled 状态
  const delegate = {
    get name() {
      return props.name
    },
    get disabled() {
      return props.disabled
    },
  }

  onMounted(() => {
    rootGroup?.register(delegate)
  })

  onBeforeUnmount(() => {
    rootGroup?.unregister(delegate)
  })

  function onClick() {
    if (props.disabled) {
      return
    }

    if (typeof props.name === 'boolean') {
      emit('update:modelValue', !props.modelValue)
    } else if (isChecked.value) {
      emit('update:modelValue', '')
      if (rootGroup) {
        rootGroup.uncheck(props.name)
      }
    } else {
      emit('update:modelValue', props.name)
      if (rootGroup) {
        rootGroup.check(props.name)
      }
    }
  }

  return { rootGroup: rootGroup as CheckRootGroup | null, isChecked, onClick }
}

/** Radio 家族共享逻辑（Radio/RadioBox） */
export function useRadioDelegate(
  props: {
    name: string | number | boolean
    modelValue: string | number | boolean
    disabled: boolean
  },
  emit: (e: 'update:modelValue', value: string | number | boolean) => void,
) {
  const rootGroup = inject<RadioRootGroup | null>('rootGroup', null)

  const isChecked = computed(
    () => props.modelValue === props.name || (!!rootGroup && rootGroup.value === props.name),
  )

  function onClick() {
    if (!props.disabled) {
      emit('update:modelValue', props.name)
      if (rootGroup) {
        rootGroup.check(props.name)
      }
    }
  }

  return { isChecked, onClick }
}

/** 共享的 icon 修饰 props（v2 check/radio mixin） */
export const iconPropsDefaults = {
  icon: 'checked',
  iconInverse: 'check',
  iconDisabled: 'check-disabled',
  iconSvg: false,
  iconSize: 'md',
  iconPosition: 'right',
}

export type IconProps = typeof iconPropsDefaults
