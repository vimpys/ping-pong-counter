import { describe, expect, it } from 'vitest'

import type { Side } from '../rules'
import {
  addPlayer,
  createSession,
  currentGame,
  leaderboard,
  leaveQueue,
  playerStats,
  previewNextGame,
  rejoinPlayer,
  replaceCourtPlayer,
  reorderQueue,
  scorePoint,
  setFirstServer,
  SessionError,
  startNextGame,
  streakOf,
  swapSides,
  undoPoint,
  withdrawPlayer,
  type SessionState,
} from '../session'
import { defaultSettings, type GameSettings } from '../settings'

const PLAYERS = ['ton', 'boy', 'jay', 'fon', 'mew'].map((id) => ({ id, name: id }))

function newSession(count = 5, overrides: Partial<GameSettings> = {}): SessionState {
  return createSession(
    { ...defaultSettings(), targetScore: 11, ...overrides },
    PLAYERS.slice(0, count),
  )
}

function score(state: SessionState, sequence: string): SessionState {
  return [...sequence].reduce<SessionState>(
    (s, c) => scorePoint(s, c === 'r' ? 'red' : 'blue'),
    state,
  )
}

/** ให้ฝั่ง `side` ชนะเกมปัจจุบัน 11–0 แล้วเริ่มเกมถัดไป */
function winGame(state: SessionState, side: Side): SessionState {
  let s = state
  while (!currentGame(s)!.status.winner) s = scorePoint(s, side)
  return startNextGame(s)
}

const court = (state: SessionState) => [state.court.red, state.court.blue]
const stat = (state: SessionState, id: string) => playerStats(state).find((p) => p.id === id)!

describe('createSession', () => {
  it('puts the first two players on court and the rest in the queue', () => {
    const state = newSession()
    expect(court(state)).toEqual(['ton', 'boy'])
    expect(state.queue).toEqual(['jay', 'fon', 'mew'])
    expect(currentGame(state)?.no).toBe(1)
  })

  it('needs at least two unique players', () => {
    expect(() => newSession(1)).toThrow(SessionError)
    expect(() => createSession(defaultSettings(), [PLAYERS[0]!, PLAYERS[0]!])).toThrow(SessionError)
  })

  it('does not share settings with the caller', () => {
    const settings = defaultSettings()
    const state = createSession(settings, PLAYERS)
    settings.streakRule.wins = 5
    expect(state.settings.streakRule.wins).toBe(3)
  })
})

describe('scoring and undo', () => {
  it('scores points without mutating the previous state', () => {
    const start = newSession()
    const state = score(start, 'rrb')
    expect(currentGame(state)!.status.score).toEqual({ red: 2, blue: 1 })
    expect(start.points).toEqual([])
  })

  it('undoes the last point', () => {
    const state = undoPoint(score(newSession(), 'rrb'))
    expect(currentGame(state)!.status.score).toEqual({ red: 2, blue: 0 })
    const empty = newSession()
    expect(undoPoint(empty)).toBe(empty)
  })

  it('blocks scoring after the game is won until the next game starts', () => {
    const won = score(newSession(), 'r'.repeat(11))
    expect(currentGame(won)!.status.winner).toBe('red')
    expect(() => scorePoint(won, 'blue')).toThrow(SessionError)
  })

  it('can undo the winning point and keep playing', () => {
    const won = score(newSession(), 'r'.repeat(11))
    const undone = undoPoint(won)
    expect(currentGame(undone)!.status.winner).toBeNull()
    expect(currentGame(scorePoint(undone, 'blue'))!.status.score).toEqual({ red: 10, blue: 1 })
  })

  it('refuses to start the next game before there is a winner', () => {
    expect(() => startNextGame(score(newSession(), 'rr'))).toThrow(SessionError)
  })
})

