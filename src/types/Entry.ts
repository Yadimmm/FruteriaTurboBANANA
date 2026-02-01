export interface Entry {
  id: number
  productId: number
  quantity: number
  date: string // ISO string
}

export type EntryCreate = Omit<Entry, 'id'>
