import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import { useDocumentStore } from '../../../store/documentStore'
import { useTaskStore } from '../../../store/taskStore'
import { BusinessTripDoc } from '../../../types/document'

interface Props {
  editId?: string
  onCancel?: () => void
  onSaved?: (id: string) => void
}

export const BusinessTripFormContent: React.FC<Props> = ({ editId, onCancel, onSaved }) => {
  const navigate = useNavigate()
  const { addDocument, updateDocument, getDocument, currentUserId } = useDocumentStore()
  const { users } = useTaskStore()

  const existing = editId ? getDocument(editId) as BusinessTripDoc | undefined : undefined

  const [title, setTitle] = useState(existing?.title || '')
  const [destination, setDestination] = useState(existing?.content?.destination || '')
  const [startDate, setStartDate] = useState(existing?.content?.startDate || '')
  const [endDate, setEndDate] = useState(existing?.content?.endDate || '')
  const [purpose, setPurpose] = useState(existing?.content?.purpose || '')
  const [activities, setActivities] = useState(existing?.content?.activities || '')
  const [results, setResults] = useState(existing?.content?.results || '')
  const [expenses, setExpenses] = useState(existing?.content?.expenses || '')
  const [approvers, setApprovers] = useState(
    existing?.approvalSteps.map((s) => ({ userId: s.userId, role: s.role })) ||
    [{ userId: currentUserId, role: '기안자' }, { userId: users[1]?.id || 'user2', role: '팀장' }]
  )

  const handleCancel = () => { if (onCancel) onCancel(); else navigate(-1) }

  const handleSave = () => {
    if (!title.trim()) { alert('제목을 입력해주세요'); return }
    const steps = approvers.map((a, i) => ({
      id: `step-${Date.now()}-${i}`, userId: a.userId, role: a.role, status: 'pending' as const, order: i + 1,
    }))
    const docData = {
      type: 'business_trip' as const,
      title,
      status: 'draft' as const,
      drafterId: currentUserId,
      approvalSteps: steps,
      content: { destination, startDate, endDate, purpose, activities, results, expenses: expenses || undefined },
    }
    let savedId: string
    if (existing && editId) { updateDocument(editId, docData); savedId = editId }
    else { savedId = addDocument(docData) }
    if (onSaved) onSaved(savedId)
    else navigate(`/approval/document/${savedId}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">제목 *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="출장보고서 제목"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">출장지 *</label>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="예: 부산 해운대구"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">출장 시작일</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">출장 종료일</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
        </div>
      </div>
      {[
        { label: '출장 목적 *', value: purpose, onChange: setPurpose, placeholder: '출장 목적을 입력하세요', rows: 3 },
        { label: '출장 내용', value: activities, onChange: setActivities, placeholder: '출장 중 수행한 업무를 입력하세요', rows: 4 },
        { label: '성과 및 결과', value: results, onChange: setResults, placeholder: '출장 성과 및 결과를 입력하세요', rows: 3 },
        { label: '지출 비용 (선택)', value: expenses, onChange: setExpenses, placeholder: '예: 교통비 85,000원, 숙박비 120,000원', rows: 2 },
      ].map((f) => (
        <div key={f.label}>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{f.label}</label>
          <textarea value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder={f.placeholder} rows={f.rows}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
        </div>
      ))}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">결재선</label>
        <div className="space-y-2">
          {approvers.map((approver, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16">{approver.role}</span>
              <select value={approver.userId} onChange={(e) => {
                const updated = [...approvers]; updated[i] = { ...updated[i], userId: e.target.value }; setApprovers(updated)
              }} disabled={i === 0}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:bg-gray-50">
                {users.map((u) => <option key={u.id} value={u.id}>{u.avatar} {u.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button onClick={handleCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">취소</button>
        <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700">
          <Save size={14} /> 저장
        </button>
      </div>
    </div>
  )
}

export const BusinessTripForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><span>✈️</span><span>출장보고서</span></div>
            <h1 className="text-xl font-bold text-gray-900">{id ? '출장보고서 수정' : '출장보고서 작성'}</h1>
          </div>
          <div className="px-8 py-6">
            <BusinessTripFormContent
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
