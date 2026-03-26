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

export type UserStatus = 'active' | 'inactive' | 'password_assigned'

export interface User {
  id: string
  userId: string       // 아이디 (로그인용)
  name: string         // 성명
  department: string   // 부서
  position?: string    // 직위
  email?: string       // 이메일
  joinDate?: string    // 입사일 (YYYY-MM-DD)
  userStatus: UserStatus // 상태코드
  password?: string    // 비밀번호
  avatar: string
  color: string
  createdAt: string
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: '사용',
  inactive: '종료',
  password_assigned: '비밀번호부여',
}

export const USER_STATUS_CODES: Record<UserStatus, string> = {
  active: '01',
  inactive: '02',
  password_assigned: '03',
}

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  active: 'bg-green-50 text-green-700 border border-green-200',
  inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
  password_assigned: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
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
