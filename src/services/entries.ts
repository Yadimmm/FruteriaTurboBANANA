import { api } from '../api/api'
import type { Entry, EntryCreate } from '../types/Entry'

export async function getEntries(): Promise<Entry[]> {
  const { data } = await api.get<Entry[]>('/entries')
  // Ordena por fecha DESC en el frontend
  return [...data].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}

export async function createEntry(payload: EntryCreate): Promise<Entry> {
  const { data } = await api.post<Entry>('/entries', payload)
  return data
}
