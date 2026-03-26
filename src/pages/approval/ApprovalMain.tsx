import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, CheckCircle, XCircle, Clock, Plus, ChevronRight } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { DocumentStatusBadge } from '../../components/approval/DocumentStatusBadge'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS } from '../../types/document'

export const ApprovalMain: React.FC = () => {
  const navigate = useNavigate()
  const { documents, getMyDocuments, getPendingApprovals, currentUserId } = useDocumentStore()

  const myDocs = getMyDocuments()
  const pendingApprovals = getPendingApprovals()
  const allDocs = documents

  const stats = {
    pending: pendingApprovals.length,
    approved: myDocs.filter((d) => d.status === 'approved').length,
    rejected: myDocs.filter((d) => d.status === 'rejected').length,
    draft: myDocs.filter((d) => d.status === 'draft').length,
  }

  const recentDocs = [...myDocs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)

  const newDocOptions = [
    { type: 'approval-request', label: '품의서', icon: '📋', path: '/approval/new/approval-request' },
    { type: 'business-trip', label: '출장보고서', icon: '✈️', path: '/approval/new/business-trip' },
    { type: 'expense', label: '지출결의서', icon: '💰', path: '/approval/new/expense' },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">전자결재</h1>
          <p className="text-sm text-gray-500 mt-1">문서를 기안하고 결재를 진행하세요</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: '결재 대기', value: stats.pending, icon: <Clock size={20} />, color: 'text-yellow-600', bg: 'bg-yellow-50', onClick: () => navigate('/approval/inbox') },
            { label: '승인 완료', value: stats.approved, icon: <CheckCircle size={20} />, color: 'text-green-600', bg: 'bg-green-50', onClick: () => navigate('/approval/my-documents') },
            { label: '반려', value: stats.rejected, icon: <XCircle size={20} />, color: 'text-red-600', bg: 'bg-red-50', onClick: () => navigate('/approval/my-documents') },
            { label: '임시저장', value: stats.draft, icon: <FileText size={20} />, color: 'text-gray-600', bg: 'bg-gray-100', onClick: () => navigate('/approval/my-documents') },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* New Document */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus size={16} className="text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-700">새 문서 작성</h2>
            </div>
            <div className="space-y-2">
              {newDocOptions.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => navigate(opt.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors text-left"
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                  <ChevronRight size={14} className="text-gray-400 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-yellow-600" />
                <h2 className="text-sm font-semibold text-gray-700">결재 대기</h2>
              </div>
              {pendingApprovals.length > 0 && (
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </div>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">대기 중인 결재가 없습니다</div>
            ) : (
              <div className="space-y-2">
                {pendingApprovals.slice(0, 4).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => navigate(`/approval/document/${doc.id}`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{DOCUMENT_TYPE_ICONS[doc.type]}</span>
                      <span className="text-xs font-medium text-gray-700 truncate">{doc.title}</span>
                    </div>
                    <div className="text-xs text-gray-400">{doc.docNumber}</div>
                  </button>
                ))}
                {pendingApprovals.length > 4 && (
                  <button onClick={() => navigate('/approval/inbox')} className="w-full text-xs text-blue-500 hover:underline py-1">
                    전체 보기 →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent Documents */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-600" />
                <h2 className="text-sm font-semibold text-gray-700">최근 내 문서</h2>
              </div>
            </div>
            {recentDocs.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">문서가 없습니다</div>
            ) : (
              <div className="space-y-2">
                {recentDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => navigate(`/approval/document/${doc.id}`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate flex-1">{doc.title}</span>
                      <DocumentStatusBadge status={doc.status} size="sm" />
                    </div>
                    <div className="text-xs text-gray-400">{doc.docNumber}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
