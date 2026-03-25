import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { TableView } from '../components/views/TableView'
import { KanbanView } from '../components/views/KanbanView'
import { CalendarView } from '../components/views/CalendarView'
import { TimelineView } from '../components/views/TimelineView'
import { ListView } from '../components/views/ListView'
import { useTaskStore } from '../store/taskStore'
import { useAppStore } from '../store/appStore'
import { Task } from '../types'

export const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { tasks, projects, addTask } = useTaskStore()
  const { currentView, searchQuery, filterStatus, filterPriority, sortBy, sortDirection } = useAppStore()

  const project = projects.find((p) => p.id === id)

  if (!project) {
    return <Navigate to="/" replace />
  }

  const projectTasks = tasks
    .filter((t) => {
      if (t.projectId !== id) return false
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

  const handleAddTask = () => {
    addTask({
      title: '새 할 일',
      status: 'todo',
      priority: 'medium',
      tags: [],
      projectId: id!,
    })
  }

  const renderView = () => {
    switch (currentView) {
      case 'table': return <TableView tasks={projectTasks} onAddTask={handleAddTask} />
      case 'kanban': return <KanbanView tasks={projectTasks} />
      case 'calendar': return <CalendarView tasks={projectTasks} />
      case 'timeline': return <TimelineView tasks={projectTasks} />
      case 'list': return <ListView tasks={projectTasks} />
      default: return <TableView tasks={projectTasks} onAddTask={handleAddTask} />
    }
  }

  return (
    <>
      <Header
        title={`${project.icon} ${project.name}`}
        showViewSwitcher
        projectId={id}
        onAddTask={handleAddTask}
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderView()}
      </div>
    </>
  )
}
