import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Inbox,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Hash,
  FileText,
  ClipboardCheck,
  FolderOpen,
} from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useDocumentStore } from '../../store/documentStore'
import { generateId } from '../../utils/helpers'

const PROJECT_COLORS = [
  '#2383e2', '#0f7b6c', '#cb912f', '#eb5757',
  '#9065b0', '#d9730d', '#448361', '#337ea9',
]

const PROJECT_ICONS = ['🌐', '📱', '📢', '📊', '🎯', '💡', '🚀', '🔧']

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { projects, addProject } = useTaskStore()
  const { getPendingCount } = useDocumentStore()
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [approvalOpen, setApprovalOpen] = useState(true)
  const [addingProject, setAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const pendingCount = getPendingCount()

  const navItems = [
    { path: '/', label: '대시보드', icon: <LayoutDashboard size={16} /> },
    { path: '/tasks', label: '내 할 일', icon: <CheckSquare size={16} /> },
    { path: '/calendar', label: '캘린더', icon: <Calendar size={16} /> },
    { path: '/inbox', label: '받은 편지함', icon: <Inbox size={16} /> },
  ]

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const colorIdx = Math.floor(Math.random() * PROJECT_COLORS.length)
      const iconIdx = Math.floor(Math.random() * PROJECT_ICONS.length)
      const id = addProject({
        name: newProjectName.trim(),
        color: PROJECT_COLORS[colorIdx],
        icon: PROJECT_ICONS[iconIdx],
      })
      setNewProjectName('')
      setAddingProject(false)
      navigate(`/project/${id}`)
    } else {
      setAddingProject(false)
    }
  }

  return (
    <aside className="w-60 flex-shrink-0 h-screen flex flex-col border-r border-notion-border bg-notion-sidebar overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-notion-border">
        <div className="w-7 h-7 bg-gray-800 rounded-md flex items-center justify-center text-white text-sm font-bold">
          S
        </div>
        <div>
          <div className="text-sm font-semibold text-notion-text">스케줄</div>
          <div className="text-xs text-notion-textSecondary">워크스페이스</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-2 mb-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors mb-0.5 ${
                location.pathname === item.path
                  ? 'bg-notion-active text-notion-text font-medium'
                  : 'text-notion-textSecondary hover:bg-notion-hover hover:text-notion-text'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        {/* Approval section */}
        <div className="px-2 mt-3">
          <div
            className="flex items-center justify-between px-2.5 py-1 rounded-md cursor-pointer hover:bg-notion-hover group mb-1"
            onClick={() => setApprovalOpen(!approvalOpen)}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-notion-textSecondary uppercase tracking-wide">
              {approvalOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              전자결재
            </div>
          </div>
          {approvalOpen && (
            <div className="space-y-0.5">
              {[
                { path: '/approval', label: '결재 홈', icon: <ClipboardCheck size={15} /> },
                { path: '/approval/inbox', label: '결재함', icon: <Inbox size={15} />, badge: pendingCount },
                { path: '/approval/my-documents', label: '내 문서함', icon: <FolderOpen size={15} /> },
              ].map((item) => (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    location.pathname === item.path
                      ? 'bg-notion-active text-notion-text font-medium'
                      : 'text-notion-textSecondary hover:bg-notion-hover hover:text-notion-text'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
              <div className="pt-1 pb-0.5">
                <div className="text-xs text-notion-textSecondary px-2.5 py-1 opacity-60">새 문서</div>
                {[
                  { path: '/approval/new/approval-request', label: '📋 품의서' },
                  { path: '/approval/new/business-trip', label: '✈️ 출장보고서' },
                  { path: '/approval/new/expense', label: '💰 지출결의서' },
                ].map((item) => (
                  <Link key={item.path} to={item.path}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-md text-xs transition-colors text-notion-textSecondary hover:bg-notion-hover hover:text-notion-text">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Projects section */}
        <div className="px-2 mt-3">
          <div
            className="flex items-center justify-between px-2.5 py-1 rounded-md cursor-pointer hover:bg-notion-hover group mb-1"
            onClick={() => setProjectsOpen(!projectsOpen)}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-notion-textSecondary uppercase tracking-wide">
              {projectsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              프로젝트
            </div>
            <button
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-notion-active rounded transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                setAddingProject(true)
                setProjectsOpen(true)
              }}
            >
              <Plus size={14} className="text-notion-textSecondary" />
            </button>
          </div>

          {projectsOpen && (
            <div className="space-y-0.5">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    location.pathname === `/project/${project.id}`
                      ? 'bg-notion-active text-notion-text font-medium'
                      : 'text-notion-textSecondary hover:bg-notion-hover hover:text-notion-text'
                  }`}
                >
                  <span className="text-base leading-none">{project.icon}</span>
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}

              {addingProject && (
                <div className="px-2.5 py-1">
                  <input
                    autoFocus
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onBlur={handleAddProject}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddProject()
                      if (e.key === 'Escape') {
                        setAddingProject(false)
                        setNewProjectName('')
                      }
                    }}
                    placeholder="프로젝트 이름..."
                    className="w-full text-sm bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-400"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Settings & User */}
      <div className="border-t border-notion-border px-2 py-2">
        <Link
          to="/settings"
          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors mb-1 ${
            location.pathname === '/settings'
              ? 'bg-notion-active text-notion-text'
              : 'text-notion-textSecondary hover:bg-notion-hover hover:text-notion-text'
          }`}
        >
          <Settings size={16} />
          설정
        </Link>
        <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-notion-hover cursor-pointer">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            나
          </div>
          <div>
            <div className="text-xs font-medium text-notion-text">내 계정</div>
            <div className="text-xs text-notion-textSecondary">user@example.com</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
