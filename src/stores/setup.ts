import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { MAX_NAME_LENGTH, validateNewName, type AddPlayerError } from '@/game/names'
import { defaultSettings, sanitizeSettings, type GameSettings } from '@/game/settings'
import { readJson, writeJson } from './storage'

export { MAX_NAME_LENGTH, type AddPlayerError }

export interface PlayerEntry {
  id: string
  name: string
}

export const SETUP_STORAGE_KEY = 'ttc:setup:v1'

function sanitizePlayers(input: unknown): PlayerEntry[] {
  if (!Array.isArray(input)) return []
  return input
    .filter(
      (p): p is PlayerEntry =>
        typeof p === 'object' &&
        p !== null &&
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        p.name.trim() !== '',
    )
    .map((p) => ({ id: p.id, name: p.name.trim().slice(0, MAX_NAME_LENGTH) }))
}

function load(): { settings: GameSettings; players: PlayerEntry[] } {
  const data = readJson(SETUP_STORAGE_KEY)
  if (typeof data !== 'object' || data === null) {
    return { settings: defaultSettings(), players: [] }
  }
  const { settings, players } = data as { settings?: unknown; players?: unknown }
  return { settings: sanitizeSettings(settings), players: sanitizePlayers(players) }
}

/** ค่าตั้งค่าเกมและรายชื่อผู้เล่นในหน้าแรก — จำไว้ใช้ครั้งหน้า */
export const useSetupStore = defineStore('setup', () => {
  const saved = load()
  const settings = ref<GameSettings>(saved.settings)
  const players = ref<PlayerEntry[]>(saved.players)

  function addPlayer(rawName: string): AddPlayerError | null {
    const result = validateNewName(
      rawName,
      players.value.map((p) => p.name),
    )
    if (result.error) return result.error
    players.value.push({ id: crypto.randomUUID(), name: result.name })
    return null
  }

  function removePlayer(id: string) {
    players.value = players.value.filter((p) => p.id !== id)
  }

  watch(
    [settings, players],
    () => writeJson(SETUP_STORAGE_KEY, { settings: settings.value, players: players.value }),
    { deep: true },
  )

  return { settings, players, addPlayer, removePlayer }
})