describe('rotation', () => {
  it('keeps the winner, sends the loser to the back and brings in the next player', () => {
    const state = winGame(newSession(), 'red')
    expect(court(state)).toEqual(['ton', 'jay'])
    expect(state.queue).toEqual(['fon', 'mew', 'boy'])
    expect(state.points).toEqual([])
    expect(state.history).toHaveLength(1)
    expect(currentGame(state)?.no).toBe(2)
    expect(streakOf(state, 'ton')).toBe(1)
  })

  it('sends both players to the back when the winner completes the streak', () => {
    let state = newSession()
    state = winGame(state, 'red') // ton ชนะ boy
    state = winGame(state, 'red') // ton ชนะ jay
    const beforeThird = score(state, 'r'.repeat(11))
    expect(previewNextGame(beforeThird)).toMatchObject({
      winnerId: 'ton',
      loserId: 'fon',
      streakCompleted: true,
      red: 'mew',
      blue: 'boy',
      firstServer: 'red',
    })

    state = startNextGame(beforeThird) // ton ชนะ fon ครบ 3
    expect(court(state)).toEqual(['mew', 'boy'])
    expect(state.queue).toEqual(['jay', 'fon', 'ton'])
    expect(state.streak).toBeNull()
  })

  it('lets the winner stay on when the streak rule is off', () => {
    let state = newSession(5, { streakRule: { enabled: false, wins: 3 } })
    for (let i = 0; i < 4; i++) state = winGame(state, 'red')
    expect(state.court.red).toBe('ton')
    expect(streakOf(state, 'ton')).toBe(4)
  })

  it('resets the streak when the champion loses', () => {
    let state = winGame(newSession(), 'red') // ton ชนะ boy
    state = winGame(state, 'blue') // jay ชนะ ton
    expect(court(state)).toEqual(['fon', 'jay'])
    expect(streakOf(state, 'jay')).toBe(1)
    expect(streakOf(state, 'ton')).toBe(0)
  })

  it('works with only two players', () => {
    let state = newSession(2, { streakRule: { enabled: true, wins: 2 } })
    state = winGame(state, 'red')
    expect(court(state)).toEqual(['ton', 'boy'])
    state = winGame(state, 'red') // ครบ 2 → ออกทั้งคู่ แล้วกลับมาเล่นกันเอง
    expect(court(state)).toEqual(['boy', 'ton'])
    expect(state.streak).toBeNull()
  })

  it('previews exactly what starting the next game does', () => {
    const won = score(newSession(), 'b'.repeat(11))
    const preview = previewNextGame(won)!
    const next = startNextGame(won)
    expect([preview.red, preview.blue]).toEqual(court(next))
    expect(preview.streakCompleted).toBe(false)
    expect(preview.firstServer).toBe(next.firstServer)
    expect(previewNextGame(newSession())).toBeNull()
  })
})

describe('queue management', () => {
  it('adds a player to the end of the queue', () => {
    const state = addPlayer(newSession(), { id: 'bank', name: 'แบงค์' })
    expect(state.queue[state.queue.length - 1]).toBe('bank')
    expect(() => addPlayer(state, { id: 'bank', name: 'ซ้ำ' })).toThrow(SessionError)
  })

  it('reorders the queue', () => {
    const state = reorderQueue(newSession(), ['fon', 'jay', 'mew'])
    expect(state.queue).toEqual(['fon', 'jay', 'mew'])
    expect(() => reorderQueue(state, ['fon', 'jay'])).toThrow(SessionError)
    expect(() => reorderQueue(state, ['fon', 'jay', 'ton'])).toThrow(SessionError)
    expect(() => reorderQueue(state, ['fon', 'fon', 'jay'])).toThrow(SessionError)
  })

  it('moves a leaving player to the inactive list and back to the queue on rejoin', () => {
    let state = winGame(newSession(), 'red') // boy แพ้ → คิว [fon, mew, boy], boy แพ้ 1
    state = leaveQueue(state, 'fon')
    expect(state.queue).toEqual(['mew', 'boy'])
    expect(state.inactive).toEqual(['fon'])
    expect(stat(state, 'fon').active).toBe(false)

    state = rejoinPlayer(state, 'fon')
    expect(state.queue).toEqual(['mew', 'boy', 'fon'])
    expect(state.inactive).toEqual([])
    expect(stat(state, 'fon').active).toBe(true)

    expect(() => leaveQueue(state, 'ton')).toThrow(SessionError)
    expect(() => rejoinPlayer(state, 'fon')).toThrow(SessionError)
  })

  it('keeps stats of a player who left', () => {
    let state = winGame(newSession(), 'red')
    state = leaveQueue(state, 'boy')
    expect(stat(state, 'boy')).toMatchObject({ played: 1, losses: 1, active: false })
  })
})

