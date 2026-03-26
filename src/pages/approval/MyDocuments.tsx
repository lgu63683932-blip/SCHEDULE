import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { DocumentStatusBadge } from '../../components/approval/DocumentStatusBadge'
import { DocumentStatus, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS } from '../../types/document'
import { useTaskStore } from '../../store/taskStore'

const TABS: { label: string; value: DocumentStatus | 'all' }[] = [
  { label: '전체', value: 'all' },
  { label: '임시저장', value: 'draft' },
  { label: '결재중', value: 'in_progress' },
  { label: '결재 대기', value: 'pending' },
  { label: '승인 완료', value: 'approved' },
  { label: '반려', value: 'rejected' },
]

export const MyDocuments: React.FC = () => {
  const navigate = useNavigate()
  const { getMyDocuments } = useDocumentStore()
  const { users } = useTaskStore()
  const [activeTab, setActiveTab] = useState<DocumentStatus | 'all'>('all')

  const myDocs = getMyDocuments()
  const filtered = activeTab === 'all' ? myDocs : myDocs.filter((d) => d.status === activeTab)
  const sorted = [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">내 문서함</h1>
          <div className="flex gap-2">
            {[
              { label: '📋 품의서', path: '/approval/new/approval-request' },
              { label: '✈️ 출장보고서', path: '/approval/new/business-trip' },
              { label: '💰 지출결의서', path: '/approval/new/expense' },
            ].map((btn) => (
              <button
                key={btn.path}
                onClick={() => navigate(btn.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Plus size={14} />
                {btn.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeTab === tab.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.value !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  {myDocs.filter((d) => d.status === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FileText size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">문서가 없습니다</p>
            <p className="text-sm">새 문서를 작성해보세요</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">문서번호</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">제목</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">종류</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">현재 결재자</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">최종 수정일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((doc) => {
                const currentStep = doc.approvalSteps.find((s) => s.status === 'pending')
                const currentApprover = currentStep ? users.find((u) => u.id === currentStep.userId) : null
                return (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/approval/document/${doc.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 text-xs text-gray-500 font-mono">{doc.docNumber}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{doc.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {DOCUMENT_TYPE_ICONS[doc.type]} {DOCUMENT_TYPE_LABELS[doc.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DocumentStatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {currentApprover ? (
                        <span className="flex items-center gap-1">
                          <span>{currentApprover.avatar}</span>
                          <span>{currentApprover.name}</span>
                          <span className="text-xs text-gray-400">({currentStep?.role})</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(doc.updatedAt).toLocaleDateString('ko-KR')}
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
