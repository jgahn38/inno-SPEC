import React from 'react';
import { Settings, Database, ChevronDown, Grid as Bridge, Image, Building2, Anchor, BarChart3 } from 'lucide-react';
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
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set(['BRIDGE_STATUS', 'MODELING']));

  const menuItems = [
    // 대시보드
    { id: 'dashboard', label: '대시보드', icon: BarChart3, category: 'DASHBOARD' },
    
    // 교량현황
    { id: 'bridge-specs', label: '교량제원', icon: Database, category: 'BRIDGE_STATUS' },
    { id: 'structure-status', label: '구조물 현황', icon: Building2, category: 'BRIDGE_STATUS' },
    { id: 'bearing-status', label: '교량받침 현황', icon: Anchor, category: 'BRIDGE_STATUS' },
    
    // 모델링
    { id: 'section', label: '단면', icon: Image, category: 'MODELING' },
    
    // 프로젝트 설정
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
      case 'BRIDGE_STATUS': return '교량현황';
      case 'MODELING': return '모델링';
      case 'SETTINGS': return '';
      default: return category;
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const isCategoryExpanded = (category: string) => expandedCategories.has(category);

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

        {/* 메뉴 목록 */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedMenuItems).map(([category, items]) => {
            if (category === 'DASHBOARD') {
              return (
                <div key={category}>
                  {/* 대시보드 메뉴 - 독립적인 메뉴 */}
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onMenuSelect(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        activeMenu === item.id ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                  
                  {/* 구분선 */}
                  <div className="px-4 py-2">
                    <div className="border-t border-gray-200"></div>
                  </div>
                </div>
              );
            }
            
            if (category === 'SETTINGS') {
              return (
                <div key={category}>
                  {/* 구분선 */}
                  <div className="px-4 py-2">
                    <div className="border-t border-gray-200"></div>
                  </div>
                  
                  {/* 프로젝트 설정 메뉴 */}
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onMenuSelect(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        activeMenu === item.id ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              );
            }

            return (
              <div key={category}>
                {/* 상위 메뉴 (카테고리 헤더) */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="text-base font-semibold text-gray-800">{getCategoryLabel(category)}</span>
                  <ChevronDown 
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      isCategoryExpanded(category) ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                
                {/* 하위 메뉴들 */}
                {isCategoryExpanded(category) && (
                  <div className="bg-gray-50">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onMenuSelect(item.id)}
                        className={`w-full flex items-center space-x-3 px-8 py-2.5 text-left hover:bg-gray-100 transition-colors ${
                          activeMenu === item.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
    </div>
  );
};

export default Sidebar;