import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ApprovalLineTemplate, ApprovalLineStep } from '../types/approvalLine'

const DEFAULT_TEMPLATES: ApprovalLineTemplate[] = [
  {
    id: 'tpl-default',
    name: '기본 결재선',
    isDefault: true,
    createdAt: new Date().toISOString(),
    steps: [
      { userId: 'user2', role: '팀장' },
      { userId: 'user3', role: '부서장' },
    ],
  },
]

interface ApprovalLineStore {
  templates: ApprovalLineTemplate[]

  addTemplate: (name: string, steps: ApprovalLineStep[]) => string
  updateTemplate: (id: string, name: string, steps: ApprovalLineStep[]) => void
  deleteTemplate: (id: string) => void
  setDefault: (id: string) => void
  getDefault: () => ApprovalLineTemplate | undefined
}

export const useApprovalLineStore = create<ApprovalLineStore>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,

      addTemplate: (name, steps) => {
        const id = `tpl-${Date.now()}`
        const newTpl: ApprovalLineTemplate = {
          id, name, steps,
          isDefault: get().templates.length === 0,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ templates: [...s.templates, newTpl] }))
        return id
      },

      updateTemplate: (id, name, steps) => {
        set((s) => ({
          templates: s.templates.map((t) => t.id === id ? { ...t, name, steps } : t),
        }))
      },

      deleteTemplate: (id) => {
        set((s) => {
          const remaining = s.templates.filter((t) => t.id !== id)
          // If deleted was default, set first as default
          if (remaining.length > 0 && !remaining.some((t) => t.isDefault)) {
            remaining[0] = { ...remaining[0], isDefault: true }
          }
          return { templates: remaining }
        })
      },

      setDefault: (id) => {
        set((s) => ({
          templates: s.templates.map((t) => ({ ...t, isDefault: t.id === id })),
        }))
      },

      getDefault: () => get().templates.find((t) => t.isDefault),
    }),
    { name: 'approval-lines' }
  )
)
