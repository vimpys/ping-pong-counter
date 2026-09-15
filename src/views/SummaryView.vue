<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import AppIcon from '@/components/AppIcon.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import PageHeader from '@/components/PageHeader.vue'
import SheetAction from '@/components/SheetAction.vue'
import { useBackButton } from '@/native/backButton'
import { shareElementAsImage } from '@/native/share'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { state, game, ranking, finishedGames } = storeToRefs(session)
const router = useRouter()

const dateText = computed(() => {
  const date = state.value?.startedAt ? new Date(state.value.startedAt) : new Date()
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
})

/** ผู้ที่ชนะมากที่สุด — ถ้าเสมอกันทั้งจำนวนชนะและ % ชนะ แสดงทุกคน */
const topPlayers = computed(() => {
  const best = ranking.value[0]
  if (!best || best.wins === 0) return []
  return ranking.value.filter((p) => p.wins === best.wins && p.winRate === best.winRate)
})

const winRateText = (rate: number, played: number) =>
  played === 0 ? '–' : `${Math.round(rate * 100)}%`

const footerText = computed(() => {
  const s = state.value?.settings
  const players = state.value?.players.length ?? 0
  return s
    ? `${finishedGames.value} เกม · ${players} ผู้เล่น · ${s.targetScore} แต้ม ดิวนำ ${s.deuceLead}`
    : ''
})

const unfinishedNote = computed(() =>
  game.value && !game.value.status.winner && state.value && state.value.points.length > 0
    ? `เกมที่ ${game.value.no} ยังไม่จบ · ไม่นับในสรุป`
    : '',
)

// ---------- แชร์ ----------

const shareArea = ref<HTMLElement>()
const sharing = ref(false)
const shareMessage = ref('')

async function share() {
  if (!shareArea.value || sharing.value) return
  sharing.value = true
  shareMessage.value = ''
  try {
    const stamp = new Date().toISOString().slice(0, 10)
    const result = await shareElementAsImage(
      shareArea.value,
      `ping-pong-summary-${stamp}.png`,
      'สรุปผลการแข่งขันปิงปอง',
    )
    if (result === 'downloaded') shareMessage.value = 'บันทึกรูปลงเครื่องแล้ว'
  } catch {
    shareMessage.value = 'แชร์ไม่สำเร็จ ลองอีกครั้ง'
  } finally {
    sharing.value = false
  }
}

// ---------- เริ่มรอบใหม่ ----------

const confirmOpen = ref(false)

useBackButton(() => router.push({ name: 'match' }))

function startNewRound() {
  confirmOpen.value = false
  session.end()
  router.push({ name: 'setup' })
}
</script>

