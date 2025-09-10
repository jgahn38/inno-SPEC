import { IProjectDataProvider } from '../types';
import { LocalStorageProjectProvider } from '../services/dataProviders/LocalStorageProjectProvider';

/**
 * 환경에 따라 적절한 데이터 제공자를 반환합니다.
 * 
 * 개발 환경: LocalStorage 사용
 * 프로덕션 환경: Database 사용 (향후 구현 예정)
 */
export function getProjectDataProvider(): IProjectDataProvider {
  // 현재는 개발 환경이므로 LocalStorage 사용
  // 향후 프로덕션 환경에서는 DatabaseProvider 반환
  return new LocalStorageProjectProvider();
}

/**
 * 데이터 제공자 설정 정보
 */
export const dataProviderConfig = {
  // 현재 사용 중인 데이터 제공자 타입
  current: 'localStorage' as const,
  
  // 지원하는 데이터 제공자 목록
  supported: ['localStorage', 'database'] as const,
  
  // 환경별 설정
  environments: {
    development: 'localStorage',
    production: 'database'
  } as const
};
