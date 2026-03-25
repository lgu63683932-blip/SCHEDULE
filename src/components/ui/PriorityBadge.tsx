import React from 'react'
import { Priority, PRIORITY_LABELS } from '../../types'
import { PRIORITY_BG } from '../../utils/helpers'
import { Flag } from 'lucide-react'

interface Props {
  priority: Priority
  onClick?: () => void
  size?: 'sm' | 'md'
}

export const PriorityBadge: React.FC<Props> = ({ priority, onClick, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium ${sizeClasses} ${PRIORITY_BG[priority]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      <Flag size={10} />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
