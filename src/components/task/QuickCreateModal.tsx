import React, { useState, useEffect, useRef } from 'react'
import { X, Calendar, User, Tag, AlignLeft, ChevronDown } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { TaskStatus, Priority, STATUS_LABELS, PRIORITY_LABELS } from '../../types'
import { STATUS_BG, PRIORITY_BG } from '../../utils/helpers'
import { Flag } from 'lucide-react'

interface Props {
  defaultProjectId?: string
  onClose: () => void
  onCreated?: (taskId: string) => void
}

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'cancelled']
const ALL_PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

export const QuickCreateModal: React.FC<Props> = ({ defaultProjectId, onClose, onCreated }) => {
  const { addTask, projects, users } = useTaskStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [assignee, setAssignee] = useState<string | undefined>(undefined)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || '')

  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState(false)

  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const closeAllMenus = () => {
    setShowStatusMenu(false)
    setShowPriorityMenu(false)
    setShowAssigneeMenu(false)
    setShowProjectMenu(false)
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim()
      if (!tags.includes(newTag)) setTags([...tags, newTag])
      setTagInput('')
      e.preventDefault()
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      titleRef.current?.focus()
      return
    }
    const id = addTask({
      title: title.trim(),
      description: description || undefined,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      assignee,
      tags,
      projectId,
    })
    onCreated?.(id)
    onClose()
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const currentProject = projects.find((p) => p.id === projectId)
  const currentAssignee = users.find((u) => u.id === assignee)

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          {/* Project selector */}
          <div className="relative">
            <button
              onClick={() => { setShowProjectMenu(!showProjectMenu); setShowStatusMenu(false); setShowPriorityMenu(false); setShowAssigneeMenu(false) }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
            >
              <span>{currentProject?.icon}</span>
              <span>{currentProject?.name || '프로젝트 선택'}</span>
              <ChevronDown size={12} />
            </button>
            {showProjectMenu && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-44 fade-in">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setProjectId(p.id); setShowProjectMenu(false) }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${projectId === p.id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                  >
                    <span>{p.icon}</span>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Title */}
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            className="w-full text-2xl font-bold text-notion-text resize-none outline-none placeholder-gray-300 mb-4 leading-tight"
            placeholder="새 할 일"
            rows={2}
          />

          {/* Properties */}
          <div className="space-y-3 mb-6">
            {/* Status */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-400">상태</div>
              <div className="relative">
                <button
                  onClick={() => { setShowStatusMenu(!showStatusMenu); closeAllMenus(); setShowStatusMenu(true) }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 ${STATUS_BG[status]}`}
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${status === 'todo' ? 'bg-gray-400' : status === 'in_progress' ? 'bg-blue-500' : status === 'review' ? 'bg-yellow-500' : status === 'done' ? 'bg-green-500' : 'bg-red-400'}`} />
                  {STATUS_LABELS[status]}
                </button>
                {showStatusMenu && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-36 fade-in">
                    {ALL_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setStatus(s); setShowStatusMenu(false) }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${status === s ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-400">우선순위</div>
              <div className="relative">
                <button
                  onClick={() => { closeAllMenus(); setShowPriorityMenu(true) }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 ${PRIORITY_BG[priority]}`}
                >
                  <Flag size={10} />
                  {PRIORITY_LABELS[priority]}
                </button>
                {showPriorityMenu && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-32 fade-in">
                    {ALL_PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPriority(p); setShowPriorityMenu(false) }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${priority === p ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                      >
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-400 flex items-center gap-1.5">
                <Calendar size={13} />
                마감일
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-sm text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1 outline-none focus:border-blue-400"
              />
            </div>

            {/* Start date */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-400 flex items-center gap-1.5">
                <Calendar size={13} />
                시작일
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1 outline-none focus:border-blue-400"
              />
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-400 flex items-center gap-1.5">
                <User size={13} />
                담당자
              </div>
              <div className="relative">
                <button
                  onClick={() => { closeAllMenus(); setShowAssigneeMenu(true) }}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg px-2.5 py-1 transition-colors"
                >
                  {currentAssignee ? (
                    <>
                      <span>{currentAssignee.avatar}</span>
                      <span>{currentAssignee.name}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">담당자 없음</span>
                  )}
                </button>
                {showAssigneeMenu && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-40 fade-in">
                    <button
                      onClick={() => { setAssignee(undefined); setShowAssigneeMenu(false) }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-500"
                    >
                      없음
                    </button>
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => { setAssignee(user.id); setShowAssigneeMenu(false) }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${assignee === user.id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                      >
                        <span>{user.avatar}</span>
                        {user.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                <Tag size={13} />
                태그
              </div>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="태그 추가..."
                  className="text-xs outline-none text-gray-600 placeholder-gray-300 min-w-20 border-b border-dashed border-gray-300 focus:border-blue-400 px-1 py-0.5"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
              <AlignLeft size={14} />
              설명
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명을 추가하세요..."
              className="w-full text-sm text-gray-700 resize-none outline-none placeholder-gray-300 leading-relaxed min-h-24"
              rows={4}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  )
}
