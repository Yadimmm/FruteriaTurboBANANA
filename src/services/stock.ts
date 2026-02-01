import { api } from '../api/api'
import type { Product } from '../types/Product'

export async function addStock(productId: number, qty: number): Promise<Product> {
  const { data: product } = await api.get<Product>(`/products/${productId}`)
  const newStock = Number(product.stock) + Number(qty)

  const { data: updated } = await api.patch<Product>(`/products/${productId}`, {
    stock: newStock,
  })

  return updated
}

export async function removeStock(productId: number, qty: number): Promise<Product> {
  const { data: product } = await api.get<Product>(`/products/${productId}`)
  const current = Number(product.stock)
  const toRemove = Number(qty)

  if (toRemove > current) {
    throw new Error('INSUFFICIENT_STOCK')
  }

  const newStock = current - toRemove

  const { data: updated } = await api.patch<Product>(`/products/${productId}`, {
    stock: newStock,
  })

  return updated
}