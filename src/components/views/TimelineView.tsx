import React, { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  parseISO, differenceInDays, addMonths, subMonths, isToday, isSameDay
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { Task } from '../../types'
import { useTaskStore } from '../../store/taskStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PRIORITY_COLORS } from '../../types'

interface Props {
  tasks: Task[]
}

const CELL_WIDTH = 32 // px per day

export const TimelineView: React.FC<Props> = ({ tasks }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { setSelectedTask } = useTaskStore()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const tasksWithDates = tasks.filter((t) => t.dueDate || t.startDate)

  const getTaskBar = (task: Task) => {
    const start = task.startDate ? parseISO(task.startDate) : task.dueDate ? parseISO(task.dueDate) : null
    const end = task.dueDate ? parseISO(task.dueDate) : start

    if (!start || !end) return null

    const startDayIdx = differenceInDays(start, monthStart)
    const endDayIdx = differenceInDays(end, monthStart)

    const clampedStart = Math.max(0, startDayIdx)
    const clampedEnd = Math.min(days.length - 1, endDayIdx)

    if (clampedEnd < 0 || clampedStart >= days.length) return null

    const left = clampedStart * CELL_WIDTH
    const width = Math.max((clampedEnd - clampedStart + 1) * CELL_WIDTH, CELL_WIDTH)

    return { left, width }
  }

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-4xl mb-3">📅</div>
        <div className="text-base font-medium text-gray-600 mb-1">날짜가 없는 할 일은 타임라인에 표시되지 않습니다</div>
        <div className="text-sm text-gray-400">마감일 또는 시작일을 설정하세요</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Month navigation */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-notion-text">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="text-sm px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
          >
            이번달
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex">
          {/* Task names column */}
          <div className="w-52 flex-shrink-0 border-r border-gray-200">
            <div className="h-10 border-b border-gray-200 bg-gray-50 px-3 flex items-center text-xs font-semibold text-gray-400 uppercase">
              할 일
            </div>
            {tasksWithDates.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task.id)}
                className="h-10 border-b border-gray-100 px-3 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700 truncate hover:text-blue-600 transition-colors">
                  {task.title}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline area */}
          <div className="flex-1 overflow-x-auto">
            {/* Day headers */}
            <div
              className="flex h-10 border-b border-gray-200 bg-gray-50"
              style={{ minWidth: days.length * CELL_WIDTH }}
            >
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-100 last:border-r-0 ${
                    isToday(day) ? 'bg-blue-50' : ''
                  }`}
                  style={{ width: CELL_WIDTH }}
                >
                  <span className={`text-xs font-medium ${isToday(day) ? 'text-blue-600' : day.getDay() === 0 ? 'text-red-400' : day.getDay() === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
              ))}
            </div>

            {/* Task bars */}
            <div style={{ minWidth: days.length * CELL_WIDTH }}>
              {tasksWithDates.map((task) => {
                const bar = getTaskBar(task)
                return (
                  <div
                    key={task.id}
                    className="relative h-10 border-b border-gray-100"
                    style={{ minWidth: days.length * CELL_WIDTH }}
                  >
                    {/* Grid lines */}
                    {days.map((day, idx) => (
                      <div
                        key={idx}
                        className={`absolute top-0 bottom-0 border-r border-gray-100 ${isToday(day) ? 'bg-blue-50/40' : ''}`}
                        style={{ left: idx * CELL_WIDTH, width: CELL_WIDTH }}
                      />
                    ))}

                    {/* Bar */}
                    {bar && (
                      <div
                        onClick={() => setSelectedTask(task.id)}
                        className="absolute top-1.5 bottom-1.5 rounded-md cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2"
                        style={{
                          left: bar.left + 2,
                          width: bar.width - 4,
                          backgroundColor: PRIORITY_COLORS[task.priority] + '33',
                          borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                        }}
                        title={task.title}
                      >
                        <span className="text-xs font-medium truncate" style={{ color: PRIORITY_COLORS[task.priority] }}>
                          {task.title}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
