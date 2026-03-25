import React from 'react'
import { Header } from '../components/layout/Header'
import { TableView } from '../components/views/TableView'
import { KanbanView } from '../components/views/KanbanView'
import { CalendarView } from '../components/views/CalendarView'
import { TimelineView } from '../components/views/TimelineView'
import { ListView } from '../components/views/ListView'
import { useTaskStore } from '../store/taskStore'
import { useAppStore } from '../store/appStore'
import { Task } from '../types'

export const MyTasks: React.FC = () => {
  const { tasks } = useTaskStore()
  const { currentView, searchQuery, filterStatus, filterPriority, sortBy, sortDirection } = useAppStore()

  const filteredTasks = tasks
    .filter((t) => {
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filterStatus.length > 0 && !filterStatus.includes(t.status)) return false
      if (filterPriority.length > 0 && !filterPriority.includes(t.priority)) return false
      return true
    })
    .sort((a: Task, b: Task) => {
      const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
      let cmp = 0
      if (sortBy === 'dueDate') cmp = (a.dueDate || '').localeCompare(b.dueDate || '')
      else if (sortBy === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      else if (sortBy === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt)
      else if (sortBy === 'title') cmp = a.title.localeCompare(b.title)
      return sortDirection === 'asc' ? cmp : -cmp
    })

  const renderView = () => {
    switch (currentView) {
      case 'table': return <TableView tasks={filteredTasks} />
      case 'kanban': return <KanbanView tasks={filteredTasks} />
      case 'calendar': return <CalendarView tasks={filteredTasks} />
      case 'timeline': return <TimelineView tasks={filteredTasks} />
      case 'list': return <ListView tasks={filteredTasks} />
      default: return <TableView tasks={filteredTasks} />
    }
  }

  return (
    <>
      <Header title="내 할 일" showViewSwitcher />
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderView()}
      </div>
    </>
  )
}
