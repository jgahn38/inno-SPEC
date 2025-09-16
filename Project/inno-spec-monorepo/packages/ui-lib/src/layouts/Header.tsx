import React, { useState } from 'react';
import { Settings, Search, Bell, HelpCircle, User, LogOut, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Tenant, User as UserType } from '@inno-spec/shared';

export type AppType = 'DESIGNER' | 'MODELER' | 'VIEWER' | 'ADMIN';

export interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentTenant: Tenant;
  currentUser: UserType;
  onLogout: () => void;
  selectedApp: AppType;
  onAppChange: (app: AppType) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, currentTenant, currentUser, onLogout, selectedApp, onAppChange }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const apps: { value: AppType; label: string }[] = [
    { value: 'DESIGNER', label: 'DESIGNER' },
    { value: 'MODELER', label: 'MODELER' },
    { value: 'VIEWER', label: 'VIEWER' },
    { value: 'ADMIN', label: 'ADMIN' }
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            {/* 프로그램 명칭 영역 */}
            <div className="flex items-center space-x-4 w-64 px-2">
              <div 
                className="w-6 h-6 rounded-lg flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 50%, #1a1a1a 100%)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-lg"></div>
                <img src="/logo.svg" alt="inno-DEX" className="w-6 h-6 relative z-10" />
              </div>
              <span 
                className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-black to-gray-900 bg-clip-text text-transparent"
                style={{
                  letterSpacing: '0.05em'
                }}
              >
                inno-DEX
              </span>
            </div>

            {/* 앱 선택 버튼들 */}
            <div className="flex items-center space-x-1">
              {apps.map((app) => (
                <button
                  key={app.value}
                  onClick={() => onAppChange(app.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedApp === app.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {app.label}
                </button>
              ))}
            </div>
            
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 테넌트 정보 */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-md border border-gray-200">
              <div 
                className="w-4 h-4 rounded-md flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 50%, #1a1a1a 100%)',
                  boxShadow: '0 0 10px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-md"></div>
                <Zap className="w-3 h-3 text-cyan-300 stroke-2 relative z-10" style={{ filter: 'drop-shadow(0 0 2px rgba(34, 211, 238, 0.5))' }} />
              </div>
              <span className="text-sm font-medium text-gray-800">{currentTenant.name}</span>
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
                      <div className="text-xs text-gray-400 mt-1">
                        {currentUser.role === 'tenant_admin' ? '테넌트 관리자' : 
                         currentUser.role === 'project_admin' ? '프로젝트 관리자' :
                         currentUser.role === 'user' ? '사용자' : currentUser.role}
                      </div>
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
