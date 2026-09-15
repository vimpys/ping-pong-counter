import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

import { handleBack, useBackButton } from '../backButton'

function withHandler(handler: () => void) {
  return mount(
    defineComponent({
      setup() {
        useBackButton(handler)
        return () => h('div')
      },
    }),
  )
}

describe('handleBack', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('exits the app when no screen handles back', () => {
    expect(handleBack()).toBe('exit')
  })

  it('uses the most recently mounted screen handler', () => {
    const first = vi.fn<() => void>()
    const second = vi.fn<() => void>()
    const a = withHandler(first)
    const b = withHandler(second)

    expect(handleBack()).toBe('handled')
    expect(second).toHaveBeenCalledOnce()
    expect(first).not.toHaveBeenCalled()

    b.unmount()
    handleBack()
    expect(first).toHaveBeenCalledOnce()
    a.unmount()
    expect(handleBack()).toBe('exit')
  })

  it('closes an open dialog before anything else', () => {
    const handler = vi.fn<() => void>()
    const screen = withHandler(handler)
    const onEscape = vi.fn<(e: KeyboardEvent) => void>()
    document.addEventListener('keydown', onEscape)
    document.body.innerHTML = '<div role="dialog"></div>'

    expect(handleBack()).toBe('handled')
    expect(onEscape.mock.calls[0]![0].key).toBe('Escape')
    expect(handler).not.toHaveBeenCalled()

    document.removeEventListener('keydown', onEscape)
    screen.unmount()
  })
})
