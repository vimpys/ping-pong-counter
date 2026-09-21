import { gameStatus, otherSide, SIDES, type GameStatus, type Side } from './rules'
import type { GameSettings } from './settings'

/*
 * Game engine ของการแข่งแบบก๊วน — TypeScript ล้วน ไม่พึ่ง Vue
 * ทุกฟังก์ชันคืน state ใหม่ ไม่แก้ state เดิม และโยน SessionError เมื่อเรียกผิดเงื่อนไข
 */

export interface SessionPlayer {
  id: string
  name: string
  /** false = ออกจากการแข่งขันอยู่ (แสดงท้ายรายชื่อ) */
  active: boolean
}

/** `void` = ยกเลิกเพราะมีคนถอนตัว ไม่นับผล */
export type GameResultKind = 'normal' | 'void'

export interface GameRecord {
  no: number
  red: string
  blue: string
  firstServer: Side
  points: Side[]
  /** `null` เมื่อยกเลิกเกม (void) */
  winner: Side | null
  kind: GameResultKind
}

export interface Streak {
  playerId: string
  count: number
}

export interface SessionState {
  settings: GameSettings
  /** ผู้เล่นทุกคนตามลำดับที่เพิ่ม (รวมคนที่ออกไปแล้ว) */
  players: SessionPlayer[]
  /** ผู้เล่นในสนาม — `null` เมื่อยังไม่มีคนลงฝั่งนั้น */
  court: Record<Side, string | null>
  /** คิวรอเล่น (เฉพาะคนที่ active) */
  queue: string[]
  /** ผู้เล่นที่ออกจากการแข่งขัน ตามลำดับที่ออก */
  inactive: string[]
  /** แต้มของเกมปัจจุบันตามลำดับ */
  points: Side[]
  firstServer: Side
  streak: Streak | null
  history: GameRecord[]
  /** เวลาเริ่มรอบ (ISO) — ใส่โดยผู้เรียก engine ไม่ได้ใช้ */
  startedAt?: string
}

export class SessionError extends Error {
  override name = 'SessionError'
}

export interface PlayerEntry {
  id: string
  name: string
}

const clone = (state: SessionState): SessionState => JSON.parse(JSON.stringify(state))

export function createSession(
  settings: GameSettings,
  entries: readonly PlayerEntry[],
): SessionState {
  if (entries.length < 2) throw new SessionError('ต้องมีผู้เล่นอย่างน้อย 2 คน')
  const ids = entries.map((entry) => entry.id)
  if (new Set(ids).size !== ids.length) throw new SessionError('รหัสผู้เล่นซ้ำกัน')

  const [red, blue, ...queue] = ids as [string, string, ...string[]]
  return {
    settings: JSON.parse(JSON.stringify(settings)),
    players: entries.map(({ id, name }) => ({ id, name, active: true })),
    court: { red, blue },
    queue,
    inactive: [],
    points: [],
    firstServer: 'red',
    streak: null,
    history: [],
  }
}

// ---------- เกมปัจจุบัน ----------

export interface CurrentGame {
  no: number
  red: string
  blue: string
  firstServer: Side
  status: GameStatus
}

/** เกมที่กำลังแข่ง — `null` เมื่อผู้เล่นในสนามยังไม่ครบ */
export function currentGame(state: SessionState): CurrentGame | null {
  const { red, blue } = state.court
  if (red === null || blue === null) return null
  return {
    no: state.history.length + 1,
    red,
    blue,
    firstServer: state.firstServer,
    status: gameStatus(state.points, state.firstServer, state.settings),
  }
}

function requireGame(state: SessionState): CurrentGame {
  const game = currentGame(state)
  if (!game) throw new SessionError('ผู้เล่นในสนามยังไม่ครบ')
  return game
}

export function scorePoint(state: SessionState, side: Side): SessionState {
  if (requireGame(state).status.winner) throw new SessionError('เกมนี้จบแล้ว')
  const next = clone(state)
  next.points.push(side)
  return next
}

/** ย้อนแต้มล่าสุด — ใช้ได้ทั้งระหว่างเกมและตอนเกมเพิ่งจบ (ก่อนเริ่มเกมถัดไป) */
export function undoPoint(state: SessionState): SessionState {
  if (state.points.length === 0) return state
  const next = clone(state)
  next.points.pop()
  return next
}

/**
 * สลับข้างผู้เล่นในสนาม — สีอยู่กับฝั่งเดิม (แดงซ้าย น้ำเงินขวา) แต่ผู้เล่นย้ายข้าง
 * แต้ม คนเสิร์ฟ และชนะติด ตามตัวผู้เล่นไปด้วย
 */
export function swapSides(state: SessionState): SessionState {
  const next = clone(state)
  next.court = { red: state.court.blue, blue: state.court.red }
  next.points = state.points.map(otherSide)
  next.firstServer = otherSide(state.firstServer)
  return next
}

