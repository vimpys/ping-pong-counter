<script lang="ts">
type Circle = readonly [cx: number, cy: number, r: number]

interface IconShape {
  /** เส้น (stroke) — ถ้าไม่ระบุ `filled` */
  paths?: readonly string[]
  circles?: readonly Circle[]
  /** ระบายทึบด้วย currentColor แทนการวาดเส้น */
  filled?: boolean
  /** สีเฉพาะของไอคอน (เช่น ลูกปิงปอง) */
  color?: string
}

const DOTS_GRID: readonly Circle[] = [7, 13].flatMap((cx) =>
  [5, 10, 15].map((cy) => [cx, cy, 1.5] as const),
)

/** ไอคอนทั้งแอป — viewBox 20×20 */
export const ICONS = {
  back: { paths: ['M12.5 4.5L7 10l5.5 5.5'] },
  plus: { paths: ['M5 10h10M10 5v10'] },
  minus: { paths: ['M5 10h10'] },
  close: { paths: ['M6 6l8 8M14 6l-8 8'] },
  undo: { paths: ['M7.5 5L4 8.5 7.5 12', 'M4 8.5h7.5a4.5 4.5 0 010 9H9'] },
  rejoin: { paths: ['M8 7L4.5 10.5 8 14', 'M4.5 10.5H12a3.5 3.5 0 000-7h-1'] },
  exit: { paths: ['M8 4H4.5v12H8', 'M12 6.5L15.5 10 12 13.5M15.5 10H8'] },
  flag: { paths: ['M5 17V3.5', 'M5 4h9l-2 3.5 2 3.5H5'] },
  reset: { paths: ['M4 10a6 6 0 1 0 1.8-4.3', 'M4 3.5v3h3'] },
  home: { paths: ['M3.5 9.5L10 4l6.5 5.5', 'M5.5 8v8h9V8'] },
  share: { paths: ['M10 12.5V3M6.5 6.5L10 3l3.5 3.5', 'M4 10.5V16h12v-5.5'] },
  trophy: {
    paths: [
      'M6 3.5h8v4a4 4 0 0 1-8 0z',
      'M6 5H3.5v1a2.5 2.5 0 0 0 2.8 2.5M14 5h2.5v1a2.5 2.5 0 0 1-2.8 2.5',
      'M10 11.5v3M7 16.5h6',
    ],
  },
  play: { paths: ['M6 4.5v11l9-5.5z'], filled: true },
  grip: { circles: DOTS_GRID, filled: true },
  more: {
    circles: [
      [4.5, 10, 1.6],
      [10, 10, 1.6],
      [15.5, 10, 1.6],
    ],
    filled: true,
  },
  ball: { circles: [[10, 10, 7]], filled: true, color: 'var(--color-accent)' },
} as const satisfies Record<string, IconShape>

export type IconName = keyof typeof ICONS
</script>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ name: IconName; size?: number; strokeWidth?: number }>(), {
  size: 20,
  strokeWidth: 2,
})

const icon = computed<IconShape>(() => ICONS[props.name])
const paint = computed(() => icon.value.color ?? 'currentColor')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    aria-hidden="true"
    :fill="icon.filled ? paint : 'none'"
    :stroke="icon.filled ? 'none' : paint"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="shrink-0"
  >
    <path v-for="d in icon.paths" :key="d" :d="d" />
    <circle v-for="[cx, cy, r] in icon.circles" :key="`${cx}-${cy}`" :cx="cx" :cy="cy" :r="r" />
  </svg>
</template>
