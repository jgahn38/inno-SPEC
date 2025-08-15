import React from 'react';
import { Building2, FolderOpen, Settings, Search, Bell, HelpCircle, User } from 'lucide-react';

interface HeaderProps {
  currentView: 'projects' | 'evaluation';
  onNavigate: (view: 'projects' | 'evaluation') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
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
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
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
            <div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;