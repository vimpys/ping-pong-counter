import { describe, it, expect, vi } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import router from '../router'

describe('App', () => {
  it('opens on the home screen and goes to setup from the start button', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router, createPinia()] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Ping Pong Counter')

    await wrapper.get('a[href="/setup"]').trigger('click')
    // หน้าตั้งค่าโหลดแบบ lazy — รอให้โหลดเสร็จ
    await vi.waitFor(() => expect(wrapper.text()).toContain('ตั้งค่าเกม'), { timeout: 10_000 })
    expect(router.currentRoute.value.name).toBe('setup')
  })

  it('has routes for match and summary screens', () => {
    expect(router.resolve({ name: 'match' }).path).toBe('/match')
    expect(router.resolve({ name: 'summary' }).path).toBe('/summary')
  })
})
