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
import { TabsContext, TabsStateContext, type TabsContextValue, type TabsStateValue } from './context'

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

  // context 拆分：注册方法恒定（ref 读取），状态按渲染值下发。
  // 注意 Provider value 不能完全恒定——children 元素身份不变时 React 会
  // 跳过子树重渲，状态 context 必须随渲染更新才能让 TabPane 感知切换。
  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex
  const methodCtx = useRef<TabsContextValue>({
    registerPane: (pane) => {
      setPanes((prev) => {
        const idx = prev.findIndex((p) => p.name === pane.name)
        if (idx >= 0) {
          // 同名 pane 重新注册（label/disabled 变更）→ 原位替换，修正注册信息滞留
          const next = prev.slice()
          next[idx] = pane
          return next
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
      currentIndex: currentIndexRef.current,
    }),
  }).current
  const stateCtx: TabsStateValue = {
    currentName,
    prevIndex: prevIndex.current,
    currentIndex,
  }

  useImperativeHandle(ref, () => ({
    reflowTabBar: () => tabBarRef.current?.reflow(),
  }))

  return (
    <TabsContext.Provider value={methodCtx}>
      <TabsStateContext.Provider value={stateCtx}>
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
      </TabsStateContext.Provider>
    </TabsContext.Provider>
  )
})

