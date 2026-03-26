import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Send, Plus, Trash2, Paperclip, X, FileIcon } from 'lucide-react'
import { useDocumentStore } from '../../../store/documentStore'
import { useTaskStore } from '../../../store/taskStore'
import { useApprovalLineStore } from '../../../store/approvalLineStore'
import { ExpenseDoc, ExpenseItem, AttachmentMeta } from '../../../types/document'
import { sampleUsers } from '../../../data/sampleData'

const CATEGORIES = ['교통비', '식비', '숙박비', '회의비', '기타']

const newItem = (): ExpenseItem => ({
  id: `item-${Date.now()}-${Math.random()}`,
  date: new Date().toISOString().split('T')[0],
  category: '교통비',
  description: '',
  amount: 0,
})

interface Props {
  editId?: string
  onCancel?: () => void
  onSaved?: (id: string) => void
  isModal?: boolean
  onRegisterSave?: (fn: () => void) => void
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ExpenseFormContent: React.FC<Props> = ({ editId, onCancel, onSaved, isModal = false, onRegisterSave }) => {
  const navigate = useNavigate()
  const { addDocument, updateDocument, getDocument, currentUserId } = useDocumentStore()
  const { users } = useTaskStore()
  const { templates, getDefault } = useApprovalLineStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existing = editId ? getDocument(editId) as ExpenseDoc | undefined : undefined
  const currentUser = users.find((u) => u.id === currentUserId) ?? sampleUsers.find((u) => u.id === currentUserId)

  const [title, setTitle] = useState(existing?.title || '')
  const [purpose, setPurpose] = useState(existing?.content?.purpose || '')
  const [notes, setNotes] = useState(existing?.content?.notes || '')
  const [items, setItems] = useState<ExpenseItem[]>(existing?.content?.items || [newItem()])

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const updateItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  // 기안자 고정 첫 단계
  const drafterStep = { userId: currentUserId, role: currentUser?.position || currentUser?.department || '기안자' }

  function getUserRole(userId: string) {
    const u = users.find((u) => u.id === userId)
    return u?.position || u?.department || '검토자'
  }

  const defaultApproverSteps = () => {
    if (existing) return existing.approvalSteps.slice(1).map((s) => ({ userId: s.userId, role: s.role }))
    const dflt = getDefault()
    if (dflt) return dflt.steps.map((s) => ({ ...s }))
    return [{ userId: users[1]?.id || 'user2', role: getUserRole(users[1]?.id || 'user2') }]
  }
  const [approvers, setApprovers] = useState(defaultApproverSteps)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

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
    setApprovers((prev) => prev.map((a, idx) => idx === i ? { ...a, userId, role: getUserRole(userId) } : a))
  }

