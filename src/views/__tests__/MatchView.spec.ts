import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { defaultSettings } from '@/game/settings'
import { handleBack } from '@/native/backButton'
import { celebrate } from '@/native/celebrate'
import router from '@/router'
import { clickInDocument, waitForRoute } from '@/__tests__/dom'
import { useSessionStore } from '@/stores/session'
import QueueSection from '@/components/match/QueueSection.vue'
import MatchView from '../MatchView.vue'

vi.mock('@/native/celebrate', () => ({ celebrate: vi.fn<() => Promise<void>>() }))

vi.mock('@/native/device', () => ({
  tapFeedback: vi.fn<() => void>(),
  winFeedback: vi.fn<() => void>(),
  setKeepAwake: vi.fn<(on: boolean) => Promise<void>>(),
}))

const PLAYERS = [
  { id: 'ton', name: 'ต้น' },
  { id: 'boy', name: 'บอย' },
  { id: 'jay', name: 'เจ' },
]

async function mountMatch(streakRule = defaultSettings().streakRule) {
  const session = useSessionStore()
  session.start({ ...defaultSettings(), targetScore: 11, streakRule }, PLAYERS)
  await router.push('/match')
  const wrapper = mount(MatchView, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return { wrapper, session }
}

const redPanel = 'button[aria-label^="เพิ่มแต้มฝั่งแดง"]'
const bluePanel = 'button[aria-label^="เพิ่มแต้มฝั่งน้ำเงิน"]'

describe('MatchView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('tells how to move the serve only at 0–0', async () => {
    const { wrapper, session } = await mountMatch()
    expect(wrapper.text()).toContain('ลากป้ายเสิร์ฟไปอีกฝั่งเพื่อเปลี่ยนคนเสิร์ฟ')
    session.score('red')
    await flushPromises()
    expect(wrapper.text()).not.toContain('ลากป้ายเสิร์ฟ')
  })

  it('shows both players, the score and who serves', async () => {
    const { wrapper } = await mountMatch()
    const text = wrapper.text()
    expect(text).toContain('ต้น')
    expect(text).toContain('บอย')
    expect(text).toContain('เกมที่ 1')
    expect(text).toContain('เสิร์ฟ 1/2')
    expect(text).not.toContain('ฝั่งแดง')
  })

  it('shows the rules as symbols: target score and deuce lead, without serve text', async () => {
    const { wrapper } = await mountMatch()
    expect(wrapper.get('[aria-label="แข่งถึง 11 แต้ม"]').text()).toBe('11')
    expect(wrapper.get('[aria-label="ดิวต้องนำ 2 แต้ม"]').text()).toMatch(/ดิว\s*\+2/)
    expect(wrapper.text()).not.toContain('สลับเสิร์ฟทุก')
  })

  it('scores on tap and undoes from the side that just scored', async () => {
    const { wrapper, session } = await mountMatch()

    await wrapper.get(redPanel).trigger('click')
    expect(session.game!.status.score).toEqual({ red: 1, blue: 0 })

    const undo = wrapper.findAll('button').filter((b) => b.text() === 'ย้อนแต้ม')
    expect(undo).toHaveLength(1)
    await undo[0]!.trigger('click')
    expect(session.game!.status.score).toEqual({ red: 0, blue: 0 })
  })

  it('ignores an accidental second tap right after the first', async () => {
    const { wrapper, session } = await mountMatch()

    await wrapper.get(redPanel).trigger('click')
    await wrapper.get(bluePanel).trigger('click')
    expect(session.game!.status.score).toEqual({ red: 1, blue: 0 })

    vi.advanceTimersByTime(500)
    await wrapper.get(bluePanel).trigger('click')
    expect(session.game!.status.score).toEqual({ red: 1, blue: 1 })
  })

  function dragFrom(element: Element, toX: number) {
    const pointer = (type: string, clientX: number) =>
      element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          isPrimary: true,
          pointerId: 1,
          clientX,
          clientY: 5,
        }),
      )
    pointer('pointerdown', 0)
    pointer('pointermove', toX)
    pointer('pointerup', toX)
  }

  describe('dragging', () => {
    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(160)
    })
    afterEach(() => vi.restoreAllMocks())

    it('swaps sides by dragging a panel across, without scoring', async () => {
      const { wrapper, session } = await mountMatch()
      session.score('red')
      await flushPromises()

      dragFrom(wrapper.get(redPanel).element, 100)
      await wrapper.get(redPanel).trigger('click')
      await flushPromises()

      expect(session.state!.court).toEqual({ red: 'boy', blue: 'ton' })
      expect(session.game!.status.score).toEqual({ red: 0, blue: 1 })
      expect(wrapper.get(redPanel).attributes('aria-label')).toContain('บอย')

      // แผงที่ลากกำลังเลื่อนกลับ (ยังซ้อนอีกฝั่ง) → ปิดการแตะไว้ชั่วคราว
      const red = wrapper.get('[data-side="red"]')
      expect(red.classes()).toContain('pointer-events-none')
      vi.advanceTimersByTime(200)
      await flushPromises()
      expect(red.classes()).not.toContain('pointer-events-none')

      vi.advanceTimersByTime(500)
      await wrapper.get(bluePanel).trigger('click')
      expect(session.game!.status.score).toEqual({ red: 0, blue: 2 })
    })

    it('shows a halo under the finger while dragging', async () => {
      const { wrapper } = await mountMatch()
      const panel = wrapper.get(redPanel).element
      const pointer = (type: string, clientX: number) =>
        panel.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            isPrimary: true,
            pointerId: 1,
            clientX,
            clientY: 5,
          }),
        )
      pointer('pointerdown', 0)
      pointer('pointermove', 40)
      await flushPromises()
      expect(document.body.querySelector('.animate-drag-halo')).not.toBeNull()
      pointer('pointerup', 40)
      await flushPromises()
      expect(document.body.querySelector('.animate-drag-halo')).toBeNull()
    })

    it('does not swap on a short drag', async () => {
      const { wrapper, session } = await mountMatch()
      dragFrom(wrapper.get(redPanel).element, 30)
      await flushPromises()
      expect(session.state!.court).toEqual({ red: 'ton', blue: 'boy' })
    })

    it('moves the serve by dragging the serve badge at 0–0 only', async () => {
      const { wrapper, session } = await mountMatch()
      const badge = () => wrapper.findAll('[data-serve-badge]')[0]!.element
      const rect = { left: -10, right: 50, top: 0, bottom: 40 } as DOMRect
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect)

      dragFrom(badge(), 100)
      await flushPromises()
      expect(session.game!.status.serve.server).toBe('blue')
      expect(session.state!.court).toEqual({ red: 'ton', blue: 'boy' })

      session.score('blue')
      await flushPromises()
      dragFrom(wrapper.findAll('[data-serve-badge]')[1]!.element, -100)
      await flushPromises()
      // มีแต้มแล้ว → ลากป้ายเสิร์ฟกลายเป็นลากสลับข้างแทน
      expect(session.state!.firstServer).toBe('red')
      expect(session.state!.court).toEqual({ red: 'boy', blue: 'ton' })
    })
  })

  it('lets a queued player replace a court player at 0–0 only', async () => {
    const { wrapper, session } = await mountMatch()
    const queue = wrapper.getComponent(QueueSection)
    expect(queue.props('canReplace')).toBe(true)

    queue.vm.$emit('hoverCourt', { playerId: 'jay', side: 'red' })
    await flushPromises()
    expect(wrapper.text()).toContain('ปล่อยเพื่อให้เจลงแทนต้น')

    queue.vm.$emit('replace', 'jay', 'red')
    await flushPromises()
    expect(session.state!.court).toEqual({ red: 'jay', blue: 'boy' })
    expect(session.state!.queue).toEqual(['ton'])

    session.score('red')
    await flushPromises()
    expect(queue.props('canReplace')).toBe(false)
  })

  it('shows the deuce banner', async () => {
    const { wrapper, session } = await mountMatch()
    for (let i = 0; i < 10; i++) {
      session.score('red')
      session.score('blue')
    }
    await flushPromises()
    expect(wrapper.text()).toContain('ต้องนำ 2 แต้มถึงชนะ')
    expect(wrapper.text()).not.toMatch(/เสิร์ฟ \d/)
  })

  it('shows the winner dialog, blocks scoring and starts the next game', async () => {
    const { wrapper, session } = await mountMatch()
    for (let i = 0; i < 11; i++) session.score('red')
    await flushPromises()

    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.textContent).toContain('จบเกมที่ 1 · ฝั่งแดงชนะ')
    expect(dialog.textContent).toContain('ต้น ชนะ')
    expect(dialog.textContent).toMatch(/11\s*ต้น\s*–\s*0\s*บอย/)
    expect(dialog.textContent).toMatch(/ต้น\s*พบ\s*เจ/)
    expect(dialog.textContent).toContain('เจ เสิร์ฟก่อน')
    expect(dialog.textContent).not.toContain('ชนะติดครบ')
    expect(wrapper.get(bluePanel).attributes('disabled')).toBeDefined()

    await clickInDocument('เริ่มเกมถัดไป')
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(wrapper.text()).toContain('เกมที่ 2')
    expect(session.state!.queue).toEqual(['boy'])
  })

  it('undoes the winning point from the dialog', async () => {
    const { session } = await mountMatch()
    for (let i = 0; i < 11; i++) session.score('red')
    await flushPromises()

    await clickInDocument('ย้อนแต้มล่าสุด')
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(session.game!.status).toMatchObject({ winner: null, score: { red: 10, blue: 0 } })
  })

  it('goes to the summary from the winner dialog', async () => {
    const { session } = await mountMatch()
    for (let i = 0; i < 11; i++) session.score('red')
    await flushPromises()

    await clickInDocument('จบการแข่งขัน · ดูสรุปผล')
    await waitForRoute('summary')
    expect(router.currentRoute.value.name).toBe('summary')
  })

  it('tells when the streak is complete and both players go to the queue', async () => {
    const { session } = await mountMatch({ enabled: true, wins: 2 })
    const winAsRed = async () => {
      for (let i = 0; i < 11; i++) session.score('red')
      await flushPromises()
    }
    await winAsRed()
    await clickInDocument('เริ่มเกมถัดไป') // ต้น vs เจ
    await winAsRed()

    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.textContent).toContain('ชนะติดครบ 2 เกม · ต้นและเจไปต่อท้ายคิว')
    expect(dialog.textContent).toMatch(/บอย\s*พบ\s*เจ/)
    expect(dialog.textContent).toContain('บอย เสิร์ฟก่อน')
  })

  it('lists the waiting queue with stats', async () => {
    const { wrapper } = await mountMatch()
    const queue = wrapper.get('ol')
    expect(queue.text()).toContain('เจ')
    expect(queue.text()).toContain('คนถัดไป')
    expect(queue.text()).toContain('ชนะ 0')
  })
})

