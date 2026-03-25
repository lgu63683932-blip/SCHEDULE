import { format, isToday, isPast, isFuture, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { TaskStatus, Priority } from '../types'

export function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    return format(parseISO(dateStr), 'M월 d일', { locale: ko })
  } catch {
    return ''
  }
}

export function formatDateFull(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    return format(parseISO(dateStr), 'yyyy년 M월 d일', { locale: ko })
  } catch {
    return ''
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd', { locale: ko })
  } catch {
    return ''
  }
}

export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false
  try {
    return isPast(parseISO(dateStr)) && !isToday(parseISO(dateStr))
  } catch {
    return false
  }
}

export function isDueToday(dateStr?: string): boolean {
  if (!dateStr) return false
  try {
    return isToday(parseISO(dateStr))
  } catch {
    return false
  }
}

export function isDueSoon(dateStr?: string): boolean {
  if (!dateStr) return false
  try {
    const date = parseISO(dateStr)
    return isFuture(date) && !isToday(date)
  } catch {
    return false
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const STATUS_BG: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

export const PRIORITY_BG: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-500',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
}

export const STATUS_DOT: Record<TaskStatus, string> = {
  todo: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  review: 'bg-yellow-500',
  done: 'bg-green-500',
  cancelled: 'bg-red-400',
}
