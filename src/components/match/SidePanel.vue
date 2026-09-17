<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import type { Side } from '@/game/rules'

const props = defineProps<{
  side: Side
  name: string
  score: number
  /** ข้อความป้ายเสิร์ฟ — `null` เมื่อฝั่งนี้ไม่ได้เสิร์ฟ */
  serveLabel: string | null
  streak: number
  /** จำนวนเกมที่ต้องชนะติด — `null` เมื่อปิดกติกาชนะติด */
  streakTarget: number | null
  canUndo: boolean
  disabled: boolean
  /** แสดงปุ่ม ⋯ สำหรับจัดการผู้เล่นฝั่งนี้ */
  hasMenu: boolean
  /** ระยะที่กำลังลากป้ายเสิร์ฟ (px) — `null` เมื่อไม่ได้ลาก */
  serveOffset?: number | null
}>()

const emit = defineEmits<{ score: []; undo: []; menu: [] }>()

const sideLabel = computed(() => (props.side === 'red' ? 'ฝั่งแดง' : 'ฝั่งน้ำเงิน'))
</script>

<template>
  <div
    class="relative flex min-h-0 flex-col items-center justify-between rounded-[22px] px-3 pt-2.5 pb-3 text-white"
    :class="[
      side === 'red' ? 'bg-red-side' : 'bg-blue-side',
      // ป้ายเสิร์ฟที่กำลังลากต้องล้นออกไปทับอีกฝั่งได้
      serveOffset == null && 'overflow-hidden',
    ]"
  >
    <!-- พื้นที่แตะนับแต้มทั้งแผง -->
    <button
      type="button"
      class="absolute inset-0 transition-colors active:bg-black/10 disabled:cursor-default disabled:active:bg-transparent"
      :disabled="disabled"
      :aria-label="`เพิ่มแต้ม${sideLabel} ${name}`"
      @click="emit('score')"
    />

    <button
      v-if="hasMenu"
      type="button"
      class="absolute top-0.5 right-0.5 z-10 flex size-11 items-center justify-center"
      :aria-label="`จัดการ ${name}`"
      @click="emit('menu')"
    >
      <span
        class="flex size-8 items-center justify-center rounded-full bg-black/15 active:bg-black/25"
      >
        <AppIcon name="more" :size="18" />
      </span>
    </button>

    <!-- px เว้นที่ให้ปุ่ม ⋯ มุมขวาบน -->
    <div class="pointer-events-none relative flex w-full flex-col items-center gap-1.5 px-[30px]">
      <span class="max-w-full truncate font-display text-[31px] leading-tight font-bold">
        {{ name }}
      </span>
      <span v-if="streakTarget" class="flex h-4 items-center gap-1.5 text-xs text-white/80">
        ชนะติด
        <span class="flex gap-1">
          <span
            v-for="i in streakTarget"
            :key="i"
            class="size-2 rounded-full"
            :class="i <= streak ? 'bg-white' : 'ring-[1.5px] ring-white/60 ring-inset'"
          />
        </span>
      </span>
      <span v-else class="flex h-5 items-center">
        <span
          v-if="streak > 0"
          role="img"
          :aria-label="`ชนะติด ${streak}`"
          class="flex items-center gap-1 font-display text-lg leading-none font-bold"
        >
          <template v-if="streak > 1">{{ streak }}</template>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M2.5 6.5l4.2 3.3L10 3.5l3.3 6.3 4.2-3.3-1.6 8.5H4.1z"
              fill="var(--color-accent)"
              stroke="var(--color-accent)"
              stroke-width="1"
              stroke-linejoin="round"
            />
            <rect x="4.1" y="15.6" width="11.8" height="1.9" rx="0.9" fill="var(--color-accent)" />
          </svg>
        </span>
      </span>
    </div>

    <span
      :key="score"
      class="pointer-events-none relative animate-score-pop font-display text-[clamp(72px,16vh,140px)] leading-none font-bold tracking-[-0.03em] tabular-nums"
    >
      {{ score }}
    </span>

    <div class="pointer-events-none relative flex w-full flex-col items-center gap-2.5">
      <span
        data-serve-badge
        class="flex h-10 items-center gap-1.5 rounded-full bg-white pr-3.5 pl-2.5 text-[17px] font-semibold whitespace-nowrap text-ink transition-transform duration-200"
        :class="{ invisible: !serveLabel, 'z-20 scale-110 animate-drag-glow': serveOffset != null }"
        :style="
          serveOffset != null
            ? { transform: `translateX(${serveOffset}px)`, transition: 'none' }
            : undefined
        "
      >
        <AppIcon name="ball" :size="18" />
        {{ serveLabel ?? 'เสิร์ฟ' }}
      </span>
      <button
        v-if="canUndo"
        type="button"
        class="pointer-events-auto flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-black/20 text-[15px] font-semibold active:bg-black/30"
        @click="emit('undo')"
      >
        <AppIcon name="undo" :size="18" />
        ย้อนแต้ม
      </button>
      <span v-else class="h-11" />
    </div>
  </div>
</template>
