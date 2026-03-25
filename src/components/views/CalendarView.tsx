import React, { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO, addMonths, subMonths
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { Task } from '../../types'
import { useTaskStore } from '../../store/taskStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { STATUS_DOT } from '../../utils/helpers'

interface Props {
  tasks: Task[]
}

export const CalendarView: React.FC<Props> = ({ tasks }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { setSelectedTask } = useTaskStore()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), day))

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-notion-text">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
          >
            오늘
          </button>
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekdays.map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-semibold py-2.5 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayTasks = getTasksForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const todayFlag = isToday(day)
            const isSun = day.getDay() === 0
            const isSat = day.getDay() === 6

            return (
              <div
                key={idx}
                className={`min-h-24 p-2 border-b border-r border-gray-100 last:border-r-0 ${
                  !isCurrentMonth ? 'bg-gray-50/50' : 'bg-white hover:bg-gray-50/50'
                } ${idx % 7 === 6 ? 'border-r-0' : ''} transition-colors`}
              >
                {/* Day number */}
                <div className="mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                      todayFlag
                        ? 'bg-blue-500 text-white'
                        : !isCurrentMonth
                        ? 'text-gray-300'
                        : isSun
                        ? 'text-red-400'
                        : isSat
                        ? 'text-blue-400'
                        : 'text-gray-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task.id)}
                      className="w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded text-xs hover:bg-gray-100 transition-colors truncate"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[task.status]}`} />
                      <span className={`truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-400 px-1.5">
                      +{dayTasks.length - 3}개 더
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
