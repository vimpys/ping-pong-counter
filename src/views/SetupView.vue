<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { VueDraggable } from 'vue-draggable-plus'

import AppIcon from '@/components/AppIcon.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import PageHeader from '@/components/PageHeader.vue'
import PlayerNameForm from '@/components/PlayerNameForm.vue'
import SegmentedControl from '@/components/SegmentedControl.vue'
import SheetAction from '@/components/SheetAction.vue'
import StepperInput from '@/components/StepperInput.vue'
import ToggleSwitch from '@/components/ToggleSwitch.vue'
import { DEUCE_LEADS, SETTINGS_LIMITS, TARGET_SCORES } from '@/game/settings'
import { useBackButton } from '@/native/backButton'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const session = useSessionStore()
const { settings, players } = storeToRefs(setup)
const router = useRouter()

const targetOptions = TARGET_SCORES.map((value) => ({ value, label: String(value) }))
const deuceOptions = DEUCE_LEADS.map((value) => ({ value, label: `${value} แต้ม` }))

const deuceHint = computed(() => {
  const tie = settings.value.targetScore - 1
  return settings.value.deuceLead === 1
    ? `เสมอ ${tie}–${tie} แล้วลูกถัดไปชนะเลย`
    : `ดิวเมื่อเสมอ ${tie}–${tie} · ระหว่างดิวสลับเสิร์ฟทุกลูก`
})

const missingPlayers = computed(() => Math.max(0, 2 - players.value.length))

const confirmReplaceOpen = ref(false)

function startGame() {
  if (missingPlayers.value > 0) return
  // มีการแข่งขันค้างอยู่ → ถามก่อนล้าง
  if (session.state && !confirmReplaceOpen.value) {
    confirmReplaceOpen.value = true
    return
  }
  confirmReplaceOpen.value = false
  session.start(settings.value, players.value)
  router.push({ name: 'match' })
}

function continueOldRound() {
  confirmReplaceOpen.value = false
  router.push({ name: 'match' })
}

useBackButton(() => router.push({ name: 'home' }))
</script>

