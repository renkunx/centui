import { useEffect, useRef, type ReactNode } from 'react'
import { useTabsContext } from './context'

export interface TabPaneProps {
  label?: string
  name?: string
  disabled?: boolean
  children?: ReactNode
}

export interface TabPaneRegistration {
  label?: string
  name?: string
  disabled?: boolean
}

export function CuTabPane({ label, name, disabled, children }: TabPaneProps) {
  const ctx = useTabsContext()
  const reg = useRef<TabPaneRegistration>({ label, name, disabled })
  reg.current = { label, name, disabled }
  useEffect(() => {
    ctx?.registerPane(reg.current)
    return () => {
      ctx?.unregisterPane(reg.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const state = ctx?.getState()
  const active = state ? state.currentName === name : false

  return (
    <div
      className="cu-tab-pane"
      role="tabpanel"
      {...({ tab: name } as object)}
      style={{ display: active ? '' : 'none' }}
    >
      {children}
    </div>
  )
}
