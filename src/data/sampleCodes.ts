import { CodeGroup } from '../types/code'

const now = '2026-01-01T00:00:00.000Z'

export const sampleCodeGroups: CodeGroup[] = [
  {
    id: 'cg-dept',
    groupCode: 'DEPT',
    groupName: '부서',
    description: '조직 부서 코드',
    isSystem: true,
    createdAt: now,
    items: [
      { id: 'dept-01', code: '01', label: '개발팀',    order: 1, isActive: true, createdAt: now },
      { id: 'dept-02', code: '02', label: '디자인팀',  order: 2, isActive: true, createdAt: now },
      { id: 'dept-03', code: '03', label: '마케팅팀',  order: 3, isActive: true, createdAt: now },
      { id: 'dept-04', code: '04', label: '영업팀',    order: 4, isActive: true, createdAt: now },
      { id: 'dept-05', code: '05', label: '인사팀',    order: 5, isActive: true, createdAt: now },
      { id: 'dept-06', code: '06', label: '재무팀',    order: 6, isActive: true, createdAt: now },
      { id: 'dept-07', code: '07', label: '기획팀',    order: 7, isActive: true, createdAt: now },
      { id: 'dept-08', code: '08', label: '운영팀',    order: 8, isActive: true, createdAt: now },
    ],
  },
  {
    id: 'cg-position',
    groupCode: 'POSITION',
    groupName: '직위',
    description: '직원 직위 코드',
    isSystem: true,
    createdAt: now,
    items: [
      { id: 'pos-01', code: '01', label: '대표이사', order: 1, isActive: true, createdAt: now },
      { id: 'pos-02', code: '02', label: '부서장',   order: 2, isActive: true, createdAt: now },
      { id: 'pos-03', code: '03', label: '팀장',     order: 3, isActive: true, createdAt: now },
      { id: 'pos-04', code: '04', label: '선임',     order: 4, isActive: true, createdAt: now },
      { id: 'pos-05', code: '05', label: '주임',     order: 5, isActive: true, createdAt: now },
      { id: 'pos-06', code: '06', label: '사원',     order: 6, isActive: true, createdAt: now },
      { id: 'pos-07', code: '07', label: '인턴',     order: 7, isActive: true, createdAt: now },
    ],
  },
  {
    id: 'cg-project-type',
    groupCode: 'PROJECT_TYPE',
    groupName: '프로젝트 유형',
    description: '프로젝트 분류 코드',
    isSystem: false,
    createdAt: now,
    items: [
      { id: 'pt-01', code: '01', label: '신규개발',  order: 1, isActive: true, createdAt: now },
      { id: 'pt-02', code: '02', label: '유지보수',  order: 2, isActive: true, createdAt: now },
      { id: 'pt-03', code: '03', label: '운영',      order: 3, isActive: true, createdAt: now },
      { id: 'pt-04', code: '04', label: '연구개발',  order: 4, isActive: true, createdAt: now },
    ],
  },
  {
    id: 'cg-expense-category',
    groupCode: 'EXPENSE_CAT',
    groupName: '지출 항목',
    description: '지출결의서 비용 항목 코드',
    isSystem: false,
    createdAt: now,
    items: [
      { id: 'ec-01', code: '01', label: '교통비',   order: 1, isActive: true, createdAt: now },
      { id: 'ec-02', code: '02', label: '숙박비',   order: 2, isActive: true, createdAt: now },
      { id: 'ec-03', code: '03', label: '식비',     order: 3, isActive: true, createdAt: now },
      { id: 'ec-04', code: '04', label: '도서비',   order: 4, isActive: true, createdAt: now },
      { id: 'ec-05', code: '05', label: '소모품비', order: 5, isActive: true, createdAt: now },
      { id: 'ec-06', code: '06', label: '기타',     order: 6, isActive: true, createdAt: now },
    ],
  },
]
