import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { useDocumentStore } from '../../../store/documentStore'
import { useTaskStore } from '../../../store/taskStore'
import { ExpenseDoc, ExpenseItem } from '../../../types/document'

const CATEGORIES = ['교통비', '식비', '숙박비', '회의비', '기타']

const newItem = (): ExpenseItem => ({
  id: `item-${Date.now()}-${Math.random()}`,
  date: new Date().toISOString().split('T')[0],
  category: '교통비',
  description: '',
  amount: 0,
})

export const ExpenseForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { addDocument, updateDocument, getDocument, currentUserId } = useDocumentStore()
  const { users } = useTaskStore()

  const existing = id ? getDocument(id) as ExpenseDoc | undefined : undefined

  const [title, setTitle] = useState(existing?.title || '')
  const [purpose, setPurpose] = useState(existing?.content?.purpose || '')
  const [notes, setNotes] = useState(existing?.content?.notes || '')
  const [items, setItems] = useState<ExpenseItem[]>(existing?.content?.items || [newItem()])
  const [approvers, setApprovers] = useState(
    existing?.approvalSteps.map((s) => ({ userId: s.userId, role: s.role })) ||
    [{ userId: currentUserId, role: '기안자' }, { userId: users[1]?.id || 'user2', role: '팀장' }]
  )

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const updateItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleSave = () => {
    if (!title.trim()) { alert('제목을 입력해주세요'); return }
    if (items.some((i) => !i.description.trim())) { alert('모든 지출 항목의 내용을 입력해주세요'); return }
    const steps = approvers.map((a, i) => ({
      id: `step-${Date.now()}-${i}`, userId: a.userId, role: a.role, status: 'pending' as const, order: i + 1,
    }))
    const docData = {
      type: 'expense' as const,
      title,
      status: 'draft' as const,
      drafterId: currentUserId,
      approvalSteps: steps,
      content: { purpose, items, totalAmount, notes: notes || undefined },
    }
    if (existing && id) {
      updateDocument(id, docData)
      navigate(`/approval/document/${id}`)
    } else {
      const newId = addDocument(docData)
      navigate(`/approval/document/${newId}`)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> 뒤로
        </button>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><span>💰</span><span>지출결의서</span></div>
            <h1 className="text-xl font-bold text-gray-900">{existing ? '지출결의서 수정' : '지출결의서 작성'}</h1>
          </div>
          <div className="px-8 py-6 space-y-5">
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

            {/* Expense Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-500 uppercase">지출 내역 *</label>
                <button onClick={() => setItems([...items, newItem()])}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                  <Plus size={12} /> 항목 추가
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 w-32">날짜</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 w-28">항목</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600">내용</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600 w-32">금액 (원)</th>
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
                            <button onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                              className="text-gray-300 hover:text-red-400">
                              <Trash2 size={13} />
                            </button>
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
          </div>
          <div className="px-8 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
            <button onClick={() => navigate(-1)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">취소</button>
            <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700">
              <Save size={14} /> 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
