import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Send, Paperclip, X, FileIcon, Plus } from 'lucide-react'
import { useDocumentStore } from '../../../store/documentStore'
import { useTaskStore } from '../../../store/taskStore'
import { useCodeStore } from '../../../store/codeStore'
import { useApprovalLineStore } from '../../../store/approvalLineStore'
import { ApprovalRequestDoc, AttachmentMeta } from '../../../types/document'
import { sampleUsers } from '../../../data/sampleData'


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
  onRegisterSave?: (fn: () => void) => void
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

export const ApprovalRequestFormContent: React.FC<Props> = ({ editId, onCancel, onSaved, isModal = false, onRegisterSave }) => {
  const navigate = useNavigate()
  const { addDocument, updateDocument, getDocument, currentUserId } = useDocumentStore()
  const { users } = useTaskStore()
  const { getActiveItems } = useCodeStore()
  const { templates, getDefault } = useApprovalLineStore()
  const retentionItems = getActiveItems('RETENTION')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existing = editId ? getDocument(editId) as ApprovalRequestDoc | undefined : undefined
  const currentUser = users.find((u) => u.id === currentUserId) ?? sampleUsers.find((u) => u.id === currentUserId)
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

  // 기안자 고정 첫 단계
  const drafterStep = { userId: currentUserId, role: currentUser?.position || currentUser?.department || '기안자' }

  // 결재자 단계 (기안자 제외): 기존 문서 > 기본 템플릿 > 기본값
  const defaultApproverSteps = () => {
    if (existing) {
      const steps = existing.approvalSteps.map((s) => ({ userId: s.userId, role: s.role }))
      return steps.slice(1) // 기안자(첫 번째) 제외
    }
    const dflt = getDefault()
    if (dflt) return dflt.steps.map((s) => ({ ...s }))
    return [{ userId: users[1]?.id || 'user2', role: getUserRole(users[1]?.id || 'user2') }]
  }
  const [approvers, setApprovers] = useState(defaultApproverSteps)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  function getUserRole(userId: string) {
    const u = users.find((u) => u.id === userId)
    return u?.position || u?.department || '검토자'
  }

  const applyTemplate = (tplId: string) => {
    const tpl = templates.find((t) => t.id === tplId)
    if (tpl) setApprovers(tpl.steps.map((s) => ({ ...s })))
    setSelectedTemplateId(tplId)
  }

  const addApprover = () => {
    const uid = users[1]?.id || 'user2'
    setApprovers((prev) => [...prev, { userId: uid, role: getUserRole(uid) }])
  }
  const removeApprover = (i: number) => setApprovers((prev) => prev.filter((_, idx) => idx !== i))
  const updateApproverUser = (i: number, userId: string) => {
    setApprovers((prev) => prev.map((a, idx) =>
      idx === i ? { ...a, userId, role: getUserRole(userId) } : a
    ))
  }

  // 첨부파일
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
  const renameAttachment = (id: string, name: string) => setAttachments((prev) => prev.map((a) => a.id === id ? { ...a, name } : a))

  const [manualName, setManualName] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const manualInputRef = useRef<HTMLInputElement>(null)

  const addManualAttachment = () => {
    const name = manualName.trim()
    if (!name) return
    setAttachments((prev) => [...prev, {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      size: 0,
      fileType: 'manual',
    }])
    setManualName('')
    setShowManualInput(false)
  }

  const openManualInput = () => {
    setShowManualInput(true)
    setTimeout(() => manualInputRef.current?.focus(), 0)
  }

  const handleSave = () => {
    if (!title.trim()) { alert('제목을 입력해주세요'); return }
    const allSteps = [drafterStep, ...approvers]
    const steps = allSteps.map((a, i) => ({
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

  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave
  useEffect(() => { onRegisterSave?.(() => handleSaveRef.current()) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 결재선 + 첨부파일 패널 (인라인 JSX) ──
  const rightPanel = (
    <div className="space-y-4">
      {/* 결재선 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">결재선</label>
          <button type="button" onClick={addApprover}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
            <Plus size={12} /> 단계 추가
          </button>
        </div>
        {/* 템플릿 선택 */}
        {templates.length > 0 && (
          <select value={selectedTemplateId} onChange={(e) => applyTemplate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 bg-gray-50 mb-2">
            <option value="">── 저장된 결재선 불러오기 ──</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' ★' : ''}</option>
            ))}
          </select>
        )}
        <div className="space-y-1.5">
          {/* 기안자 고정 첫 단계 */}
          <div className="flex items-center gap-1.5">
            <span className="w-16 border border-blue-200 rounded px-1.5 py-1.5 text-xs bg-blue-50 text-blue-600 flex-shrink-0 truncate select-none">
              {drafterStep.role}
            </span>
            <span className="flex-1 border border-blue-200 rounded-lg px-2 py-1.5 text-xs bg-blue-50 text-blue-600 min-w-0">
              {currentUser?.avatar} {currentUser?.name || '-'}
            </span>
          </div>
          {/* 결재자 단계 */}
          {approvers.map((approver, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-16 border border-gray-200 rounded px-1.5 py-1.5 text-xs bg-gray-50 text-gray-600 flex-shrink-0 truncate select-none">
                {approver.role}
              </span>
              <select value={approver.userId} onChange={(e) => updateApproverUser(i, e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 min-w-0">
                {users.map((u) => <option key={u.id} value={u.id}>{u.avatar} {u.name}</option>)}
              </select>
              <button onClick={() => removeApprover(i)}
                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded flex-shrink-0">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 첨부파일 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">첨부파일</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={openManualInput}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium">
              <Plus size={12} /> 직접 입력
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Paperclip size={12} /> 파일 추가
            </button>
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
        </div>

        {/* 직접 입력 행 */}
        {showManualInput && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileIcon size={14} className="text-gray-300 flex-shrink-0" />
            <input
              ref={manualInputRef}
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addManualAttachment(); if (e.key === 'Escape') { setShowManualInput(false); setManualName('') } }}
              placeholder="파일명 입력 후 Enter"
              className="flex-1 border border-blue-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            />
            <button onClick={addManualAttachment}
              className="px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">확인</button>
            <button onClick={() => { setShowManualInput(false); setManualName('') }}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
              <X size={12} />
            </button>
          </div>
        )}

        {attachments.length === 0 && !showManualInput ? (
          <div onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
            <Paperclip size={20} className="mx-auto text-gray-300 mb-1" />
            <div className="text-xs text-gray-400">클릭하여 파일 첨부</div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 group">
                <FileIcon size={14} className={att.fileType === 'manual' ? 'text-gray-300 flex-shrink-0' : 'text-blue-400 flex-shrink-0'} />
                <div className="flex-1 min-w-0">
                  <input
                    value={att.name}
                    onChange={(e) => renameAttachment(att.id, e.target.value)}
                    className="w-full text-xs font-medium text-gray-700 bg-transparent outline-none border-b border-transparent focus:border-blue-400 focus:bg-white focus:px-1 rounded-sm transition-all"
                  />
                  <div className="text-xs text-gray-400">
                    {att.fileType === 'manual' ? '직접 입력' : formatBytes(att.size)}
                  </div>
                </div>
                <button onClick={() => removeAttachment(att.id)}
                  className="p-0.5 hover:bg-red-100 rounded text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <X size={12} />
                </button>
              </div>
            ))}
            <div className="flex gap-1.5">
              <button onClick={openManualInput}
                className="flex-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                + 직접 입력
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 text-xs text-gray-400 hover:text-blue-500 border border-dashed border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                + 파일 추가
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ── 좌측 본문 폼 (인라인 JSX) ──
  const leftContent = (
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
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">목적 *</label>
        <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="품의 목적을 입력하세요" rows={isModal ? 2 : 3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">배경</label>
        <textarea value={background} onChange={(e) => setBackground(e.target.value)} placeholder="배경 및 현황을 입력하세요" rows={isModal ? 2 : 3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">세부내용 *</label>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="세부 내용을 입력하세요" rows={isModal ? 4 : 5}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">기대효과</label>
        <textarea value={expectedEffect} onChange={(e) => setExpectedEffect(e.target.value)} placeholder="기대되는 효과를 입력하세요" rows={isModal ? 2 : 3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">예산 (선택)</label>
        <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="예: 1,000,000원"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
      </div>

      {/* 단일 컬럼 모드일 때만 결재선 여기 */}
      {!isModal && rightPanel}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {isModal ? (
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">{leftContent}</div>
          <div className="w-64 flex-shrink-0">{rightPanel}</div>
        </div>
      ) : (
        leftContent
      )}

      {/* 버튼 — 모달 아닐 때만 하단에 표시 */}
      {!isModal && (
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button onClick={handleCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">취소</button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Save size={14} /> 임시저장
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700">
            <Send size={14} /> 저장
          </button>
        </div>
      )}
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
