import React, { useState } from 'react';
import { Settings, Search, Bell, HelpCircle, User, LogOut, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Tenant, User as UserType } from '@inno-spec/shared';

export type AppType = 'DESIGNER' | 'MODELER' | 'VIEWER' | 'DATABASE';

export interface HeaderProps {
  currentView: 'projects' | 'evaluation' | 'tables' | 'databases' | 'sync' | 'functions' | 'screens' | 'settings' | 'dashboard' | 'project-settings' | 'user-screen' | 'illustration' | 'no-screen';
  onNavigate: (view: 'projects' | 'evaluation' | 'tables' | 'databases' | 'sync' | 'functions' | 'screens' | 'settings' | 'dashboard' | 'project-settings' | 'user-screen' | 'illustration' | 'no-screen') => void;
  currentTenant: Tenant;
  currentUser: UserType;
  onLogout: () => void;
  selectedApp: AppType;
  onAppChange: (app: AppType) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, currentTenant, currentUser, onLogout, selectedApp, onAppChange }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppMenu, setShowAppMenu] = useState(false);

  const apps: { value: AppType; label: string }[] = [
    { value: 'DESIGNER', label: 'DESIGNER' },
    { value: 'MODELER', label: 'MODELER' },
    { value: 'VIEWER', label: 'VIEWER' },
    { value: 'DATABASE', label: 'DATABASE' }
  ];

  const getNavigationMenus = (app: AppType) => {
    switch (app) {
      case 'DESIGNER':
        return ['projects', 'tables', 'functions', 'screens', 'sync'];
      case 'MODELER':
        return [];
      case 'VIEWER':
        return [];
      case 'DATABASE':
        return ['databases'];
      default:
        return [];
    }
  };

  const navigationMenus = getNavigationMenus(selectedApp);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            {/* 프로그램 명칭 영역 */}
            <div className="flex items-center space-x-4 w-64 px-2">
              <div 
                className="w-6 h-6 rounded-sm flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)'
                }}
              >
                <Zap className="w-4 h-4 text-white stroke-2" />
              </div>
              <span className="text-2xl font-bold text-gray-800">inno-DEX</span>
            </div>

            {/* 앱 선택 콤보박스 - LNB 오른쪽 구분선 위치에 배치 */}
            <div className="relative" style={{ marginLeft: '0px' }}>
              <button
                onClick={() => setShowAppMenu(!showAppMenu)}
                className="flex items-center justify-between space-x-2 px-3 py-1.5 text-sm font-semibold text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 w-32"
                style={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }}
              >
                <span>{selectedApp}</span>
                {showAppMenu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showAppMenu && (
                <div className="absolute top-full left-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="py-1">
                    {apps.map((app) => (
                      <button
                        key={app.value}
                        onClick={() => {
                          onAppChange(app.value);
                          setShowAppMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                          selectedApp === app.value 
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-4 border-blue-500' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {app.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-0 ml-6">
              {navigationMenus.map((menu) => {
                const menuLabels: { [key: string]: string } = {
                  'projects': '프로젝트',
                  'tables': '테이블',
                  'functions': '함수',
                  'screens': '화면',
                  'databases': 'DB',
                  'sync': '동기화'
                };
                
                return (
                  <button
                    key={menu}
                    onClick={() => onNavigate(menu as any)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                      currentView === menu 
                        ? 'text-blue-600 border-blue-600 font-semibold' 
                        : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300 font-semibold'
                    }`}
                  >
                    {menuLabels[menu] || menu}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 테넌트 정보 */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-md">
              <div 
                className="w-4 h-4 rounded-sm flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)'
                }}
              >
                <Zap className="w-3 h-3 text-white stroke-2" />
              </div>
              <span className="text-sm font-medium text-blue-700">{currentTenant.name}</span>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="검색"
                className="pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
            
            {/* Action buttons */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <HelpCircle className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Settings className="h-4 w-4" />
            </button>
            
            {/* 사용자 메뉴 */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">{currentUser.firstName} {currentUser.lastName}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium">{currentUser.firstName} {currentUser.lastName}</div>
                      <div className="text-gray-500">{currentUser.email}</div>
                      <div className="text-xs text-gray-400 mt-1">{currentUser.role}</div>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
