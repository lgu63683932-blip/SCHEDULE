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
  ClipboardCheck,
  FolderOpen,
  CalendarDays,
  FileSignature,
  Plane,
  Receipt,
  FolderKanban,
} from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { useDocumentStore } from '../../store/documentStore'

const PROJECT_COLORS = [
  '#2383e2', '#0f7b6c', '#cb912f', '#eb5757',
  '#9065b0', '#d9730d', '#448361', '#337ea9',
]
const PROJECT_ICONS = ['🌐', '📱', '📢', '📊', '🎯', '💡', '🚀', '🔧']

const NavGroup: React.FC<{
  label: string
  icon: React.ReactNode
  color: string        // 카테고리 색상 (Tailwind text color class)
  bgColor: string      // 아이콘 배경색 (Tailwind bg class)
  open: boolean
  onToggle: () => void
  onAdd?: () => void
  children: React.ReactNode
}> = ({ label, icon, color, bgColor, open, onToggle, onAdd, children }) => (
  <div className="px-2 mt-1">
    <div
      className="flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer hover:bg-notion-hover group mb-0.5"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${bgColor}`}>
          <span className={color}>{icon}</span>
        </span>
        <span className={`text-xs font-bold tracking-wide ${color}`}>{label}</span>
        <span className="text-notion-textSecondary">
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </span>
      </div>
      {onAdd && (
        <button
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-notion-active rounded transition-opacity"
          onClick={(e) => { e.stopPropagation(); onAdd() }}
        >
          <Plus size={14} className="text-notion-textSecondary" />
        </button>
      )}
    </div>
    {open && <div className="space-y-0.5 ml-2">{children}</div>}
  </div>
)

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { projects, addProject } = useTaskStore()
  const { getPendingCount } = useDocumentStore()
  const pendingCount = getPendingCount()

  const [scheduleOpen, setScheduleOpen] = useState(true)
  const [approvalOpen, setApprovalOpen] = useState(true)
  const [registerOpen, setRegisterOpen] = useState(true)
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [addingProject, setAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const isActive = (path: string) => location.pathname === path

  const navLink = (
    path: string,
    label: string,
    icon: React.ReactNode,
    badge?: number
  ) => (
    <Link
      key={path}
      to={path}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
        isActive(path)
          ? 'bg-notion-active text-notion-text font-medium'
          : 'text-notion-textSecondary hover:bg-notion-hover hover:text-notion-text'
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
          {badge}
        </span>
      ) : null}
    </Link>
  )

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

      <nav className="flex-1 overflow-y-auto py-2">
        {/* 대시보드 — 회색 */}
        <div className="px-2 mb-1">
          <Link
            to="/"
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              isActive('/')
                ? 'bg-notion-active text-notion-text font-medium'
                : 'text-notion-textSecondary hover:bg-notion-hover hover:text-notion-text'
            }`}
          >
            <span className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard size={13} className="text-gray-600" />
            </span>
            <span className="text-xs font-bold tracking-wide text-gray-600">대시보드</span>
          </Link>
        </div>

        {/* 일정관리 — 파란색 */}
        <NavGroup
          label="일정관리"
          icon={<CalendarDays size={13} />}
          color="text-blue-600"
          bgColor="bg-blue-100"
          open={scheduleOpen}
          onToggle={() => setScheduleOpen(!scheduleOpen)}
        >
          {navLink('/tasks', '내 할 일', <CheckSquare size={15} />)}
          {navLink('/calendar', '캘린더', <Calendar size={15} />)}
          {navLink('/inbox', '받은 편지함', <Inbox size={15} />)}
        </NavGroup>

        {/* 전자결재 — 초록색 */}
        <NavGroup
          label="전자결재"
          icon={<ClipboardCheck size={13} />}
          color="text-emerald-600"
          bgColor="bg-emerald-100"
          open={approvalOpen}
          onToggle={() => setApprovalOpen(!approvalOpen)}
        >
          {navLink('/approval', '결재홈', <ClipboardCheck size={15} />)}
          {navLink('/approval/inbox', '결재함', <Inbox size={15} />, pendingCount || undefined)}
          {navLink('/approval/my-documents', '내문서함', <FolderOpen size={15} />)}
        </NavGroup>

        {/* 결재등록 — 주황색 */}
        <NavGroup
          label="결재등록"
          icon={<FileSignature size={13} />}
          color="text-orange-600"
          bgColor="bg-orange-100"
          open={registerOpen}
          onToggle={() => setRegisterOpen(!registerOpen)}
        >
          {navLink('/approval/list/approval-request', '품의서', <FileSignature size={15} />)}
          {navLink('/approval/list/business-trip', '출장보고서', <Plane size={15} />)}
          {navLink('/approval/list/expense', '지출결의서', <Receipt size={15} />)}
        </NavGroup>

        {/* 프로젝트 — 보라색 */}
        <NavGroup
          label="프로젝트"
          icon={<FolderKanban size={13} />}
          color="text-purple-600"
          bgColor="bg-purple-100"
          open={projectsOpen}
          onToggle={() => setProjectsOpen(!projectsOpen)}
          onAdd={() => { setAddingProject(true); setProjectsOpen(true) }}
        >
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
                  if (e.key === 'Escape') { setAddingProject(false); setNewProjectName('') }
                }}
                placeholder="프로젝트 이름..."
                className="w-full text-sm bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-400"
              />
            </div>
          )}
        </NavGroup>
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
