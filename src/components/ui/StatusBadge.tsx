import React from 'react'
import { TaskStatus, STATUS_LABELS } from '../../types'
import { STATUS_BG } from '../../utils/helpers'

interface Props {
  status: TaskStatus
  onClick?: () => void
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<Props> = ({ status, onClick, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium ${sizeClasses} ${STATUS_BG[status]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${
          status === 'todo' ? 'bg-gray-400' :
          status === 'in_progress' ? 'bg-blue-500' :
          status === 'review' ? 'bg-yellow-500' :
          status === 'done' ? 'bg-green-500' :
          'bg-red-400'
        }`}
      />
      {STATUS_LABELS[status]}
    </span>
  )
}
