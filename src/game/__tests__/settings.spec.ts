import { describe, expect, it } from 'vitest'

import { defaultSettings, sanitizeSettings } from '../settings'

describe('defaultSettings', () => {
  it('is 5 points, serve every 2, deuce lead 2', () => {
    expect(defaultSettings()).toMatchObject({ targetScore: 5, serveEvery: 2, deuceLead: 2 })
  })
})

describe('sanitizeSettings', () => {
  it('returns defaults for missing or broken data', () => {
    expect(sanitizeSettings(undefined)).toEqual(defaultSettings())
    expect(sanitizeSettings('oops')).toEqual(defaultSettings())
    expect(sanitizeSettings({})).toEqual(defaultSettings())
  })

  it('keeps valid values', () => {
    const settings = {
      targetScore: 5,
      serveEvery: 1,
      deuceLead: 3,
      streakRule: { enabled: false, wins: 4 },
    }
    expect(sanitizeSettings(settings)).toEqual(settings)
  })

  it('rejects target scores and deuce leads that are not options', () => {
    const result = sanitizeSettings({ targetScore: 21, deuceLead: 0 })
    expect(result.targetScore).toBe(5)
    expect(result.deuceLead).toBe(2)
  })

  it('clamps steppers into their allowed range', () => {
    const result = sanitizeSettings({ serveEvery: 99, streakRule: { enabled: true, wins: 0 } })
    expect(result.serveEvery).toBe(5)
    expect(result.streakRule.wins).toBe(2)
  })
})
