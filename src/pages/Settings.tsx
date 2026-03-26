import React, { useState, useRef, useCallback } from 'react'
import { Header } from '../components/layout/Header'
import { useTaskStore } from '../store/taskStore'
import {
  User, Bell, Palette, Database, Shield, ChevronRight,
  Users, Plus, Edit2, Trash2, X, Check, Eye, EyeOff, Search
} from 'lucide-react'
import {
  UserStatus, USER_STATUS_LABELS, USER_STATUS_CODES, USER_STATUS_COLORS
} from '../types'

const AVATAR_OPTIONS = ['👨‍💻', '👩‍💼', '👨‍🎨', '👩‍🔬', '👨‍💼', '👩‍💻', '👨‍🔬', '👩‍🎨', '🧑‍💼', '👤']
const COLOR_OPTIONS = ['#2383e2', '#0f7b6c', '#cb912f', '#eb5757', '#9065b0', '#d9730d', '#448361', '#337ea9']
const DEPARTMENTS = ['개발팀', '디자인팀', '마케팅팀', '영업팀', '인사팀', '재무팀', '기획팀', '운영팀']
const POSITIONS = ['대표이사', '부서장', '팀장', '선임', '주임', '사원', '인턴']
const ALL_STATUSES: UserStatus[] = ['active', 'inactive', 'password_assigned']

interface UserFormData {
  userId: string
  name: string
  department: string
  position: string
  email: string
  userStatus: UserStatus
  password: string
  avatar: string
  color: string
}

const emptyForm = (): UserFormData => ({
  userId: '', name: '', department: '개발팀', position: '사원',
  email: '', userStatus: 'password_assigned', password: '', avatar: '👤', color: '#2383e2',
})

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
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserFormData>(emptyForm())
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<UserFormData>>({})
  const drag = useDraggable()

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
      userStatus: user.userStatus,
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

  const validate = (): boolean => {
    const e: Partial<UserFormData> = {}
    if (!form.userId.trim()) e.userId = '아이디를 입력하세요'
    else if (!/^[a-zA-Z0-9_]+$/.test(form.userId)) e.userId = '영문, 숫자, _만 사용 가능합니다'
    else if (!editingId && users.some((u) => u.userId === form.userId)) e.userId = '이미 사용 중인 아이디입니다'
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
        position: form.position, email: form.email, userStatus: form.userStatus,
        password: form.password, avatar: form.avatar, color: form.color,
      })
    } else {
      addUser({
        userId: form.userId, name: form.name, department: form.department,
        position: form.position, email: form.email, userStatus: form.userStatus,
        password: form.password, avatar: form.avatar, color: form.color,
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
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">아이디</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">성명</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">부서</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">직위</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">상태</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">등록일</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-sm text-gray-400">검색 결과가 없습니다</td></tr>
            ) : filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{user.avatar}</span>
                    <span className="text-sm font-mono text-gray-700">{user.userId}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.department}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.position || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${USER_STATUS_COLORS[user.userStatus]}`}>
                    [{USER_STATUS_CODES[user.userStatus]}] {USER_STATUS_LABELS[user.userStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(user.id)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(user.id, user.name)}
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">아이디 *</label>
                  <input value={form.userId} onChange={(e) => set('userId', e.target.value)}
                    placeholder="영문/숫자" disabled={!!editingId}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 ${errors.userId ? 'border-red-400' : 'border-gray-300'}`} />
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
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                    <option value="기타">기타</option>
                  </select>
                </div>
                {/* 직위 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">직위</label>
                  <select value={form.position} onChange={(e) => set('position', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
                    {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">이메일</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="user@company.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
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

export const Settings: React.FC = () => {
  const { tasks, projects } = useTaskStore()
  const [activeSection, setActiveSection] = useState('users')

  const sections = [
    { id: 'users', label: '사용자 관리', icon: <Users size={16} /> },
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
        <div className="max-w-4xl mx-auto">
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
