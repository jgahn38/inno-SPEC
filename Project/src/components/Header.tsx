import React, { useState } from 'react';
import { Building2, FolderOpen, Settings, Search, Bell, HelpCircle, User, LogOut, ChevronDown } from 'lucide-react';
import { Tenant, User as UserType } from '../types';

interface HeaderProps {
  currentView: 'projects' | 'evaluation' | 'tables' | 'databases' | 'sync' | 'functions' | 'settings';
  onNavigate: (view: 'projects' | 'evaluation' | 'tables' | 'databases' | 'sync' | 'functions' | 'settings') => void;
  currentTenant: Tenant;
  currentUser: UserType;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, currentTenant, currentUser, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <div className="flex items-center space-x-2 w-64 px-2">
              <img src="/src/assets/image.png" alt="inno-SPEC" className="w-6 h-6" />
              <span className="text-lg font-bold text-gray-800">inno-SPEC</span>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-0 ml-6">
              <button
                onClick={() => onNavigate('projects')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  currentView === 'projects' 
                    ? 'text-blue-600 border-blue-600 font-semibold' 
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300 font-semibold'
                }`}
              >
                프로젝트
              </button>
              <button
                onClick={() => onNavigate('tables')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  currentView === 'tables' 
                    ? 'text-blue-600 border-blue-600 font-semibold' 
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300 font-semibold'
                }`}
              >
                테이블
              </button>
              <button
                onClick={() => onNavigate('functions')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  currentView === 'functions' 
                    ? 'text-blue-600 border-blue-600 font-semibold' 
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300 font-semibold'
                }`}
              >
                함수
              </button>
              <button
                onClick={() => onNavigate('databases')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  currentView === 'databases' 
                    ? 'text-blue-600 border-blue-600 font-semibold' 
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300 font-semibold'
                }`}
              >
                DB
              </button>
              <button
                onClick={() => onNavigate('sync')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  currentView === 'sync' 
                    ? 'text-blue-600 border-blue-600 font-semibold' 
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300 font-semibold'
                }`}
              >
                동기화
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 테넌트 정보 */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-md">
              <Building2 className="h-4 w-4 text-blue-600" />
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