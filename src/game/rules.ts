import type { GameSettings } from './settings'

export type Side = 'red' | 'blue'

export const SIDES: readonly Side[] = ['red', 'blue']

export const otherSide = (side: Side): Side => (side === 'red' ? 'blue' : 'red')

export interface Score {
  red: number
  blue: number
}

export function scoreOf(points: readonly Side[]): Score {
  const score: Score = { red: 0, blue: 0 }
  for (const side of points) score[side]++
  return score
}

/** ดิวเริ่มเมื่อทั้งสองฝั่งได้ T-1 แต้ม */
export function isDeuce(score: Score, settings: Pick<GameSettings, 'targetScore'>): boolean {
  const tie = settings.targetScore - 1
  return score.red >= tie && score.blue >= tie
}

/** ชนะเมื่อได้ ≥ T แต้ม และ (อีกฝั่งยังไม่ถึง T-1 หรือนำอย่างน้อย D แต้ม) */
export function winnerOf(
  score: Score,
  settings: Pick<GameSettings, 'targetScore' | 'deuceLead'>,
): Side | null {
  const { targetScore, deuceLead } = settings
  for (const side of SIDES) {
    const own = score[side]
    const opponent = score[otherSide(side)]
    if (own >= targetScore && (opponent < targetScore - 1 || own - opponent >= deuceLead)) {
      return side
    }
  }
  return null
}

export interface ServeInfo {
  server: Side
  /** ลูกที่เท่าไหร่ของรอบเสิร์ฟ (1..S) — `null` ช่วงดิวที่สลับทุกลูก */
  ball: number | null
}

/**
 * คนเสิร์ฟของลูกถัดไป
 * - ก่อนดิว: เปลี่ยนมือทุก S ลูก
 * - ช่วงดิว: สลับทุกลูก ต่อจากคนที่ถึงคิวเสิร์ฟตอนเริ่มดิว
 */
export function serveInfo(
  points: readonly Side[],
  firstServer: Side,
  settings: Pick<GameSettings, 'targetScore' | 'serveEvery'>,
): ServeInfo {
  const total = points.length
  const serverForTurn = (turn: number) => (turn % 2 === 0 ? firstServer : otherSide(firstServer))

  if (!isDeuce(scoreOf(points), settings)) {
    return {
      server: serverForTurn(Math.floor(total / settings.serveEvery)),
      ball: (total % settings.serveEvery) + 1,
    }
  }

  const deuceStart = 2 * (settings.targetScore - 1)
  const serverAtDeuce = serverForTurn(Math.floor(deuceStart / settings.serveEvery))
  return {
    server: (total - deuceStart) % 2 === 0 ? serverAtDeuce : otherSide(serverAtDeuce),
    ball: null,
  }
}

/**
 * จำนวนครั้งที่เสมอกันในช่วงดิว
 * เช่น แข่ง 5 แต้ม: 4–4 = ครั้งที่ 1, 5–5 = ครั้งที่ 2, 6–6 = ครั้งที่ 3 …
 */
export function deuceTiesOf(
  points: readonly Side[],
  settings: Pick<GameSettings, 'targetScore'>,
): number {
  const tie = settings.targetScore - 1
  const score: Score = { red: 0, blue: 0 }
  let ties = 0
  for (const side of points) {
    score[side]++
    if (score.red === score.blue && score.red >= tie) ties++
  }
  return ties
}

export interface GameStatus {
  score: Score
  isDeuce: boolean
  /** เสมอกันในช่วงดิวไปกี่ครั้งแล้ว */
  deuceTies: number
  winner: Side | null
  serve: ServeInfo
  /** ฝั่งที่ได้แต้มล่าสุด — ใช้แสดงปุ่มย้อนแต้ม */
  lastScorer: Side | null
}

export function gameStatus(
  points: readonly Side[],
  firstServer: Side,
  settings: GameSettings,
): GameStatus {
  const score = scoreOf(points)
  return {
    score,
    isDeuce: isDeuce(score, settings),
    deuceTies: deuceTiesOf(points, settings),
    winner: winnerOf(score, settings),
    serve: serveInfo(points, firstServer, settings),
    lastScorer: points[points.length - 1] ?? null,
  }
}
