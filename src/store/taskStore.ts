import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, Project, User } from '../types'
import { sampleTasks, sampleProjects, sampleUsers } from '../data/sampleData'
import { generateId } from '../utils/helpers'

interface TaskStore {
  tasks: Task[]
  projects: Project[]
  users: User[]
  selectedTaskId: string | null

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  setSelectedTask: (id: string | null) => void

  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => string
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Getters
  getTasksByProject: (projectId: string) => Task[]
  getTask: (id: string) => Task | undefined
  getProject: (id: string) => Project | undefined
  getUser: (id: string) => User | undefined
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: sampleTasks,
      projects: sampleProjects,
      users: sampleUsers,
      selectedTaskId: null,

      addTask: (taskData) => {
        const id = generateId()
        const now = new Date().toISOString()
        const task: Task = {
          ...taskData,
          id,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ tasks: [...state.tasks, task] }))
        return id
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        }))
      },

      setSelectedTask: (id) => {
        set({ selectedTaskId: id })
      },

      addProject: (projectData) => {
        const id = generateId()
        const project: Project = {
          ...projectData,
          id,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ projects: [...state.projects, project] }))
        return id
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
        }))
      },

      getTasksByProject: (projectId) => {
        return get().tasks.filter((t) => t.projectId === projectId)
      },

      getTask: (id) => {
        return get().tasks.find((t) => t.id === id)
      },

      getProject: (id) => {
        return get().projects.find((p) => p.id === id)
      },

      getUser: (id) => {
        return get().users.find((u) => u.id === id)
      },
    }),
    {
      name: 'schedule-app-data',
    }
  )
)
