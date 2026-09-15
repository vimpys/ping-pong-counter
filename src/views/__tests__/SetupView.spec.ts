import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import router from '@/router'
import { buttonInDocument, waitForRoute } from '@/__tests__/dom'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'
import SetupView from '../SetupView.vue'

async function mountSetup() {
  await router.push('/setup')
  await router.isReady()
  return mount(SetupView, { global: { plugins: [router] }, attachTo: document.body })
}

describe('SetupView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows every rule option', async () => {
    const wrapper = await mountSetup()
    const text = wrapper.text()
    for (const label of ['แข่งถึงกี่แต้ม', 'สลับเสิร์ฟทุก', 'ดิว', 'ชนะติดกันครบ', 'ผู้เล่น']) {
      expect(text).toContain(label)
    }
    expect(wrapper.findAll('input[name="target-score"]')).toHaveLength(3)
  })

  it('needs two players before the game can start', async () => {
    const wrapper = await mountSetup()
    const start = () => wrapper.get('footer button')
    const input = wrapper.get('input[aria-label="ชื่อผู้เล่น"]')

    expect(start().attributes('disabled')).toBeDefined()

    await input.setValue('ต้น')
    await wrapper.get('form').trigger('submit')
    await input.setValue('บอย')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('ลงก่อน · ฝั่งแดง')
    expect(wrapper.text()).toContain('ลงก่อน · ฝั่งน้ำเงิน')
    expect(start().attributes('disabled')).toBeUndefined()
    expect(start().text()).toContain('เริ่มเกม')
  })

  it('shows an error for a duplicate name', async () => {
    const wrapper = await mountSetup()
    const input = wrapper.get('input[aria-label="ชื่อผู้เล่น"]')

    await input.setValue('ต้น')
    await wrapper.get('form').trigger('submit')
    await input.setValue('ต้น')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('มีชื่อนี้ในรายชื่อแล้ว')
  })

  it('updates the deuce hint when the target score changes', async () => {
    const wrapper = await mountSetup()
    expect(
      wrapper.get<HTMLInputElement>('input[name="target-score"][value="5"]').element.checked,
    ).toBe(true)
    expect(wrapper.text()).toContain('ดิวเมื่อเสมอ 4–4')
    await wrapper.get('input[name="target-score"][value="7"]').setValue(true)
    expect(wrapper.text()).toContain('ดิวเมื่อเสมอ 6–6')
  })

  describe('with a round already in progress', () => {
    async function setupWithOldRound() {
      const setup = useSetupStore()
      setup.addPlayer('ต้น')
      setup.addPlayer('บอย')
      const session = useSessionStore()
      session.start(setup.settings, setup.players)
      session.score('red')
      const wrapper = await mountSetup()
      await wrapper.get('footer button').trigger('click')
      await flushPromises()
      return { wrapper, session }
    }

    afterEach(() => {
      document.body.innerHTML = ''
    })

    it('asks before replacing it', async () => {
      const { session } = await setupWithOldRound()
      expect(document.body.textContent).toContain('มีการแข่งขันค้างอยู่')
      expect(session.game!.status.score).toEqual({ red: 1, blue: 0 })
    })

    it('starts a fresh round when confirmed', async () => {
      const { session } = await setupWithOldRound()
      const confirm = buttonInDocument('ล้างสถิติและเริ่มรอบใหม่')
      confirm.click()
      await flushPromises()
      expect(session.game!.status.score).toEqual({ red: 0, blue: 0 })
    })

    it('can go back to the old round instead', async () => {
      const { session } = await setupWithOldRound()
      const back = buttonInDocument('กลับไปเล่นรอบเดิมต่อ')
      back.click()
      await waitForRoute('match')
      expect(session.game!.status.score).toEqual({ red: 1, blue: 0 })
    })
  })
})
