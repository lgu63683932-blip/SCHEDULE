import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Send, CheckCircle, XCircle, Edit } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'
import { DocumentStatusBadge } from '../../components/approval/DocumentStatusBadge'
import { ApprovalLineView } from '../../components/approval/ApprovalLineView'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS, ExpenseDoc, BusinessTripDoc, ApprovalRequestDoc } from '../../types/document'
import { useTaskStore } from '../../store/taskStore'

export const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getDocument, submitDocument, approveStep, rejectStep, deleteDocument, currentUserId } = useDocumentStore()
  const { users } = useTaskStore()
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [showApproveInput, setShowApproveInput] = useState(false)
  const [approveComment, setApproveComment] = useState('')

  const doc = getDocument(id!)
  if (!doc) return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <p className="text-lg mb-2">문서를 찾을 수 없습니다</p>
        <button onClick={() => navigate('/approval')} className="text-blue-500 hover:underline text-sm">전자결재 홈으로</button>
      </div>
    </div>
  )

  const drafter = users.find((u) => u.id === doc.drafterId)
  const myStep = doc.approvalSteps.find((s) => s.userId === currentUserId)
  const prevStepsApproved = myStep ? doc.approvalSteps.filter((s) => s.order < myStep.order).every((s) => s.status === 'approved') : false
  const canApprove = myStep?.status === 'pending' && prevStepsApproved && doc.status !== 'draft'
  const canSubmit = doc.status === 'draft' && doc.drafterId === currentUserId
  const canDelete = doc.status === 'draft' && doc.drafterId === currentUserId
  const canEdit = doc.status === 'draft' && doc.drafterId === currentUserId

  const handleSubmit = () => {
    if (confirm('결재 상신하시겠습니까?')) {
      submitDocument(doc.id)
    }
  }

  const handleApprove = () => {
    approveStep(doc.id, currentUserId, approveComment || undefined)
    setShowApproveInput(false)
    setApproveComment('')
  }

  const handleReject = () => {
    if (!rejectComment.trim()) { alert('반려 사유를 입력해주세요.'); return }
    rejectStep(doc.id, currentUserId, rejectComment)
    setShowRejectInput(false)
    setRejectComment('')
  }

  const handleDelete = () => {
    if (confirm('문서를 삭제하시겠습니까?')) {
      deleteDocument(doc.id)
      navigate('/approval/my-documents')
    }
  }

  const getEditPath = () => {
    const typeMap: Record<string, string> = { approval_request: 'approval-request', business_trip: 'business-trip', expense: 'expense' }
    return `/approval/edit/${typeMap[doc.type]}/${doc.id}`
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} /> 뒤로
          </button>
          <div className="flex gap-2">
            {canEdit && (
              <button onClick={() => navigate(getEditPath())} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                <Edit size={14} /> 수정
              </button>
            )}
            {canDelete && (
              <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                <Trash2 size={14} /> 삭제
              </button>
            )}
            {canSubmit && (
              <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Send size={14} /> 상신
              </button>
            )}
          </div>
        </div>

        {/* Document card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{DOCUMENT_TYPE_ICONS[doc.type]}</span>
                  <span className="text-sm text-gray-500">{DOCUMENT_TYPE_LABELS[doc.type]}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm font-mono text-gray-500">{doc.docNumber}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{doc.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    {drafter?.avatar} <span>{drafter?.name}</span>
                  </span>
                  <span>기안일: {new Date(doc.createdAt).toLocaleDateString('ko-KR')}</span>
                  {doc.submittedAt && <span>상신일: {new Date(doc.submittedAt).toLocaleDateString('ko-KR')}</span>}
                </div>
              </div>
              <DocumentStatusBadge status={doc.status} />
            </div>
          </div>

          {/* Approval Line */}
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">결재선</h2>
            <ApprovalLineView steps={doc.approvalSteps} />
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            {doc.type === 'approval_request' && <ApprovalRequestContent doc={doc as ApprovalRequestDoc} />}
            {doc.type === 'business_trip' && <BusinessTripContent doc={doc as BusinessTripDoc} />}
            {doc.type === 'expense' && <ExpenseContent doc={doc as ExpenseDoc} />}
          </div>

          {/* Approve/Reject actions */}
          {canApprove && (
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-600 mb-3">결재 처리</h2>
              {!showApproveInput && !showRejectInput && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApproveInput(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <CheckCircle size={16} /> 승인
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <XCircle size={16} /> 반려
                  </button>
                </div>
              )}
              {showApproveInput && (
                <div className="space-y-3">
                  <textarea
                    value={approveComment}
                    onChange={(e) => setApproveComment(e.target.value)}
                    placeholder="의견을 입력하세요 (선택사항)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleApprove} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium">승인 확인</button>
                    <button onClick={() => setShowApproveInput(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">취소</button>
                  </div>
                </div>
              )}
              {showRejectInput && (
                <div className="space-y-3">
                  <textarea
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="반려 사유를 입력하세요 (필수)"
                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-medium">반려 확인</button>
                    <button onClick={() => setShowRejectInput(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">취소</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Field: React.FC<{ label: string; value?: string | null; className?: string }> = ({ label, value, className }) => (
  <div className={className}>
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</div>
    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{value || '-'}</div>
  </div>
)

const ApprovalRequestContent: React.FC<{ doc: ApprovalRequestDoc }> = ({ doc }) => (
  <div className="space-y-5">
    {/* 문서 헤더 */}
    {doc.docHeader && (
      <div className="border border-gray-300 rounded-lg overflow-hidden text-sm mb-6">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              {[
                { label: '문서번호', value: doc.docNumber },
                { label: '보존기한', value: doc.docHeader.retentionPeriod || '-' },
                { label: '시행일자', value: doc.docHeader.effectiveDate ? new Date(doc.docHeader.effectiveDate).toLocaleDateString('ko-KR') : '-' },
              ].map(({ label, value }) => (
                <td key={label} className="border border-gray-300">
                  <div className="flex">
                    <span className="bg-gray-50 text-xs font-semibold text-gray-600 px-2 py-2 whitespace-nowrap border-r border-gray-300 min-w-[64px] flex items-center justify-center">{label}</span>
                    <span className="px-2 py-2 text-sm text-gray-700 flex-1">{value}</span>
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              {[
                { label: '기안자', value: doc.approvalSteps[0] ? undefined : '-' },
                { label: '기안부서', value: doc.docHeader.drafterDept || '-' },
                { label: '기안일자', value: doc.docHeader.drafterDate ? new Date(doc.docHeader.drafterDate).toLocaleDateString('ko-KR') : new Date(doc.createdAt).toLocaleDateString('ko-KR') },
              ].map(({ label, value }) => (
                <td key={label} className="border border-gray-300">
                  <div className="flex">
                    <span className="bg-gray-50 text-xs font-semibold text-gray-600 px-2 py-2 whitespace-nowrap border-r border-gray-300 min-w-[64px] flex items-center justify-center">{label}</span>
                    <span className="px-2 py-2 text-sm text-gray-700 flex-1">{value}</span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    )}
    <Field label="목적" value={doc.content.purpose} />
    <Field label="배경" value={doc.content.background} />
    <Field label="세부내용" value={doc.content.details} />
    <Field label="기대효과" value={doc.content.expectedEffect} />
    {doc.content.budget && <Field label="예산" value={doc.content.budget} />}
  </div>
)

const BusinessTripContent: React.FC<{ doc: BusinessTripDoc }> = ({ doc }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-3 gap-4">
      <Field label="출장지" value={doc.content.destination} />
      <Field label="출장 시작일" value={doc.content.startDate} />
      <Field label="출장 종료일" value={doc.content.endDate} />
    </div>
    <Field label="출장 목적" value={doc.content.purpose} />
    <Field label="출장 내용" value={doc.content.activities} />
    <Field label="성과 및 결과" value={doc.content.results} />
    {doc.content.expenses && <Field label="지출 비용" value={doc.content.expenses} />}
  </div>
)

const ExpenseContent: React.FC<{ doc: ExpenseDoc }> = ({ doc }) => (
  <div className="space-y-5">
    <Field label="지출 목적" value={doc.content.purpose} />
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">지출 내역</div>
      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">날짜</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">항목</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">내용</th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600">금액</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {doc.content.items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-2.5 text-sm text-gray-600">{item.date}</td>
              <td className="px-4 py-2.5 text-sm text-gray-600">{item.category}</td>
              <td className="px-4 py-2.5 text-sm text-gray-800">{item.description}</td>
              <td className="px-4 py-2.5 text-sm text-gray-800 text-right font-medium">{item.amount.toLocaleString()}원</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t border-gray-200">
          <tr>
            <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-gray-700">합계</td>
            <td className="px-4 py-2.5 text-sm font-bold text-gray-900 text-right">{doc.content.totalAmount.toLocaleString()}원</td>
          </tr>
        </tfoot>
      </table>
    </div>
    {doc.content.notes && <Field label="비고" value={doc.content.notes} />}
  </div>
)
