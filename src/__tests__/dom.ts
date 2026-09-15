import { expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

import router from '@/router'

/** หาปุ่มจากข้อความทั้งหน้า — ใช้กับ dialog / bottom sheet ที่ถูก teleport ไปที่ body */
export function buttonInDocument(text: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes(text))
  if (!button) throw new Error(`ไม่พบปุ่ม "${text}"`)
  return button
}

export async function clickInDocument(text: string) {
  buttonInDocument(text).click()
  await flushPromises()
}

/** รอให้ไปถึงหน้าที่โหลดแบบ lazy */
export async function waitForRoute(name: string) {
  await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(name), { timeout: 10_000 })
}
