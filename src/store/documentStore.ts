import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Document, DocumentStatus } from '../types/document'
import { sampleDocuments } from '../data/sampleDocuments'

let docCounter: Record<string, number> = { approval_request: 0, business_trip: 2, expense: 3 }

// 품의서: YYYYMMDD + NNN 형식으로 채번
const generateApprovalDocNumber = (existing: { docNumber: string }[]): string => {
  const now = new Date()
  const ymd =
    String(now.getFullYear()) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const todayNums = existing
    .map((d) => d.docNumber)
    .filter((n) => n.startsWith(ymd) && /^\d{11}$/.test(n))
    .map((n) => parseInt(n.slice(8), 10))
  const next = todayNums.length > 0 ? Math.max(...todayNums) + 1 : 1
  return `${ymd}${String(next).padStart(3, '0')}`
}

const TYPE_PREFIX: Record<string, string> = {
  business_trip: '출장',
  expense: '지출',
}

interface DocumentStore {
  documents: Document[]
  currentUserId: string

  addDocument: (doc: Omit<Document, 'id' | 'docNumber' | 'createdAt' | 'updatedAt'>) => string
  updateDocument: (id: string, updates: Partial<Document>) => void
  deleteDocument: (id: string) => void
  submitDocument: (id: string) => void
  approveStep: (docId: string, userId: string, comment?: string) => void
  rejectStep: (docId: string, userId: string, comment: string) => void

  getDocument: (id: string) => Document | undefined
  getMyDocuments: () => Document[]
  getPendingApprovals: () => Document[]
  getPendingCount: () => number
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: sampleDocuments,
      currentUserId: 'user1',

      addDocument: (docData) => {
        const type = docData.type
        const docs = get().documents
        let docNumber: string
        if (type === 'approval_request') {
          docNumber = generateApprovalDocNumber(docs)
        } else {
          docCounter[type] = (docCounter[type] || 0) + 1
          const num = String(docCounter[type]).padStart(3, '0')
          const year = new Date().getFullYear()
          docNumber = `${TYPE_PREFIX[type]}-${year}-${num}`
        }
        const id = `doc-${Date.now()}`
        const now = new Date().toISOString()
        const newDoc = { ...docData, id, docNumber, createdAt: now, updatedAt: now } as Document
        set((s) => ({ documents: [...s.documents, newDoc] }))
        return id
      },

      updateDocument: (id, updates) => {
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } as Document : d
          ),
        }))
      },

      deleteDocument: (id) => {
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }))
      },

      submitDocument: (id) => {
        const doc = get().getDocument(id)
        if (!doc) return
        const now = new Date().toISOString()
        // Mark drafter step as approved
        const steps = doc.approvalSteps.map((s, i) =>
          i === 0 ? { ...s, status: 'approved' as const, approvedAt: now } : s
        )
        const nextPending = steps.find((s) => s.status === 'pending')
        const status: DocumentStatus = nextPending ? (steps.some(s => s.status === 'approved') ? 'in_progress' : 'pending') : 'approved'
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, status: steps.length > 1 ? 'in_progress' : 'approved', approvalSteps: steps, submittedAt: now, updatedAt: now } as Document : d
          ),
        }))
      },

      approveStep: (docId, userId, comment) => {
        const doc = get().getDocument(docId)
        if (!doc) return
        const now = new Date().toISOString()
        const steps = doc.approvalSteps.map((s) =>
          s.userId === userId && s.status === 'pending'
            ? { ...s, status: 'approved' as const, approvedAt: now, comment }
            : s
        )
        const allApproved = steps.every((s) => s.status === 'approved')
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === docId ? { ...d, status: allApproved ? 'approved' : 'in_progress', approvalSteps: steps, updatedAt: now } as Document : d
          ),
        }))
      },

      rejectStep: (docId, userId, comment) => {
        const doc = get().getDocument(docId)
        if (!doc) return
        const now = new Date().toISOString()
        const steps = doc.approvalSteps.map((s) =>
          s.userId === userId && s.status === 'pending'
            ? { ...s, status: 'rejected' as const, approvedAt: now, comment }
            : s
        )
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === docId ? { ...d, status: 'rejected', approvalSteps: steps, updatedAt: now } as Document : d
          ),
        }))
      },

      getDocument: (id) => get().documents.find((d) => d.id === id),

      getMyDocuments: () => {
        const userId = get().currentUserId
        return get().documents.filter((d) => d.drafterId === userId)
      },

      getPendingApprovals: () => {
        const userId = get().currentUserId
        return get().documents.filter((d) => {
          if (d.status === 'draft' || d.status === 'approved' || d.status === 'rejected') return false
          const myStep = d.approvalSteps.find((s) => s.userId === userId)
          if (!myStep || myStep.status !== 'pending') return false
          // Check if previous steps are all approved
          const prevSteps = d.approvalSteps.filter((s) => s.order < myStep.order)
          return prevSteps.every((s) => s.status === 'approved')
        })
      },

      getPendingCount: () => get().getPendingApprovals().length,
    }),
    { name: 'document-store' }
  )
)
