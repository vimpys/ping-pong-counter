import { onUnmounted, ref } from 'vue'

import { otherSide, type Side } from '@/game/rules'

/** ลากเกินระยะนี้ (px) ถึงนับว่าเริ่มลาก ไม่ใช่แตะ */
const DRAG_SLOP = 12
/** ลากแผงเกินสัดส่วนนี้ของความกว้างแผง → ปล่อยแล้วสลับข้าง */
const SWAP_RATIO = 0.35
/** เวลาที่แผงเลื่อนกลับที่เดิมหลังปล่อยนิ้ว — ต้องตรงกับ duration ของ transition บนแผง */
export const SETTLE_MS = 200
/** ลากป้ายเสิร์ฟเกินสัดส่วนนี้ของความกว้างแผง (เกือบถึงอีกฝั่ง) → ปล่อยแล้วเปลี่ยนคนเสิร์ฟ */
const SERVE_RATIO = 0.5

/**
 * - `side` ลากทั้งแผงไปอีกฝั่ง → สลับข้างผู้เล่น
 * - `serve` ลากป้ายเสิร์ฟไปอีกฝั่ง → เปลี่ยนคนเสิร์ฟก่อน
 */
export type DragKind = 'side' | 'serve'

export interface PanelDrag {
  kind: DragKind
  /** ฝั่งที่เริ่มลาก */
  side: Side
  /** ระยะเลื่อนแนวนอน (px) — ลากได้แค่ทางอีกฝั่ง */
  offset: number
  /** ปล่อยตอนนี้จะสลับ */
  willApply: boolean
}

interface Pending {
  kind: DragKind
  pointerId: number
  side: Side
  x: number
  y: number
  width: number
}

function isInside(element: Element | null, x: number, y: number) {
  if (!element) return false
  const rect = element.getBoundingClientRect()
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

/**
 * ลากบนแผงผู้เล่นในหน้าแข่ง — ผูก handler กับกล่องที่ครอบแผง
 * แต่ละแผงต้องมี `data-side` และป้ายเสิร์ฟต้องมี `data-serve-badge`
 */
export function usePanelDrag(options: {
  canSwapSides: () => boolean
  /** เปลี่ยนคนเสิร์ฟได้ (ตอน 0–0) */
  canMoveServe: () => boolean
  onSwapSides: () => void
  onMoveServe: (side: Side) => void
}) {
  const drag = ref<PanelDrag | null>(null)
  /** ตำแหน่งนิ้วขณะลาก (สำหรับวาดวงเรือง) */
  const point = ref<{ x: number; y: number } | null>(null)
  /**
   * แผงที่กำลังเลื่อนกลับที่เดิมหลังปล่อยนิ้ว — ช่วงนี้แผงยังซ้อนทับอีกฝั่งอยู่
   * จึงต้องปิดการแตะบนแผงนี้ ไม่ให้แต้มไปเข้าผิดฝั่ง
   */
  const settling = ref<Side | null>(null)
  let pending: Pending | null = null
  let suppressClick = false
  let settleTimer: ReturnType<typeof setTimeout> | undefined

  function onPointerDown(event: PointerEvent) {
    suppressClick = false
    if (!event.isPrimary || event.button !== 0) return
    const panel = (event.target as Element).closest<HTMLElement>('[data-side]')
    const side = panel?.dataset.side
    if (!panel || (side !== 'red' && side !== 'blue')) return

    const onBadge = isInside(
      panel.querySelector('[data-serve-badge]:not(.invisible)'),
      event.clientX,
      event.clientY,
    )
    const kind: DragKind | null =
      onBadge && options.canMoveServe() ? 'serve' : options.canSwapSides() ? 'side' : null
    if (!kind) return

    pending = {
      kind,
      pointerId: event.pointerId,
      side,
      x: event.clientX,
      y: event.clientY,
      width: panel.offsetWidth,
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!pending || event.pointerId !== pending.pointerId) return
    const dx = event.clientX - pending.x
    const dy = event.clientY - pending.y

    if (!drag.value) {
      if (Math.abs(dx) < DRAG_SLOP && Math.abs(dy) < DRAG_SLOP) return
      if (Math.abs(dy) > Math.abs(dx)) {
        pending = null
        return
      }
      try {
        ;(event.currentTarget as Element).setPointerCapture?.(event.pointerId)
      } catch {
        // pointer หายไปแล้ว (เช่นนิ้วยกพอดี) — ลากต่อได้โดยไม่ต้อง capture
      }
    }

    point.value = { x: event.clientX, y: event.clientY }
    const { kind, side, width } = pending
    const direction = side === 'red' ? 1 : -1
    const distance = Math.min(Math.max(dx * direction, 0), width)
    drag.value = {
      kind,
      side,
      offset: distance * direction,
      willApply: distance > width * (kind === 'serve' ? SERVE_RATIO : SWAP_RATIO),
    }
  }

  function finish(apply: boolean) {
    const current = drag.value
    if (current) {
      suppressClick = true
      if (current.kind === 'side') {
        settling.value = current.side
        clearTimeout(settleTimer)
        settleTimer = setTimeout(() => (settling.value = null), SETTLE_MS)
      }
      if (apply && current.willApply) {
        if (current.kind === 'side') options.onSwapSides()
        else options.onMoveServe(otherSide(current.side))
      }
    }
    drag.value = null
    point.value = null
    pending = null
  }

  onUnmounted(() => clearTimeout(settleTimer))

  /** กัน click ที่ตามหลังการลาก ไม่ให้กลายเป็นการนับแต้ม */
  function onClickCapture(event: MouseEvent) {
    if (!suppressClick) return
    suppressClick = false
    event.preventDefault()
    event.stopPropagation()
  }

  return {
    drag,
    point,
    settling,
    handlers: {
      onPointerdown: onPointerDown,
      onPointermove: onPointerMove,
      onPointerup: (event: PointerEvent) => {
        if (event.pointerId === pending?.pointerId) finish(true)
      },
      onPointercancel: () => finish(false),
      onClickCapture,
    },
  }
}
