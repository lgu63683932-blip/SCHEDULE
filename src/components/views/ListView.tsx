import React, { useState } from 'react'
import { Task, TaskStatus, STATUS_LABELS } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'
import { PriorityBadge } from '../ui/PriorityBadge'
import { formatDate, isOverdue, isDueToday, STATUS_DOT } from '../../utils/helpers'
import { useTaskStore } from '../../store/taskStore'
import { ChevronDown, ChevronRight, Plus, CalendarDays } from 'lucide-react'

interface Props {
  tasks: Task[]
}

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'cancelled']

export const ListView: React.FC<Props> = ({ tasks }) => {
  const { setSelectedTask, updateTask, addTask, projects } = useTaskStore()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const grouped = STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  const toggle = (status: TaskStatus) => {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))
  }

  const handleAdd = (status: TaskStatus) => {
    const defaultProject = projects[0]?.id || ''
    addTask({ title: '새 할 일', status, priority: 'medium', tags: [], projectId: defaultProject })
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-4xl mb-3">📝</div>
        <div className="text-base font-medium text-gray-600">할 일이 없습니다</div>
        <div className="text-sm text-gray-400 mt-1">새 할 일을 추가하여 시작하세요</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      {STATUSES.map((status) => {
        const groupTasks = grouped[status]
        const isCollapsed = collapsed[status]

        return (
          <div key={status} className="border-b border-gray-100 last:border-b-0">
            {/* Group header */}
            <div
              className="flex items-center gap-2 px-6 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors group sticky top-0 bg-white z-10 border-b border-gray-50"
              onClick={() => toggle(status)}
            >
              <span className="text-gray-400">
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </span>
              <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
              <span className="text-sm font-semibold text-gray-700">{STATUS_LABELS[status]}</span>
              <span className="text-xs text-gray-400 ml-1">{groupTasks.length}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleAdd(status) }}
                className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-all text-gray-400 hover:text-gray-600"
                title="추가"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Tasks */}
            {!isCollapsed && (
              <div>
                {groupTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate) && task.status !== 'done' && task.status !== 'cancelled'
                  const dueToday = isDueToday(task.dueDate)

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task.id)}
                      className="flex items-center gap-3 px-6 py-2.5 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={(e) => {
                          e.stopPropagation()
                          updateTask(task.id, { status: e.target.checked ? 'done' : 'todo' })
                        }}
                        className="rounded flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <span
                        className={`flex-1 text-sm ${
                          task.status === 'done'
                            ? 'line-through text-gray-400'
                            : 'text-notion-text font-medium'
                        }`}
                      >
                        {task.title}
                      </span>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PriorityBadge priority={task.priority} size="sm" />
                        {task.dueDate && (
                          <div className={`flex items-center gap-1 text-xs ${
                            overdue ? 'text-red-500' : dueToday ? 'text-orange-500' : 'text-gray-400'
                          }`}>
                            <CalendarDays size={11} />
                            {formatDate(task.dueDate)}
                          </div>
                        )}
                        <div className="flex gap-1">
                          {task.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {groupTasks.length === 0 && (
                  <div className="px-6 py-3 text-sm text-gray-400 italic">
                    이 상태의 할 일이 없습니다
                  </div>
                )}

                <div
                  onClick={() => handleAdd(status)}
                  className="flex items-center gap-2 px-6 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Plus size={13} />
                  새로 만들기
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
