export type DocumentType = 'approval_request' | 'business_trip' | 'expense'
export type DocumentStatus = 'draft' | 'pending' | 'in_progress' | 'approved' | 'rejected'
export type ApproverStatus = 'pending' | 'approved' | 'rejected' | 'skipped'

export interface ApprovalStep {
  id: string
  userId: string
  role: string // '기안자' | '팀장' | '부서장' | '대표이사'
  status: ApproverStatus
  comment?: string
  approvedAt?: string
  order: number
}

export interface AttachmentMeta {
  id: string
  name: string
  size: number
  fileType: string
}

export interface BaseDocument {
  id: string
  type: DocumentType
  title: string
  docNumber: string // e.g. "품의-2026-001"
  status: DocumentStatus
  drafterId: string
  approvalSteps: ApprovalStep[]
  attachments?: AttachmentMeta[]
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

export interface ApprovalRequestDoc extends BaseDocument {
  type: 'approval_request'
  docHeader?: {
    retentionPeriod?: string  // 보존기한 (코드 label)
    effectiveDate?: string    // 시행일자 (YYYY-MM-DD)
    drafterDept?: string      // 기안부서
    drafterDate?: string      // 기안일자 (YYYY-MM-DD)
  }
  content: {
    purpose: string      // 목적
    background: string   // 배경
    details: string      // 세부내용
    expectedEffect: string // 기대효과
    budget?: string      // 예산
  }
}

export interface BusinessTripDoc extends BaseDocument {
  type: 'business_trip'
  content: {
    destination: string  // 출장지
    startDate: string    // 출장 시작일
    endDate: string      // 출장 종료일
    purpose: string      // 출장 목적
    activities: string   // 출장 내용
    results: string      // 성과 및 결과
    expenses?: string    // 지출 비용
  }
}

export interface ExpenseItem {
  id: string
  date: string
  category: string  // 교통비, 식비, 숙박비, 기타
  description: string
  amount: number
}

export interface ExpenseDoc extends BaseDocument {
  type: 'expense'
  content: {
    purpose: string      // 지출 목적
    items: ExpenseItem[] // 지출 항목들
    totalAmount: number  // 합계
    notes?: string       // 비고
  }
}

export type Document = ApprovalRequestDoc | BusinessTripDoc | ExpenseDoc

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  approval_request: '품의서',
  business_trip: '출장보고서',
  expense: '지출결의서',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: '임시저장',
  pending: '결재 대기',
  in_progress: '결재 중',
  approved: '승인 완료',
  rejected: '반려',
}

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
}

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  approval_request: '📋',
  business_trip: '✈️',
  expense: '💰',
}
