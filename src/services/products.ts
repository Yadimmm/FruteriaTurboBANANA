import { api } from '../api/api'
import type { Product, ProductCreate, ProductUpdate } from '../types/Product'

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>('/products')
  return data
}

export async function createProduct(payload: ProductCreate): Promise<Product> {
  // Obtener todos los productos para calcular el siguiente ID numérico
  const products = await getProducts()

  // Encontrar el ID más alto (convertir a número y filtrar NaN)
  const numericIds = products.map((p) => Number(p.id)).filter((id) => !isNaN(id))

  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0
  const nextId = maxId + 1

  // Crear producto con ID numérico específico
  const { data } = await api.post<Product>('/products', {
    ...payload,
    id: String(nextId),
  })
  return data
}

export async function updateProduct(id: number, payload: ProductUpdate): Promise<Product> {
  const { data } = await api.patch<Product>(`/products/${id}`, payload)
  return data
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`)
}
