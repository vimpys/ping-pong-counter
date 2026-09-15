export interface QueueItem {
  id: string
  name: string
  wins: number
  losses: number
}

/** bottom sheet ที่เปิดอยู่ในหน้าแข่ง */
export type MatchSheetState =
  { kind: 'court' | 'queue' | 'inactive'; playerId: string } | { kind: 'add' } | { kind: 'leave' }
