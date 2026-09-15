/** อ่าน JSON จาก localStorage — คืน `undefined` ถ้าไม่มีหรืออ่านไม่ได้ */
export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

/** เขียน JSON ลง localStorage — `null` = ลบ · ที่เก็บเต็มหรือถูกปิดจะเงียบไป (แอปใช้งานต่อได้ แค่ไม่จำ) */
export function writeJson(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}
