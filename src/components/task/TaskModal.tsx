import React, { useState, useEffect } from 'react'
import { X, Trash2, Calendar, User, Tag, AlignLeft } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { TaskStatus, Priority, STATUS_LABELS, PRIORITY_LABELS } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'
import { PriorityBadge } from '../ui/PriorityBadge'
import { formatDateTime } from '../../utils/helpers'

interface Props {
  taskId: string
  onClose: () => void
}

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'cancelled']
const ALL_PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

export const TaskModal: React.FC<Props> = ({ taskId, onClose }) => {
  const { getTask, updateTask, deleteTask, users, getProject } = useTaskStore()
  const task = getTask(taskId)

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
    }
  }, [taskId])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!task) return null

  const project = getProject(task.projectId)

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(taskId, { title: title.trim() })
    }
  }

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      updateTask(taskId, { description })
    }
  }

  const handleDelete = () => {
    if (confirm('이 할 일을 삭제하시겠습니까?')) {
      deleteTask(taskId)
      onClose()
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim()
      if (!task.tags.includes(newTag)) {
        updateTask(taskId, { tags: [...task.tags, newTag] })
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    updateTask(taskId, { tags: task.tags.filter((t) => t !== tag) })
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {project && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <span>{project.icon}</span>
                <span>{project.name}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
              title="삭제"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Title */}
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full text-2xl font-bold text-notion-text resize-none outline-none placeholder-gray-300 mb-4 leading-tight"
            placeholder="제목 없음"
            rows={2}
          />

          {/* Properties */}
          <div className="space-y-3 mb-6">
            {/* Status */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-400 flex items-center gap-1.5">
                상태
              </div>
              <div className="relative">
                <StatusBadge
                  status={task.status}
                  onClick={() => {
                    setShowStatusMenu(!showStatusMenu)
                    setShowPriorityMenu(false)
                    setShowAssigneeMenu(false)
                  }}
                />
                {showStatusMenu && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-36 fade-in">
                    {ALL_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          updateTask(taskId, { status: s })
                          setShowStatusMenu(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          task.status === s ? 'text-blue-600 font-medium' : 'text-gray-700'
                        }`}
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
                <PriorityBadge
                  priority={task.priority}
                  onClick={() => {
                    setShowPriorityMenu(!showPriorityMenu)
                    setShowStatusMenu(false)
                    setShowAssigneeMenu(false)
                  }}
                />
                {showPriorityMenu && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-32 fade-in">
                    {ALL_PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          updateTask(taskId, { priority: p })
                          setShowPriorityMenu(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                          task.priority === p ? 'text-blue-600 font-medium' : 'text-gray-700'
                        }`}
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
                value={task.dueDate ? formatDateTime(task.dueDate) : ''}
                onChange={(e) => updateTask(taskId, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
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
                value={task.startDate ? formatDateTime(task.startDate) : ''}
                onChange={(e) => updateTask(taskId, { startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
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
                  onClick={() => {
                    setShowAssigneeMenu(!showAssigneeMenu)
                    setShowStatusMenu(false)
                    setShowPriorityMenu(false)
                  }}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg px-2.5 py-1 transition-colors"
                >
                  {task.assignee ? (
                    <>
                      <span>{users.find((u) => u.id === task.assignee)?.avatar}</span>
                      <span>{users.find((u) => u.id === task.assignee)?.name}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">담당자 없음</span>
                  )}
                </button>
                {showAssigneeMenu && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-40 fade-in">
                    <button
                      onClick={() => {
                        updateTask(taskId, { assignee: undefined })
                        setShowAssigneeMenu(false)
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-500"
                    >
                      없음
                    </button>
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          updateTask(taskId, { assignee: user.id })
                          setShowAssigneeMenu(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          task.assignee === user.id ? 'text-blue-600 font-medium' : 'text-gray-700'
                        }`}
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
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
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
              onBlur={handleDescriptionBlur}
              placeholder="설명을 추가하세요..."
              className="w-full text-sm text-gray-700 resize-none outline-none placeholder-gray-300 leading-relaxed min-h-32"
              rows={6}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
