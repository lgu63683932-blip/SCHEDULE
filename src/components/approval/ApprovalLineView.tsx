import React from 'react'
import { CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react'
import { ApprovalStep } from '../../types/document'
import { useTaskStore } from '../../store/taskStore'

interface Props {
  steps: ApprovalStep[]
}

export const ApprovalLineView: React.FC<Props> = ({ steps }) => {
  const { users } = useTaskStore()

  return (
    <div className="flex items-start gap-1 flex-wrap">
      {steps.map((step, i) => {
        const user = users.find((u) => u.id === step.userId)
        const isApproved = step.status === 'approved'
        const isRejected = step.status === 'rejected'
        const isPending = step.status === 'pending'

        return (
          <React.Fragment key={step.id}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
              isApproved ? 'bg-green-50 border-green-200' :
              isRejected ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              {/* 아바타 */}
              <div className="text-2xl flex-shrink-0">{user?.avatar || '👤'}</div>
              {/* 정보 */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs text-gray-500 font-medium">{step.role}</span>
                  {isApproved && <CheckCircle size={12} className="text-green-500 flex-shrink-0" />}
                  {isRejected && <XCircle size={12} className="text-red-500 flex-shrink-0" />}
                  {isPending && <Clock size={12} className="text-gray-400 flex-shrink-0" />}
                </div>
                <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">{user?.name || '미지정'}</div>
                {step.approvedAt && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(step.approvedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
            {step.comment && (
              <div className="text-xs text-gray-500 bg-white rounded px-2 py-1 border border-gray-200 max-w-48 leading-relaxed self-center">
                "{step.comment}"
              </div>
            )}
            {i < steps.length - 1 && (
              <div className="flex items-center">
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
