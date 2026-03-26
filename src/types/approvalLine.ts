export interface ApprovalLineStep {
  userId: string
  role: string
}

export interface ApprovalLineTemplate {
  id: string
  name: string
  steps: ApprovalLineStep[]
  isDefault: boolean
  createdAt: string
}
