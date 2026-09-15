export type TargetScore = 5 | 7 | 11
export type DeuceLead = 1 | 2 | 3

export interface GameSettings {
  /** แต้มที่ชนะเกม (T) */
  targetScore: TargetScore
  /** สลับคนเสิร์ฟทุกกี่ลูก (S) */
  serveEvery: number
  /** ช่วงดิวต้องนำกี่แต้มถึงชนะ (D) */
  deuceLead: DeuceLead
  /** ชนะติดกันครบ `wins` เกม → ทั้งคู่ไปต่อท้ายคิว (K) */
  streakRule: { enabled: boolean; wins: number }
}

export const TARGET_SCORES: readonly TargetScore[] = [5, 7, 11]
export const DEUCE_LEADS: readonly DeuceLead[] = [1, 2, 3]

export const SETTINGS_LIMITS = {
  serveEvery: { min: 1, max: 5 },
  streakWins: { min: 2, max: 5 },
} as const

export function defaultSettings(): GameSettings {
  return {
    targetScore: 5,
    serveEvery: 2,
    deuceLead: 2,
    streakRule: { enabled: true, wins: 3 },
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** แปลงข้อมูลที่อ่านจากที่เก็บ (อาจเสียหรือเป็นเวอร์ชันเก่า) ให้เป็นค่าตั้งค่าที่ใช้ได้เสมอ */
export function sanitizeSettings(input: unknown): GameSettings {
  const defaults = defaultSettings()
  if (typeof input !== 'object' || input === null) return defaults
  const raw = input as Record<string, unknown>
  const streak =
    typeof raw.streakRule === 'object' && raw.streakRule !== null
      ? (raw.streakRule as Record<string, unknown>)
      : {}

  return {
    targetScore: TARGET_SCORES.includes(raw.targetScore as TargetScore)
      ? (raw.targetScore as TargetScore)
      : defaults.targetScore,
    serveEvery: clampInt(
      raw.serveEvery,
      SETTINGS_LIMITS.serveEvery.min,
      SETTINGS_LIMITS.serveEvery.max,
      defaults.serveEvery,
    ),
    deuceLead: DEUCE_LEADS.includes(raw.deuceLead as DeuceLead)
      ? (raw.deuceLead as DeuceLead)
      : defaults.deuceLead,
    streakRule: {
      enabled: typeof streak.enabled === 'boolean' ? streak.enabled : defaults.streakRule.enabled,
      wins: clampInt(
        streak.wins,
        SETTINGS_LIMITS.streakWins.min,
        SETTINGS_LIMITS.streakWins.max,
        defaults.streakRule.wins,
      ),
    },
  }
}
