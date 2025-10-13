# 레이아웃 컴포넌트 사용 가이드

## 개요

**모든 앱에서 일관된 스타일을 유지하기 위한 공통 레이아웃 컴포넌트**입니다.

- **위치**: `@inno-spec/ui-lib`
- **적용 범위**: ADMIN, PROJECT, DESIGNER, MODELER, VIEWER 등 모든 앱

### 두 가지 레이아웃 컴포넌트

1. **PageLayout**: 독립적인 전체 페이지용 (배경, 최대 너비 포함)
2. **ContentLayout**: Sidebar와 함께 사용하는 콘텐츠 영역용

## 스타일 표준

### PageLayout

- **배경**: `bg-gray-50` (연한 회색)
- **최대 너비**: `max-w-7xl` (화면 중앙 정렬)
- **패딩**: `px-4 sm:px-6 lg:px-8 py-8` (반응형)
- **제목**: `text-3xl font-bold text-gray-900`
- **설명**: `text-gray-600`
- **간격**: 헤더와 콘텐츠 사이 `mb-8`

### ContentLayout

- **배경**: 없음 (상위에서 제공)
- **최대 너비**: 없음 (전체 너비 사용)
- **패딩**: `px-4 sm:px-6 lg:px-8 py-8` (PageLayout과 동일)
- **제목**: `text-3xl font-bold text-gray-900` (PageLayout과 동일)
- **설명**: `text-gray-600` (PageLayout과 동일)
- **간격**: 헤더와 콘텐츠 사이 `mb-8` (PageLayout과 동일)

## PageLayout 사용 방법

### 언제 PageLayout을 사용하나요?

- ✅ 독립적인 전체 페이지
- ✅ Sidebar가 없는 화면
- ✅ 예: ADMIN 앱의 모든 관리 화면, PROJECT의 프로젝트 목록

### 기본 사용

```tsx
import { PageLayout } from "@inno-spec/ui-lib";

const MyPage = () => {
  return (
    <PageLayout title="페이지 제목" description="페이지 설명">
      {/* 여기에 콘텐츠 작성 */}
      <div>페이지 콘텐츠</div>
    </PageLayout>
  );
};
```

### 액션 버튼 추가

```tsx
import { PageLayout } from "@inno-spec/ui-lib";
import { Plus } from "lucide-react";

const MyPage = () => {
  return (
    <PageLayout
      title="페이지 제목"
      description="페이지 설명"
      actions={
        <button onClick={handleAdd} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          항목 추가
        </button>
      }
    >
      {/* 콘텐츠 */}
    </PageLayout>
  );
};
```

### 검색 영역 포함

```tsx
import { PageLayout } from "@inno-spec/ui-lib";
import { Search } from "lucide-react";

const MyPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <PageLayout title="페이지 제목" description="페이지 설명" actions={/* 액션 버튼 */}>
      {/* 검색 */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">{/* 테이블 또는 카드 등 */}</div>
    </PageLayout>
  );
};
```

### 여러 액션 버튼

```tsx
<PageLayout
  title="페이지 제목"
  description="페이지 설명"
  actions={
    <div className="flex space-x-2">
      <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        엑셀 가져오기
      </button>
      <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        <Plus className="w-4 h-4 mr-2" />
        추가
      </button>
    </div>
  }
>
  {/* 콘텐츠 */}
</PageLayout>
```

## Props

| Prop          | Type        | Required | Description                    |
| ------------- | ----------- | -------- | ------------------------------ |
| `title`       | `string`    | ✅       | 페이지 제목                    |
| `description` | `string`    | ❌       | 페이지 설명 (선택사항)         |
| `actions`     | `ReactNode` | ❌       | 헤더 우측에 표시될 액션 버튼들 |
| `children`    | `ReactNode` | ✅       | 페이지 콘텐츠                  |

## ContentLayout 사용 방법

### 언제 ContentLayout을 사용하나요?

- ✅ Sidebar와 함께 렌더링되는 콘텐츠
- ✅ 이미 외부에서 배경색이 제공되는 경우
- ✅ 예: PROJECT 대시보드의 각 메뉴, DESIGNER의 화면

### 기본 사용

```tsx
import { ContentLayout, Sidebar } from "@inno-spec/ui-lib";

const MyDashboard = () => {
  return (
    <div className="flex h-full">
      <Sidebar ... />
      <div className="flex-1 bg-gray-50 overflow-auto">
        <ContentLayout
          title="대시보드"
          description="프로젝트 현황을 확인하세요."
          actions={<button>추가</button>}
        >
          {/* 콘텐츠 */}
        </ContentLayout>
      </div>
    </div>
  );
};
```

### 여러 화면을 switch로 처리

