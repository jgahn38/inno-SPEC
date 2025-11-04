import React, { ReactNode } from 'react';

export interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * 모든 앱에서 사용할 수 있는 공통 페이지 레이아웃 컴포넌트
 * 
 * 일관된 스타일 적용:
 * - 배경: bg-gray-50
 * - 최대 너비: max-w-7xl
 * - 패딩: px-4 sm:px-6 lg:px-8 py-8
 * - 제목: text-3xl font-bold
 * - 설명: text-gray-600
 * 
 * @example
 * ```tsx
 * <PageLayout
 *   title="페이지 제목"
 *   description="페이지 설명"
 *   actions={<button>추가</button>}
 * >
 *   <div>콘텐츠</div>
 * </PageLayout>
 * ```
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  actions,
  children
}) => {
  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        {(title || description || actions) && (
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                {title && (
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                )}
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
        )}
        
        {/* 콘텐츠 */}
        {children}
      </div>
    </div>
  );
};

export default PageLayout;

