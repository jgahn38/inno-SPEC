import React from 'react';
import { Settings, ChevronDown, Image, Building2, Anchor, BarChart3 } from 'lucide-react';
import { Project, Bridge as BridgeType } from '@inno-spec/shared';

export interface SidebarProps {
  activeMenu: string;
  onMenuSelect: (menu: string) => void;
  selectedProject: Project | null;
  selectedBridge: BridgeType | null;
  projects: Project[];
  onProjectChange: (project: Project) => void;
  onBridgeChange: (bridge: BridgeType) => void;
  onLNBMenuClick?: (menuId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeMenu, 
  onMenuSelect, 
  selectedProject, 
  selectedBridge: _selectedBridge,
  projects, 
  onProjectChange,
  onBridgeChange: _onBridgeChange,
  onLNBMenuClick
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set(['BRIDGE_STATUS', 'MODELING']));

  // selectedProject가 null인 경우 처리
  if (!selectedProject) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>프로젝트를 선택해주세요</p>
        </div>
      </div>
    );
  }

  // LNB 구성에서 메뉴 생성
  type MenuItem = { id: string; label: string; icon: React.ComponentType<any>; category: string };

  // const getIconComponent = (iconName?: string): React.ComponentType<any> => {
  //   const iconMap: Record<string, React.ComponentType<any>> = {
  //     'BarChart3': BarChart3,
  //     'Building2': Building2,
  //     'Database': Database,
  //     'Image': Image,
  //     'Anchor': Anchor,
  //   };
  //   return iconMap[iconName || ''] || BarChart3;
  // };

  // 기본 메뉴 구성
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: '대시보드', icon: BarChart3, category: 'MAIN' },
    { id: 'bridge-specs', label: '교량제원', icon: Building2, category: 'BRIDGE_STATUS' },
    { id: 'structure-status', label: '구조물 현황', icon: Building2, category: 'BRIDGE_STATUS' },
    { id: 'bearing-status', label: '교량받침 현황', icon: Anchor, category: 'BRIDGE_STATUS' },
    { id: 'section', label: '단면', icon: Image, category: 'MODELING' },
    { id: 'project-settings', label: '프로젝트 설정', icon: Settings, category: 'SETTINGS' },
  ];

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const groupedMenus = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categoryLabels: Record<string, string> = {
    'MAIN': '',
    'BRIDGE_STATUS': '교량현황',
    'MODELING': '모델링',
    'SETTINGS': '설정',
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* 프로젝트 선택 */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-2 text-left bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div>
              <div className="font-medium text-gray-900">{selectedProject.name}</div>
              <div className="text-sm text-gray-500">{selectedProject.description}</div>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="py-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      onProjectChange(project);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      selectedProject.id === project.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-gray-500">{project.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {Object.entries(groupedMenus).map(([category, items]) => (
            <div key={category}>
              {category !== 'MAIN' && (
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <span>{categoryLabels[category]}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                    expandedCategories.has(category) ? 'rotate-180' : ''
                  }`} />
                </button>
              )}
              
              {(category === 'MAIN' || expandedCategories.has(category)) && (
                <div className="ml-2 space-y-1">
                  {items.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeMenu === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onMenuSelect(item.id);
                          onLNBMenuClick?.(item.id);
                        }}
                        className={`w-full flex items-center px-2 py-2 text-sm rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className="h-4 w-4 mr-3" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
