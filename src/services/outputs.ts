import { api } from '../api/api'
import type { Output, OutputCreate } from '../types/Output'

export async function getOutputs(): Promise<Output[]> {
  const { data } = await api.get<Output[]>('/outputs')
  return [...data].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}

export async function createOutput(payload: OutputCreate): Promise<Output> {
  const { data } = await api.post<Output>('/outputs', payload)
  return data
}
