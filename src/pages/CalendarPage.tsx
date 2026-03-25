import React from 'react'
import { Header } from '../components/layout/Header'
import { CalendarView } from '../components/views/CalendarView'
import { useTaskStore } from '../store/taskStore'
import { useAppStore } from '../store/appStore'

export const CalendarPage: React.FC = () => {
  const { tasks } = useTaskStore()
  const { searchQuery, filterStatus, filterPriority } = useAppStore()

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStatus.length > 0 && !filterStatus.includes(t.status)) return false
    if (filterPriority.length > 0 && !filterPriority.includes(t.priority)) return false
    return true
  })

  return (
    <>
      <Header title="캘린더" />
      <div className="flex-1 overflow-hidden flex flex-col">
        <CalendarView tasks={filteredTasks} />
      </div>
    </>
  )
}
