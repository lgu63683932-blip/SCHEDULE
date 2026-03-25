import React from 'react'
import { ViewType } from '../../types'
import { Table2, Columns, Calendar, AlignLeft, BarChart3 } from 'lucide-react'

interface Props {
  currentView: ViewType
  onChange: (view: ViewType) => void
}

const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'table', label: '테이블', icon: <Table2 size={14} /> },
  { id: 'kanban', label: '칸반', icon: <Columns size={14} /> },
  { id: 'calendar', label: '캘린더', icon: <Calendar size={14} /> },
  { id: 'timeline', label: '타임라인', icon: <BarChart3 size={14} /> },
  { id: 'list', label: '목록', icon: <AlignLeft size={14} /> },
]

export const ViewSwitcher: React.FC<Props> = ({ currentView, onChange }) => {
  return (
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onChange(view.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            currentView === view.id
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
        >
          {view.icon}
          <span>{view.label}</span>
        </button>
      ))}
    </div>
  )
}