describe('withdraw', () => {
  it('voids the game: no win or loss for anyone, next player replaces the one who withdrew', () => {
    let state = score(newSession(), 'rrrrrbbb') // ton 5–3 boy
    state = withdrawPlayer(state, 'ton')

    expect(state.history[state.history.length - 1]).toMatchObject({ kind: 'void', winner: null })
    expect(stat(state, 'boy')).toMatchObject({ wins: 0, played: 0 })
    expect(stat(state, 'ton')).toMatchObject({ losses: 0, played: 0, active: false })
    expect(court(state)).toEqual(['jay', 'boy'])
    expect(state.inactive).toEqual(['ton'])
    expect(state.points).toEqual([])
    expect(streakOf(state, 'boy')).toBe(0)
  })

  it('during deuce: opponent stays and keeps their streak', () => {
    let state = winGame(newSession(), 'red') // ton ชนะ → ton vs jay, ton ชนะติด 1
    state = score(state, 'rb'.repeat(10)) // 10–10
    expect(currentGame(state)!.status.isDeuce).toBe(true)

    state = withdrawPlayer(state, 'jay')
    expect(state.history[state.history.length - 1]).toMatchObject({ kind: 'void', winner: null })
    expect(stat(state, 'jay')).toMatchObject({ played: 0, active: false })
    expect(court(state)).toEqual(['ton', 'fon'])
    expect(streakOf(state, 'ton')).toBe(1)
    expect(currentGame(state)!.status.score).toEqual({ red: 0, blue: 0 })
  })

  it('at 0–0 does not create a game record', () => {
    const state = withdrawPlayer(newSession(), 'boy')
    expect(state.history).toEqual([])
    expect(court(state)).toEqual(['ton', 'jay'])
  })

  it('clears the streak of the player who withdrew', () => {
    let state = winGame(newSession(), 'red')
    state = withdrawPlayer(state, 'ton')
    expect(state.streak).toBeNull()
  })

  it('leaves a seat empty when nobody is waiting, and fills it on rejoin', () => {
    let state = withdrawPlayer(score(newSession(2), 'rr'), 'ton')
    expect(court(state)).toEqual([null, 'boy'])
    expect(currentGame(state)).toBeNull()
    expect(() => scorePoint(state, 'blue')).toThrow(SessionError)

    state = rejoinPlayer(state, 'ton')
    expect(court(state)).toEqual(['ton', 'boy'])
    expect(currentGame(state)?.no).toBe(2)
  })

  it('fills an empty seat when a new player is added', () => {
    let state = withdrawPlayer(newSession(2), 'boy')
    state = addPlayer(state, { id: 'bank', name: 'แบงค์' })
    expect(court(state)).toEqual(['ton', 'bank'])
  })

  it('rejects invalid withdrawals', () => {
    expect(() => withdrawPlayer(newSession(), 'jay')).toThrow(SessionError)
    const won = score(newSession(), 'r'.repeat(11))
    expect(() => withdrawPlayer(won, 'boy')).toThrow(SessionError)
  })
})

describe('first server', () => {
  it('is red in the first game', () => {
    expect(currentGame(newSession())!.firstServer).toBe('red')
  })

  it('is the challenger side when the winner stays on', () => {
    let state = winGame(newSession(), 'red') // ton (แดง) ชนะ → jay ลงฝั่งน้ำเงิน
    expect(currentGame(state)!.firstServer).toBe('blue')
    expect(currentGame(state)!.status.serve.server).toBe('blue')

    state = winGame(state, 'blue') // jay (น้ำเงิน) ชนะ → fon ลงฝั่งแดง
    expect(currentGame(state)!.firstServer).toBe('red')
  })

  it('is the loser when only two players rotate', () => {
    const state = winGame(newSession(2), 'blue') // boy (น้ำเงิน) ชนะ ton
    expect(court(state)).toEqual(['ton', 'boy'])
    expect(currentGame(state)!.firstServer).toBe('red')
    expect(currentGame(winGame(state, 'red'))!.firstServer).toBe('blue')
  })

  it('is red when both players leave after a completed streak', () => {
    let state = newSession(5, { streakRule: { enabled: true, wins: 2 } })
    state = winGame(state, 'red')
    state = winGame(state, 'red') // ton ชนะติดครบ 2 → ออกทั้งคู่
    expect(currentGame(state)!.firstServer).toBe('red')
  })

  it('is red after a withdrawal', () => {
    let state = winGame(newSession(), 'red') // น้ำเงินเสิร์ฟก่อน
    state = withdrawPlayer(score(state, 'r'), 'jay')
    expect(currentGame(state)!.firstServer).toBe('red')
  })
})

