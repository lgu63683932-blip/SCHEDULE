import React, { useState } from 'react'
import { Task, TaskStatus, Priority, STATUS_LABELS, PRIORITY_LABELS } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'
import { PriorityBadge } from '../ui/PriorityBadge'
import { formatDate, isOverdue, isDueToday } from '../../utils/helpers'
import { useTaskStore } from '../../store/taskStore'
import { ChevronUp, ChevronDown, Plus } from 'lucide-react'

interface Props {
  tasks: Task[]
  onAddTask?: () => void
}

type SortKey = 'title' | 'status' | 'priority' | 'dueDate' | 'assignee'

export const TableView: React.FC<Props> = ({ tasks, onAddTask }) => {
  const { setSelectedTask, updateTask, getUser, addTask, projects } = useTaskStore()
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
  const STATUS_ORDER: Record<TaskStatus, number> = { todo: 0, in_progress: 1, review: 2, done: 3, cancelled: 4 }

  const sortedTasks = [...tasks].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'title') cmp = a.title.localeCompare(b.title)
    else if (sortKey === 'status') cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    else if (sortKey === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    else if (sortKey === 'dueDate') cmp = (a.dueDate || '').localeCompare(b.dueDate || '')
    else if (sortKey === 'assignee') cmp = (a.assignee || '').localeCompare(b.assignee || '')
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="opacity-0 group-hover:opacity-40"><ChevronUp size={12} /></span>
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const startEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(task.id)
    setEditTitle(task.title)
  }

  const commitEdit = (id: string) => {
    if (editTitle.trim()) updateTask(id, { title: editTitle.trim() })
    setEditingId(null)
  }

  const handleAddRow = () => {
    if (onAddTask) {
      onAddTask()
    } else {
      const defaultProject = projects[0]?.id || ''
      addTask({ title: '새 할 일', status: 'todo', priority: 'medium', tags: [], projectId: defaultProject })
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📋</div>
        <div className="text-base font-medium text-gray-600 mb-1">할 일이 없습니다</div>
        <div className="text-sm text-gray-400 mb-4">새 할 일을 추가하여 시작하세요</div>
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus size={14} />
          새 할 일 추가
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-auto flex-1">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="w-8 px-3 py-2.5 text-left">
              <input type="checkbox" className="rounded" />
            </th>
            {([
              { key: 'title', label: '제목', width: 'w-72' },
              { key: 'status', label: '상태', width: 'w-28' },
              { key: 'priority', label: '우선순위', width: 'w-24' },
              { key: 'dueDate', label: '마감일', width: 'w-28' },
              { key: 'assignee', label: '담당자', width: 'w-28' },
            ] as { key: SortKey; label: string; width: string }[]).map((col) => (
              <th
                key={col.key}
                className={`${col.width} px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none group`}
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  <SortIcon col={col.key} />
                </div>
              </th>
            ))}
            <th className="flex-1 px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
              태그
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task) => {
            const assignee = task.assignee ? getUser(task.assignee) : null
            const overdue = isOverdue(task.dueDate) && task.status !== 'done' && task.status !== 'cancelled'
            const dueToday = isDueToday(task.dueDate)

            return (
              <tr
                key={task.id}
                className="border-b border-gray-100 hover:bg-gray-50 group cursor-pointer transition-colors"
                onClick={() => setSelectedTask(task.id)}
              >
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={(e) => updateTask(task.id, { status: e.target.checked ? 'done' : 'todo' })}
                    className="rounded"
                  />
                </td>
                <td className="px-3 py-2.5">
                  {editingId === task.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => commitEdit(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit(task.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="text-sm text-notion-text outline-none border-b border-blue-400 w-full bg-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-notion-text'}`}
                      onDoubleClick={(e) => startEdit(task, e)}
                    >
                      {task.title}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={task.status} size="sm" />
                </td>
                <td className="px-3 py-2.5">
                  <PriorityBadge priority={task.priority} size="sm" />
                </td>
                <td className="px-3 py-2.5">
                  {task.dueDate && (
                    <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : dueToday ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                      {formatDate(task.dueDate)}
                      {overdue && ' ⚠'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {assignee && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{assignee.avatar}</span>
                      <span className="text-xs text-gray-600">{assignee.name}</span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div
        onClick={handleAddRow}
        className="flex items-center gap-2 px-6 py-2.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
      >
        <Plus size={14} />
        새로 만들기
      </div>
    </div>
  )
}
