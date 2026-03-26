import React, { useState, useRef, useCallback } from 'react'
import { Header } from '../components/layout/Header'
import { useTaskStore } from '../store/taskStore'
import { useCodeStore } from '../store/codeStore'
import { useApprovalLineStore } from '../store/approvalLineStore'
import {
  User, Bell, Palette, Database, Shield, ChevronRight,
  Users, Plus, Edit2, Trash2, X, Check, Eye, EyeOff, Search,
  ListTree, ChevronDown, ChevronUp, KeyRound, Copy, CheckCheck,
  GitBranch, Star
} from 'lucide-react'
import {
  UserStatus, USER_STATUS_LABELS, USER_STATUS_CODES, USER_STATUS_COLORS
} from '../types'
import { CodeGroup } from '../types/code'
import { ApprovalLineStep } from '../types/approvalLine'

const AVATAR_OPTIONS = ['👨‍💻', '👩‍💼', '👨‍🎨', '👩‍🔬', '👨‍💼', '👩‍💻', '👨‍🔬', '👩‍🎨', '🧑‍💼', '👤']
const COLOR_OPTIONS = ['#2383e2', '#0f7b6c', '#cb912f', '#eb5757', '#9065b0', '#d9730d', '#448361', '#337ea9']
const ALL_STATUSES: UserStatus[] = ['active', 'inactive', 'password_assigned']

interface UserFormData {
  userId: string
  name: string
  department: string
  position: string
  email: string
  joinDate: string
  userStatus: UserStatus
  isAdmin: boolean
  password: string
  avatar: string
  color: string
}

const emptyForm = (): UserFormData => ({
  userId: '', name: '', department: '개발팀', position: '사원',
  email: '', joinDate: new Date().toISOString().split('T')[0],
  userStatus: 'password_assigned', isAdmin: false, password: '', avatar: '👤', color: '#2383e2',
})

const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const generateUserId = (existingUsers: { userId: string }[], joinDate?: string): string => {
  const base = joinDate ? new Date(joinDate) : new Date()
  const prefix = `${base.getFullYear()}${String(base.getMonth() + 1).padStart(2, '0')}`
  const existing = existingUsers
    .map((u) => u.userId)
    .filter((id) => id.startsWith(prefix) && /^\d{9}$/.test(id))
    .map((id) => parseInt(id.slice(6), 10))
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

const useDraggable = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const startPos = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startPos.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    e.preventDefault()
  }, [pos])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return
    setPos({
      x: startPos.current.px + e.clientX - startPos.current.mx,
      y: startPos.current.py + e.clientY - startPos.current.my,
    })
  }, [])

  const onMouseUp = useCallback(() => { dragging.current = false }, [])

  const reset = useCallback(() => setPos({ x: 0, y: 0 }), [])

  return { pos, onMouseDown, onMouseMove, onMouseUp, reset }
}