  // 첨부파일
  const [attachments, setAttachments] = useState<(AttachmentMeta & { _file?: File })[]>(
    existing?.attachments?.map((a) => ({ ...a })) || []
  )
  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id))
  const renameAttachment = (id: string, name: string) => setAttachments((prev) => prev.map((a) => a.id === id ? { ...a, name } : a))

  const [manualName, setManualName] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const manualInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files.map((f) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name, size: f.size, fileType: f.type || 'application/octet-stream', _file: f,
    }))])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addManualAttachment = () => {
    const name = manualName.trim()
    if (!name) return
    setAttachments((prev) => [...prev, { id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`, name, size: 0, fileType: 'manual' }])
    setManualName(''); setShowManualInput(false)
  }
  const openManualInput = () => { setShowManualInput(true); setTimeout(() => manualInputRef.current?.focus(), 0) }

  const handleCancel = () => { if (onCancel) onCancel(); else navigate(-1) }

  const handleSave = () => {
    if (!title.trim()) { alert('제목을 입력해주세요'); return }
    if (items.some((i) => !i.description.trim())) { alert('모든 지출 항목의 내용을 입력해주세요'); return }
    const allSteps = [drafterStep, ...approvers]
    const steps = allSteps.map((a, i) => ({
      id: `step-${Date.now()}-${i}`, userId: a.userId, role: a.role, status: 'pending' as const, order: i + 1,
    }))
    const attMeta: AttachmentMeta[] = attachments.map(({ _file: _, ...rest }) => rest)
    const docData = {
      type: 'expense' as const, title, status: 'draft' as const, drafterId: currentUserId,
      approvalSteps: steps, attachments: attMeta,
      content: { purpose, items, totalAmount, notes: notes || undefined },
    }
    let savedId: string
    if (existing && editId) { updateDocument(editId, docData); savedId = editId }
    else { savedId = addDocument(docData) }
    if (onSaved) onSaved(savedId)
    else navigate(`/approval/document/${savedId}`)
  }

  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave
  useEffect(() => { onRegisterSave?.(() => handleSaveRef.current()) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 우측 패널 ──
  const rightPanel = (
    <div className="space-y-4">
      {/* 결재선 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">결재선</label>
          <button type="button" onClick={addApprover} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
            <Plus size={12} /> 단계 추가
          </button>
        </div>
        {templates.length > 0 && (
          <select value={selectedTemplateId} onChange={(e) => applyTemplate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 bg-gray-50 mb-2">
            <option value="">── 저장된 결재선 불러오기 ──</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' ★' : ''}</option>)}
          </select>
        )}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-16 border border-blue-200 rounded px-1.5 py-1.5 text-xs bg-blue-50 text-blue-600 flex-shrink-0 truncate select-none">{drafterStep.role}</span>
            <span className="flex-1 border border-blue-200 rounded-lg px-2 py-1.5 text-xs bg-blue-50 text-blue-600 min-w-0">{currentUser?.avatar} {currentUser?.name || '-'}</span>
          </div>
          {approvers.map((approver, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-16 border border-gray-200 rounded px-1.5 py-1.5 text-xs bg-gray-50 text-gray-600 flex-shrink-0 truncate select-none">{approver.role}</span>
              <select value={approver.userId} onChange={(e) => updateApproverUser(i, e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 min-w-0">
                {users.map((u) => <option key={u.id} value={u.id}>{u.avatar} {u.name}</option>)}
              </select>
              <button onClick={() => removeApprover(i)} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded flex-shrink-0"><X size={12} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* 첨부파일 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">첨부파일</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={openManualInput} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium"><Plus size={12} /> 직접 입력</button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"><Paperclip size={12} /> 파일 추가</button>
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
        </div>
        {showManualInput && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileIcon size={14} className="text-gray-300 flex-shrink-0" />
            <input ref={manualInputRef} value={manualName} onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addManualAttachment(); if (e.key === 'Escape') { setShowManualInput(false); setManualName('') } }}
              placeholder="파일명 입력 후 Enter"
              className="flex-1 border border-blue-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" />
            <button onClick={addManualAttachment} className="px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">확인</button>
            <button onClick={() => { setShowManualInput(false); setManualName('') }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"><X size={12} /></button>
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
                  <input value={att.name} onChange={(e) => renameAttachment(att.id, e.target.value)}
                    className="w-full text-xs font-medium text-gray-700 bg-transparent outline-none border-b border-transparent focus:border-blue-400 focus:bg-white focus:px-1 rounded-sm transition-all" />
                  <div className="text-xs text-gray-400">{att.fileType === 'manual' ? '직접 입력' : formatBytes(att.size)}</div>
                </div>
                <button onClick={() => removeAttachment(att.id)} className="p-0.5 hover:bg-red-100 rounded text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X size={12} /></button>
              </div>
            ))}
            <div className="flex gap-1.5">
              <button onClick={openManualInput} className="flex-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors">+ 직접 입력</button>
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-1.5 text-xs text-gray-400 hover:text-blue-500 border border-dashed border-gray-200 rounded-lg hover:border-blue-300 transition-colors">+ 파일 추가</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ── 좌측 본문 ──
  const leftContent = (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">제목 *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="지출결의서 제목"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">지출 목적 *</label>
        <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="지출 목적을 입력하세요"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">지출 내역 *</label>
          <button onClick={() => setItems((prev) => [...prev, newItem()])} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
            <Plus size={12} /> 항목 추가
          </button>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 w-32">날짜</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 w-24">항목</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600">내용</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600 w-28">금액 (원)</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <tr key={item.id}>
                  <td className="px-2 py-2">
                    <input type="date" value={item.date} onChange={(e) => updateItem(i, 'date', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-400" />
                  </td>
                  <td className="px-2 py-2">
                    <select value={item.category} onChange={(e) => updateItem(i, 'category', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-400">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)}
                      placeholder="지출 내용"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-400" />
                  </td>
                  <td className="px-2 py-2">
                    <input type="number" value={item.amount || ''} onChange={(e) => updateItem(i, 'amount', Number(e.target.value))}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-400 text-right" />
                  </td>
                  <td className="px-1 py-2">
                    {items.length > 1 && (
                      <button onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-300 hover:text-red-400"><Trash2 size={13} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={3} className="px-3 py-2.5 text-sm font-semibold text-gray-700">합계</td>
                <td className="px-3 py-2.5 text-sm font-bold text-gray-900 text-right">{totalAmount.toLocaleString()}원</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">비고 (선택)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="비고사항을 입력하세요" rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
      </div>
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
      ) : leftContent}
      {!isModal && (
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button onClick={handleCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">취소</button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"><Save size={14} /> 임시저장</button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700"><Send size={14} /> 저장</button>
        </div>
      )}
    </div>
  )
}

export const ExpenseForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><span>💰</span><span>지출결의서</span></div>
            <h1 className="text-xl font-bold text-gray-900">{id ? '지출결의서 수정' : '지출결의서 작성'}</h1>
          </div>
          <div className="px-8 py-6">
            <ExpenseFormContent editId={id} onCancel={() => navigate(-1)} onSaved={(savedId) => navigate(`/approval/document/${savedId}`)} />
          </div>
        </div>
      </div>
    </div>
  )
}
