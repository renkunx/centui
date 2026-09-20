import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
} from 'react'
import { CuTabBar, type TabBarItem, type TabBarExposed } from './TabBar'
import type { TabPaneRegistration } from './TabPane'
import { TabsContext, type TabsContextValue } from './context'

export interface TabsProps {
  value?: string
  hasInk?: boolean
  inkLength?: number
  immediate?: boolean
  children?: ReactNode
  onChange?: (tab: TabBarItem) => void
}

export interface TabsExposed {
  reflowTabBar: () => void
}

export const CuTabs = forwardRef<TabsExposed, TabsProps>(function CuTabs(
  { value, hasInk = true, inkLength = 25, immediate = false, children, onChange },
  ref,
) {
  const tabBarRef = useRef<TabBarExposed | null>(null)
  const [currentName, setCurrentName] = useState<string | undefined>(value)
  const [panes, setPanes] = useState<TabPaneRegistration[]>([])
  const prevIndex = useRef(0)
  const panesRef = useRef(panes)
  panesRef.current = panes
  const currentNameRef = useRef(currentName)
  currentNameRef.current = currentName

  const menus = panes.map((pane) => ({
    name: pane.name as string,
    label: pane.label as string,
    disabled: pane.disabled as boolean,
  }))
  const currentIndex = menus.findIndex((menu) => menu.name === currentName) >= 0
    ? menus.findIndex((menu) => menu.name === currentName)
    : 0

  // v2 watch value
  useEffect(() => {
    if (value !== undefined && value !== currentName) {
      setCurrentName(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // v2 mounted：未指定时默认选中首个 pane
  useEffect(() => {
    if (!currentNameRef.current && menus.length) {
      setCurrentName(menus[0].name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panes.length])

  const ctx: TabsContextValue = {
    registerPane: (pane) => {
      setPanes((prev) => {
        if (prev.some((p) => p.name === pane.name)) {
          return prev
        }
        return [...prev, pane]
      })
    },
    unregisterPane: (pane) => {
      setPanes((prev) => prev.filter((p) => p.name !== pane.name))
    },
    getState: () => ({
      currentName: currentNameRef.current,
      prevIndex: prevIndex.current,
      currentIndex,
    }),
  }

  useImperativeHandle(ref, () => ({
    reflowTabBar: () => tabBarRef.current?.reflow(),
  }))

  return (
    <TabsContext.Provider value={ctx}>
      <div className="cu-tabs">
        <CuTabBar
          ref={tabBarRef}
          items={menus}
          value={currentName}
          hasInk={hasInk}
          inkLength={inkLength}
          immediate={immediate}
          onChange={(tab, _index, prev) => {
            prevIndex.current = prev
            setCurrentName(tab.name as string)
            onChange?.(tab)
          }}
        />
        <div className="cu-tabs-content">{children}</div>
      </div>
    </TabsContext.Provider>
  )
})

