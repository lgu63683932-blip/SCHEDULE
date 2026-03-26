import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CodeGroup, CodeItem } from '../types/code'
import { sampleCodeGroups } from '../data/sampleCodes'

const generateId = () => Math.random().toString(36).slice(2, 10)

interface CodeStore {
  codeGroups: CodeGroup[]

  // Group actions
  addCodeGroup: (group: Omit<CodeGroup, 'id' | 'createdAt' | 'items'>) => string
  updateCodeGroup: (id: string, updates: Partial<Pick<CodeGroup, 'groupName' | 'description'>>) => void
  deleteCodeGroup: (id: string) => void

  // Item actions
  addCodeItem: (groupId: string, item: Omit<CodeItem, 'id' | 'createdAt'>) => string
  updateCodeItem: (groupId: string, itemId: string, updates: Partial<Omit<CodeItem, 'id' | 'createdAt'>>) => void
  deleteCodeItem: (groupId: string, itemId: string) => void
  reorderItems: (groupId: string, items: CodeItem[]) => void

  // Getters
  getGroup: (groupCode: string) => CodeGroup | undefined
  getActiveItems: (groupCode: string) => CodeItem[]
  getLabels: (groupCode: string) => string[]
}

export const useCodeStore = create<CodeStore>()(
  persist(
    (set, get) => ({
      codeGroups: sampleCodeGroups,

      addCodeGroup: (groupData) => {
        const id = generateId()
        const group: CodeGroup = {
          ...groupData,
          id,
          items: [],
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ codeGroups: [...s.codeGroups, group] }))
        return id
      },

      updateCodeGroup: (id, updates) => {
        set((s) => ({
          codeGroups: s.codeGroups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }))
      },

      deleteCodeGroup: (id) => {
        set((s) => ({ codeGroups: s.codeGroups.filter((g) => g.id !== id) }))
      },

      addCodeItem: (groupId, itemData) => {
        const id = generateId()
        const item: CodeItem = { ...itemData, id, createdAt: new Date().toISOString() }
        set((s) => ({
          codeGroups: s.codeGroups.map((g) =>
            g.id === groupId ? { ...g, items: [...g.items, item] } : g
          ),
        }))
        return id
      },

      updateCodeItem: (groupId, itemId, updates) => {
        set((s) => ({
          codeGroups: s.codeGroups.map((g) =>
            g.id === groupId
              ? { ...g, items: g.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)) }
              : g
          ),
        }))
      },

      deleteCodeItem: (groupId, itemId) => {
        set((s) => ({
          codeGroups: s.codeGroups.map((g) =>
            g.id === groupId ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g
          ),
        }))
      },

      reorderItems: (groupId, items) => {
        set((s) => ({
          codeGroups: s.codeGroups.map((g) => (g.id === groupId ? { ...g, items } : g)),
        }))
      },

      getGroup: (groupCode) => get().codeGroups.find((g) => g.groupCode === groupCode),

      getActiveItems: (groupCode) => {
        const group = get().codeGroups.find((g) => g.groupCode === groupCode)
        return (group?.items ?? []).filter((i) => i.isActive).sort((a, b) => a.order - b.order)
      },

      getLabels: (groupCode) => {
        return get().getActiveItems(groupCode).map((i) => i.label)
      },
    }),
    { name: 'schedule-codes' }
  )
)
