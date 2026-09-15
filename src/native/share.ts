import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { toBlob } from 'html-to-image'

export type ShareResult = 'shared' | 'downloaded' | 'cancelled'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

const isCancel = (error: unknown) =>
  (error instanceof DOMException && error.name === 'AbortError') ||
  /cancel/i.test(error instanceof Error ? error.message : String(error))

/**
 * แปลง element เป็นรูป PNG แล้วเปิดหน้าแชร์ของเครื่อง
 * - แอป (Android/iOS): เซฟลง cache แล้วแชร์ผ่าน share sheet
 * - เบราว์เซอร์: ใช้ Web Share ถ้ามี ไม่งั้นดาวน์โหลดไฟล์
 */
export async function shareElementAsImage(
  element: HTMLElement,
  fileName: string,
  title: string,
): Promise<ShareResult> {
  const blob = await toBlob(element, { pixelRatio: 3 })
  if (!blob) throw new Error('สร้างรูปไม่สำเร็จ')

  try {
    if (Capacitor.isNativePlatform()) {
      const { uri } = await Filesystem.writeFile({
        path: fileName,
        data: await blobToBase64(blob),
        directory: Directory.Cache,
      })
      await Share.share({ title, files: [uri] })
      return 'shared'
    }

    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] })
      return 'shared'
    }
  } catch (error) {
    if (isCancel(error)) return 'cancelled'
    throw error
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
