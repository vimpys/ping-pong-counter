import { onMounted, onUnmounted } from 'vue'

export interface MatchShortcutActions {
  scoreRed: () => void
  scoreBlue: () => void
  undo: () => void
  /** เริ่มเกมถัดไป (ใช้ได้ตอน dialog ผู้ชนะเปิดอยู่) */
  nextGame: () => void
  /** dialog ผู้ชนะเปิดอยู่หรือไม่ */
  hasWinner: () => boolean
}

/** คีย์ลัดที่แสดงให้ผู้ใช้ดู */
export const MATCH_SHORTCUTS = [
  { keys: ['←', 'A'], label: 'แต้มฝั่งแดง' },
  { keys: ['→', 'L'], label: 'แต้มฝั่งน้ำเงิน' },
  { keys: ['Backspace', 'Z'], label: 'ย้อนแต้ม' },
  { keys: ['Enter'], label: 'เริ่มเกมถัดไป' },
] as const

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

/** มี bottom sheet (dialog อื่นที่ไม่ใช่ dialog ผู้ชนะ) เปิดอยู่ */
function otherDialogOpen() {
  return document.querySelector('[role="dialog"]:not([data-winner-dialog])') !== null
}

/**
 * คีย์ลัดหน้าแข่ง สำหรับคอม / Mac
 * ← หรือ A = แดง · → หรือ L = น้ำเงิน · Backspace หรือ Z = ย้อนแต้ม · Enter = เริ่มเกมถัดไป
 */
export function useMatchShortcuts(actions: MatchShortcutActions) {
  function onKeydown(event: KeyboardEvent) {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
    if (isTyping(event.target) || otherDialogOpen()) return

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    const winner = actions.hasWinner()
    let handled = true

    if (!winner && (key === 'ArrowLeft' || key === 'a')) actions.scoreRed()
    else if (!winner && (key === 'ArrowRight' || key === 'l')) actions.scoreBlue()
    else if (key === 'Backspace' || key === 'z') actions.undo()
    else if (winner && key === 'Enter') actions.nextGame()
    else handled = false

    if (handled) event.preventDefault()
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