describe('MatchView long deuce celebration', () => {
  /** เสมอกัน n ครั้งตั้งแต่ 10–10 (กติกา 11 แต้ม) แล้วแดงชนะ 2 แต้มติด */
  async function winAfterDeuceTies(ties: number) {
    const { session } = await mountMatch()
    for (let i = 0; i < 9 + ties; i++) {
      session.score('red')
      session.score('blue')
    }
    session.score('red')
    session.score('red')
    await flushPromises()
    return document.querySelector('[role="dialog"]')?.textContent ?? ''
  }

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(celebrate).mockClear()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('does not celebrate 3 deuce ties', async () => {
    const text = await winAfterDeuceTies(3)
    expect(text).toContain('ต้น ชนะ')
    expect(text).not.toContain('สุดยอด')
    expect(celebrate).not.toHaveBeenCalled()
  })

  it('says สุดยอด with confetti after more than 3 ties', async () => {
    const text = await winAfterDeuceTies(4)
    expect(text).toContain('สุดยอด!')
    expect(text).not.toContain('โคตรเดือด')
    expect(text).toContain('ดิวกันไป 4 ครั้ง')
    expect(celebrate).toHaveBeenCalledOnce()
  })

  it('says โคตรเดือด after more than 5 ties', async () => {
    const text = await winAfterDeuceTies(6)
    expect(text).toContain('โคตรเดือด!')
    expect(text).not.toContain('สุดยอด')
    expect(text).toContain('ดิวกันไป 6 ครั้ง')
  })
})