describe('stats', () => {
  it('ranks by wins, then win rate, then fewer losses', () => {
    let state = newSession(3)
    state = winGame(state, 'red') // ton ชนะ boy     → ton vs jay
    state = winGame(state, 'red') // ton ชนะ jay     → ton vs boy
    state = winGame(state, 'blue') // boy ชนะ ton    → jay vs boy
    state = score(state, 'rrr') // เกมที่ยังไม่จบไม่นับ

    const board = leaderboard(state)
    expect(board.map((p) => [p.id, p.wins, p.losses])).toEqual([
      ['ton', 2, 1],
      ['boy', 1, 1],
      ['jay', 0, 1],
    ])
    expect(board[0]!.winRate).toBeCloseTo(2 / 3)
  })

  it('ignores void games', () => {
    const state = withdrawPlayer(score(newSession(), 'rrr'), 'boy')
    expect(playerStats(state).every((p) => p.played === 0)).toBe(true)
  })
})

describe('swapSides', () => {
  it('moves players across while their score and serve follow them', () => {
    const before = score(newSession(), 'rrb')
    const after = swapSides(before)
    expect(court(after)).toEqual(['boy', 'ton'])
    expect(currentGame(after)!.status.score).toEqual({ red: 1, blue: 2 })
    expect(currentGame(after)!.status.serve.server).toBe('red')
    expect(currentGame(before)!.status.serve.server).toBe('blue')
    expect(swapSides(after)).toEqual(before)
  })

  it('keeps the winner and stats with the player in later games', () => {
    let s = swapSides(newSession())
    s = winGame(s, 'red')
    expect(stat(s, 'boy').wins).toBe(1)
    expect(stat(s, 'ton').losses).toBe(1)
    expect(court(s)).toEqual(['boy', 'jay'])
    expect(streakOf(s, 'boy')).toBe(1)
  })

  it('undoes the last point of the right player after swapping', () => {
    const s = undoPoint(swapSides(score(newSession(), 'rb')))
    expect(currentGame(s)!.status.score).toEqual({ red: 0, blue: 1 })
  })
})

describe('setFirstServer', () => {
  it('changes who serves first at 0–0', () => {
    const s = setFirstServer(newSession(), 'blue')
    expect(currentGame(s)!.status.serve.server).toBe('blue')
    expect(currentGame(score(s, 'rr'))!.status.serve.server).toBe('red')
  })

  it('is locked once the game has points', () => {
    expect(() => setFirstServer(score(newSession(), 'r'), 'blue')).toThrow(SessionError)
  })
})

describe('replaceCourtPlayer', () => {
  it('puts a queued player on court and the replaced player at the head of the queue', () => {
    const s = replaceCourtPlayer(newSession(), 'fon', 'blue')
    expect(court(s)).toEqual(['ton', 'fon'])
    expect(s.queue).toEqual(['boy', 'jay', 'mew'])
  })

  it('resets the streak of the replaced player', () => {
    const s = winGame(newSession(), 'red')
    expect(streakOf(s, 'ton')).toBe(1)
    const replaced = replaceCourtPlayer(s, 'mew', 'red')
    expect(streakOf(replaced, 'ton')).toBe(0)
    expect(replaced.queue[0]).toBe('ton')
  })

  it('only works at 0–0 and for queued players', () => {
    expect(() => replaceCourtPlayer(score(newSession(), 'r'), 'jay', 'red')).toThrow(SessionError)
    expect(() => replaceCourtPlayer(newSession(), 'boy', 'red')).toThrow(SessionError)
  })
})
