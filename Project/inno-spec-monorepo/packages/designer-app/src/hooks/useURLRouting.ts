import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';

export interface ScreenRoute {
  type: 'projects' | 'dashboard' | 'screens' | 'user-screen' | 'lnb-menu' | 'settings' | 'illustration' | 'project-settings' | 'no-screen' | 'tables' | 'sync' | 'functions' | 'modeler' | 'viewer' | 'admin-db' | 'admin-fields' | 'admin-tables' | 'admin-variables' | 'admin-functions' | 'admin-lnbconfig' | 'admin-screenconfig';
  module?: 'designer' | 'modeler' | 'viewer' | 'admin';
  tenantId?: string;
  screenId?: string;
  menuId?: string;
  projectId?: string;
}

export const useURLRouting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  // URL에서 화면 정보 추출
  const getScreenFromPath = useCallback((pathname: string): ScreenRoute => {
    const segments = pathname.split('/').filter(Boolean);
    console.log('getScreenFromPath - pathname:', pathname, 'segments:', segments);
    
    if (segments.length === 0) {
      return { type: 'projects', module: 'designer' };
    }
    
    // ADMIN 라우팅: /admin/화면 (테넌트 독립)
    if (segments.length >= 1 && segments[0] === 'admin') {
      const page = segments[1];
      console.log('ADMIN routing - page:', page);
      
      switch (page) {
        case 'db':
          return { type: 'admin-db', module: 'admin' };
        case 'fields':
          return { type: 'admin-fields', module: 'admin' };
        case 'tables':
          return { type: 'admin-tables', module: 'admin' };
        case 'variables':
          return { type: 'admin-variables', module: 'admin' };
        case 'functions':
          return { type: 'admin-functions', module: 'admin' };
        case 'lnbconfig':
          return { type: 'admin-lnbconfig', module: 'admin' };
        case 'screenconfig':
          return { type: 'admin-screenconfig', module: 'admin' };
        case 'fields':
          return { type: 'admin-fields', module: 'admin' };
        case 'tables':
          return { type: 'admin-tables', module: 'admin' };
        case 'variables':
          return { type: 'admin-variables', module: 'admin' };
        case 'functions':
          return { type: 'admin-functions', module: 'admin' };
        default:
          return { type: 'admin-db', module: 'admin' };
      }
    }
    
    // GNB 라우팅: /{tenantId}/module/GNB화면
    if (segments.length >= 2 && segments[0] !== 'designer' && segments[0] !== 'modeler' && segments[0] !== 'viewer' && segments[0] !== 'admin') {
      const tenantId = segments[0];
      const module = segments[1];
      const page = segments[2];
      console.log('GNB routing - tenantId:', tenantId, 'module:', module, 'page:', page);
      
      // GNB 화면들 (프로젝트 공통)
      if (module === 'designer' || module === 'modeler' || module === 'viewer') {
        switch (module) {
          case 'designer':
            switch (page) {
              case 'projects':
                return { type: 'projects', module: 'designer', tenantId };
              case 'screens':
                console.log('Returning screens type for GNB routing');
                return { type: 'screens', module: 'designer', tenantId };
              case 'tables':
                return { type: 'tables', module: 'designer', tenantId };
              case 'functions':
                return { type: 'functions', module: 'designer', tenantId };
              case 'sync':
                return { type: 'sync', module: 'designer', tenantId };
              case 'settings':
                return { type: 'settings', module: 'designer', tenantId };
              default:
                return { type: 'projects', module: 'designer', tenantId };
            }
          case 'modeler':
            return { type: 'modeler', module: 'modeler', tenantId };
          case 'viewer':
            return { type: 'viewer', module: 'viewer', tenantId };
          default:
            return { type: 'projects', module: 'designer', tenantId };
        }
      }
    }
    
    // LNB 라우팅: /{tenantId}/module/{projectId}/LNB화면
    if (segments.length >= 4 && segments[0] !== 'designer' && segments[0] !== 'modeler' && segments[0] !== 'viewer' && segments[2] !== 'project') {
      const tenantId = segments[0];
      const module = segments[1];
      const projectId = segments[2];
      const page = segments[3];
      
      switch (module) {
        case 'designer':
          switch (page) {
            case 'dashboard':
              return { type: 'dashboard', module: 'designer', tenantId, projectId };
            case 'screens':
              return { type: 'screens', module: 'designer', tenantId, projectId };
            case 'illustration':
              return { type: 'illustration', module: 'designer', tenantId, projectId };
            case 'project-settings':
              return { type: 'project-settings', module: 'designer', tenantId, projectId };
            case 'lnb':
              if (segments[4]) {
                return { type: 'lnb-menu', module: 'designer', tenantId, projectId, menuId: segments[4] };
              }
              return { type: 'screens', module: 'designer', tenantId, projectId };
            case 'screen':
              if (segments[4]) {
                return { type: 'user-screen', module: 'designer', tenantId, projectId, screenId: segments[4] };
              }
              return { type: 'screens', module: 'designer', tenantId, projectId };
            default:
              return { type: 'dashboard', module: 'designer', tenantId, projectId };
          }
        default:
          return { type: 'dashboard', module: 'designer', tenantId, projectId };
      }
    }
    
    // 모듈 기반 라우팅 (하위 호환성)
    if (segments.length >= 2) {
      const module = segments[0];
      const page = segments[1];
      
      switch (module) {
        case 'designer':
          switch (page) {
            case 'projects':
              return { type: 'projects', module: 'designer' };
            case 'dashboard':
              return { type: 'dashboard', module: 'designer' };
            case 'screens':
              return { type: 'screens', module: 'designer', tenantId };
            case 'tables':
              return { type: 'tables', module: 'designer', tenantId };
            case 'functions':
              return { type: 'functions', module: 'designer', tenantId };
            case 'sync':
              return { type: 'sync', module: 'designer', tenantId };
            case 'settings':
              return { type: 'settings', module: 'designer' };
            case 'illustration':
              return { type: 'illustration', module: 'designer' };
            case 'project-settings':
              return { type: 'project-settings', module: 'designer' };
            case 'lnb':
              if (segments[2]) {
                return { type: 'lnb-menu', module: 'designer', menuId: segments[2] };
              }
              return { type: 'screens', module: 'designer' };
            case 'screen':
              if (segments[2]) {
                return { type: 'user-screen', module: 'designer', screenId: segments[2] };
              }
              return { type: 'screens', module: 'designer' };
            case 'project':
              if (segments[2]) {
                return { type: 'dashboard', module: 'designer', projectId: segments[2] };
              }
              return { type: 'projects', module: 'designer' };
            default:
              return { type: 'projects', module: 'designer' };
          }
        case 'database':
          switch (page) {
            case 'db':
              return { type: 'admin-db', module: 'admin', tenantId };
            default:
              return { type: 'admin-db', module: 'admin', tenantId };
          }
        default:
          return { type: 'projects', module: 'designer' };
      }
    }
    
    // 기존 단일 세그먼트 라우팅 (하위 호환성)
    switch (segments[0]) {
      case 'projects':
        return { type: 'projects', module: 'designer' };
      case 'dashboard':
        return { type: 'dashboard', module: 'designer' };
      case 'screens':
        return { type: 'screens', module: 'designer' };
      case 'tables':
        return { type: 'tables', module: 'designer' };
      case 'databases':
        return { type: 'admin-db', module: 'admin' };
      case 'sync':
        return { type: 'sync', module: 'designer' };
      case 'functions':
        return { type: 'functions', module: 'designer' };
      case 'settings':
        return { type: 'settings', module: 'designer' };
      case 'illustration':
        return { type: 'illustration', module: 'designer' };
      case 'project-settings':
        return { type: 'project-settings', module: 'designer' };
      case 'modeler':
        return { type: 'modeler', module: 'modeler' };
      case 'viewer':
        return { type: 'viewer', module: 'viewer' };
      case 'screen':
        if (segments[1]) {
          return { type: 'user-screen', module: 'designer', screenId: segments[1] };
        }
        return { type: 'projects', module: 'designer' };
      case 'lnb':
        if (segments[1]) {
          return { type: 'lnb-menu', module: 'designer', menuId: segments[1] };
        }
        return { type: 'projects', module: 'designer' };
      case 'project':
        if (segments[1]) {
          return { type: 'dashboard', module: 'designer', projectId: segments[1] };
        }
        return { type: 'projects', module: 'designer' };
      default:
        return { type: 'projects', module: 'designer' };
    }
  }, []);

  // 화면 변경 시 URL 업데이트
  const navigateToScreen = useCallback((route: ScreenRoute) => {
    const module = route.module || 'designer';
    const tenantId = route.tenantId || currentTenant?.id || 'tenant-1'; // 실제 테넌트 ID 사용
    const projectId = route.projectId;
    
        // ADMIN URL 생성 (테넌트 독립)
        if (route.module === 'admin') {
          switch (route.type) {
            case 'admin-db':
              navigate('/admin/db');
              break;
            case 'admin-fields':
              navigate('/admin/fields');
              break;
            case 'admin-tables':
              navigate('/admin/tables');
              break;
            case 'admin-variables':
              navigate('/admin/variables');
              break;
            case 'admin-functions':
              navigate('/admin/functions');
              break;
            case 'admin-lnbconfig':
              navigate('/admin/lnbconfig');
              break;
            case 'admin-screenconfig':
              navigate('/admin/screenconfig');
              break;
            default:
              navigate('/admin/db');
          }
          return;
        }
        
        // GNB/LNB 구분 URL 생성
        const buildURL = (path: string, isLNB: boolean = false) => {
          if (isLNB && projectId) {
            return `/${tenantId}/${module}/${projectId}${path}`;
          } else {
            return `/${tenantId}/${module}${path}`;
          }
        };
        
        switch (route.type) {
          // GNB 화면들 (프로젝트 공통)
          case 'projects':
            navigate(buildURL('/projects'));
            break;
          case 'tables':
            navigate(buildURL('/tables'));
            break;
          case 'functions':
            navigate(buildURL('/functions'));
            break;
          case 'sync':
            navigate(buildURL('/sync'));
            break;
          case 'settings':
            navigate(buildURL('/settings'));
            break;
          case 'modeler':
            navigate(buildURL(''));
            break;
          case 'viewer':
            navigate(buildURL(''));
            break;
      
      // LNB 화면들 (프로젝트별 독립)
      case 'user-screen':
        if (route.screenId) {
          navigate(buildURL(`/screen/${route.screenId}`, true));
        }
        break;
      case 'lnb-menu':
        if (route.menuId) {
          navigate(buildURL(`/lnb/${route.menuId}`, true));
        }
        break;
      case 'dashboard':
        navigate(buildURL('/dashboard', true));
        break;
      case 'screens':
        if (route.module === 'designer') {
          navigate(buildURL('/screens', false));
        } else {
          navigate(buildURL('/screens', true));
        }
        break;
      case 'illustration':
        navigate(buildURL('/illustration', true));
        break;
      case 'project-settings':
        navigate(buildURL('/project-settings', true));
        break;
      case 'no-screen':
        navigate(buildURL('/no-screen', true));
        break;
      default:
        navigate(buildURL('/projects'));
    }
  }, [navigate, currentTenant]);

  // 현재 URL의 화면 정보
  const currentRoute = getScreenFromPath(location.pathname);

  return {
    currentRoute,
    navigateToScreen,
    getScreenFromPath,
  };
};
