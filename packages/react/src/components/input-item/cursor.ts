/**
 * 输入光标位置读写（自 v2 components/input-item/cursor.js 迁移）。
 */

/** get position of input cursor */
export function getCursorsPosition(ctrl: HTMLInputElement | HTMLTextAreaElement | undefined | null): number {
  if (!ctrl) {
    return 0
  }
  if (ctrl.selectionStart || ctrl.selectionStart === 0) {
    return ctrl.selectionStart
  }
  return 0
}

let timer: ReturnType<typeof setTimeout> | null = null

/** set position of input cursor */
export function setCursorsPosition(ctrl: HTMLInputElement | HTMLTextAreaElement | undefined | null, pos: number): void {
  if (!ctrl) {
    return
  }
  if (timer) {
    clearTimeout(timer)
  }

  // Compatible with some Android devices, the synchronized settings will be invalid
  timer = setTimeout(() => {
    if (ctrl.setSelectionRange) {
      ctrl.focus()
      ctrl.setSelectionRange(pos, pos)
    }
  }, 0)
}
