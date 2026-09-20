<script lang="ts">
import {
  cloneVNode,
  createVNode,
  defineComponent,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  render,
  type VNode,
} from 'vue'
import { randomId } from '@centui/core'
import CuTipContent from './TipContent.vue'

/**
 * Tip 包装器：只渲染插槽的第一个节点，并在其上追加点击触发；
 * 气泡内容懒创建为游离 DOM，绝对定位于第一个可滚动祖先内（v2 契约）。
 */
export default defineComponent({
  name: 'cu-tip',

  props: {
    /** top | left | bottom | right */
    placement: {
      type: String,
      default: 'top',
    },
    name: {
      type: [String, Number],
      default: undefined,
    },
    icon: {
      type: String,
      default: undefined,
    },
    iconSvg: {
      type: Boolean,
      default: false,
    },
    content: {
      type: [String, Number],
      default: '',
    },
    closable: {
      type: Boolean,
      default: true,
    },
    fill: {
      type: Boolean,
      default: false,
    },
    offset: {
      type: Object,
      default: () => ({ top: 0, left: 0 }),
    },
  },

  emits: ['show', 'hide'],

  setup(props, { slots, emit }) {
    let wrapperEl: HTMLElement | null = null
    let tipContainer: HTMLElement | null = null

    const instance = getCurrentInstance()

    // 当前渲染的插槽节点元素（Tip 的根即触发元素；无插槽时为注释节点）
    function getCurrentInstanceEl(): HTMLElement | null {
      const el = instance?.proxy?.$el as HTMLElement | null
      return el && el.nodeType === 1 ? el : null
    }

    onMounted(() => {
      wrapperEl = getFirstScrollWrapper(getCurrentInstanceEl() ?? document.body)
    })

    onBeforeUnmount(() => {
      removeTip()
      wrapperEl = null
    })

    /**
     * Get the first scrollable parent,
     * so we can append the tip element to
     * the right parent container
     */
    function getFirstScrollWrapper(node: HTMLElement | null): HTMLElement | null {
      if (node === null || node === document.body) {
        return node
      }

      const overflowY = window.getComputedStyle(node).overflowY
      const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden'
      const isScrollView = node.getAttribute && node.getAttribute('scroll-wrapper') !== null

      if ((isScrollable && node.scrollHeight > node.clientHeight) || isScrollView) {
        return node
      } else {
        return getFirstScrollWrapper(node.parentNode as HTMLElement | null)
      }
    }

    function getPosition(node: HTMLElement, wrapper: HTMLElement | null): { x: number; y: number } {
      let x = 0
      let y = 0
      let el: HTMLElement | null = node

      while (el) {
        x += el.offsetLeft
        y += el.offsetTop

        if (el === wrapper || el === document.body || el === null) {
          break
        }

        el = el.offsetParent as HTMLElement | null
      }

      return { x, y }
    }

    /**
     * Lazy create tip element
     */
    function getOrNewTip(): HTMLElement {
      if (tipContainer) {
        return tipContainer
      }

      tipContainer = document.createElement('div')
      const vnode = createVNode(CuTipContent, {
        icon: props.icon,
        iconSvg: props.iconSvg,
        placement: props.placement,
        content: props.content,
        closable: props.closable,
        name: props.name ?? randomId('tip'),
        onClose: hide,
      })
      render(vnode, tipContainer)

      return tipContainer
    }

    /**
     * Calculate the position of tip,
     * and relayout its position
     */
    function layout(referenceEl: HTMLElement) {
      if (!tipContainer) {
        return
      }

      const tipEl = tipContainer.firstElementChild as HTMLElement
      const delta = getPosition(referenceEl, wrapperEl)
      const offsetTop = props.offset.top || 0
      const offsetLeft = props.offset.left || 0

      let tipElWidth = tipEl.offsetWidth
      let tipElHeight = tipEl.offsetHeight
      let cssText = ''

      if (props.fill && (props.placement === 'top' || props.placement === 'bottom')) {
        tipElWidth = referenceEl.offsetWidth
        cssText += `width: ${tipElWidth}px;`
      }

      if (props.fill && (props.placement === 'left' || props.placement === 'right')) {
        tipElHeight = referenceEl.offsetHeight
        cssText += `height: ${tipElHeight}px;`
      }

      switch (props.placement) {
        case 'left':
          delta.y += (referenceEl.offsetHeight - tipElHeight) / 2
          delta.x -= tipElWidth + 10
          break

        case 'right':
          delta.y += (referenceEl.offsetHeight - tipElHeight) / 2
          delta.x += referenceEl.offsetWidth + 10
          break

        case 'bottom':
          delta.y += referenceEl.offsetHeight + 10
          delta.x += (referenceEl.offsetWidth - tipElWidth) / 2
          break

        default:
          delta.y -= tipElHeight + 10
          delta.x += (referenceEl.offsetWidth - tipElWidth) / 2
          break
      }

      cssText += `position: absolute; top: ${delta.y + offsetTop}px; left: ${delta.x + offsetLeft}px;`
      tipEl.style.cssText = cssText
    }

    function removeTip() {
      if (tipContainer && tipContainer.parentNode) {
        tipContainer.parentNode.removeChild(tipContainer)
      }
    }

    /**
     * Do the magic, show me your tip
     */
    function show() {
      const tipEl = getOrNewTip()
      const referenceEl = getCurrentInstanceEl()

      if (wrapperEl && tipEl.parentNode !== wrapperEl && referenceEl) {
        wrapperEl.appendChild(tipEl)
      }

      if (referenceEl) {
        layout(referenceEl)
      }
      emit('show', props.name)
    }

    /**
     * Hide tip
     */
    function hide() {
      if (tipContainer && tipContainer.parentNode !== null) {
        tipContainer.parentNode.removeChild(tipContainer)
        emit('hide', props.name)
      }
    }

    /**
     * Only render the first node of slots
     * and add tip trigger handler on it
     */
    return () => {
      const nodes = slots.default?.() ?? []
      if (!nodes.length) {
        return nodes
      }

      // v2 契约：优先取第一个带数据的节点（元素节点）
      let firstNode: VNode | null = null
      for (const node of nodes) {
        firstNode = node
        if (node.type || (node.props && Object.keys(node.props).length)) {
          break
        }
      }

      if (!firstNode) {
        return nodes
      }

      return cloneVNode(firstNode, { onClick: show })
    }
  },
})
</script>
