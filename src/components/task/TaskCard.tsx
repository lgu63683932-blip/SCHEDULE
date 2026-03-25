import React from 'react'
import { Task } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'
import { PriorityBadge } from '../ui/PriorityBadge'
import { formatDate, isOverdue, isDueToday } from '../../utils/helpers'
import { CalendarDays, User } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'

interface Props {
  task: Task
  onClick?: () => void
  isDragging?: boolean
}

export const TaskCard: React.FC<Props> = ({ task, onClick, isDragging }) => {
  const { getUser, setSelectedTask } = useTaskStore()
  const assignee = task.assignee ? getUser(task.assignee) : null
  const overdue = isOverdue(task.dueDate) && task.status !== 'done' && task.status !== 'cancelled'
  const dueToday = isDueToday(task.dueDate)

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setSelectedTask(task.id)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all group ${
        isDragging ? 'shadow-lg border-blue-300 opacity-90 rotate-1' : ''
      }`}
    >
      {/* Title */}
      <div className="text-sm font-medium text-notion-text mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {task.title}
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <StatusBadge status={task.status} size="sm" />
        <PriorityBadge priority={task.priority} size="sm" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${
              overdue ? 'text-red-500' : dueToday ? 'text-orange-500' : 'text-gray-400'
            }`}>
              <CalendarDays size={11} />
              {formatDate(task.dueDate)}
            </div>
          )}
          {task.tags.length > 0 && (
            <div className="flex gap-1">
              {task.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {assignee && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ backgroundColor: assignee.color + '22', color: assignee.color }}
            title={assignee.name}
          >
            {assignee.avatar}
          </div>
        )}
      </div>
    </div>
  )
}
