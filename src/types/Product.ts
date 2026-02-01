export interface Product {
  id: number
  name: string
  price: number
  stock: number
  expirationDate: string // "YYYY-MM-DD"
}

export type ProductCreate = Omit<Product, 'id'>
export type ProductUpdate = Partial<ProductCreate>
