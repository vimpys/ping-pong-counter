<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import BottomSheet from '@/components/BottomSheet.vue'
import PlayerNameForm from '@/components/PlayerNameForm.vue'
import SheetAction from '@/components/SheetAction.vue'
import { SIDES } from '@/game/rules'
import { useSessionStore } from '@/stores/session'
import type { MatchSheetState } from './types'

/** bottom sheet ของหน้าแข่ง: เพิ่มผู้เล่น / ถอนตัว / ออกจากคิว / กลับเข้า / ออกจากหน้าแข่ง */
const sheet = defineModel<MatchSheetState | null>('sheet', { required: true })

const session = useSessionStore()
const router = useRouter()
const nameForm = ref<InstanceType<typeof PlayerNameForm>>()

const open = computed({
  get: () => sheet.value !== null,
  set: (value: boolean) => {
    if (!value) sheet.value = null
  },
})

watch(
  () => sheet.value?.kind,
  async (kind) => {
    if (kind !== 'add') return
    await nextTick()
    nameForm.value?.focus()
  },
)

const player = computed(() =>
  sheet.value && 'playerId' in sheet.value ? session.playerItem(sheet.value.playerId) : null,
)
const queue = computed(() => session.state?.queue ?? [])
const game = computed(() => session.game)

const title = computed(() => {
  const s = sheet.value
  if (s?.kind === 'add') return 'เพิ่มผู้เล่น'
  if (s?.kind === 'leave') return 'ออกจากหน้าแข่ง?'
  const side = SIDES.find((x) => session.state?.court[x] === player.value?.id)
  return s?.kind === 'court' && side
    ? `${player.value?.name} · กำลังแข่ง${side === 'red' ? 'ฝั่งแดง' : 'ฝั่งน้ำเงิน'}`
    : (player.value?.name ?? '')
})

const record = computed(() =>
  player.value ? `ชนะ ${player.value.wins} แพ้ ${player.value.losses}` : '',
)

const description = computed(() => {
  const score = game.value?.status.score
  switch (sheet.value?.kind) {
    case 'add':
      return 'ผู้เล่นใหม่จะต่อท้ายคิวรอเล่น'
    case 'leave':
      return 'การแข่งขันบันทึกไว้แล้ว · กด "เล่นต่อ" ที่หน้าแรกเพื่อกลับมา'
    case 'court':
      return game.value && score
        ? `เกมที่ ${game.value.no} · สกอร์ ${score.red}–${score.blue}`
        : 'รอคู่แข่ง'
    case 'queue':
      return `ลำดับที่ ${queue.value.indexOf(player.value?.id ?? '') + 1} ในคิว · ${record.value}`
    case 'inactive':
      return `ออกจากการแข่งขันอยู่ · ${record.value}`
    default:
      return ''
  }
})

const leaveDescription = computed(() => {
  const g = game.value
  return g
    ? `เกมที่ ${g.no} ค้างไว้ที่สกอร์ ${g.status.score.red}–${g.status.score.blue}`
    : 'กลับมาเล่นต่อได้ทุกเมื่อ'
})

const withdrawDescription = computed(() => {
  const next = queue.value[0]
  const replacement = next ? `${session.playerName(next)}ลงแทน` : 'รอผู้เล่นเพิ่ม'
  return `ยกเลิกเกมนี้ ไม่นับผล · ${player.value?.name}ย้ายไปท้ายรายชื่อ · ${replacement}`
})

const rejoinDescription = computed(() =>
  SIDES.some((side) => session.state?.court[side] === null)
    ? 'ลงสนามทันที · นับสถิติต่อจากเดิม'
    : `ต่อท้ายคิวเป็นลำดับที่ ${queue.value.length + 1} · นับสถิติต่อจากเดิม`,
)

function run(action: (id: string) => void) {
  const id = player.value?.id
  sheet.value = null
  if (id) action(id)
}

function leaveMatch() {
  sheet.value = null
  router.push({ name: 'home' })
}
</script>

<template>
  <BottomSheet v-model:open="open" :title="title" :description="description">
    <PlayerNameForm v-if="sheet?.kind === 'add'" ref="nameForm" :submit="session.addPlayer" />
    <SheetAction
      v-else-if="sheet?.kind === 'leave'"
      icon="home"
      title="ออกไปหน้าแรก"
      :description="leaveDescription"
      @click="leaveMatch"
    />
    <SheetAction
      v-else-if="sheet?.kind === 'court'"
      icon="flag"
      danger
      title="ถอนตัว"
      :description="withdrawDescription"
      @click="run(session.withdraw)"
    />
    <SheetAction
      v-else-if="sheet?.kind === 'queue'"
      icon="exit"
      danger
      title="ออกจากการแข่งขัน"
      description="ย้ายไปท้ายรายชื่อ · เก็บสถิติไว้ กลับเข้าการแข่งขันได้ทุกเมื่อ"
      @click="run(session.leave)"
    />
    <SheetAction
      v-else-if="sheet?.kind === 'inactive'"
      icon="rejoin"
      title="กลับเข้าการแข่งขัน"
      :description="rejoinDescription"
      @click="run(session.rejoin)"
    />
  </BottomSheet>
</template>
