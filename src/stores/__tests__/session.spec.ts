import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import { defaultSettings } from '@/game/settings'
import { SESSION_STORAGE_KEY, useSessionStore } from '../session'

/** กติกา 11 แต้ม (test เขียนตามนี้ ไม่ขึ้นกับค่าเริ่มต้นของแอป) */
const SETTINGS = { ...defaultSettings(), targetScore: 11 as const }

const PLAYERS = [
  { id: 'ton', name: 'ต้น' },
  { id: 'boy', name: 'บอย' },
  { id: 'jay', name: 'เจ' },
]

describe('session store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    const store = useSessionStore()
    expect(store.state).toBeNull()
    expect(store.game).toBeNull()
  })

  it('plays a game through the engine', () => {
    const store = useSessionStore()
    store.start(SETTINGS, PLAYERS)
    expect(store.playerName(store.game!.red)).toBe('ต้น')

    store.score('red')
    store.score('blue')
    store.undo()
    expect(store.game!.status.score).toEqual({ red: 1, blue: 0 })

    for (let i = 0; i < 10; i++) store.score('red')
    expect(store.nextGamePreview).toMatchObject({ winnerId: 'ton', red: 'ton', blue: 'jay' })

    store.nextGame()
    expect(store.game!.no).toBe(2)
    expect(store.stats.get('ton')).toMatchObject({ wins: 1 })
    expect(store.streak('ton')).toBe(1)
  })

  it('restores the session after the app restarts', async () => {
    const store = useSessionStore()
    store.start(SETTINGS, PLAYERS)
    store.score('blue')
    await nextTick()

    setActivePinia(createPinia())
    expect(useSessionStore().game!.status.score).toEqual({ red: 0, blue: 1 })
  })

  it('forgets the session when it ends', async () => {
    const store = useSessionStore()
    store.start(SETTINGS, PLAYERS)
    await nextTick()
    store.end()
    await nextTick()
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('ignores corrupt saved data', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, '{"players": 5}')
    expect(useSessionStore().state).toBeNull()
  })

  it('adds players during the session and rejects duplicate names', () => {
    const store = useSessionStore()
    store.start(SETTINGS, PLAYERS)
    expect(store.addPlayer('  ฝน ')).toBeNull()
    expect(store.addPlayer('เจ')).toBe('duplicate')
    expect(store.addPlayer(' ')).toBe('empty')
    expect(store.state!.queue.map(store.playerName)).toEqual(['เจ', 'ฝน'])
  })

  it('manages the queue: reorder, leave, rejoin and withdraw', () => {
    const store = useSessionStore()
    store.start(SETTINGS, PLAYERS)
    store.addPlayer('ฝน')
    const [jay, fon] = store.state!.queue as [string, string]

    store.reorder([fon, jay])
    expect(store.state!.queue).toEqual([fon, jay])

    store.leave(fon)
    expect(store.state!.inactive).toEqual([fon])

    store.rejoin(fon)
    expect(store.state!.queue).toEqual([jay, fon])

    store.withdraw('ton')
    expect(store.state!.court.red).toBe(jay)
    expect(store.state!.inactive).toEqual(['ton'])
  })
})
