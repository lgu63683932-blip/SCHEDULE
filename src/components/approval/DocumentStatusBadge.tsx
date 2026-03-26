import React from 'react'
import { DocumentStatus, DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_COLORS } from '../../types/document'

interface Props {
  status: DocumentStatus
  size?: 'sm' | 'md'
}

export const DocumentStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center rounded-md font-medium ${sizeClass} ${DOCUMENT_STATUS_COLORS[status]}`}>
      {DOCUMENT_STATUS_LABELS[status]}
    </span>
  )
}
