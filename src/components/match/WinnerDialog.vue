<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'

import AppIcon from '@/components/AppIcon.vue'
import type { Side } from '@/game/rules'
import { celebrate } from '@/native/celebrate'

const props = defineProps<{
  gameNo: number
  winnerSide: Side
  winnerName: string
  loserName: string
  winnerScore: number
  loserScore: number
  /** ข้อความแจ้งเมื่อชนะติดครบกำหนด — `null` ถ้าไม่มี */
  streakNotice: string | null
  nextRed: string | null
  nextBlue: string | null
  nextFirstServer: Side
  /** คำฉลองเมื่อดิวยาว — `null` ถ้าไม่มี */
  cheer: string | null
  deuceTies: number
}>()

const emit = defineEmits<{ next: []; undo: []; finish: [] }>()

const sideLabel = computed(() => (props.winnerSide === 'red' ? 'ฝั่งแดง' : 'ฝั่งน้ำเงิน'))

onMounted(() => {
  if (props.cheer) void celebrate()
})
</script>

<template>
  <!-- ปิดเองไม่ได้ ต้องเลือกเริ่มเกมถัดไปหรือย้อนแต้ม -->
  <DialogRoot :open="true">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 animate-fade-in bg-ink/55" />
      <DialogContent
        data-winner-dialog
        class="fixed inset-x-5 top-1/2 z-50 mx-auto flex max-h-[calc(100dvh-24px)] max-w-[400px] -translate-y-1/2 animate-pop-in flex-col overflow-x-hidden overflow-y-auto rounded-3xl bg-surface shadow-card outline-none"
        @open-auto-focus.prevent
        @escape-key-down.prevent
        @interact-outside.prevent
      >
        <div
          class="flex flex-col items-center gap-1.5 px-5 pt-5.5 pb-5 text-white"
          :class="winnerSide === 'red' ? 'bg-red-side' : 'bg-blue-side'"
        >
          <DialogDescription class="text-[13px] font-semibold text-white/80">
            จบเกมที่ {{ gameNo }} · {{ sideLabel }}ชนะ
          </DialogDescription>
          <!-- ดิวยาว → คำฉลองเด้งแทนถ้วย -->
          <p
            v-if="cheer"
            class="cheer-word mb-3 animate-bounce px-2 pt-4 pb-3 text-center font-display text-[46px] leading-[1.15] font-bold whitespace-pre-line"
            :data-text="cheer"
          >
            {{ cheer }}
          </p>
          <AppIcon v-else name="trophy" :size="40" :stroke-width="1.6" />
          <DialogTitle class="max-w-full truncate font-display text-[40px] leading-tight font-bold">
            {{ winnerName }} ชนะ
          </DialogTitle>
          <span v-if="cheer" class="rounded-full bg-white/20 px-3 py-0.5 text-[13px] font-semibold">
            ดิวกันไป {{ deuceTies }} ครั้ง
          </span>
        </div>

        <div class="flex flex-col gap-3.5 px-5 pt-4.5 pb-5">
          <div class="grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center">
            <div class="flex flex-col items-center gap-0.5">
              <span class="font-display text-[40px] leading-none font-bold tabular-nums">
                {{ winnerScore }}
              </span>
              <span class="max-w-full truncate text-sm text-muted">{{ winnerName }}</span>
            </div>
            <span class="text-center text-2xl font-semibold text-faint">–</span>
            <div class="flex flex-col items-center gap-0.5">
              <span class="font-display text-[40px] leading-none font-bold text-muted tabular-nums">
                {{ loserScore }}
              </span>
              <span class="max-w-full truncate text-sm text-muted">{{ loserName }}</span>
            </div>
          </div>

          <p
            v-if="streakNotice"
            class="rounded-xl bg-accent/20 px-3 py-2.5 text-center text-[13px] font-semibold text-pretty text-ink"
          >
            {{ streakNotice }}
          </p>

          <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold text-faint">เกมถัดไป</span>
            <div
              class="grid h-12 grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] items-center rounded-xl bg-surface-2 px-3.5"
            >
              <span class="flex min-w-0 items-center gap-2 font-semibold">
                <span class="size-2.5 shrink-0 rounded-full bg-red-side" />
                <span class="truncate">{{ nextRed ?? 'รอผู้เล่น' }}</span>
              </span>
              <span class="text-center text-xs text-faint">พบ</span>
              <span class="flex min-w-0 items-center justify-end gap-2 font-semibold">
                <span class="truncate">{{ nextBlue ?? 'รอผู้เล่น' }}</span>
                <span class="size-2.5 shrink-0 rounded-full bg-blue-side" />
              </span>
            </div>
            <span v-if="nextRed && nextBlue" class="text-center text-xs text-faint">
              <span class="mr-1 inline-block size-2 rounded-full bg-accent align-middle" />
              {{ nextFirstServer === 'red' ? nextRed : nextBlue }} เสิร์ฟก่อน
            </span>
          </div>

          <div class="flex flex-col gap-1 pt-1">
            <button
              type="button"
              class="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-primary font-display text-lg font-bold text-on-primary shadow-card active:scale-[0.98]"
              @click="emit('next')"
            >
              <AppIcon name="play" />
              เริ่มเกมถัดไป
            </button>
            <button
              type="button"
              class="flex h-10 items-center justify-center gap-2 text-sm font-semibold text-muted active:text-ink"
              @click="emit('undo')"
            >
              <AppIcon name="undo" :size="18" />
              กดผิด · ย้อนแต้มล่าสุด
            </button>
            <button
              type="button"
              class="h-11 rounded-2xl text-sm font-semibold text-primary ring-1 ring-line ring-inset active:bg-surface-2"
              @click="emit('finish')"
            >
              จบการแข่งขัน · ดูสรุปผล
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
/* คำฉลองแบบสติกเกอร์: ตัวแดง เส้นในแดงเข้ม ขอบดำหนา มีเงานูน */
.cheer-word {
  position: relative;
  isolation: isolate;
  rotate: -7deg;
  color: #e02424;
  -webkit-text-stroke: 2px #8f0f14;
}

/* ขอบดำหนา + เงานูนลงล่าง (ชั้นหลังตัวหนังสือ) */
.cheer-word::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  padding: inherit;
  z-index: -1;
  color: #111;
  -webkit-text-stroke: 10px #111;
  filter: drop-shadow(0 5px 0 #111);
}
</style>
