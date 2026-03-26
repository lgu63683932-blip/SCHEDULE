import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { DocumentStatusBadge } from '../../components/approval/DocumentStatusBadge'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS } from '../../types/document'
import { useTaskStore } from '../../store/taskStore'

export const ApprovalBox: React.FC = () => {
  const navigate = useNavigate()
  const { getPendingApprovals } = useDocumentStore()
  const { users } = useTaskStore()
  const pending = getPendingApprovals()

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900">결재함</h1>
          {pending.length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">내 결재를 기다리는 문서입니다</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Inbox size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">결재 대기 문서가 없습니다</p>
            <p className="text-sm">모든 결재가 완료되었습니다</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">문서번호</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">제목</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">종류</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">기안자</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">제출일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.map((doc) => {
                const drafter = users.find((u) => u.id === doc.drafterId)
                return (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/approval/document/${doc.id}`)}
                    className="hover:bg-yellow-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 text-xs text-gray-500 font-mono">{doc.docNumber}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{doc.title}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {DOCUMENT_TYPE_ICONS[doc.type]} {DOCUMENT_TYPE_LABELS[doc.type]}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {drafter && (
                        <span className="flex items-center gap-1">
                          <span>{drafter.avatar}</span>
                          <span>{drafter.name}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <DocumentStatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {doc.submittedAt ? new Date(doc.submittedAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
