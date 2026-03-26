import React, { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Send, Paperclip, X, FileIcon } from 'lucide-react'
import { useDocumentStore } from '../../../store/documentStore'
import { useTaskStore } from '../../../store/taskStore'
import { useCodeStore } from '../../../store/codeStore'
import { ApprovalRequestDoc, AttachmentMeta } from '../../../types/document'

const DEFAULT_STEPS = (users: { id: string; name: string }[]) => [
  { userId: 'user1', role: '기안자' },
  { userId: users[1]?.id || 'user2', role: '팀장' },
  { userId: users[2]?.id || 'user3', role: '부서장' },
]

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  editId?: string
  onCancel?: () => void
  onSaved?: (id: string) => void
  isModal?: boolean
}

// ── 문서 헤더 테이블 셀 ──
const DocHeaderCell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <td className="border border-gray-300 align-top">
    <div className="flex">
      <span className="bg-gray-50 text-xs font-semibold text-gray-600 px-2 py-2 whitespace-nowrap border-r border-gray-300 min-w-[64px] flex items-center justify-center">{label}</span>
      <span className="flex-1">{children}</span>
    </div>
  </td>
)

export const ApprovalRequestFormContent: React.FC<Props> = ({ editId, onCancel, onSaved, isModal = false }) => {
  const navigate = useNavigate()
  const { addDocument, updateDocument, getDocument, currentUserId } = useDocumentStore()
  const { users } = useTaskStore()
  const { getActiveItems } = useCodeStore()
  const retentionItems = getActiveItems('RETENTION')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existing = editId ? getDocument(editId) as ApprovalRequestDoc | undefined : undefined
  const currentUser = users.find((u) => u.id === currentUserId)
  const today = new Date().toISOString().split('T')[0]

  // 문서 헤더
  const [retentionPeriod, setRetentionPeriod] = useState(existing?.docHeader?.retentionPeriod || '')
  const [effectiveDate, setEffectiveDate] = useState(existing?.docHeader?.effectiveDate || today)
  const [drafterDept] = useState(existing?.docHeader?.drafterDept || currentUser?.department || '')
  const [drafterDate] = useState(existing?.docHeader?.drafterDate || today)

  // 본문
  const [title, setTitle] = useState(existing?.title || '')
  const [purpose, setPurpose] = useState(existing?.content?.purpose || '')
  const [background, setBackground] = useState(existing?.content?.background || '')
  const [details, setDetails] = useState(existing?.content?.details || '')
  const [expectedEffect, setExpectedEffect] = useState(existing?.content?.expectedEffect || '')
  const [budget, setBudget] = useState(existing?.content?.budget || '')

  // 결재선
  const [approvers, setApprovers] = useState(
    existing?.approvalSteps.map((s) => ({ userId: s.userId, role: s.role })) || DEFAULT_STEPS(users)
  )

  // 첨부파일 (메타데이터만 저장, 실제 파일은 세션 유지)
  const [attachments, setAttachments] = useState<(AttachmentMeta & { _file?: File })[]>(
    existing?.attachments?.map((a) => ({ ...a })) || []
  )

  const handleCancel = () => { if (onCancel) onCancel(); else navigate(-1) }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments = files.map((f) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      fileType: f.type || 'application/octet-stream',
      _file: f,
    }))
    setAttachments((prev) => [...prev, ...newAttachments])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id))

  const handleSave = () => {
    if (!title.trim()) { alert('제목을 입력해주세요'); return }
    const steps = approvers.map((a, i) => ({
      id: `step-${Date.now()}-${i}`, userId: a.userId, role: a.role, status: 'pending' as const, order: i + 1,
    }))
    const attMeta: AttachmentMeta[] = attachments.map(({ _file: _, ...rest }) => rest)
    const docData = {
      type: 'approval_request' as const,
      title,
      status: 'draft' as const,
      drafterId: currentUserId,
      approvalSteps: steps,
      attachments: attMeta,
      docHeader: { retentionPeriod, effectiveDate, drafterDept, drafterDate },
      content: { purpose, background, details, expectedEffect, budget: budget || undefined },
    }
    let savedId: string
    if (existing && editId) { updateDocument(editId, docData as Partial<ApprovalRequestDoc>); savedId = editId }
    else { savedId = addDocument(docData) }
    if (onSaved) onSaved(savedId)
    else navigate(`/approval/document/${savedId}`)
  }

  // ── 결재선 + 첨부파일 패널 (우측 공통) ──
  const RightPanel = () => (
    <div className="space-y-4">
      {/* 결재선 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">결재선</label>
        <div className="space-y-2">
          {approvers.map((approver, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-14 flex-shrink-0">{approver.role}</span>
              <select value={approver.userId} onChange={(e) => {
                const updated = [...approvers]; updated[i] = { ...updated[i], userId: e.target.value }; setApprovers(updated)
              }} disabled={i === 0}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 min-w-0">
                {users.map((u) => <option key={u.id} value={u.id}>{u.avatar} {u.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* 첨부파일 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">첨부파일</label>
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
            <Paperclip size={12} /> 파일 추가
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
        </div>

        {attachments.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
            <Paperclip size={20} className="mx-auto text-gray-300 mb-1" />
            <div className="text-xs text-gray-400">클릭하여 파일 첨부</div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 group">
                <FileIcon size={14} className="text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate">{att.name}</div>
                  <div className="text-xs text-gray-400">{formatBytes(att.size)}</div>
                </div>
                <button onClick={() => removeAttachment(att.id)}
                  className="p-0.5 hover:bg-red-100 rounded text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <X size={12} />
                </button>
              </div>
            ))}
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full py-1.5 text-xs text-gray-400 hover:text-blue-500 border border-dashed border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              + 파일 추가
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // ── 좌측 본문 폼 ──
  const LeftContent = () => (
    <div className="space-y-4">
      {/* 문서 헤더 */}
      <div className="border border-gray-300 rounded-lg overflow-hidden text-sm">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <DocHeaderCell label="문서번호">
                <span className="px-2 py-2 block text-xs text-gray-400 italic">
                  {existing?.docNumber || '저장 시 자동채번'}
                </span>
              </DocHeaderCell>
              <DocHeaderCell label="보존기한">
                <select value={retentionPeriod} onChange={(e) => setRetentionPeriod(e.target.value)}
                  className="w-full px-2 py-2 text-sm outline-none bg-transparent">
                  <option value="">선택</option>
                  {retentionItems.map((item) => (
                    <option key={item.id} value={item.label}>{item.label}</option>
                  ))}
                </select>
              </DocHeaderCell>
              <DocHeaderCell label="시행일자">
                <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-2 py-2 text-sm outline-none bg-transparent" />
              </DocHeaderCell>
            </tr>
            <tr>
              <DocHeaderCell label="기안자">
                <span className="px-2 py-2 block text-sm text-gray-700">{currentUser?.avatar} {currentUser?.name || '-'}</span>
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

      {/* 제목 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">제목 *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="품의서 제목을 입력하세요"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
      </div>

      {/* 본문 필드 */}
      {[
        { label: '목적 *', value: purpose, onChange: setPurpose, placeholder: '품의 목적을 입력하세요', rows: isModal ? 2 : 3 },
        { label: '배경', value: background, onChange: setBackground, placeholder: '배경 및 현황을 입력하세요', rows: isModal ? 2 : 3 },
        { label: '세부내용 *', value: details, onChange: setDetails, placeholder: '세부 내용을 입력하세요', rows: isModal ? 4 : 5 },
        { label: '기대효과', value: expectedEffect, onChange: setExpectedEffect, placeholder: '기대되는 효과를 입력하세요', rows: isModal ? 2 : 3 },
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

      {/* 단일 컬럼 모드일 때만 결재선 여기 */}
      {!isModal && <RightPanel />}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {isModal ? (
        /* 2컬럼 레이아웃 */
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <LeftContent />
          </div>
          <div className="w-64 flex-shrink-0">
            <RightPanel />
          </div>
        </div>
      ) : (
        <LeftContent />
      )}

      {/* 버튼 */}
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
