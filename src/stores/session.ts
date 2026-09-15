import { computed, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'

import { validateNewName, type AddPlayerError } from '@/game/names'
import type { Side } from '@/game/rules'
import {
  addPlayer as addPlayerToSession,
  createSession,
  currentGame,
  leaderboard,
  leaveQueue,
  playerStats,
  previewNextGame,
  rejoinPlayer,
  reorderQueue,
  scorePoint,
  startNextGame,
  streakOf,
  undoPoint,
  withdrawPlayer,
  type PlayerEntry,
  type PlayerStats,
  type SessionState,
} from '@/game/session'
import { sanitizeSettings, type GameSettings } from '@/game/settings'
import { readJson, writeJson } from './storage'

export const SESSION_STORAGE_KEY = 'ttc:session:v1'

function load(): SessionState | null {
  const data = readJson(SESSION_STORAGE_KEY) as Partial<SessionState> | null | undefined
  const valid =
    typeof data === 'object' &&
    data !== null &&
    typeof data.court === 'object' &&
    data.court !== null &&
    [data.players, data.queue, data.inactive, data.points, data.history].every(Array.isArray)
  return valid ? ({ ...data, settings: sanitizeSettings(data.settings) } as SessionState) : null
}

/** การแข่งรอบปัจจุบัน — ห่อ game engine และบันทึกลงเครื่องทุกครั้งที่เปลี่ยน */
export const useSessionStore = defineStore('session', () => {
  // shallowRef: engine คืน state ใหม่ทุกครั้ง (ไม่แก้ในที่) → ไม่ต้องห่อ proxy ลึกทั้งก้อน
  // ซึ่งช้ามากเมื่อ history ยาว (JSON clone / stats ต้องวิ่งผ่าน proxy ทุก property)
  const state = shallowRef<SessionState | null>(load())

  const game = computed(() => (state.value ? currentGame(state.value) : null))
  const nextGamePreview = computed(() => (state.value ? previewNextGame(state.value) : null))
  const stats = computed(
    () =>
      new Map<string, PlayerStats>(
        (state.value ? playerStats(state.value) : []).map((s) => [s.id, s]),
      ),
  )
  /** state สำหรับสรุปผล — นับเกมที่ชนะแล้วแต่ยังไม่ได้กดเริ่มเกมถัดไปด้วย */
  const settledState = computed(() =>
    state.value && nextGamePreview.value ? startNextGame(state.value) : state.value,
  )
  const ranking = computed(() => (settledState.value ? leaderboard(settledState.value) : []))
  const finishedGames = computed(
    () => settledState.value?.history.filter((g) => g.kind === 'normal').length ?? 0,
  )

  function playerName(id: string | null): string {
    return state.value?.players.find((p) => p.id === id)?.name ?? ''
  }

  /** ชื่อ + สถิติชนะ/แพ้ สำหรับแสดงในรายชื่อ */
  function playerItem(id: string) {
    const s = stats.value.get(id)
    return { id, name: playerName(id), wins: s?.wins ?? 0, losses: s?.losses ?? 0 }
  }

  function streak(id: string | null): number {
    return state.value && id ? streakOf(state.value, id) : 0
  }

  function update(action: (s: SessionState) => SessionState) {
    if (state.value) state.value = action(state.value)
  }

  function start(settings: GameSettings, players: readonly PlayerEntry[]) {
    state.value = { ...createSession(settings, players), startedAt: new Date().toISOString() }
  }

  const score = (side: Side) => update((s) => scorePoint(s, side))
  const undo = () => update(undoPoint)
  const nextGame = () => update(startNextGame)

  /** เพิ่มผู้เล่นระหว่างการแข่ง → ต่อท้ายคิว */
  function addPlayer(rawName: string): AddPlayerError | null {
    if (!state.value) return null
    const result = validateNewName(
      rawName,
      state.value.players.map((p) => p.name),
    )
    if (result.error) return result.error
    update((s) => addPlayerToSession(s, { id: crypto.randomUUID(), name: result.name }))
    return null
  }

  const reorder = (ids: readonly string[]) => update((s) => reorderQueue(s, ids))
  const leave = (id: string) => update((s) => leaveQueue(s, id))
  const rejoin = (id: string) => update((s) => rejoinPlayer(s, id))
  const withdraw = (id: string) => update((s) => withdrawPlayer(s, id))

  function end() {
    state.value = null
  }

  watch(state, (value) => writeJson(SESSION_STORAGE_KEY, value))

  return {
    state,
    game,
    nextGamePreview,
    stats,
    ranking,
    finishedGames,
    playerName,
    playerItem,
    streak,
    start,
    score,
    undo,
    nextGame,
    addPlayer,
    reorder,
    leave,
    rejoin,
    withdraw,
    end,
  }
})
