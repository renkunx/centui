import { createContext, useContext } from 'react'
import type { TabPaneRegistration } from './TabPane'

export interface TabsContextValue {
  registerPane: (pane: TabPaneRegistration) => void
  unregisterPane: (pane: TabPaneRegistration) => void
  getState: () => { currentName: unknown; prevIndex: number; currentIndex: number }
}

export const TabsContext = createContext<TabsContextValue | null>(null)

export function useTabsContext(): TabsContextValue | null {
  return useContext(TabsContext)
}
