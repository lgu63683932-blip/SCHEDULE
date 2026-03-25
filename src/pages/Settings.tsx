import React, { useState } from 'react'
import { Header } from '../components/layout/Header'
import { useTaskStore } from '../store/taskStore'
import { User, Bell, Palette, Database, Shield, ChevronRight } from 'lucide-react'

export const Settings: React.FC = () => {
  const { tasks, projects } = useTaskStore()
  const [activeSection, setActiveSection] = useState('profile')

  const sections = [
    { id: 'profile', label: '프로필', icon: <User size={16} /> },
    { id: 'notifications', label: '알림', icon: <Bell size={16} /> },
    { id: 'appearance', label: '외관', icon: <Palette size={16} /> },
    { id: 'data', label: '데이터', icon: <Database size={16} /> },
    { id: 'privacy', label: '보안 및 개인정보', icon: <Shield size={16} /> },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-4">프로필 설정</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  나
                </div>
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
                    <input
                      type="text"
                      defaultValue={field.value}
                      placeholder={field.placeholder}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
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
                  <button
                    onClick={() => {
                      const data = { tasks, projects }
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'schedule-data.json'
                      a.click()
                    }}
                    className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    JSON으로 내보내기
                  </button>
                </div>
                <div className="border border-red-100 rounded-xl p-4 bg-red-50/30">
                  <h4 className="text-sm font-medium text-red-700 mb-1">위험 구역</h4>
                  <p className="text-xs text-red-400 mb-3">이 작업은 되돌릴 수 없습니다. 신중하게 진행하세요.</p>
                  <button
                    onClick={() => {
                      if (confirm('로컬 스토리지의 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) {
                        localStorage.clear()
                        window.location.reload()
                      }
                    }}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                  >
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
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-6">
            {/* Settings nav */}
            <div className="w-48 flex-shrink-0">
              <nav className="space-y-0.5">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {section.icon}
                      {section.label}
                    </div>
                    {activeSection === section.id && <ChevronRight size={14} className="text-gray-400" />}
                  </button>
                ))}
              </nav>
            </div>

            {/* Settings content */}
            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
