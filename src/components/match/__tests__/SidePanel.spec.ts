import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import SidePanel from '../SidePanel.vue'

const baseProps = {
  side: 'blue' as const,
  name: 'โป้',
  score: 3,
  serveLabel: null,
  streakTarget: null,
  canUndo: false,
  disabled: false,
  hasMenu: true,
}

describe('SidePanel streak crown (streak rule off)', () => {
  it('shows nothing without a streak', () => {
    const wrapper = mount(SidePanel, { props: { ...baseProps, streak: 0 } })
    expect(wrapper.find('[role="img"]').exists()).toBe(false)
  })

  it('shows a single crown for one win', () => {
    const crown = mount(SidePanel, { props: { ...baseProps, streak: 1 } }).get('[role="img"]')
    expect(crown.attributes('aria-label')).toBe('ชนะติด 1')
    expect(crown.text()).toBe('')
    expect(crown.findAll('svg')).toHaveLength(1)
  })

  it('shows the count in front of one crown for more wins', () => {
    const crown = mount(SidePanel, { props: { ...baseProps, streak: 2 } }).get('[role="img"]')
    expect(crown.attributes('aria-label')).toBe('ชนะติด 2')
    expect(crown.text()).toBe('2')
    expect(crown.findAll('svg')).toHaveLength(1)
  })
})
