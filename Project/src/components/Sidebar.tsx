import React from 'react';
import { Calculator, FileBarChart, Settings, Database, Download, ChevronDown, BarChart3, Grid as Bridge, Image } from 'lucide-react';
import { Project, Bridge as BridgeType } from '../types';

interface SidebarProps {
  activeMenu: string;
  onMenuSelect: (menu: string) => void;
  selectedProject: Project;
  selectedBridge: BridgeType | null;
  projects: Project[];
  onProjectChange: (project: Project) => void;
  onBridgeChange: (bridge: BridgeType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeMenu, 
  onMenuSelect, 
  selectedProject, 
  selectedBridge,
  projects, 
  onProjectChange,
  onBridgeChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const menuItems = [
    { id: 'input', label: '설계 제원 입력', icon: Database, category: 'PLANNING' },
    { id: 'calculation', label: '내진성능 계산', icon: Calculator, category: 'DEVELOPMENT' },
    { id: 'results', label: '검토 결과', icon: BarChart3, category: 'DEVELOPMENT' },
    { id: 'illustration', label: '삽도', icon: Image, category: 'DEVELOPMENT' },
    { id: 'report', label: '보고서 생성', icon: Download, category: 'DEVELOPMENT' },
    { id: 'settings', label: '프로젝트 설정', icon: Settings, category: 'SETTINGS' },
  ];

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'PLANNING': return 'PLANNING';
      case 'DEVELOPMENT': return 'DEVELOPMENT';
      case 'SETTINGS': return '';
      default: return category;
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="px-4 pt-2.5 pb-2 border-b border-gray-200">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">P</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm truncate" title={selectedProject.name}>
                  {selectedProject.name}
                </div>
                <div className="text-xs text-gray-500">내진성능평가</div>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectChange(project);
                    if (project.bridges.length > 0) {
                      onBridgeChange(project.bridges[0]);
                    }
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                    selectedProject.id === project.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="truncate font-medium" title={project.name}>
                    {project.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {project.description || '설명 없음'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="px-4 py-1">
        <nav className="space-y-1">
          {Object.entries(groupedMenuItems).map(([category, items]) => (
            <div key={category}>
              {getCategoryLabel(category) && (
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {getCategoryLabel(category)}
                </div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onMenuSelect(item.id)}
                    className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeMenu === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;