```tsx
const renderContent = () => {
  switch (activeMenu) {
    case 'dashboard':
      return (
        <ContentLayout
          title="대시보드"
          description="현황을 한눈에 확인하세요."
        >
          <div>대시보드 콘텐츠</div>
        </ContentLayout>
      );

    case 'settings':
      return (
        <ContentLayout
          title="설정"
          description="설정을 관리하세요."
          actions={<button>저장</button>}
        >
          <div>설정 콘텐츠</div>
        </ContentLayout>
      );
  }
};

return (
  <div className="flex h-full">
    <Sidebar ... />
    <div className="flex-1 bg-gray-50 overflow-auto">
      {renderContent()}
    </div>
  </div>
);
```

## 앱별 사용 예시

### ADMIN 앱 (독립 페이지)

```tsx
import { PageLayout } from "@inno-spec/ui-lib";
// 또는 하위 호환성을 위해
// import { AdminPageLayout } from '@inno-spec/admin-app';

const CategoryManager = () => {
  return (
    <PageLayout title="카테고리 관리" description="프로젝트 카테고리를 관리합니다." actions={<button>추가</button>}>
      {/* 콘텐츠 */}
    </PageLayout>
  );
};
```

### PROJECT 앱 (목록 - PageLayout / 대시보드 - ContentLayout)

```tsx
import { PageLayout, ContentLayout, Sidebar } from "@inno-spec/ui-lib";

// 프로젝트 목록 (독립 페이지)
const ProjectList = () => {
  return (
    <PageLayout title="프로젝트 목록" actions={<button>생성</button>}>
      {/* 콘텐츠 */}
    </PageLayout>
  );
};

// 프로젝트 대시보드 (Sidebar 포함)
const ProjectDashboard = () => {
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <ContentLayout title="대시보드" description="현황을 확인하세요.">
            {/* 콘텐츠 */}
          </ContentLayout>
        );
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar ... />
      <div className="flex-1 bg-gray-50 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};
```

### DESIGNER 앱 (Sidebar 포함 - ContentLayout)

```tsx
import { ContentLayout, Sidebar } from "@inno-spec/ui-lib";

const DesignerApp = () => {
  return (
    <div className="flex h-full">
      <Sidebar ... />
      <div className="flex-1 bg-gray-50 overflow-auto">
        <ContentLayout
          title="화면 디자이너"
          description="화면 레이아웃을 디자인합니다."
          actions={
            <div className="flex space-x-2">
              <button>미리보기</button>
              <button>저장</button>
            </div>
          }
        >
          {/* 콘텐츠 */}
        </ContentLayout>
      </div>
    </div>
  );
};
```

## 기존 페이지 마이그레이션

### Before (기존 코드)

```tsx
const MyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">제목</h1>
          <p className="text-gray-600">설명</p>
        </div>
        {/* 콘텐츠 */}
      </div>
    </div>
  );
};
```

### After (PageLayout 사용)

```tsx
import { PageLayout } from "@inno-spec/ui-lib";

const MyPage = () => {
  return (
    <PageLayout title="제목" description="설명">
      {/* 콘텐츠 */}
    </PageLayout>
  );
};
```

## 이점

1. ✅ **일관된 스타일**: 모든 앱에서 동일한 스타일 적용
2. ✅ **반복 작업 감소**: 헤더와 레이아웃 코드를 매번 작성할 필요 없음
3. ✅ **유지보수 용이**: 공통 스타일 변경 시 한 곳만 수정
4. ✅ **반응형**: 모바일, 태블릿, 데스크톱 모두 지원
5. ✅ **타입 안전성**: TypeScript로 작성되어 타입 체크 가능
6. ✅ **크로스 앱 일관성**: ADMIN, PROJECT, DESIGNER 등 모든 앱에서 동일한 UX

## 아키텍처

```
packages/
├── ui-lib/                        # 공통 UI 라이브러리
│   └── src/layouts/
│       ├── PageLayout.tsx         # 🎯 독립 페이지용
│       └── ContentLayout.tsx      # 🎯 Sidebar 콘텐츠용
│
├── admin-app/                     # PageLayout (모든 화면)
├── project-app/
│   ├── ProjectList                # PageLayout (독립 페이지)
│   └── ProjectDashboard           # ContentLayout (Sidebar 포함)
├── designer-app/                  # ContentLayout (Sidebar 포함)
├── modeler-app/                   # 필요시 PageLayout 또는 ContentLayout
└── viewer-app/                    # 필요시 PageLayout 또는 ContentLayout
```

## 모든 앱에서 동일한 방식으로 사용

```tsx
import { PageLayout } from "@inno-spec/ui-lib";

const MyPage = () => (
  <PageLayout title="제목" description="설명">
    {/* 콘텐츠 */}
  </PageLayout>
);
```

## 참고

기존 페이지들도 점진적으로 이 레이아웃을 사용하도록 리팩토링할 수 있습니다.
