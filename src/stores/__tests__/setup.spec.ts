import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import { MAX_NAME_LENGTH, SETUP_STORAGE_KEY, useSetupStore } from '../setup'

describe('setup store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('adds players with trimmed names', () => {
    const store = useSetupStore()
    expect(store.addPlayer('  ต้น  ')).toBeNull()
    expect(store.players.map((p) => p.name)).toEqual(['ต้น'])
  })

  it('rejects empty and duplicate names', () => {
    const store = useSetupStore()
    store.addPlayer('Boy')
    expect(store.addPlayer('   ')).toBe('empty')
    expect(store.addPlayer(' boy ')).toBe('duplicate')
    expect(store.players).toHaveLength(1)
  })

  it('cuts names longer than the limit', () => {
    const store = useSetupStore()
    store.addPlayer('ก'.repeat(MAX_NAME_LENGTH + 5))
    expect(store.players[0]?.name).toHaveLength(MAX_NAME_LENGTH)
  })

  it('removes a player', () => {
    const store = useSetupStore()
    store.addPlayer('ต้น')
    store.addPlayer('บอย')
    store.removePlayer(store.players[0]!.id)
    expect(store.players.map((p) => p.name)).toEqual(['บอย'])
  })

  it('remembers settings and players for next time', async () => {
    const store = useSetupStore()
    store.settings.targetScore = 7
    store.addPlayer('ต้น')
    await nextTick()

    setActivePinia(createPinia())
    const reloaded = useSetupStore()
    expect(reloaded.settings.targetScore).toBe(7)
    expect(reloaded.players.map((p) => p.name)).toEqual(['ต้น'])
  })

  it('falls back to defaults when saved data is corrupt', () => {
    localStorage.setItem(SETUP_STORAGE_KEY, '{not json')
    const store = useSetupStore()
    expect(store.settings.targetScore).toBe(5)
    expect(store.players).toEqual([])
  })
})