/** เปลี่ยนฝั่งที่เสิร์ฟก่อน — ทำได้เฉพาะตอนเริ่มเกม (0–0) */
export function setFirstServer(state: SessionState, side: Side): SessionState {
  if (state.points.length > 0) throw new SessionError('เปลี่ยนคนเสิร์ฟได้เฉพาะตอนเริ่มเกม')
  if (state.firstServer === side) return state
  const next = clone(state)
  next.firstServer = side
  return next
}

// ---------- จบเกม / หมุนคิว ----------

function nextStreakCount(state: SessionState, winnerId: string): number {
  return state.streak?.playerId === winnerId ? state.streak.count + 1 : 1
}

function reachesStreakLimit(state: SessionState, winnerId: string): boolean {
  const rule = state.settings.streakRule
  return rule.enabled && nextStreakCount(state, winnerId) >= rule.wins
}

function archive(next: SessionState, winner: Side | null, kind: GameResultKind) {
  next.history.push({
    no: next.history.length + 1,
    red: next.court.red!,
    blue: next.court.blue!,
    firstServer: next.firstServer,
    points: next.points,
    winner,
    kind,
  })
  next.points = []
  next.firstServer = 'red'
}

/** ผู้แพ้ไปต่อท้ายคิว ผู้ชนะอยู่ต่อ — ถ้าชนะติดครบกำหนด ผู้ชนะไปต่อคิวด้วย (หลังผู้แพ้) */
function settle(next: SessionState, winnerSide: Side) {
  const loserSide = otherSide(winnerSide)
  const winnerId = next.court[winnerSide]!
  const loserId = next.court[loserSide]!

  next.court[loserSide] = null
  next.queue.push(loserId)

  if (reachesStreakLimit(next, winnerId)) {
    next.court[winnerSide] = null
    next.queue.push(winnerId)
    next.streak = null
  } else {
    next.streak = { playerId: winnerId, count: nextStreakCount(next, winnerId) }
  }
}

/** เติมที่ว่างในสนามจากหัวคิว (ฝั่งแดงก่อน) */
function fillCourt(next: SessionState) {
  for (const side of SIDES) {
    if (next.court[side] !== null) continue
    const id = next.queue.shift()
    if (id !== undefined) next.court[side] = id
  }
}

/**
 * จบเกมแล้วหมุนคิว
 * คนเสิร์ฟก่อนในเกมถัดไป: ถ้าผู้ชนะยังอยู่ในสนาม → อีกฝั่ง (ฝั่งผู้แพ้/ผู้ท้าชิง) เสิร์ฟก่อน
 * ถ้าไม่มีผู้ชนะอยู่ในสนาม (ชนะติดครบ ออกทั้งคู่) → ฝั่งแดงเสิร์ฟก่อน
 */
export function startNextGame(state: SessionState): SessionState {
  const game = requireGame(state)
  const winner = game.status.winner
  if (!winner) throw new SessionError('เกมยังไม่จบ')
  const next = clone(state)
  archive(next, winner, 'normal')
  settle(next, winner)
  fillCourt(next)
  if (next.court[winner] === game[winner]) next.firstServer = otherSide(winner)
  return next
}

export interface NextGamePreview {
  winnerId: string
  loserId: string
  /** ผู้ชนะชนะติดครบกำหนด → ทั้งคู่ไปต่อท้ายคิว */
  streakCompleted: boolean
  red: string | null
  blue: string | null
  /** ฝั่งที่เสิร์ฟก่อนในเกมถัดไป */
  firstServer: Side
}

/** สิ่งที่จะเกิดเมื่อกด "เริ่มเกมถัดไป" — `null` ถ้าเกมยังไม่จบ */
export function previewNextGame(state: SessionState): NextGamePreview | null {
  const game = currentGame(state)
  const winner = game?.status.winner
  if (!game || !winner) return null
  const winnerId = game[winner]
  const next = startNextGame(state)
  return {
    winnerId,
    loserId: game[otherSide(winner)],
    streakCompleted: reachesStreakLimit(state, winnerId),
    red: next.court.red,
    blue: next.court.blue,
    firstServer: next.firstServer,
  }
}

// ---------- จัดการผู้เล่น ----------

function findPlayer(state: SessionState, playerId: string): SessionPlayer {
  const player = state.players.find((p) => p.id === playerId)
  if (!player) throw new SessionError('ไม่พบผู้เล่น')
  return player
}

function deactivate(next: SessionState, playerId: string) {
  findPlayer(next, playerId).active = false
  next.queue = next.queue.filter((id) => id !== playerId)
  next.inactive.push(playerId)
}

export function addPlayer(state: SessionState, entry: PlayerEntry): SessionState {
  if (state.players.some((p) => p.id === entry.id)) throw new SessionError('รหัสผู้เล่นซ้ำกัน')
  const next = clone(state)
  next.players.push({ id: entry.id, name: entry.name, active: true })
  next.queue.push(entry.id)
  fillCourt(next)
  return next
}

