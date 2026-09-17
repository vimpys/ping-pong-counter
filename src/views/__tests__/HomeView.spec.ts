import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import router from '@/router'
import HomeView from '../HomeView.vue'

describe('HomeView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows the app version from package.json', () => {
    const wrapper = mount(HomeView, { global: { plugins: [router] } })
    expect(wrapper.text()).toMatch(/v\d+\.\d+\.\d+/)
    expect(wrapper.text()).toContain(`v${__APP_VERSION__}`)
  })
})