describe('MatchView keyboard shortcuts', () => {
  const press = async (key: string, init: KeyboardEventInit = {}) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true, ...init }))
    await flushPromises()
    vi.advanceTimersByTime(500) // พ้นช่วงกันแตะซ้ำ
  }

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('scores with arrows / A / L and undoes with Backspace / Z', async () => {
    const { session } = await mountMatch()
    await press('ArrowLeft')
    await press('a')
    await press('ArrowRight')
    await press('L')
    expect(session.game!.status.score).toEqual({ red: 2, blue: 2 })

    await press('Backspace')
    await press('z')
    expect(session.game!.status.score).toEqual({ red: 2, blue: 0 })
  })

  it('ignores shortcuts with modifier keys, while typing, or with a sheet open', async () => {
    const { wrapper, session } = await mountMatch()
    await press('ArrowLeft', { metaKey: true })
    expect(session.game!.status.score).toEqual({ red: 0, blue: 0 })

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'เพิ่มผู้เล่น')!
      .trigger('click')
    await flushPromises()
    await press('a')
    expect(session.game!.status.score).toEqual({ red: 0, blue: 0 })
  })

  it('starts the next game with Enter once there is a winner', async () => {
    const { wrapper, session } = await mountMatch()
    await press('Enter')
    expect(session.game!.no).toBe(1)

    for (let i = 0; i < 11; i++) session.score('red')
    await flushPromises()
    await press('ArrowRight') // ทำแต้มไม่ได้ระหว่าง dialog ผู้ชนะ
    expect(session.game!.status.score).toEqual({ red: 11, blue: 0 })

    await press('Enter')
    expect(wrapper.text()).toContain('เกมที่ 2')
  })
})