const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useTaskStore()
  const { getActiveItems } = useCodeStore()
  const deptItems = getActiveItems('DEPT')
  const posItems = getActiveItems('POSITION')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserFormData>(emptyForm())
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<UserFormData>>({})
  const drag = useDraggable()

  // 비밀번호 초기화
  const [resetResult, setResetResult] = useState<{ name: string; userId: string; tempPw: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleResetPassword = (id: string, name: string, userId: string) => {
    if (!confirm(`'${name}' 사용자의 비밀번호를 초기화하시겠습니까?`)) return
    const tempPw = generateTempPassword()
    updateUser(id, { password: tempPw, userStatus: 'password_assigned' })
    setResetResult({ name, userId, tempPw })
    setCopied(false)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.name.includes(search) || u.userId.includes(search) ||
      u.department.includes(search) || (u.email || '').includes(search)
    const matchStatus = filterStatus === 'all' || u.userStatus === filterStatus
    return matchSearch && matchStatus
  })

  const openAdd = () => {
    setForm(emptyForm())
    setEditingId(null)
    setErrors({})
    setShowPassword(false)
    drag.reset()
    setShowModal(true)
  }

  const openEdit = (id: string) => {
    const user = users.find((u) => u.id === id)
    if (!user) return
    setForm({
      userId: user.userId,
      name: user.name,
      department: user.department,
      position: user.position || '사원',
      email: user.email || '',
      joinDate: user.joinDate || '',
      userStatus: user.userStatus,
      isAdmin: user.isAdmin ?? false,
      password: user.password || '',
      avatar: user.avatar,
      color: user.color,
    })
    setEditingId(id)
    setErrors({})
    setShowPassword(false)
    drag.reset()
    setShowModal(true)
  }

  const handleAutoGenId = () => {
    const generated = generateUserId(users, form.joinDate)
    setForm((f) => ({ ...f, userId: generated }))
    if (errors.userId) setErrors((e) => ({ ...e, userId: undefined }))
  }

  const validate = (): boolean => {
    const e: Partial<UserFormData> = {}
    // 아이디가 비어있으면 자동채번
    let finalUserId = form.userId.trim()
    if (!finalUserId) {
      finalUserId = generateUserId(users, form.joinDate)
      setForm((f) => ({ ...f, userId: finalUserId }))
    } else if (!/^[a-zA-Z0-9_]+$/.test(finalUserId)) {
      e.userId = '영문, 숫자, _만 사용 가능합니다'
    } else if (!editingId && users.some((u) => u.userId === finalUserId)) {
      e.userId = '이미 사용 중인 아이디입니다'
    }
    if (!form.name.trim()) e.name = '성명을 입력하세요'
    if (!form.password.trim()) e.password = '비밀번호를 입력하세요'
    else if (form.password.length < 4) e.password = '4자 이상 입력하세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    if (editingId) {
      updateUser(editingId, {
        userId: form.userId, name: form.name, department: form.department,
        position: form.position, email: form.email, joinDate: form.joinDate || undefined,
        userStatus: form.userStatus, isAdmin: form.isAdmin, password: form.password, avatar: form.avatar, color: form.color,
      })
    } else {
      addUser({
        userId: form.userId, name: form.name, department: form.department,
        position: form.position, email: form.email, joinDate: form.joinDate || undefined,
        userStatus: form.userStatus, isAdmin: form.isAdmin, password: form.password, avatar: form.avatar, color: form.color,
      })
    }
    setShowModal(false)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`'${name}' 사용자를 삭제하시겠습니까?`)) deleteUser(id)
  }

  const set = (field: keyof UserFormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">사용자 관리</h3>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
          <Plus size={14} /> 사용자 등록
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="아이디, 성명, 부서 검색..."
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-full outline-none focus:border-blue-400" />
        </div>
        <div className="flex gap-1">
          {(['all', ...ALL_STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                filterStatus === s ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {s === 'all' ? '전체' : USER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {ALL_STATUSES.map((s) => (
          <div key={s} className={`rounded-lg px-3 py-2.5 ${USER_STATUS_COLORS[s]}`}>
            <div className="text-lg font-bold">{users.filter((u) => u.userStatus === s).length}</div>
            <div className="text-xs">[{USER_STATUS_CODES[s]}] {USER_STATUS_LABELS[s]}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-44 whitespace-nowrap">아이디</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-24 whitespace-nowrap">성명</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-28 whitespace-nowrap">부서</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-20 whitespace-nowrap">직위</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-36 whitespace-nowrap">상태</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 w-24 whitespace-nowrap">관리자</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-24 whitespace-nowrap">등록일</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 text-center w-20 whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-sm text-gray-400">검색 결과가 없습니다</td></tr>
            ) : filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{user.avatar}</span>
                    <span className="text-sm font-mono text-gray-700">{user.userId}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{user.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{user.department}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{user.position || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${USER_STATUS_COLORS[user.userStatus]}`}>
                    [{USER_STATUS_CODES[user.userStatus]}] {USER_STATUS_LABELS[user.userStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {user.isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      <Shield size={10} /> 관리자
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(user.id)}
                      title="수정"
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleResetPassword(user.id, user.name, user.userId)}
                      title="비밀번호 초기화"
                      className="p-1.5 hover:bg-yellow-50 rounded-lg text-gray-400 hover:text-yellow-600 transition-colors">
                      <KeyRound size={14} />
                    </button>
                    <button onClick={() => handleDelete(user.id, user.name)}
                      title="삭제"
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 비밀번호 초기화 결과 모달 */}
      {resetResult && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <KeyRound size={15} className="text-yellow-500" /> 비밀번호 초기화 완료
              </h2>
              <button onClick={() => setResetResult(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={15} />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                상태가 <strong>[03] 비밀번호부여</strong>로 변경되었습니다.<br />
                아래 임시 비밀번호를 사용자에게 전달하세요.
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>사용자</span>
                  <span className="font-medium text-gray-700">{resetResult.name} ({resetResult.userId})</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>임시 비밀번호</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-gray-900 tracking-widest bg-gray-100 px-3 py-1 rounded-lg">
                      {resetResult.tempPw}
                    </span>
                    <button
                      onClick={() => handleCopy(resetResult.tempPw)}
                      className={`p-1.5 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                      title="클립보드에 복사"
                    >
                      {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setResetResult(null)}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 font-medium">
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onMouseMove={(e) => drag.onMouseMove(e.nativeEvent)}
          onMouseUp={drag.onMouseUp}
          onMouseLeave={drag.onMouseUp}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ transform: `translate(${drag.pos.x}px, ${drag.pos.y}px)`, cursor: 'default' }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-gray-100 cursor-move select-none"
              onMouseDown={drag.onMouseDown}
            >
              <h2 className="text-base font-semibold text-gray-900">{editingId ? '사용자 정보 수정' : '사용자 등록'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Avatar & Color */}
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">아바타</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_OPTIONS.map((a) => (
                      <button key={a} onClick={() => set('avatar', a)}
                        className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${form.avatar === a ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">색상</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button key={c} onClick={() => set('color', c)}
                        className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: form.color + '22' }}>
                  {form.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{form.name || '성명'}</div>
                  <div className="text-xs text-gray-500">{form.department} · {form.position}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 아이디 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase">아이디</label>
                    {!editingId && (
                      <button
                        type="button"
                        onClick={handleAutoGenId}
                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline font-medium"
                      >
                        자동채번
                      </button>
                    )}
                  </div>
                  <input
                    value={form.userId}
                    onChange={(e) => set('userId', e.target.value)}
                    placeholder={editingId ? '' : generateUserId(users, form.joinDate) + ' (자동)'}
                    disabled={!!editingId}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 font-mono ${errors.userId ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {!editingId && !form.userId && (
                    <p className="text-xs text-gray-400 mt-1">비워두면 입사일 기준으로 자동 채번됩니다</p>
                  )}
                  {errors.userId && <p className="text-xs text-red-500 mt-1">{errors.userId}</p>}
                </div>
                {/* 성명 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">성명 *</label>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="홍길동"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 ${errors.name ? 'border-red-400' : 'border-gray-300'}`} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                {/* 부서 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">부서</label>
                  <select value={form.department} onChange={(e) => set('department', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
                    {deptItems.map((d) => <option key={d.id} value={d.label}>{d.label}</option>)}
                  </select>
                </div>
                {/* 직위 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">직위</label>
                  <select value={form.position} onChange={(e) => set('position', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
                    {posItems.map((p) => <option key={p.id} value={p.label}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* 이메일 + 입사일 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">이메일</label>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                    placeholder="user@company.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">입사일</label>
                  <input
                    type="date"
                    value={form.joinDate}
                    onChange={(e) => {
                      set('joinDate', e.target.value)
                      // 아이디가 비어있으면 placeholder 갱신을 위해 state만 바꿈
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                  {!editingId && form.joinDate && !form.userId && (
                    <p className="text-xs text-blue-500 mt-1 font-mono">
                      → {generateUserId(users, form.joinDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">비밀번호 *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)}
                    placeholder="4자 이상"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 pr-10 ${errors.password ? 'border-red-400' : 'border-gray-300'}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* 시스템 관리자 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Shield size={14} className="text-purple-500" /> 시스템 관리자
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">모든 메뉴 및 사용자 관리 권한 부여</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isAdmin: !f.isAdmin }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${form.isAdmin ? 'bg-purple-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.isAdmin ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">상태 *</label>
                <div className="flex gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button key={s} onClick={() => set('userStatus', s)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex-1 justify-center ${
                        form.userStatus === s
                          ? USER_STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-blue-300'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {form.userStatus === s && <Check size={11} />}
                      [{USER_STATUS_CODES[s]}] {USER_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">취소</button>
              <button onClick={handleSave} className="px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 font-medium">
                {editingId ? '수정 완료' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// CodeManagement
// ────────────────────────────────────────────────────────────
const CodeManagement: React.FC = () => {
  const {
    codeGroups, addCodeGroup, updateCodeGroup, deleteCodeGroup,
    addCodeItem, updateCodeItem, deleteCodeItem,
  } = useCodeStore()

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    codeGroups[0]?.id ?? null
  )

  // Group form
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [groupForm, setGroupForm] = useState({ groupCode: '', groupName: '', description: '' })
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

  // Item form
  const [showItemForm, setShowItemForm] = useState(false)
  const [itemForm, setItemForm] = useState({ code: '', label: '', order: '' })
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const selectedGroup = codeGroups.find((g) => g.id === selectedGroupId) ?? null

  // ── Group handlers ──────────────────────────
  const openAddGroup = () => {
    setGroupForm({ groupCode: '', groupName: '', description: '' })
    setEditingGroupId(null)
    setShowGroupForm(true)
  }

  const openEditGroup = (g: CodeGroup) => {
    setGroupForm({ groupCode: g.groupCode, groupName: g.groupName, description: g.description ?? '' })
    setEditingGroupId(g.id)
    setShowGroupForm(true)
  }

  const saveGroup = () => {
    if (!groupForm.groupName.trim()) return
    if (editingGroupId) {
      updateCodeGroup(editingGroupId, { groupName: groupForm.groupName, description: groupForm.description })
    } else {
      if (!groupForm.groupCode.trim()) return
      const id = addCodeGroup({
        groupCode: groupForm.groupCode.toUpperCase(),
        groupName: groupForm.groupName,
        description: groupForm.description,
        isSystem: false,
      })
      setSelectedGroupId(id)
    }
    setShowGroupForm(false)
  }

  const handleDeleteGroup = (g: CodeGroup) => {
    if (g.isSystem) return
    if (confirm(`'${g.groupName}' 코드 그룹을 삭제하시겠습니까?\n하위 코드도 모두 삭제됩니다.`)) {
      deleteCodeGroup(g.id)
      setSelectedGroupId(codeGroups.find((x) => x.id !== g.id)?.id ?? null)
    }
  }

  // ── Item handlers ───────────────────────────
  const openAddItem = () => {
    const nextOrder = (selectedGroup?.items.length ?? 0) + 1
    const nextCode = String(nextOrder).padStart(2, '0')
    setItemForm({ code: nextCode, label: '', order: String(nextOrder) })
    setEditingItemId(null)
    setShowItemForm(true)
  }

  const openEditItem = (item: CodeGroup['items'][0]) => {
    setItemForm({ code: item.code, label: item.label, order: String(item.order) })
    setEditingItemId(item.id)
    setShowItemForm(true)
  }

  const saveItem = () => {
    if (!selectedGroupId || !itemForm.label.trim()) return
    const order = parseInt(itemForm.order) || 1
    if (editingItemId) {
      updateCodeItem(selectedGroupId, editingItemId, {
        code: itemForm.code, label: itemForm.label, order,
      })
    } else {
      addCodeItem(selectedGroupId, { code: itemForm.code, label: itemForm.label, order, isActive: true })
    }
    setShowItemForm(false)
  }

  const handleDeleteItem = (itemId: string, label: string) => {
    if (!selectedGroupId) return
    if (confirm(`'${label}' 코드를 삭제하시겠습니까?`)) deleteCodeItem(selectedGroupId, itemId)
  }

  const toggleItemActive = (itemId: string, current: boolean) => {
    if (!selectedGroupId) return
    updateCodeItem(selectedGroupId, itemId, { isActive: !current })
  }

  const moveItem = (itemId: string, dir: -1 | 1) => {
    if (!selectedGroup) return
    const items = [...selectedGroup.items].sort((a, b) => a.order - b.order)
    const idx = items.findIndex((i) => i.id === itemId)
    if (idx < 0) return
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= items.length) return
    const reordered = items.map((item, i) => {
      if (i === idx) return { ...item, order: items[swapIdx].order }
      if (i === swapIdx) return { ...item, order: items[idx].order }
      return item
    })
    reordered.forEach((item) => updateCodeItem(selectedGroup.id, item.id, { order: item.order }))
  }

  const sortedItems = selectedGroup
    ? [...selectedGroup.items].sort((a, b) => a.order - b.order)
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">사용자 코드 관리</h3>
        <button onClick={openAddGroup}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
          <Plus size={14} /> 그룹 추가
        </button>
      </div>

      <div className="flex gap-4 min-h-[420px]">
        {/* 좌측: 코드 그룹 목록 */}
        <div className="w-44 flex-shrink-0 border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase">코드 그룹</span>
          </div>
          <div className="divide-y divide-gray-100">
            {codeGroups.map((g) => (
              <div
                key={g.id}
                onClick={() => { setSelectedGroupId(g.id); setShowItemForm(false) }}
                className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors group ${
                  selectedGroupId === g.id ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'
                }`}
              >
                <div className="min-w-0">
                  <div className={`text-sm font-medium truncate ${selectedGroupId === g.id ? 'text-blue-700' : 'text-gray-700'}`}>
                    {g.groupName}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">{g.groupCode}</div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); openEditGroup(g) }}
                    className="p-1 hover:bg-blue-100 rounded text-gray-400 hover:text-blue-600">
                    <Edit2 size={11} />
                  </button>
                  {!g.isSystem && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g) }}
                      className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500">
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 코드 아이템 */}
        <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          {selectedGroup ? (
            <>
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-700">{selectedGroup.groupName}</span>
                  {selectedGroup.description && (
                    <span className="ml-2 text-xs text-gray-400">{selectedGroup.description}</span>
                  )}
                  {selectedGroup.isSystem && (
                    <span className="ml-2 text-xs bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-medium">시스템</span>
                  )}
                </div>
                <button onClick={openAddItem}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700">
                  <Plus size={12} /> 코드 추가
                </button>
              </div>

              {/* 아이템 폼 (인라인) */}
              {showItemForm && (
                <div className="px-4 py-3 bg-blue-50/60 border-b border-blue-100 flex items-end gap-2">
                  <div className="flex-shrink-0 w-20">
                    <label className="block text-xs text-gray-500 mb-1">코드값</label>
                    <input value={itemForm.code} onChange={(e) => setItemForm((f) => ({ ...f, code: e.target.value }))}
                      placeholder="01"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400 font-mono" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">표시명 *</label>
                    <input value={itemForm.label} onChange={(e) => setItemForm((f) => ({ ...f, label: e.target.value }))}
                      placeholder="코드명 입력"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400" />
                  </div>
                  <div className="flex-shrink-0 w-16">
                    <label className="block text-xs text-gray-500 mb-1">순서</label>
                    <input type="number" value={itemForm.order} onChange={(e) => setItemForm((f) => ({ ...f, order: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400" />
                  </div>
                  <button onClick={saveItem}
                    className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1">
                    <Check size={13} /> 저장
                  </button>
                  <button onClick={() => setShowItemForm(false)}
                    className="flex-shrink-0 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                    취소
                  </button>
                </div>
              )}

              <table className="w-full flex-1">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-8 px-2 py-2"></th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">코드</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">표시명</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">순서</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">사용</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedItems.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-sm text-gray-400">코드를 추가하세요</td></tr>
                  ) : sortedItems.map((item, idx) => (
                    <tr key={item.id} className={`transition-colors ${item.isActive ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-60'}`}>
                      <td className="px-2 py-2">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveItem(item.id, -1)} disabled={idx === 0}
                            className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-20 text-gray-400">
                            <ChevronUp size={12} />
                          </button>
                          <button onClick={() => moveItem(item.id, 1)} disabled={idx === sortedItems.length - 1}
                            className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-20 text-gray-400">
                            <ChevronDown size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm font-mono text-gray-500">{item.code}</td>
                      <td className="px-3 py-2.5 text-sm font-medium text-gray-800">{item.label}</td>
                      <td className="px-3 py-2.5 text-center text-sm text-gray-400">{item.order}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => toggleItemActive(item.id, item.isActive)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${item.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditItem(item)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id, item.label)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              좌측에서 코드 그룹을 선택하세요
            </div>
          )}
        </div>
      </div>

      {/* 그룹 추가/수정 모달 */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{editingGroupId ? '코드 그룹 수정' : '코드 그룹 추가'}</h2>
              <button onClick={() => setShowGroupForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={15} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {!editingGroupId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">그룹 코드 *</label>
                  <input value={groupForm.groupCode}
                    onChange={(e) => setGroupForm((f) => ({ ...f, groupCode: e.target.value.toUpperCase() }))}
                    placeholder="예: MY_CODE"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 font-mono uppercase" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">그룹명 *</label>
                <input value={groupForm.groupName}
                  onChange={(e) => setGroupForm((f) => ({ ...f, groupName: e.target.value }))}
                  placeholder="예: 프로젝트 구분"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">설명</label>
                <input value={groupForm.description}
                  onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="코드 그룹 설명"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowGroupForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">취소</button>
              <button onClick={saveGroup} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 font-medium">
                {editingGroupId ? '수정 완료' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 결재선 관리 ──
const ApprovalLineManagement: React.FC = () => {
  const { users } = useTaskStore()
  const { templates, addTemplate, updateTemplate, deleteTemplate, setDefault } = useApprovalLineStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formSteps, setFormSteps] = useState<ApprovalLineStep[]>([
    { userId: 'user1', role: '기안자' },
    { userId: users[1]?.id || 'user2', role: '팀장' },
  ])

  const openNew = () => {
    setEditingId(null)
    setFormName('')
    setFormSteps([
      { userId: users[0]?.id || 'user1', role: '기안자' },
      { userId: users[1]?.id || 'user2', role: '팀장' },
    ])
    setShowForm(true)
  }

  const openEdit = (id: string) => {
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return
    setEditingId(id)
    setFormName(tpl.name)
    setFormSteps(tpl.steps.map((s) => ({ ...s })))
    setShowForm(true)
  }

  const getUserRole = (userId: string) => {
    const u = users.find((u) => u.id === userId)
    return u?.position || u?.department || '검토자'
  }
  const addStep = () => {
    const uid = users[0]?.id || 'user1'
    setFormSteps((prev) => [...prev, { userId: uid, role: getUserRole(uid) }])
  }
  const removeStep = (i: number) => setFormSteps((prev) => prev.filter((_, idx) => idx !== i))
  const updateStepUser = (i: number, userId: string) => {
    setFormSteps((prev) => prev.map((s, idx) =>
      idx === i ? { ...s, userId, role: getUserRole(userId) } : s
    ))
  }

  const saveForm = () => {
    if (!formName.trim()) { alert('결재선 이름을 입력해주세요'); return }
    if (formSteps.length < 1) { alert('결재 단계를 1개 이상 추가해주세요'); return }
    if (editingId) updateTemplate(editingId, formName.trim(), formSteps)
    else addTemplate(formName.trim(), formSteps)
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">결재선 관리</h3>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700">
          <Plus size={14} /> 결재선 추가
        </button>
      </div>

      <div className="space-y-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 text-sm">{tpl.name}</span>
                {tpl.isDefault && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-medium">
                    <Star size={10} className="fill-yellow-500 text-yellow-500" /> 기본
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!tpl.isDefault && (
                  <button onClick={() => setDefault(tpl.id)}
                    className="px-2 py-1 text-xs text-yellow-600 border border-yellow-200 rounded-lg hover:bg-yellow-50">
                    기본으로 설정
                  </button>
                )}
                <button onClick={() => openEdit(tpl.id)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => { if (confirm('삭제하시겠습니까?')) deleteTemplate(tpl.id) }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {tpl.steps.map((step, i) => {
                const u = users.find((u) => u.id === step.userId)
                return (
                  <React.Fragment key={i}>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                      <span>{u?.avatar || '👤'}</span>
                      <div>
                        <div className="font-medium text-gray-700">{u?.name || step.userId}</div>
                        <div className="text-gray-400">{step.role}</div>
                      </div>
                    </div>
                    {i < tpl.steps.length - 1 && <span className="text-gray-300 text-xs">→</span>}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
            등록된 결재선이 없습니다
          </div>
        )}
      </div>

      {/* 결재선 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editingId ? '결재선 수정' : '결재선 추가'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">결재선 이름 *</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="예: 기본 결재선"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">결재 단계 ({formSteps.length}단계)</label>
                  <button onClick={addStep} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    <Plus size={12} /> 단계 추가
                  </button>
                </div>
                <div className="space-y-2">
                  {formSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-400 w-5 text-center font-medium">{i + 1}</span>
                      <span className="w-20 border border-gray-200 rounded px-2 py-1.5 text-xs bg-white text-gray-600 truncate select-none flex-shrink-0">
                        {step.role}
                      </span>
                      <select value={step.userId} onChange={(e) => updateStepUser(i, e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400 bg-white">
                        {users.map((u) => <option key={u.id} value={u.id}>{u.avatar} {u.name} ({u.department})</option>)}
                      </select>
                      {formSteps.length > 1 && (
                        <button onClick={() => removeStep(i)} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">취소</button>
              <button onClick={saveForm} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 font-medium">
                {editingId ? '수정 완료' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const Settings: React.FC = () => {
  const { tasks, projects } = useTaskStore()
  const [activeSection, setActiveSection] = useState('users')

  const sections = [
    { id: 'users', label: '사용자 관리', icon: <Users size={16} /> },
    { id: 'approval-lines', label: '결재선 관리', icon: <GitBranch size={16} /> },
    { id: 'codes', label: '코드 관리', icon: <ListTree size={16} /> },
    { id: 'profile', label: '내 프로필', icon: <User size={16} /> },
    { id: 'notifications', label: '알림', icon: <Bell size={16} /> },
    { id: 'appearance', label: '외관', icon: <Palette size={16} /> },
    { id: 'data', label: '데이터', icon: <Database size={16} /> },
    { id: 'privacy', label: '보안', icon: <Shield size={16} /> },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />
      case 'approval-lines':
        return <ApprovalLineManagement />
      case 'codes':
        return <CodeManagement />
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-4">내 프로필</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">나</div>
                <div>
                  <button className="text-sm text-blue-500 hover:underline">사진 변경</button>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG 파일 지원 (최대 2MB)</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: '이름', value: '내 계정', placeholder: '이름 입력' },
                  { label: '이메일', value: 'user@example.com', placeholder: '이메일 입력' },
                  { label: '직책', value: '', placeholder: '직책 입력' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">{field.label}</label>
                    <input type="text" defaultValue={field.value} placeholder={field.placeholder}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
                  </div>
                ))}
              </div>
              <button className="mt-6 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
                변경사항 저장
              </button>
            </div>
          </div>
        )
      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-4">데이터 관리</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">현재 데이터 현황</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: '전체 할 일', value: tasks.length },
                      { label: '프로젝트', value: projects.length },
                      { label: '완료된 할 일', value: tasks.filter((t) => t.status === 'done').length },
                      { label: '진행 중', value: tasks.filter((t) => t.status === 'in_progress').length },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-lg px-3 py-2.5 border border-gray-100">
                        <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">데이터 내보내기</h4>
                  <p className="text-xs text-gray-400 mb-3">모든 할 일과 프로젝트 데이터를 JSON 형식으로 내보냅니다.</p>
                  <button onClick={() => {
                    const data = { tasks, projects }
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url; a.download = 'schedule-data.json'; a.click()
                  }} className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
                    JSON으로 내보내기
                  </button>
                </div>
                <div className="border border-red-100 rounded-xl p-4 bg-red-50/30">
                  <h4 className="text-sm font-medium text-red-700 mb-1">위험 구역</h4>
                  <p className="text-xs text-red-400 mb-3">이 작업은 되돌릴 수 없습니다.</p>
                  <button onClick={() => {
                    if (confirm('로컬 스토리지의 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) {
                      localStorage.clear(); window.location.reload()
                    }
                  }} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors">
                    모든 데이터 초기화
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🚧</div>
            <div className="text-base font-medium text-gray-600">준비 중입니다</div>
            <div className="text-sm text-gray-400 mt-1">이 설정은 곧 제공될 예정입니다</div>
          </div>
        )
    }
  }

  return (
    <>
      <Header title="설정" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6">
            <div className="w-48 flex-shrink-0">
              <nav className="space-y-0.5">
                {sections.map((section) => (
                  <button key={section.id} onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}>
                    <div className="flex items-center gap-2.5">{section.icon}{section.label}</div>
                    {activeSection === section.id && <ChevronRight size={14} className="text-gray-400" />}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
