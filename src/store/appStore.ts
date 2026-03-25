import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ViewType } from '../types'

interface AppStore {
  currentView: ViewType
  sidebarOpen: boolean
  searchQuery: string
  filterStatus: string[]
  filterPriority: string[]
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title'
  sortDirection: 'asc' | 'desc'

  setCurrentView: (view: ViewType) => void
  setSidebarOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setFilterStatus: (statuses: string[]) => void
  setFilterPriority: (priorities: string[]) => void
  setSortBy: (sort: 'dueDate' | 'priority' | 'createdAt' | 'title') => void
  setSortDirection: (dir: 'asc' | 'desc') => void
  resetFilters: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentView: 'table',
      sidebarOpen: true,
      searchQuery: '',
      filterStatus: [],
      filterPriority: [],
      sortBy: 'createdAt',
      sortDirection: 'desc',

      setCurrentView: (view) => set({ currentView: view }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterStatus: (statuses) => set({ filterStatus: statuses }),
      setFilterPriority: (priorities) => set({ filterPriority: priorities }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setSortDirection: (dir) => set({ sortDirection: dir }),
      resetFilters: () =>
        set({ filterStatus: [], filterPriority: [], searchQuery: '' }),
    }),
    {
      name: 'schedule-app-ui',
    }
  )
)
