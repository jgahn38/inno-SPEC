import React, { ReactNode } from 'react';

export interface ContentLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Sidebar와 함께 사용하는 콘텐츠 영역용 레이아웃 컴포넌트
 * 
 * PageLayout과 동일한 스타일이지만:
 * - min-h-screen 없음 (상위에서 제공)
 * - max-w-7xl 없음 (Sidebar와 함께 사용되므로 전체 너비 사용)
 * - 배경색 없음 (상위에서 제공)
 * 
 * PageLayout과 동일한 스타일:
 * - 패딩: px-4 sm:px-6 lg:px-8 py-8
 * - 제목: text-3xl font-bold
 * - 설명: text-gray-600
 * 
 * @example
 * ```tsx
 * <div className="flex">
 *   <Sidebar ... />
 *   <div className="flex-1 bg-gray-50">
 *     <ContentLayout
 *       title="대시보드"
 *       description="프로젝트 현황을 확인하세요."
 *       actions={<button>추가</button>}
 *     >
 *       <div>콘텐츠</div>
 *     </ContentLayout>
 *   </div>
 * </div>
 * ```
 */
const ContentLayout: React.FC<ContentLayoutProps> = ({
  title,
  description,
  actions,
  children
}) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            {description && (
              <p className="text-gray-600">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      {/* 콘텐츠 */}
      {children}
    </div>
  );
};

export default ContentLayout;

