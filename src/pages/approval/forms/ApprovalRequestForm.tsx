import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Send } from 'lucide-react'
import { useDocumentStore } from '../../../store/documentStore'
import { useTaskStore } from '../../../store/taskStore'
import { useCodeStore } from '../../../store/codeStore'
import { ApprovalRequestDoc } from '../../../types/document'

const DEFAULT_STEPS = (users: { id: string; name: string }[]) => [
  { userId: 'user1', role: '기안자' },
  { userId: users[1]?.id || 'user2', role: '팀장' },
  { userId: users[2]?.id || 'user3', role: '부서장' },
]

interface Props {
  editId?: string
  onCancel?: () => void
  onSaved?: (id: string) => void
}

// ── 문서 헤더 테이블 (문서번호/보존기한/시행일자/기안자/기안부서/기안일자) ──
const DocHeaderCell: React.FC<{ label: string; children: React.ReactNode; colSpan?: number }> = ({ label, children, colSpan }) => (
  <td className={`border border-gray-300 align-top${colSpan ? ` colspan-${colSpan}` : ''}`} colSpan={colSpan}>
    <div className="flex">
      <span className="bg-gray-50 text-xs font-semibold text-gray-600 px-2 py-2 whitespace-nowrap border-r border-gray-300 min-w-[64px] flex items-center justify-center">{label}</span>
      <span className="flex-1">{children}</span>
    </div>
  </td>
)

