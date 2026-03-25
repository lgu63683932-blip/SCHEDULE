import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { MyTasks } from './pages/MyTasks'
import { CalendarPage } from './pages/CalendarPage'
import { ProjectPage } from './pages/ProjectPage'
import { Settings } from './pages/Settings'

const InboxPage: React.FC = () => (
  <div className="flex flex-col items-center justify-center flex-1 py-20">
    <div className="text-5xl mb-4">📬</div>
    <div className="text-lg font-medium text-gray-600 mb-1">받은 편지함</div>
    <div className="text-sm text-gray-400">알림 및 메시지가 여기에 표시됩니다</div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<MyTasks />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/project/:id" element={<ProjectPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