<template>
  <main class="flex h-full flex-col bg-doodles">
    <PageHeader
      class="px-4 pt-3 pb-1"
      title="สรุปผลการแข่งขัน"
      back-label="กลับไปเล่นต่อ"
      @back="router.push({ name: 'match' })"
    />

    <div class="flex-1 overflow-y-auto">
      <!-- ส่วนนี้จะกลายเป็นรูปตอนแชร์ -->
      <div ref="shareArea" class="bg-doodles px-4 py-2">
        <article
          class="flex flex-col gap-3.5 rounded-[20px] bg-surface px-4 pt-4.5 pb-3.5 shadow-card"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <AppIcon name="ball" :size="18" />
              <span class="font-display text-sm font-bold tracking-[0.02em]">
                Ping Pong Counter
              </span>
            </div>
            <span class="text-[13px] text-muted">{{ dateText }}</span>
          </div>

          <div v-if="topPlayers.length > 0" class="flex items-end justify-between gap-3">
            <div class="flex min-w-0 flex-col gap-0.5">
              <span class="text-[13px] font-semibold text-primary">ชนะมากที่สุด</span>
              <span class="font-display text-[34px] leading-tight font-bold break-words">
                {{ topPlayers.map((p) => p.name).join(', ') }}
              </span>
            </div>
            <div class="flex shrink-0 items-baseline gap-1.5 pb-1">
              <span class="font-display text-[40px] leading-none font-bold">
                {{ topPlayers[0]!.wins }}
              </span>
              <span class="text-sm text-muted">ชนะ จาก {{ topPlayers[0]!.played }} เกม</span>
            </div>
          </div>
          <p v-else class="py-2 text-center text-muted">ยังไม่มีเกมที่จบ</p>

          <div class="h-px bg-divider" />

          <table class="w-full table-fixed text-center">
            <colgroup>
              <col class="w-6" />
              <col />
              <col class="w-10" />
              <col class="w-10" />
              <col class="w-10" />
              <col class="w-13" />
            </colgroup>
            <thead>
              <tr class="h-7.5 text-xs font-semibold text-faint">
                <th scope="col">#</th>
                <th scope="col" class="pl-2 text-left">ผู้เล่น</th>
                <th scope="col">เล่น</th>
                <th scope="col">ชนะ</th>
                <th scope="col">แพ้</th>
                <th scope="col" class="text-right">% ชนะ</th>
              </tr>
            </thead>
            <tbody class="font-display font-semibold">
              <tr
                v-for="(player, index) in ranking"
                :key="player.id"
                class="h-12 border-t border-divider"
              >
                <td
                  :class="index === 0 && player.wins > 0 ? 'font-bold text-primary' : 'text-faint'"
                >
                  {{ index + 1 }}
                </td>
                <td
                  class="truncate pl-2 text-left font-body"
                  :class="index === 0 && player.wins > 0 ? 'font-semibold' : 'font-medium'"
                >
                  {{ player.name }}
                </td>
                <td class="text-muted">{{ player.played }}</td>
                <td>{{ player.wins }}</td>
                <td class="text-muted">{{ player.losses }}</td>
                <td class="text-right">{{ winRateText(player.winRate, player.played) }}</td>
              </tr>
            </tbody>
          </table>

          <p class="text-center text-xs text-faint">{{ footerText }}</p>
        </article>
      </div>

      <p v-if="unfinishedNote" class="px-4 pt-1 text-center text-xs text-muted">
        {{ unfinishedNote }}
      </p>
    </div>

    <footer class="flex shrink-0 flex-col gap-2.5 px-4 pt-3 pb-4">
      <button
        type="button"
        :disabled="finishedGames === 0 || sharing"
        class="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-primary font-display text-lg font-bold text-on-primary shadow-card active:scale-[0.98] disabled:bg-surface-2 disabled:text-faint disabled:shadow-none disabled:active:scale-100"
        @click="share"
      >
        <AppIcon name="share" />
        {{ sharing ? 'กำลังสร้างรูป…' : 'แชร์เป็นรูปภาพ' }}
      </button>
      <p v-if="shareMessage" role="status" class="-mt-1 text-center text-[13px] text-muted">
        {{ shareMessage }}
      </p>
      <p v-else-if="finishedGames === 0" class="-mt-1 text-center text-[13px] text-muted">
        แชร์ได้เมื่อจบอย่างน้อย 1 เกม
      </p>
      <div class="grid grid-cols-2 gap-2.5">
        <RouterLink
          :to="{ name: 'match' }"
          class="flex h-12 items-center justify-center rounded-[14px] text-[15px] font-semibold ring-1 ring-line ring-inset active:bg-surface-2"
        >
          กลับไปเล่นต่อ
        </RouterLink>
        <button
          type="button"
          class="h-12 rounded-[14px] bg-surface-2 text-[15px] font-semibold active:scale-[0.98]"
          @click="confirmOpen = true"
        >
          เริ่มรอบใหม่
        </button>
      </div>
    </footer>

    <BottomSheet
      v-model:open="confirmOpen"
      title="เริ่มรอบใหม่?"
      description="สถิติรอบนี้จะถูกล้าง · แชร์รูปสรุปไว้ก่อนได้"
    >
      <SheetAction
        danger
        title="ล้างสถิติและเริ่มรอบใหม่"
        description="กลับไปหน้าตั้งค่า รายชื่อผู้เล่นยังอยู่"
        @click="startNewRound"
        icon="reset"
      />
    </BottomSheet>
  </main>
</template>
