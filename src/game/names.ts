export const MAX_NAME_LENGTH = 20

export type AddPlayerError = 'empty' | 'duplicate'

const normalize = (name: string) => name.trim().toLocaleLowerCase('th')

/** ตรวจชื่อผู้เล่นใหม่ — ตัดช่องว่าง จำกัดความยาว และกันชื่อซ้ำ (ไม่สนตัวพิมพ์เล็ก/ใหญ่) */
export function validateNewName(
  rawName: string,
  existingNames: readonly string[],
): { name: string; error: null } | { name: null; error: AddPlayerError } {
  const name = rawName.trim().slice(0, MAX_NAME_LENGTH)
  if (name === '') return { name: null, error: 'empty' }
  if (existingNames.some((existing) => normalize(existing) === normalize(name))) {
    return { name: null, error: 'duplicate' }
  }
  return { name, error: null }
}
