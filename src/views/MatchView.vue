<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import AppIcon from '@/components/AppIcon.vue'
import MatchSheet from '@/components/match/MatchSheet.vue'
import QueueSection from '@/components/match/QueueSection.vue'
import SidePanel from '@/components/match/SidePanel.vue'
import WinnerDialog from '@/components/match/WinnerDialog.vue'
import type { MatchSheetState } from '@/components/match/types'
import { useMatchShortcuts } from '@/composables/useMatchShortcuts'
import { otherSide, SIDES, type Side } from '@/game/rules'
import { useBackButton } from '@/native/backButton'
import { setKeepAwake, tapFeedback, winFeedback } from '@/native/device'
import { useSessionStore } from '@/stores/session'

/** กันแตะซ้ำโดยไม่ตั้งใจ — แต้มจริงไม่เกิดเร็วกว่านี้ */
const TAP_GUARD_MS = 400

const session = useSessionStore()
const router = useRouter()
const { state, game, nextGamePreview } = storeToRefs(session)
const settings = computed(() => state.value?.settings)

// ---------- นับแต้ม ----------

let lastTapAt = Number.NEGATIVE_INFINITY

function onScore(side: Side) {
  const now = Date.now()
  if (now - lastTapAt < TAP_GUARD_MS) return
  if (!game.value || game.value.status.winner) return
  lastTapAt = now
  session.score(side)
  tapFeedback()
}

function onUndo() {
  session.undo()
  lastTapAt = Number.NEGATIVE_INFINITY
}

watch(
  () => game.value?.status.winner,
  (winner, previous) => {
    if (winner && !previous) winFeedback()
  },
)

// ---------- สิ่งที่แสดง ----------

function serveLabel(ball: number | null): string {
  const every = settings.value?.serveEvery ?? 2
  // ช่วงดิวสลับทุกลูก → แสดงแค่ "เสิร์ฟ"
  return ball === null || every === 1 ? 'เสิร์ฟ' : `เสิร์ฟ ${ball}/${every}`
}

const panels = computed(() =>
  SIDES.map((side) => {
    const id = state.value?.court[side] ?? null
    const status = game.value?.status
    const serving = !!status && !status.winner && status.serve.server === side
    return {
      side,
      playerId: id,
      name: session.playerName(id) || 'รอผู้เล่น',
      score: status?.score[side] ?? 0,
      serveLabel: serving ? serveLabel(status.serve.ball) : null,
      streak: session.streak(id),
      canUndo: status?.lastScorer === side,
      disabled: !status || !!status.winner,
      hasMenu: id !== null && !status?.winner,
    }
  }),
)

const streakTarget = computed(() =>
  settings.value?.streakRule.enabled ? settings.value.streakRule.wins : null,
)

const deuceText = computed(() =>
  settings.value?.deuceLead === 1
    ? 'ลูกถัดไปชนะ'
    : `ต้องนำ ${settings.value?.deuceLead} แต้มถึงชนะ`,
)

/** คำฉลองเมื่อดิวยาว: เสมอในช่วงดิวเกิน 3 ครั้ง → สุดยอด · เกิน 5 ครั้ง → โคตรเดือด */
function cheerFor(deuceTies: number): string | null {
  if (deuceTies > 5) return 'โคตรเดือด!'
  if (deuceTies > 3) return 'สุดยอด!'
  return null
}

const winnerDialog = computed(() => {
  const preview = nextGamePreview.value
  const status = game.value?.status
  if (!preview || !status?.winner || !game.value || !settings.value) return null
  const winnerName = session.playerName(preview.winnerId)
  const loserName = session.playerName(preview.loserId)
  return {
    gameNo: game.value.no,
    winnerSide: status.winner,
    winnerName,
    loserName,
    winnerScore: status.score[status.winner],
    loserScore: status.score[otherSide(status.winner)],
    streakNotice: preview.streakCompleted
      ? `ชนะติดครบ ${settings.value.streakRule.wins} เกม · ${winnerName}และ${loserName}ไปต่อท้ายคิว`
      : null,
    nextRed: preview.red ? session.playerName(preview.red) : null,
    nextBlue: preview.blue ? session.playerName(preview.blue) : null,
    nextFirstServer: preview.firstServer,
    cheer: cheerFor(status.deuceTies),
    deuceTies: status.deuceTies,
  }
})

const queue = computed(() => (state.value?.queue ?? []).map(session.playerItem))
const inactive = computed(() => (state.value?.inactive ?? []).map(session.playerItem))

// ---------- bottom sheet / ออกจากหน้า ----------

const sheet = ref<MatchSheetState | null>(null)

