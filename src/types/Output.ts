export interface Output {
  id: number
  productId: number
  quantity: number
  date: string // ISO string
}

export type OutputCreate = Omit<Output, 'id'>
