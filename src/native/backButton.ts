import { onMounted, onUnmounted } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

type BackHandler = () => void

const handlers: BackHandler[] = []

/** หน้าจอบอกว่าจะทำอะไรเมื่อกดปุ่ม back ของ Android (หน้าที่ไม่ลงทะเบียน → ออกจากแอป) */
export function useBackButton(handler: BackHandler) {
  onMounted(() => handlers.push(handler))
  onUnmounted(() => {
    const index = handlers.lastIndexOf(handler)
    if (index >= 0) handlers.splice(index, 1)
  })
}

/** ปิด dialog / bottom sheet ที่เปิดอยู่ก่อน — ส่ง Escape ให้ Reka UI จัดการ (dialog ที่กัน Escape จะไม่ปิด) */
function closeOpenDialog(): boolean {
  if (!document.querySelector('[role="dialog"]')) return false
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  return true
}

export function handleBack(): 'handled' | 'exit' {
  if (closeOpenDialog()) return 'handled'
  const handler = handlers[handlers.length - 1]
  if (!handler) return 'exit'
  handler()
  return 'handled'
}

export function installBackButton() {
  if (!Capacitor.isNativePlatform()) return
  void App.addListener('backButton', () => {
    if (handleBack() === 'exit') void App.exitApp()
  })
}
