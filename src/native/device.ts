import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { KeepAwake } from '@capacitor-community/keep-awake'

/** สั่นเบา ๆ ตอนนับแต้ม — เครื่องที่ไม่รองรับจะเงียบไป */
export function tapFeedback() {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}

/** สั่นแบบแจ้งสำเร็จตอนจบเกม */
export function winFeedback() {
  Haptics.notification({ type: NotificationType.Success }).catch(() => {})
}

/** กันจอดับระหว่างแข่ง */
export async function setKeepAwake(on: boolean) {
  try {
    const { isSupported } = await KeepAwake.isSupported()
    if (!isSupported) return
    await (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep())
  } catch {
    // ไม่รองรับบนเครื่องนี้ → ใช้งานต่อได้ตามปกติ
  }
}
