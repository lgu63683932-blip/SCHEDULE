import React, { useState } from 'react'
import { Search, SlidersHorizontal, ArrowUpDown, Plus, X } from 'lucide-react'
import { ViewSwitcher } from '../ui/ViewSwitcher'
import { ViewType, TaskStatus, Priority, STATUS_LABELS, PRIORITY_LABELS } from '../../types'
import { useAppStore } from '../../store/appStore'
import { useTaskStore } from '../../store/taskStore'
import { useQuickCreate } from './Layout'

interface Props {
  title: string
  showViewSwitcher?: boolean
  projectId?: string
  onAddTask?: () => void
}

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'cancelled']
const ALL_PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

export const Header: React.FC<Props> = ({ title, showViewSwitcher = false, projectId, onAddTask }) => {
  const {
    currentView, setCurrentView,
    searchQuery, setSearchQuery,
    filterStatus, setFilterStatus,
    filterPriority, setFilterPriority,
    sortBy, setSortBy,
    sortDirection, setSortDirection,
    resetFilters,
  } = useAppStore()

  const { projects } = useTaskStore()
  const { openQuickCreate } = useQuickCreate()
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  const hasActiveFilters = filterStatus.length > 0 || filterPriority.length > 0 || searchQuery

  const handleAddTask = () => {
    if (onAddTask) {
      onAddTask()
      return
    }
    const defaultProjectId = projectId || projects[0]?.id || ''
    openQuickCreate(defaultProjectId)
  }

  const toggleStatus = (s: TaskStatus) => {
    setFilterStatus(
      filterStatus.includes(s) ? filterStatus.filter((x) => x !== s) : [...filterStatus, s]
    )
  }

  const togglePriority = (p: Priority) => {
    setFilterPriority(
      filterPriority.includes(p) ? filterPriority.filter((x) => x !== p) : [...filterPriority, p]
    )
  }

  return (
    <header className="border-b border-notion-border bg-white">
      <div className="flex items-center justify-between px-6 py-3">
        <h1 className="text-lg font-semibold text-notion-text">{title}</h1>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색..."
              className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:bg-white w-44 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => { setShowFilters(!showFilters); setShowSort(false) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                filterStatus.length > 0 || filterPriority.length > 0
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <SlidersHorizontal size={14} />
              필터
              {(filterStatus.length + filterPriority.length) > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {filterStatus.length + filterPriority.length}
                </span>
              )}
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3 fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">필터</span>
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="text-xs text-blue-500 hover:underline">
                      초기화
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-600 mb-1.5">상태</div>
                  <div className="flex flex-wrap gap-1">
                    {ALL_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleStatus(s)}
                        className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                          filterStatus.includes(s)
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1.5">우선순위</div>
                  <div className="flex flex-wrap gap-1">
                    {ALL_PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => togglePriority(p)}
                        className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                          filterPriority.includes(p)
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => { setShowSort(!showSort); setShowFilters(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <ArrowUpDown size={14} />
              정렬
            </button>

            {showSort && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2 fade-in">
                {[
                  { value: 'createdAt', label: '생성일' },
                  { value: 'dueDate', label: '마감일' },
                  { value: 'priority', label: '우선순위' },
                  { value: 'title', label: '제목' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (sortBy === option.value) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy(option.value as any)
                        setSortDirection('asc')
                      }
                      setShowSort(false)
                    }}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg flex items-center justify-between ${
                      sortBy === option.value ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {option.label}
                    {sortBy === option.value && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Task */}
          <button
            onClick={handleAddTask}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={14} />
            새 할 일
          </button>
        </div>
      </div>

      {/* View Switcher */}
      {showViewSwitcher && (
        <div className="px-6 pb-3">
          <ViewSwitcher currentView={currentView} onChange={setCurrentView} />
        </div>
      )}
    </header>
  )
}
