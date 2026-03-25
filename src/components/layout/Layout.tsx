import React, { createContext, useContext, useState } from 'react'
import { Sidebar } from './Sidebar'
import { TaskModal } from '../task/TaskModal'
import { QuickCreateModal } from '../task/QuickCreateModal'
import { useTaskStore } from '../../store/taskStore'

interface QuickCreateContextType {
  openQuickCreate: (projectId?: string) => void
}

export const QuickCreateContext = createContext<QuickCreateContextType>({
  openQuickCreate: () => {},
})

export const useQuickCreate = () => useContext(QuickCreateContext)

interface Props {
  children: React.ReactNode
}

export const Layout: React.FC<Props> = ({ children }) => {
  const { selectedTaskId, setSelectedTask } = useTaskStore()
  const [quickCreateProjectId, setQuickCreateProjectId] = useState<string | null>(null)

  const openQuickCreate = (projectId?: string) => {
    setQuickCreateProjectId(projectId ?? '')
  }

  const closeQuickCreate = () => {
    setQuickCreateProjectId(null)
  }

  return (
    <QuickCreateContext.Provider value={{ openQuickCreate }}>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>

        {selectedTaskId && (
          <TaskModal
            taskId={selectedTaskId}
            onClose={() => setSelectedTask(null)}
          />
        )}

        {quickCreateProjectId !== null && (
          <QuickCreateModal
            defaultProjectId={quickCreateProjectId || undefined}
            onClose={closeQuickCreate}
          />
        )}
      </div>
    </QuickCreateContext.Provider>
  )
}