export const ApprovalRequestFormContent: React.FC<Props> = ({ editId, onCancel, onSaved }) => {
  const navigate = useNavigate()
  const { addDocument, updateDocument, getDocument, currentUserId } = useDocumentStore()
  const { users } = useTaskStore()
  const { getActiveItems } = useCodeStore()
  const retentionItems = getActiveItems('RETENTION')

  const existing = editId ? getDocument(editId) as ApprovalRequestDoc | undefined : undefined
  const currentUser = users.find((u) => u.id === currentUserId)
  const today = new Date().toISOString().split('T')[0]

  // 문서 헤더 상태
  const [retentionPeriod, setRetentionPeriod] = useState(existing?.docHeader?.retentionPeriod || '')
  const [effectiveDate, setEffectiveDate] = useState(existing?.docHeader?.effectiveDate || today)
  const [drafterDept] = useState(existing?.docHeader?.drafterDept || currentUser?.department || '')
  const [drafterDate] = useState(existing?.docHeader?.drafterDate || today)

  // 본문 상태
  const [title, setTitle] = useState(existing?.title || '')
  const [purpose, setPurpose] = useState(existing?.content?.purpose || '')
  const [background, setBackground] = useState(existing?.content?.background || '')
  const [details, setDetails] = useState(existing?.content?.details || '')
  const [expectedEffect, setExpectedEffect] = useState(existing?.content?.expectedEffect || '')
  const [budget, setBudget] = useState(existing?.content?.budget || '')
  const [approvers, setApprovers] = useState(
    existing?.approvalSteps.map((s) => ({ userId: s.userId, role: s.role })) ||
    DEFAULT_STEPS(users)
  )

  const handleCancel = () => { if (onCancel) onCancel(); else navigate(-1) }

  const handleSave = () => {
    if (!title.trim()) { alert('제목을 입력해주세요'); return }
    const steps = approvers.map((a, i) => ({
      id: `step-${Date.now()}-${i}`,
      userId: a.userId, role: a.role, status: 'pending' as const, order: i + 1,
    }))
    const docData = {
      type: 'approval_request' as const,
      title,
      status: 'draft' as const,
      drafterId: currentUserId,
      approvalSteps: steps,
      docHeader: { retentionPeriod, effectiveDate, drafterDept, drafterDate },
      content: { purpose, background, details, expectedEffect, budget: budget || undefined },
    }
    let savedId: string
    if (existing && editId) { updateDocument(editId, docData as Partial<ApprovalRequestDoc>); savedId = editId }
    else { savedId = addDocument(docData) }
    if (onSaved) onSaved(savedId)
    else navigate(`/approval/document/${savedId}`)
  }

  return (
    <div className="space-y-5">
      {/* ── 문서 헤더 ── */}
      <div className="border border-gray-300 rounded-lg overflow-hidden text-sm">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <DocHeaderCell label="문서번호">
                <span className="px-2 py-2 block text-xs text-gray-400 italic">
                  {existing?.docNumber || '저장 시 자동채번 (YYYYMMDDNNN)'}
                </span>
              </DocHeaderCell>
              <DocHeaderCell label="보존기한">
                <select
                  value={retentionPeriod}
                  onChange={(e) => setRetentionPeriod(e.target.value)}
                  className="w-full px-2 py-2 text-sm outline-none bg-transparent"
                >
                  <option value="">선택</option>
                  {retentionItems.map((item) => (
                    <option key={item.id} value={item.label}>{item.label}</option>
                  ))}
                </select>
              </DocHeaderCell>
              <DocHeaderCell label="시행일자">
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-2 py-2 text-sm outline-none bg-transparent"
                />
              </DocHeaderCell>
            </tr>
            <tr>
              <DocHeaderCell label="기안자">
                <span className="px-2 py-2 block text-sm text-gray-700">
                  {currentUser?.avatar} {currentUser?.name || '-'}
                </span>
              </DocHeaderCell>
              <DocHeaderCell label="기안부서">
                <span className="px-2 py-2 block text-sm text-gray-700">{drafterDept || '-'}</span>
              </DocHeaderCell>
              <DocHeaderCell label="기안일자">
                <span className="px-2 py-2 block text-sm text-gray-700">
                  {drafterDate ? new Date(drafterDate).toLocaleDateString('ko-KR') : '-'}
                </span>
              </DocHeaderCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 제목 ── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">제목 *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="품의서 제목을 입력하세요"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
      </div>

      {/* ── 본문 필드 ── */}
      {[
        { label: '목적 *', value: purpose, onChange: setPurpose, placeholder: '품의 목적을 입력하세요', rows: 3 },
        { label: '배경', value: background, onChange: setBackground, placeholder: '배경 및 현황을 입력하세요', rows: 3 },
        { label: '세부내용 *', value: details, onChange: setDetails, placeholder: '세부 내용을 입력하세요', rows: 5 },
        { label: '기대효과', value: expectedEffect, onChange: setExpectedEffect, placeholder: '기대되는 효과를 입력하세요', rows: 3 },
      ].map((f) => (
        <div key={f.label}>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{f.label}</label>
          <textarea value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder={f.placeholder} rows={f.rows}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
        </div>
      ))}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">예산 (선택)</label>
        <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="예: 1,000,000원"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
      </div>

      {/* ── 결재선 ── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">결재선</label>
        <div className="space-y-2">
          {approvers.map((approver, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16">{approver.role}</span>
              <select value={approver.userId} onChange={(e) => {
                const updated = [...approvers]; updated[i] = { ...updated[i], userId: e.target.value }; setApprovers(updated)
              }} disabled={i === 0}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400">
                {users.map((u) => <option key={u.id} value={u.id}>{u.avatar} {u.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ── 버튼 ── */}
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button onClick={handleCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">취소</button>
        <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          <Save size={14} /> 임시저장
        </button>
        <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700">
          <Send size={14} /> 저장
        </button>
      </div>
    </div>
  )
}

// 기존 페이지 라우트 호환용 wrapper
export const ApprovalRequestForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><span>📋</span><span>품의서</span></div>
            <h1 className="text-xl font-bold text-gray-900">{id ? '품의서 수정' : '품의서 작성'}</h1>
          </div>
          <div className="px-8 py-6">
            <ApprovalRequestFormContent
              editId={id}
              onCancel={() => navigate(-1)}
              onSaved={(savedId) => navigate(`/approval/document/${savedId}`)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
