import { describe, expect, it } from 'vitest'

import { deuceTiesOf, gameStatus, isDeuce, scoreOf, serveInfo, winnerOf, type Side } from '../rules'
import { defaultSettings, type GameSettings } from '../settings'

const rules = (overrides: Partial<GameSettings> = {}): GameSettings => ({
  ...defaultSettings(),
  targetScore: 11,
  ...overrides,
})

/** 'rrb' → ['red', 'red', 'blue'] */
const pts = (sequence: string): Side[] => [...sequence].map((c) => (c === 'r' ? 'red' : 'blue'))

/** แต้มเสมอ n–n สลับกันทีละลูก */
const tied = (n: number) => pts('rb'.repeat(n))

describe('winnerOf', () => {
  const cases: [Partial<GameSettings>, number, number, Side | null][] = [
    // T = 11, D = 2
    [{}, 11, 9, 'red'],
    [{}, 11, 10, null],
    [{}, 12, 10, 'red'],
    [{}, 10, 12, 'blue'],
    [{}, 14, 13, null],
    [{}, 15, 13, 'red'],
    // T = 5, D = 2
    [{ targetScore: 5 }, 5, 3, 'red'],
    [{ targetScore: 5 }, 5, 4, null],
    [{ targetScore: 5 }, 4, 6, 'blue'],
    // T = 7, D = 1 → ไม่ต้องนำ 2
    [{ targetScore: 7, deuceLead: 1 }, 7, 6, 'red'],
    [{ targetScore: 7, deuceLead: 1 }, 6, 6, null],
    // T = 11, D = 3
    [{ deuceLead: 3 }, 11, 9, 'red'], // อีกฝั่งยังไม่ถึง 10 → ชนะเลย
    [{ deuceLead: 3 }, 12, 10, null],
    [{ deuceLead: 3 }, 13, 10, 'red'],
    [{}, 3, 0, null],
  ]

  it.each(cases)('%o %i–%i → %s', (overrides, red, blue, expected) => {
    expect(winnerOf({ red, blue }, rules(overrides))).toBe(expected)
  })
})

describe('isDeuce', () => {
  it('starts when both sides reach T-1', () => {
    expect(isDeuce({ red: 10, blue: 10 }, rules())).toBe(true)
    expect(isDeuce({ red: 10, blue: 9 }, rules())).toBe(false)
    expect(isDeuce({ red: 4, blue: 4 }, rules({ targetScore: 5 }))).toBe(true)
  })
})

describe('deuceTiesOf', () => {
  it('counts every tie from T-1 onwards', () => {
    const five = rules({ targetScore: 5 })
    expect(deuceTiesOf(pts('rbrbrb'), five)).toBe(0) // 3–3
    expect(deuceTiesOf(tied(4), five)).toBe(1) // 4–4
    expect(deuceTiesOf(tied(7), five)).toBe(4) // 4–4, 5–5, 6–6, 7–7
    expect(deuceTiesOf([...tied(7), 'red'], five)).toBe(4) // 8–7 ไม่ใช่เสมอ
    expect(gameStatus(tied(10), 'red', rules()).deuceTies).toBe(1) // 10–10 ที่ 11 แต้ม
  })
})

describe('serveInfo', () => {
  it('changes server every S balls before deuce', () => {
    const settings = rules({ serveEvery: 2 })
    const at = (n: number) => serveInfo(pts('r'.repeat(n)), 'red', settings)
    expect(at(0)).toEqual({ server: 'red', ball: 1 })
    expect(at(1)).toEqual({ server: 'red', ball: 2 })
    expect(at(2)).toEqual({ server: 'blue', ball: 1 })
    expect(at(3)).toEqual({ server: 'blue', ball: 2 })
    expect(at(4)).toEqual({ server: 'red', ball: 1 })
  })

  it('alternates every ball when S = 1', () => {
    const settings = rules({ serveEvery: 1 })
    expect(serveInfo(pts(''), 'red', settings).server).toBe('red')
    expect(serveInfo(pts('b'), 'red', settings).server).toBe('blue')
    expect(serveInfo(pts('bb'), 'red', settings).server).toBe('red')
  })

  it('starts with the chosen first server', () => {
    expect(serveInfo([], 'blue', rules()).server).toBe('blue')
    expect(serveInfo(pts('rr'), 'blue', rules()).server).toBe('red')
  })

  it('alternates every ball during deuce', () => {
    const settings = rules() // T = 11, S = 2
    expect(serveInfo(tied(10), 'red', settings)).toEqual({ server: 'red', ball: null })
    expect(serveInfo([...tied(10), 'red'], 'red', settings)).toEqual({ server: 'blue', ball: null })
    expect(serveInfo([...tied(10), 'red', 'blue'], 'red', settings).server).toBe('red')
    expect(serveInfo([...tied(10), 'red', 'blue', 'blue'], 'red', settings).server).toBe('blue')
  })

  it('continues deuce rotation from whoever was due to serve', () => {
    // T = 5, S = 5: ลูกที่ 1–5 แดง, 6–10 น้ำเงิน → เสมอ 4–4 (ลูกที่ 9) น้ำเงินเสิร์ฟ
    const settings = rules({ targetScore: 5, serveEvery: 5 })
    expect(serveInfo(tied(4), 'red', settings).server).toBe('blue')
    expect(serveInfo([...tied(4), 'blue'], 'red', settings).server).toBe('red')
  })
})

describe('gameStatus', () => {
  it('reports score, last scorer and winner', () => {
    const status = gameStatus(pts('rrb'), 'red', rules())
    expect(status.score).toEqual({ red: 2, blue: 1 })
    expect(status.lastScorer).toBe('blue')
    expect(status.winner).toBeNull()
    expect(status.isDeuce).toBe(false)
  })

  it('has no last scorer at 0–0', () => {
    expect(gameStatus([], 'red', rules()).lastScorer).toBeNull()
    expect(scoreOf([])).toEqual({ red: 0, blue: 0 })
  })
})
