import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, FileText } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { useTaskStore } from '../../store/taskStore'
import {
  DocumentType, DocumentStatus,
  DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS,
  DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_COLORS,
} from '../../types/document'
import { ApprovalRequestFormContent } from './forms/ApprovalRequestForm'
import { BusinessTripFormContent } from './forms/BusinessTripForm'
import { ExpenseFormContent } from './forms/ExpenseForm'
import { Header } from '../../components/layout/Header'

const STATUS_TABS: { key: DocumentStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'draft', label: '임시저장' },
  { key: 'pending', label: '결재대기' },
  { key: 'in_progress', label: '결재중' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '반려' },
]

interface Props {
  type: DocumentType
}

export const DocumentListPage: React.FC<Props> = ({ type }) => {
  const navigate = useNavigate()
  const { documents } = useDocumentStore()
  const { users } = useTaskStore()

  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | undefined>(undefined)

  const typeLabel = DOCUMENT_TYPE_LABELS[type]
  const typeIcon = DOCUMENT_TYPE_ICONS[type]

  const filtered = documents
    .filter((d) => d.type === type)
    .filter((d) => statusFilter === 'all' || d.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const openNew = () => { setEditId(undefined); setShowModal(true) }
  const openEdit = (id: string) => { setEditId(id); setShowModal(true) }
  const closeModal = () => setShowModal(false)
  const handleSaved = (id: string) => { setShowModal(false); navigate(`/approval/document/${id}`) }

  const getDrafter = (drafterId: string) =>
    users.find((u) => u.id === drafterId)

  const renderForm = () => {
    const props = { editId, onCancel: closeModal, onSaved: handleSaved }
    if (type === 'approval_request') return <ApprovalRequestFormContent {...props} />
    if (type === 'business_trip') return <BusinessTripFormContent {...props} />
    return <ExpenseFormContent {...props} />
  }

  return (
    <>
      <Header title={`${typeIcon} ${typeLabel}`} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* 상단 바 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{typeIcon}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{typeLabel}</h2>
                <p className="text-xs text-gray-400">{filtered.length}건</p>
              </div>
            </div>
            <button onClick={openNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
              <Plus size={14} /> 새 문서 작성
            </button>
          </div>

          {/* 상태 필터 탭 */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => {
              const count = tab.key === 'all'
                ? documents.filter((d) => d.type === type).length
                : documents.filter((d) => d.type === type && d.status === tab.key).length
              return (
                <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {tab.label}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 목록 테이블 */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 w-36">문서번호</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">제목</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 w-28">기안자</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 w-28">상태</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 w-28 whitespace-nowrap">기안일</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 w-16">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="text-4xl mb-3">{typeIcon}</div>
                      <div className="text-sm font-medium text-gray-500">{typeLabel}이 없습니다</div>
                      <div className="text-xs text-gray-400 mt-1">새 문서 작성 버튼을 눌러 시작하세요</div>
                    </td>
                  </tr>
                ) : filtered.map((doc) => {
                  const drafter = getDrafter(doc.drafterId)
                  return (
                    <tr key={doc.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/approval/document/${doc.id}`)}>
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-500 whitespace-nowrap">{doc.docNumber}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-800 line-clamp-1">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {drafter ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{drafter.avatar}</span>
                            <span className="text-sm text-gray-700">{drafter.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${DOCUMENT_STATUS_COLORS[doc.status]}`}>
                          {DOCUMENT_STATUS_LABELS[doc.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(doc.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {doc.status === 'draft' && (
                          <button onClick={() => openEdit(doc.id)}
                            className="text-xs text-blue-500 hover:text-blue-700 hover:underline">
                            수정
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 작성 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">{typeIcon}</span>
                <h2 className="text-base font-bold text-gray-900">
                  {editId ? `${typeLabel} 수정` : `${typeLabel} 작성`}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                <X size={16} />
              </button>
            </div>
            {/* 모달 바디 */}
            <div className="px-6 py-5">
              {renderForm()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
