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
            <div className={`flex flex-col items-center p-3 rounded-xl border min-w-28 ${
              isApproved ? 'bg-green-50 border-green-200' :
              isRejected ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs text-gray-500 font-medium">{step.role}</span>
                {isApproved && <CheckCircle size={14} className="text-green-500" />}
                {isRejected && <XCircle size={14} className="text-red-500" />}
                {isPending && <Clock size={14} className="text-gray-400" />}
              </div>
              <div className="text-xl mb-1">{user?.avatar || '👤'}</div>
              <div className="text-xs font-medium text-gray-700">{user?.name || '미지정'}</div>
              {step.approvedAt && (
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(step.approvedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </div>
              )}
              {step.comment && (
                <div className="text-xs text-gray-500 mt-1.5 bg-white rounded px-2 py-1 border border-gray-200 max-w-full text-center leading-relaxed">
                  "{step.comment}"
                </div>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center pt-8">
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
