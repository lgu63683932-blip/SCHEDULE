export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type ViewType = 'table' | 'kanban' | 'calendar' | 'timeline' | 'list'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  dueDate?: string // ISO string
  startDate?: string
  assignee?: string
  tags: string[]
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  avatar: string
  color: string
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '할 일',
  in_progress: '진행 중',
  review: '검토 중',
  done: '완료',
  cancelled: '취소됨',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#787774',
  in_progress: '#2383e2',
  review: '#cb912f',
  done: '#0f7b6c',
  cancelled: '#eb5757',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#787774',
  medium: '#2383e2',
  high: '#d9730d',
  urgent: '#eb5757',
}
