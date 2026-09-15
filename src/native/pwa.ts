import { Capacitor } from '@capacitor/core'

/** ลงทะเบียน service worker สำหรับ PWA — เฉพาะบนเว็บ (ในแอป Android/iOS ไฟล์อยู่ในเครื่องอยู่แล้ว) */
export async function registerPwa() {
  if (Capacitor.isNativePlatform() || !import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return
  }
  const { registerSW } = await import('virtual:pwa-register')
  // ไม่เรียก updateSW → เวอร์ชันใหม่จะมีผลเมื่อปิดแล้วเปิดแอปใหม่
  registerSW({ immediate: true })
}
