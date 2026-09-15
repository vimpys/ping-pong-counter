import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { defaultSettings } from '@/game/settings'
import { shareElementAsImage } from '@/native/share'
import router from '@/router'
import { buttonInDocument, waitForRoute } from '@/__tests__/dom'
import { useSessionStore } from '@/stores/session'
import SummaryView from '../SummaryView.vue'

vi.mock('@/native/share', () => ({
  shareElementAsImage:
    vi.fn<(el: HTMLElement, fileName: string, title: string) => Promise<string>>(),
}))

const PLAYERS = [
  { id: 'ton', name: 'ต้น' },
  { id: 'boy', name: 'บอย' },
  { id: 'jay', name: 'เจ' },
]

function winGame(side: 'red' | 'blue') {
  const session = useSessionStore()
  while (!session.game!.status.winner) session.score(side)
  session.nextGame()
}

async function mountSummary() {
  await router.push('/summary')
  const wrapper = mount(SummaryView, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

describe('SummaryView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(shareElementAsImage).mockReset()
    useSessionStore().start({ ...defaultSettings(), targetScore: 5 }, PLAYERS)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('ranks every player and highlights the top winner', async () => {
    winGame('red') // ต้น ชนะ บอย
    winGame('red') // ต้น ชนะ เจ
    useSessionStore().score('blue') // เกมที่ 3 ยังไม่จบ
    const wrapper = await mountSummary()

    expect(wrapper.text()).toContain('ชนะมากที่สุด')
    expect(wrapper.text()).toMatch(/ต้น\s*2\s*ชนะ จาก 2 เกม/)
    const rows = wrapper.findAll('tbody tr').map((r) => r.findAll('td').map((c) => c.text()))
    expect(rows).toEqual([
      ['1', 'ต้น', '2', '2', '0', '100%'],
      ['2', 'บอย', '1', '0', '1', '0%'],
      ['3', 'เจ', '1', '0', '1', '0%'],
    ])
    expect(wrapper.text()).toContain('2 เกม · 3 ผู้เล่น · 5 แต้ม ดิวนำ 2')
    expect(wrapper.text()).toContain('เกมที่ 3 ยังไม่จบ · ไม่นับในสรุป')
    expect(wrapper.text()).toMatch(/\d{1,2} \S+ 25\d\d/) // วันที่แบบ พ.ศ.
  })

  it('counts a game that was just won but not moved on from', async () => {
    const session = useSessionStore()
    while (!session.game!.status.winner) session.score('red')
    const wrapper = await mountSummary()
    expect(wrapper.text()).toMatch(/ต้น\s*1\s*ชนะ จาก 1 เกม/)
    expect(wrapper.text()).not.toContain('ยังไม่จบ')
  })

  it('cannot share before any game has finished', async () => {
    const wrapper = await mountSummary()
    expect(wrapper.text()).toContain('ยังไม่มีเกมที่จบ')
    const share = wrapper.findAll('button').find((b) => b.text().includes('แชร์เป็นรูปภาพ'))!
    expect(share.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('แชร์ได้เมื่อจบอย่างน้อย 1 เกม')
  })

  it('shares the summary card as an image', async () => {
    vi.mocked(shareElementAsImage).mockResolvedValue('downloaded')
    winGame('blue')
    const wrapper = await mountSummary()

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('แชร์เป็นรูปภาพ'))!
      .trigger('click')
    await flushPromises()

    const [element, fileName] = vi.mocked(shareElementAsImage).mock.calls[0]!
    expect(element.textContent).toContain('Ping Pong Counter')
    expect(fileName).toMatch(/^ping-pong-summary-\d{4}-\d{2}-\d{2}\.png$/)
    expect(wrapper.text()).toContain('บันทึกรูปลงเครื่องแล้ว')
  })

  it('shows an error when sharing fails', async () => {
    vi.mocked(shareElementAsImage).mockRejectedValue(new Error('boom'))
    winGame('red')
    const wrapper = await mountSummary()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('แชร์เป็นรูปภาพ'))!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('แชร์ไม่สำเร็จ ลองอีกครั้ง')
  })

  it('asks before starting a new round, then clears the session', async () => {
    winGame('red')
    const wrapper = await mountSummary()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'เริ่มรอบใหม่')!
      .trigger('click')
    await flushPromises()
    expect(useSessionStore().state).not.toBeNull()

    const confirm = buttonInDocument('ล้างสถิติและเริ่มรอบใหม่')
    confirm.click()
    await flushPromises()
    expect(useSessionStore().state).toBeNull()
    // หน้าตั้งค่าโหลดแบบ lazy
    await waitForRoute('setup')
  })
})
