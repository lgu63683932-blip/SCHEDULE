import React, { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, TaskStatus, STATUS_LABELS } from '../../types'
import { TaskCard } from '../task/TaskCard'
import { useTaskStore } from '../../store/taskStore'
import { Plus } from 'lucide-react'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'cancelled']

const COLUMN_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-gray-50 border-gray-200',
  in_progress: 'bg-blue-50 border-blue-200',
  review: 'bg-yellow-50 border-yellow-200',
  done: 'bg-green-50 border-green-200',
  cancelled: 'bg-red-50 border-red-200',
}

const COLUMN_HEADER_COLORS: Record<TaskStatus, string> = {
  todo: 'text-gray-600',
  in_progress: 'text-blue-700',
  review: 'text-yellow-700',
  done: 'text-green-700',
  cancelled: 'text-red-600',
}

const COLUMN_DOT: Record<TaskStatus, string> = {
  todo: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  review: 'bg-yellow-500',
  done: 'bg-green-500',
  cancelled: 'bg-red-400',
}

interface SortableTaskProps {
  task: Task
}

const SortableTask: React.FC<SortableTaskProps> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  )
}

interface Props {
  tasks: Task[]
}

export const KanbanView: React.FC<Props> = ({ tasks }) => {
  const { updateTask, addTask, projects } = useTaskStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status)

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (!over) return

    const overId = over.id as string
    if (COLUMNS.includes(overId as TaskStatus)) {
      setOverColumn(overId as TaskStatus)
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) setOverColumn(overTask.status)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverColumn(null)

    if (!over) return

    const activeTaskId = active.id as string
    const overId = over.id as string

    // Check if dropped on column
    if (COLUMNS.includes(overId as TaskStatus)) {
      updateTask(activeTaskId, { status: overId as TaskStatus })
    } else {
      // Dropped on another task - use that task's status
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask && activeTaskId !== overId) {
        const activeTask = tasks.find((t) => t.id === activeTaskId)
        if (activeTask && activeTask.status !== overTask.status) {
          updateTask(activeTaskId, { status: overTask.status })
        }
      }
    }
  }

  const handleAddTask = (status: TaskStatus) => {
    const defaultProject = projects[0]?.id || ''
    addTask({ title: '새 할 일', status, priority: 'medium', tags: [], projectId: defaultProject })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto p-4 pb-6">
        {COLUMNS.map((status) => {
          const columnTasks = getTasksByStatus(status)
          const isOver = overColumn === status

          return (
            <div
              key={status}
              className={`flex-shrink-0 w-64 flex flex-col rounded-xl border ${COLUMN_COLORS[status]} ${
                isOver ? 'ring-2 ring-blue-300' : ''
              } transition-all`}
            >
              {/* Column header */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 font-semibold text-sm ${COLUMN_HEADER_COLORS[status]}`}>
                    <div className={`w-2 h-2 rounded-full ${COLUMN_DOT[status]}`} />
                    {STATUS_LABELS[status]}
                    <span className="text-xs font-normal opacity-60 ml-1">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddTask(status)}
                    className="opacity-0 group-hover:opacity-100 hover:bg-white/70 p-0.5 rounded transition-all"
                    title="추가"
                  >
                    <Plus size={14} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Droppable area */}
              <SortableContext
                items={columnTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className={`flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-20 ${
                    isOver && columnTasks.length === 0 ? 'bg-blue-100/50 rounded-lg' : ''
                  }`}
                  id={status}
                >
                  {/* Invisible drop zone for empty columns */}
                  {columnTasks.length === 0 && (
                    <div
                      className="h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400"
                    >
                      여기에 드래그
                    </div>
                  )}
                  {columnTasks.map((task) => (
                    <SortableTask key={task.id} task={task} />
                  ))}
                </div>
              </SortableContext>

              {/* Add button */}
              <div className="px-3 pb-3">
                <button
                  onClick={() => handleAddTask(status)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-white/70 rounded-lg transition-colors"
                >
                  <Plus size={12} />
                  추가
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
