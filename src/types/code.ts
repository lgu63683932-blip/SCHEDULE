export interface CodeItem {
  id: string
  code: string      // 코드값 (예: '01', 'DEV')
  label: string     // 표시명 (예: '개발팀')
  order: number     // 정렬순서
  isActive: boolean // 사용여부
  createdAt: string
}

export interface CodeGroup {
  id: string
  groupCode: string   // 그룹코드 (예: 'DEPT', 'POSITION')
  groupName: string   // 그룹명 (예: '부서', '직위')
  description?: string
  isSystem: boolean   // 시스템 기본 코드 여부 (삭제 불가)
  items: CodeItem[]
  createdAt: string
}