/** จัดลำดับคิวใหม่ — `order` ต้องมีผู้เล่นชุดเดิมในคิวครบ */
export function reorderQueue(state: SessionState, order: readonly string[]): SessionState {
  const same =
    order.length === state.queue.length &&
    new Set(order).size === order.length &&
    order.every((id) => state.queue.includes(id))
  if (!same) throw new SessionError('ลำดับคิวไม่ตรงกับผู้เล่นในคิว')
  const next = clone(state)
  next.queue = [...order]
  return next
}

/**
 * ผู้เล่นในคิวลงสนามแทนฝั่ง `side` — ทำได้เฉพาะตอนเริ่มเกม (0–0)
 * คนที่ถูกแทนไปต่อท้ายคิว และชนะติดของคนนั้นเริ่มนับใหม่
 */
export function replaceCourtPlayer(
  state: SessionState,
  playerId: string,
  side: Side,
): SessionState {
  if (!state.queue.includes(playerId)) throw new SessionError('ผู้เล่นคนนี้ไม่ได้อยู่ในคิว')
  if (state.points.length > 0) throw new SessionError('เปลี่ยนตัวผู้เล่นได้เฉพาะตอนเริ่มเกม')
  const next = clone(state)
  const replaced = next.court[side]
  next.queue = next.queue.filter((id) => id !== playerId)
  if (replaced !== null) {
    next.queue.push(replaced)
    if (next.streak?.playerId === replaced) next.streak = null
  }
  next.court[side] = playerId
  return next
}

/** ผู้เล่นในคิว → ออกจากการแข่งขัน (เก็บสถิติไว้) */
export function leaveQueue(state: SessionState, playerId: string): SessionState {
  if (!state.queue.includes(playerId)) throw new SessionError('ผู้เล่นคนนี้ไม่ได้อยู่ในคิว')
  const next = clone(state)
  deactivate(next, playerId)
  return next
}

/** กลับเข้าการแข่งขัน → ต่อท้ายคิว นับสถิติต่อจากเดิม */
export function rejoinPlayer(state: SessionState, playerId: string): SessionState {
  if (!state.inactive.includes(playerId)) {
    throw new SessionError('ผู้เล่นคนนี้ไม่ได้ออกจากการแข่งขัน')
  }
  const next = clone(state)
  findPlayer(next, playerId).active = true
  next.inactive = next.inactive.filter((id) => id !== playerId)
  next.queue.push(playerId)
  fillCourt(next)
  return next
}

/**
 * ผู้เล่นในสนามถอนตัว แล้วออกจากการแข่งขัน
 * เกมนี้ถูกยกเลิก ไม่นับผลให้ใคร อีกฝ่ายอยู่ต่อ (ชนะติดคงเดิม) คนถัดไปในคิวลงแทน เริ่ม 0–0 ฝั่งแดงเสิร์ฟ
 */
export function withdrawPlayer(state: SessionState, playerId: string): SessionState {
  const side = SIDES.find((s) => state.court[s] === playerId)
  if (!side) throw new SessionError('ผู้เล่นคนนี้ไม่ได้อยู่ในสนาม')
  const game = currentGame(state)
  if (game?.status.winner) throw new SessionError('เกมนี้จบแล้ว — เริ่มเกมถัดไปก่อน')

  const next = clone(state)
  if (game && next.points.length > 0) archive(next, null, 'void')
  next.points = []
  next.firstServer = 'red'
  next.court[side] = null
  if (next.streak?.playerId === playerId) next.streak = null
  deactivate(next, playerId)
  fillCourt(next)
  return next
}

// ---------- สถิติ ----------

export interface PlayerStats {
  id: string
  name: string
  active: boolean
  played: number
  wins: number
  losses: number
  /** 0..1 */
  winRate: number
}

/** สถิติต่อผู้เล่น ตามลำดับที่เพิ่ม — ไม่นับเกมที่ยกเลิกและเกมที่ยังไม่จบ */
export function playerStats(state: SessionState): PlayerStats[] {
  const stats = new Map<string, PlayerStats>(
    state.players.map(({ id, name, active }) => [
      id,
      { id, name, active, played: 0, wins: 0, losses: 0, winRate: 0 },
    ]),
  )
  for (const game of state.history) {
    if (game.winner === null) continue
    const winner = stats.get(game[game.winner])
    const loser = stats.get(game[otherSide(game.winner)])
    if (winner) {
      winner.played++
      winner.wins++
    }
    if (loser) {
      loser.played++
      loser.losses++
    }
  }
  for (const s of stats.values()) s.winRate = s.played > 0 ? s.wins / s.played : 0
  return [...stats.values()]
}

/** เรียงสำหรับหน้าสรุป: ชนะมาก → % ชนะสูง → แพ้น้อย */
export function leaderboard(state: SessionState): PlayerStats[] {
  return playerStats(state).sort(
    (a, b) => b.wins - a.wins || b.winRate - a.winRate || a.losses - b.losses,
  )
}

export function streakOf(state: SessionState, playerId: string): number {
  return state.streak?.playerId === playerId ? state.streak.count : 0
}