// ปุ่ม back ของ Android → ถามก่อนออก
useBackButton(() => {
  sheet.value = { kind: 'leave' }
})

// คีย์ลัดบนคอม / Mac
useMatchShortcuts({
  scoreRed: () => onScore('red'),
  scoreBlue: () => onScore('blue'),
  undo: onUndo,
  nextGame: () => session.nextGame(),
  hasWinner: () => winnerDialog.value !== null,
})

onMounted(() => setKeepAwake(true))
onUnmounted(() => setKeepAwake(false))
</script>

<template>
  <main class="flex h-full flex-col bg-doodles">
    <header class="flex h-15 shrink-0 items-center justify-between gap-1 pr-3 pl-1">
      <button
        type="button"
        aria-label="ออกจากหน้าแข่ง"
        class="flex size-11 shrink-0 items-center justify-center"
        @click="sheet = { kind: 'leave' }"
      >
        <AppIcon name="back" :size="22" />
      </button>
      <div class="flex min-w-0 flex-1 flex-col items-center gap-1">
        <h1 class="font-display text-[17px] leading-tight font-bold">
          {{ game ? `เกมที่ ${game.no}` : 'รอผู้เล่น' }}
        </h1>
        <!-- กติกาเป็นสัญลักษณ์: แต้มชนะ + ดิว (เรื่องเสิร์ฟดูได้จากป้ายบนแผงแดง/น้ำเงิน) -->
        <div v-if="settings" class="flex items-center gap-1.5">
          <span
            role="img"
            :aria-label="`แข่งถึง ${settings.targetScore} แต้ม`"
            class="inline-flex h-6 items-center gap-1 rounded-full bg-surface pr-2 pl-2.5 font-display text-base leading-none font-bold shadow-card"
          >
            {{ settings.targetScore }}
            <AppIcon name="trophy" :size="16" :stroke-width="1.8" class="text-primary" />
          </span>
          <span
            role="img"
            :aria-label="`ดิวต้องนำ ${settings.deuceLead} แต้ม`"
            class="inline-flex h-6 items-center gap-1 rounded-full bg-surface px-2.5 font-display text-base leading-none font-bold shadow-card"
          >
            <span class="font-body text-xs font-semibold text-muted">ดิว</span>
            +{{ settings.deuceLead }}
          </span>
        </div>
      </div>
      <RouterLink
        :to="{ name: 'summary' }"
        class="flex h-11 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap ring-1 ring-line ring-inset"
      >
        จบการแข่งขัน
      </RouterLink>
    </header>

    <div class="grid shrink-0 basis-[51%] grid-cols-2 gap-2 px-3">
      <SidePanel
        v-for="{ playerId, ...panel } in panels"
        :key="panel.side"
        v-bind="panel"
        :streak-target="streakTarget"
        @score="onScore(panel.side)"
        @undo="onUndo"
        @menu="playerId && (sheet = { kind: 'court', playerId })"
      />
    </div>

    <div class="flex min-h-13 shrink-0 items-center justify-center px-4 py-2" aria-live="polite">
      <p v-if="winnerDialog" class="text-[13px] text-muted">จบเกมแล้ว</p>
      <div
        v-else-if="game?.status.isDeuce"
        class="flex h-8 items-center gap-2 rounded-full bg-accent px-3.5 text-ink"
      >
        <span class="font-display font-bold">ดิว</span>
        <span class="text-[13px] font-semibold">{{ deuceText }}</span>
      </div>
      <p v-else-if="!game" class="text-[13px] text-muted">
        ผู้เล่นไม่พอ · เพิ่มผู้เล่นเพื่อเริ่มเกม
      </p>
      <template v-else>
        <p class="text-[13px] text-faint pointer-fine:hidden">แตะฝั่งที่ได้แต้มเพื่อนับคะแนน</p>
        <!-- คอม / Mac ที่ใช้เมาส์: บอกคีย์ลัด -->
        <p class="hidden text-[13px] text-faint pointer-fine:block">
          คีย์ลัด <kbd class="kbd">←</kbd> แดง · <kbd class="kbd">→</kbd> น้ำเงิน ·
          <kbd class="kbd">Backspace</kbd> ย้อนแต้ม
        </p>
      </template>
    </div>

    <WinnerDialog
      v-if="winnerDialog"
      v-bind="winnerDialog"
      @next="session.nextGame()"
      @undo="onUndo"
      @finish="router.push({ name: 'summary' })"
    />

    <QueueSection
      :queue="queue"
      :inactive="inactive"
      @reorder="session.reorder"
      @select="(kind, playerId) => (sheet = { kind, playerId })"
      @add="sheet = { kind: 'add' }"
    />

    <MatchSheet v-model:sheet="sheet" />
  </main>
</template>
