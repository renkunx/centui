import { createContext, useContext } from 'react'
import type { TabPaneRegistration } from './TabPane'

export interface TabsMethodsValue {
  registerPane: (pane: TabPaneRegistration) => void
  unregisterPane: (pane: TabPaneRegistration) => void
}

export interface TabsStateValue {
  currentName: unknown
  prevIndex: number
  currentIndex: number
}

export interface TabsContextValue extends TabsMethodsValue {
  getState: () => TabsStateValue
}

export const TabsContext = createContext<TabsMethodsValue | null>(null)
export const TabsStateContext = createContext<TabsStateValue | null>(null)

export function useTabsContext(): TabsMethodsValue | null {
  return useContext(TabsContext)
}

export function useTabsState(): TabsStateValue | null {
  return useContext(TabsStateContext)
}