<template>
  <main class="flex h-full flex-col bg-doodles">
    <div class="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pt-3 pb-6">
      <PageHeader
        title="ตั้งค่าเกม"
        subtitle="กำหนดกติกาก่อนเริ่มเล่น"
        back-label="กลับหน้าแรก"
        @back="router.push({ name: 'home' })"
      />

      <section class="flex flex-col gap-2.5">
        <h2 class="px-0.5 text-[15px] font-bold text-ink">แข่งถึงกี่แต้ม</h2>
        <SegmentedControl
          v-model="settings.targetScore"
          name="target-score"
          label="แข่งถึงกี่แต้ม"
          size="lg"
          :options="targetOptions"
        />
      </section>

      <section class="flex flex-col rounded-2xl bg-surface shadow-card">
        <div class="flex min-h-17 items-center justify-between gap-3 py-3 pr-3 pl-4">
          <div class="flex flex-col gap-0.5">
            <h2 class="font-semibold">สลับเสิร์ฟทุก</h2>
            <p class="text-[13px] text-muted">คนละกี่ลูกก่อนเปลี่ยนมือ</p>
          </div>
          <StepperInput
            v-model="settings.serveEvery"
            label="จำนวนลูกก่อนสลับเสิร์ฟ"
            :min="SETTINGS_LIMITS.serveEvery.min"
            :max="SETTINGS_LIMITS.serveEvery.max"
          />
        </div>
        <div class="mx-4 h-px bg-divider" />
        <div class="flex flex-col gap-3 pt-3.5 pr-3 pb-4 pl-4">
          <div class="flex flex-col gap-0.5">
            <h2 class="font-semibold">ดิว · ต้องนำกี่แต้มถึงชนะ</h2>
            <p class="text-[13px] text-pretty text-muted">{{ deuceHint }}</p>
          </div>
          <SegmentedControl
            v-model="settings.deuceLead"
            name="deuce-lead"
            label="ดิวต้องนำกี่แต้ม"
            :options="deuceOptions"
          />
        </div>
      </section>

      <section class="flex flex-col gap-2.5">
        <h2 class="px-0.5 text-[15px] font-bold text-ink">กติกาพิเศษ</h2>
        <div class="flex flex-col rounded-2xl bg-surface shadow-card">
          <div class="flex min-h-17 items-center justify-between gap-3 px-4 py-3">
            <div class="flex flex-col gap-0.5">
              <h3 class="font-semibold">ชนะติดกันครบ ให้ออกทั้งคู่</h3>
              <p class="text-[13px] text-muted">เปิดโต๊ะให้คนในคิวได้เล่นบ้าง</p>
            </div>
            <ToggleSwitch
              v-model="settings.streakRule.enabled"
              label="ชนะติดกันครบ ให้ออกทั้งคู่"
            />
          </div>
          <div class="mx-4 h-px bg-divider" />
          <div class="flex min-h-17 items-center justify-between gap-3 py-3 pr-3 pl-4">
            <h3
              class="font-medium transition-opacity"
              :class="{ 'opacity-35': !settings.streakRule.enabled }"
            >
              จำนวนเกมที่ชนะติด
            </h3>
            <StepperInput
              v-model="settings.streakRule.wins"
              label="จำนวนเกมที่ชนะติด"
              :min="SETTINGS_LIMITS.streakWins.min"
              :max="SETTINGS_LIMITS.streakWins.max"
              :disabled="!settings.streakRule.enabled"
            />
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-3">
        <div class="flex items-baseline justify-between">
          <h2 class="px-0.5 text-[15px] font-bold text-ink">ผู้เล่น</h2>
          <p v-if="players.length > 0" class="text-[13px] text-muted">
            {{ players.length }} คน · ลากเพื่อจัดลำดับ
          </p>
        </div>

        <PlayerNameForm :submit="setup.addPlayer" />

        <VueDraggable
          v-if="players.length > 0"
          v-model="players"
          tag="ul"
          handle=".drag-handle"
          :animation="150"
          ghost-class="opacity-30"
          class="flex flex-col rounded-2xl bg-surface py-1 shadow-card"
        >
          <li
            v-for="(player, index) in players"
            :key="player.id"
            class="flex h-13 items-center gap-3 bg-surface pr-1 pl-1.5"
          >
            <span
              class="drag-handle flex h-11 w-7 shrink-0 cursor-grab touch-none items-center justify-center text-faint"
              aria-hidden="true"
            >
              <AppIcon name="grip" />
            </span>
            <span
              v-if="index < 2"
              class="size-2.5 shrink-0 rounded-full"
              :class="index === 0 ? 'bg-red-side' : 'bg-blue-side'"
            />
            <span
              v-else
              class="w-2.5 shrink-0 text-center font-display text-sm font-semibold text-faint"
            >
              {{ index + 1 }}
            </span>
            <span class="min-w-0 flex-1 truncate font-medium">{{ player.name }}</span>
            <span v-if="index === 0" class="shrink-0 text-xs font-semibold text-red-side">
              ลงก่อน · ฝั่งแดง
            </span>
            <span v-else-if="index === 1" class="shrink-0 text-xs font-semibold text-blue-side">
              ลงก่อน · ฝั่งน้ำเงิน
            </span>
            <button
              type="button"
              :aria-label="`ลบ ${player.name}`"
              class="flex size-11 shrink-0 items-center justify-center text-faint active:text-ink"
              @click="setup.removePlayer(player.id)"
            >
              <AppIcon name="close" :size="18" />
            </button>
          </li>
        </VueDraggable>
        <p
          v-else
          class="rounded-2xl bg-surface px-4 py-5 text-center shadow-card text-sm text-muted"
        >
          ยังไม่มีผู้เล่น · เพิ่มอย่างน้อย 2 คน
        </p>
      </section>
    </div>

    <footer class="shrink-0 px-4 pt-2 pb-4">
      <button
        type="button"
        :disabled="missingPlayers > 0"
        class="flex h-15 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary font-display text-xl font-bold text-on-primary shadow-[0_10px_24px_rgb(236_79_147/0.35)] active:scale-[0.98] disabled:shadow-none disabled:bg-surface-2 disabled:text-faint disabled:active:scale-100"
        @click="startGame"
      >
        <template v-if="missingPlayers > 0">เพิ่มผู้เล่นอีก {{ missingPlayers }} คน</template>
        <template v-else>
          <AppIcon name="play" />
          ยืนยันและเริ่มเกม
        </template>
      </button>
    </footer>

    <BottomSheet
      v-model:open="confirmReplaceOpen"
      title="มีการแข่งขันค้างอยู่"
      :description="`รอบเดิมเล่นไปแล้ว ${session.finishedGames} เกม · เริ่มรอบใหม่จะล้างสถิติรอบเดิม`"
    >
      <SheetAction
        danger
        title="ล้างสถิติและเริ่มรอบใหม่"
        description="ใช้กติกาและรายชื่อในหน้านี้"
        @click="startGame"
        icon="reset"
      />
      <SheetAction
        title="กลับไปเล่นรอบเดิมต่อ"
        description="ไม่เปลี่ยนแปลงอะไร"
        @click="continueOldRound"
        icon="play"
      />
    </BottomSheet>
  </main>
</template>
