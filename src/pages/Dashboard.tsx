import React from 'react'
import { Link } from 'react-router-dom'
import { useTaskStore } from '../store/taskStore'
import { StatusBadge } from '../components/ui/StatusBadge'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import { formatDate, isOverdue, isDueToday } from '../utils/helpers'
import { CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, ArrowRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'

export const Dashboard: React.FC = () => {
  const { tasks, projects, setSelectedTask } = useTaskStore()

  const now = new Date()
  const total = tasks.length
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const dueTodayCount = tasks.filter((t) => isDueToday(t.dueDate) && t.status !== 'done' && t.status !== 'cancelled').length
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'done' && t.status !== 'cancelled').length
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length

  const recentTasks = [...tasks]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8)

  // Mini calendar
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const getTaskCountForDay = (day: Date) =>
    tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), day)).length

  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const stats = [
    {
      label: '전체 할 일',
      value: total,
      icon: <ListTodo size={20} className="text-blue-500" />,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
    },
    {
      label: '오늘 마감',
      value: dueTodayCount,
      icon: <Clock size={20} className="text-orange-500" />,
      bg: 'bg-orange-50',
      color: 'text-orange-600',
    },
    {
      label: '기한 초과',
      value: overdueCount,
      icon: <AlertTriangle size={20} className="text-red-500" />,
      bg: 'bg-red-50',
      color: 'text-red-600',
    },
    {
      label: '완료',
      value: doneCount,
      icon: <CheckCircle2 size={20} className="text-green-500" />,
      bg: 'bg-green-50',
      color: 'text-green-600',
    },
  ]

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-notion-text">안녕하세요 👋</h1>
        <p className="text-gray-500 mt-1">
          {format(now, 'yyyy년 M월 d일 EEEE', { locale: ko })} · 오늘 {dueTodayCount}개의 할 일이 마감됩니다
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.bg} border border-${stat.bg.replace('bg-', '')}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.label}</span>
              {stat.icon}
            </div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">최근 활동</h2>
            <Link to="/tasks" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              전체 보기 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTasks.map((task) => {
              const overdue = isOverdue(task.dueDate) && task.status !== 'done' && task.status !== 'cancelled'
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task.id)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-notion-text'}`}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {projects.find((p) => p.id === task.projectId)?.name}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                          · {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={task.status} size="sm" />
                    <PriorityBadge priority={task.priority} size="sm" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Progress */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">전체 진행률</h2>
              <TrendingUp size={16} className="text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">{completionRate}%</div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-2">{doneCount} / {total} 완료</div>
          </div>

          {/* Mini Calendar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {format(now, 'M월', { locale: ko })} 캘린더
            </h2>
            <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
              {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                <div key={d} className="text-xs text-gray-400 font-medium py-0.5">{d}</div>
              ))}
            </div>

            {/* First day offset */}
            {(() => {
              const firstDayOfWeek = monthStart.getDay()
              const allCells = [
                ...Array(firstDayOfWeek).fill(null),
                ...days,
              ]
              // Pad to complete last row
              while (allCells.length % 7 !== 0) allCells.push(null)

              return (
                <div className="grid grid-cols-7 gap-0.5">
                  {allCells.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} />
                    const count = getTaskCountForDay(day)
                    const today = isToday(day)
                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 flex items-center justify-center text-xs rounded-full ${
                            today ? 'bg-blue-500 text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {format(day, 'd')}
                        </div>
                        {count > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                              <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Projects */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">프로젝트</h2>
            </div>
            <div className="space-y-2">
              {projects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id)
                const done = projectTasks.filter((t) => t.status === 'done').length
                const pct = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0
                return (
                  <Link key={project.id} to={`/project/${project.id}`}>
                    <div className="hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{project.icon}</span>
                        <span className="text-sm text-gray-700 font-medium flex-1 truncate">{project.name}</span>
                        <span className="text-xs text-gray-400">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: project.color }}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