describe('MatchView queue management', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('withdraws a player on court from the ⋯ menu', async () => {
    const { wrapper, session } = await mountMatch()
    await wrapper.get('button[aria-label="จัดการ ต้น"]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('ต้น · กำลังแข่งฝั่งแดง')
    expect(document.body.textContent).toContain('เจลงแทน')

    await clickInDocument('ถอนตัว')
    expect(session.state!.court.red).toBe('jay')
    expect(session.state!.inactive).toEqual(['ton'])
    expect(wrapper.text()).toContain('ออกจากการแข่งขัน · แตะเพื่อกลับเข้า')
  })

  it('lets a waiting player leave and come back', async () => {
    const { wrapper, session } = await mountMatch()
    await wrapper.get('button[aria-label="จัดการ เจ"]').trigger('click')
    await flushPromises()
    await clickInDocument('ออกจากการแข่งขัน')
    expect(session.state!.inactive).toEqual(['jay'])

    await wrapper.get('button[aria-label="จัดการ เจ (ออกจากการแข่งขัน)"]').trigger('click')
    await flushPromises()
    await clickInDocument('กลับเข้าการแข่งขัน')
    expect(session.state!.queue).toEqual(['jay'])
    expect(session.state!.inactive).toEqual([])
  })

  it('adds a player from the sheet', async () => {
    const { wrapper, session } = await mountMatch()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'เพิ่มผู้เล่น')!
      .trigger('click')
    await flushPromises()

    const input = document.querySelector<HTMLInputElement>('input[aria-label="ชื่อผู้เล่น"]')!
    input.value = 'ฝน'
    input.dispatchEvent(new Event('input'))
    input.form!.dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(session.state!.queue.map(session.playerName)).toEqual(['เจ', 'ฝน'])
  })

  it('reorders the queue when the list is dragged', async () => {
    const { wrapper, session } = await mountMatch()
    session.addPlayer('ฝน')
    await flushPromises()
    const [jay, fon] = session.state!.queue as [string, string]

    wrapper.findComponent({ name: 'QueueSection' }).vm.$emit('reorder', [fon, jay])
    await flushPromises()
    expect(session.state!.queue).toEqual([fon, jay])
    expect(wrapper.get('ol').text()).toMatch(/^1\s*ฝน/)
  })

  it('drags the queue with Sortable fallback, not native drag (needed to drop on court)', async () => {
    const { wrapper } = await mountMatch()
    const list = wrapper.findComponent({ name: 'VueDraggable' })
    expect(list.props('forceFallback')).toBe(true)
    expect(list.props('fallbackOnBody')).toBe(true)
  })
})

