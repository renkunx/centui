import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { MdIcon } from '../icon/Icon'
import { MdTag } from '../tag/Tag'

export type CheckValue = string | number | boolean

export interface CheckChild {
  name: CheckValue
  disabled?: boolean
}

export interface CheckRootGroupValue {
  value: CheckValue[]
  register: (child: CheckChild) => void
  unregister: (child: CheckChild) => void
  check: (name: CheckValue) => void
  uncheck: (name: CheckValue) => void
  toggle?: (name: CheckValue) => void
  toggleAll?: (checked?: boolean) => void
}

export interface RadioRootGroupValue {
  value: CheckValue
  check: (name: CheckValue) => void
}

export const CheckGroupContext = createContext<CheckRootGroupValue | null>(null)
export const RadioGroupContext = createContext<RadioRootGroupValue | null>(null)

export const ICON_DEFAULTS = {
  icon: 'checked',
  iconInverse: 'check',
  iconDisabled: 'check-disabled',
}

interface DelegateProps {
  name: CheckValue
  value: CheckValue
  disabled: boolean
}

/** Check 家族共享逻辑（v2 check/index.vue 与 box.vue 的重复实现提取） */
export function useCheckDelegate(
  { name, value, disabled }: DelegateProps,
  emitChange?: (value: CheckValue) => void,
) {
  const rootGroup = useContext(CheckGroupContext)
  const child = useMemo<CheckChild>(() => ({ name, disabled }), [name, disabled])

  useEffect(() => {
    rootGroup?.register(child)
    return () => rootGroup?.unregister(child)
  }, [rootGroup, child])

  const isChecked = value === name || (!!rootGroup && rootGroup.value.includes(name))

  const onClick = () => {
    if (disabled) {
      return
    }
    if (typeof name === 'boolean') {
      emitChange?.(!value)
    } else if (isChecked) {
      emitChange?.('')
      rootGroup?.uncheck(name)
    } else {
      emitChange?.(name)
      rootGroup?.check(name)
    }
  }

  return { rootGroup, isChecked, onClick }
}

/** Radio 家族共享逻辑（单选不可反选） */
export function useRadioDelegate(
  { name, value, disabled }: DelegateProps,
  emitChange?: (value: CheckValue) => void,
) {
  const rootGroup = useContext(RadioGroupContext)
  const isChecked = value === name || (!!rootGroup && rootGroup.value === name)

  const onClick = () => {
    if (!disabled) {
      emitChange?.(name)
      rootGroup?.check(name)
    }
  }

  return { isChecked, onClick }
}

export interface CheckBaseBoxProps {
  className?: string
  label?: string
  disabled?: boolean
  isChecked?: boolean
  /** lt | rt */
  iconPosition?: string
  onClick?: () => void
  children?: ReactNode
}

export function MdCheckBaseBox({
  className,
  label = '',
  disabled = false,
  isChecked = false,
  iconPosition = 'rt',
  onClick,
  children,
}: CheckBaseBoxProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'md-check-base-box',
        className,
        iconPosition,
        disabled ? 'is-disabled' : '',
        isChecked ? 'is-checked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children ?? label}
      {isChecked ? (
        <MdTag size="tiny" shape="quarter" type="fill">
          <MdIcon name="right" size="xs" />
        </MdTag>
      ) : null}
    </div>
  )
}

export interface CheckProps {
  name?: CheckValue
  value?: CheckValue
  size?: string
  label?: string
  disabled?: boolean
  icon?: string
  iconInverse?: string
  iconDisabled?: string
  iconSvg?: boolean
  children?: ReactNode
  onChange?: (value: CheckValue) => void
}

export function MdCheck({
  name = true,
  value = false,
  size = 'md',
  label = '',
  disabled = false,
  icon = ICON_DEFAULTS.icon,
  iconInverse = ICON_DEFAULTS.iconInverse,
  iconDisabled = ICON_DEFAULTS.iconDisabled,
  iconSvg = false,
  children,
  onChange,
}: CheckProps) {
  const { isChecked, onClick } = useCheckDelegate({ name, value, disabled }, onChange!)
  const currentIcon = disabled ? iconDisabled : isChecked ? icon : iconInverse

  return (
    <label
      className={`md-check${disabled ? ' is-disabled' : ''}${isChecked ? ' is-checked' : ''}`}
      onClick={onClick}
    >
      <div className="md-check-icon">
        <MdIcon name={currentIcon} size={size} svg={iconSvg} />
      </div>
      {children || label ? <div className="md-check-label">{children ?? label}</div> : null}
    </label>
  )
}

export interface CheckBoxProps {
  name?: CheckValue
  value?: CheckValue
  label?: string
  disabled?: boolean
  /** lt | rt */
  iconPosition?: string
  children?: ReactNode
  onChange?: (value: CheckValue) => void
}

export function MdCheckBox({
  name = true,
  value = false,
  label = '',
  disabled = false,
  iconPosition = 'rt',
  children,
  onChange,
}: CheckBoxProps) {
  const { isChecked, onClick } = useCheckDelegate({ name, value, disabled }, onChange!)

  return (
    <MdCheckBaseBox
      className="md-check-box"
      isChecked={isChecked}
      disabled={disabled}
      iconPosition={iconPosition}
      label={label}
      onClick={onClick}
    >
      {children ?? label}
    </MdCheckBaseBox>
  )
}

export interface CheckGroupProps {
  value?: CheckValue[]
  max?: number
  children?: ReactNode
  className?: string
  onChange?: (value: CheckValue[]) => void
}

export function MdCheckGroup({
  value = [],
  max = 0,
  children,
  className,
  onChange,
}: CheckGroupProps) {
  const childrenMap = new Map<string, CheckChild>()

  const group: CheckRootGroupValue = {
    value,
    register(child) {
      if (child.name !== true && child.name !== '') {
        childrenMap.set(String(child.name), child)
      }
    },
    unregister(child) {
      childrenMap.delete(String(child.name))
    },
    check(name) {
      const index = value.indexOf(name)
      if (index === -1 && (max < 1 || value.length < max)) {
        onChange?.(value.concat(name))
      }
    },
    uncheck(name) {
      const index = value.indexOf(name)
      if (index !== -1) {
        onChange?.(value.slice(0, index).concat(value.slice(index + 1)))
      }
    },
    toggle(name) {
      if (value.indexOf(name) === -1) {
        group.check(name)
      } else {
        group.uncheck(name)
      }
    },
    toggleAll(checked) {
      const names: CheckValue[] = []
      childrenMap.forEach(child => {
        const isChecked = value.includes(child.name)
        // disabled 保留原状态（v2 契约）
        if (child.disabled) {
          if (isChecked) {
            names.push(child.name)
          }
          return
        }
        if (checked === false) {
          return
        }
        names.push(child.name)
      })
      onChange?.(names)
    },
  }

  return (
    <CheckGroupContext.Provider value={group}>
      <div className={`md-check-group${className ? ` ${className}` : ''}`}>{children}</div>
    </CheckGroupContext.Provider>
  )
}
