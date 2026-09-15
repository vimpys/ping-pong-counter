const COLORS = ['#ec4f93', '#ffbf3c', '#3b7be6', '#d9434a', '#8fd9c4', '#ffffff']

/** โปรยกระดาษฉลอง — โหลดไลบรารีเฉพาะตอนใช้ · แสดงเสมอ แม้เครื่องตั้งค่าลดการเคลื่อนไหว (ตามที่ตกลงกัน) */
export async function celebrate() {
  try {
    const { default: confetti } = await import('canvas-confetti')
    const base = { colors: COLORS, scalar: 0.9, disableForReducedMotion: false, zIndex: 100 }
    void confetti({ ...base, particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.8 } })
    void confetti({ ...base, particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.8 } })
    setTimeout(() => {
      void confetti({
        ...base,
        particleCount: 70,
        spread: 110,
        startVelocity: 30,
        origin: { y: 0.35 },
      })
    }, 350)
  } catch {
    // วาดไม่ได้ (เช่น ไม่มี canvas) → ข้ามไป
  }
}