describe('MatchView leaving', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('asks before leaving and keeps the session', async () => {
    const { wrapper, session } = await mountMatch()
    session.score('red')
    await wrapper.get('button[aria-label="ออกจากหน้าแข่ง"]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('ออกจากหน้าแข่ง?')
    expect(document.body.textContent).toContain('เกมที่ 1 ค้างไว้ที่สกอร์ 1–0')

    await clickInDocument('ออกไปหน้าแรก')
    await waitForRoute('home')
    expect(session.game!.status.score).toEqual({ red: 1, blue: 0 })
  })

  it('opens the leave question on Android back, and closes it on the next back', async () => {
    await mountMatch()
    expect(handleBack()).toBe('handled')
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('ออกจากหน้าแข่ง?')

    expect(handleBack()).toBe('handled')
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  describe('expanding the queue', () => {
    const handle = () => document.querySelector<HTMLButtonElement>('button[aria-expanded]')!
    const queueSheet = () => handle().closest('section')!

    function pointer(target: EventTarget, type: string, clientY: number) {
      const event = new Event(type, { bubbles: true })
      Object.assign(event, { pointerId: 1, button: 0, clientY })
      target.dispatchEvent(event)
    }

    async function dragHandle(fromY: number, toY: number) {
      pointer(handle(), 'pointerdown', fromY)
      pointer(window, 'pointermove', toY)
      pointer(window, 'pointerup', toY)
      await flushPromises()
    }

    it('expands and collapses when the handle is tapped', async () => {
      await mountMatch()
      expect(handle().getAttribute('aria-label')).toBe('ขยายคิวรอเล่น')

      handle().click()
      await flushPromises()
      expect(handle().getAttribute('aria-expanded')).toBe('true')
      expect(queueSheet().classList).toContain('absolute')

      handle().click()
      await flushPromises()
      expect(handle().getAttribute('aria-expanded')).toBe('false')
    })

    it('expands on a drag up and collapses on a drag down, ignoring a tiny move', async () => {
      await mountMatch()
      await dragHandle(500, 497)
      expect(handle().getAttribute('aria-expanded')).toBe('false')

      await dragHandle(500, 300)
      expect(handle().getAttribute('aria-expanded')).toBe('true')

      await dragHandle(300, 500)
      expect(handle().getAttribute('aria-expanded')).toBe('false')
    })

    it('collapses the queue first on Android back', async () => {
      await mountMatch()
      handle().click()
      await flushPromises()

      expect(handleBack()).toBe('handled')
      await flushPromises()
      expect(handle().getAttribute('aria-expanded')).toBe('false')
      expect(document.querySelector('[role="dialog"]')).toBeNull()
    })
  })

  it('does not close the winner dialog on Android back', async () => {
    const { session } = await mountMatch()
    for (let i = 0; i < 11; i++) session.score('red')
    await flushPromises()

    handleBack()
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('ต้น ชนะ')
  })
})
