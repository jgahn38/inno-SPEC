import React from 'react';
import { Settings, Database, ChevronDown, Grid as Bridge, Image, Building2, Anchor, BarChart3 } from 'lucide-react';
import { screenService } from '../services/ScreenService';
import { Project, Bridge as BridgeType } from '../types';

interface SidebarProps {
  activeMenu: string;
  onMenuSelect: (menu: string) => void;
  selectedProject: Project;
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
  selectedBridge,
  projects, 
  onProjectChange,
  onBridgeChange,
  onLNBMenuClick
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set(['BRIDGE_STATUS', 'MODELING']));

  // LNB 구성에서 메뉴 생성
  type MenuItem = { id: string; label: string; icon: React.ComponentType<any>; category: string };

  const getIconComponent = (iconName?: string): React.ComponentType<any> => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'BarChart3': BarChart3,
      'Building2': Building2,
      'Database': Database,
      'Image': Image,
      'Anchor': Anchor,
      'Settings': Settings,
    };
    return iconMap[iconName || 'Settings'] || Settings;
  };

  const toCategory = (name: string): string => {
    switch (name) {
      case 'dashboard': return 'DASHBOARD';
      case 'bridge-status': return 'BRIDGE_STATUS';
      case 'modeling': return 'MODELING';
      case 'project-settings': return 'SETTINGS';
      default: return name.toUpperCase();
    }
  };

  const toItemId = (name: string): string => {
    if (name === 'project-settings') return 'settings';
    return name;
  };

  const lnbConfigs = React.useMemo(() => screenService.getLNBConfigs(), []);

  const menuItems: MenuItem[] = React.useMemo(() => {
    const items: MenuItem[] = [];
    // 상위 메뉴 순서대로
    lnbConfigs.forEach(top => {
      const category = toCategory(top.name);
      if (top.children && top.children.length > 0) {
        // 하위 메뉴 정렬 후 푸시
        const sortedChildren = [...top.children].sort((a, b) => (a.order || 0) - (b.order || 0));
        sortedChildren.forEach(child => {
          items.push({
            id: toItemId(child.name),
            label: child.displayName,
            icon: getIconComponent(child.icon),
            category,
          });
        });
      } else {
        // 독립 메뉴는 카테고리 헤더 없이 바로 표시되도록 'INDEPENDENT' 그룹에 넣음
        const independentCategory = (top.name === 'dashboard') ? 'DASHBOARD' : (top.name === 'project-settings') ? 'SETTINGS' : 'INDEPENDENT';
        items.push({
          id: toItemId(top.name),
          label: top.displayName,
          icon: getIconComponent(top.icon),
          category: independentCategory,
        });
      }
    });
    return items;
  }, [lnbConfigs]);

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [] as MenuItem[];
    }
    (acc[item.category] as MenuItem[]).push(item);
    return acc;
  }, {} as Record<string, MenuItem[] | undefined>);

  // 카테고리 레이블 매핑 (상위 메뉴의 displayName 사용)
  const categoryDisplayNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    lnbConfigs.forEach(top => {
      if (top.children && top.children.length > 0) {
        map[toCategory(top.name)] = top.displayName;
      }
    });
    return map;
  }, [lnbConfigs]);

  const getCategoryLabel = (category: string) => {
    if (categoryDisplayNameMap[category]) return categoryDisplayNameMap[category];
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
                      onClick={() => {
                        onMenuSelect(item.id);
                        if (onLNBMenuClick) {
                          onLNBMenuClick(item.id);
                        }
                      }}
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
            if (category === 'INDEPENDENT') {
              return (
                <div key={category}>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onMenuSelect(item.id);
                        if (onLNBMenuClick) {
                          onLNBMenuClick(item.id);
                        }
                      }}
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
                      onClick={() => {
                        onMenuSelect(item.id);
                        if (onLNBMenuClick) {
                          onLNBMenuClick(item.id);
                        }
                      }}
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
                  <div className="flex items-center space-x-3">
                    {/* 상위 메뉴 아이콘 표시 */}
                    {(() => {
                      const topMenu = lnbConfigs.find(top => toCategory(top.name) === category);
                      if (topMenu && topMenu.icon) {
                        const IconComponent = getIconComponent(topMenu.icon);
                        return <IconComponent className="h-5 w-5 text-gray-600" />;
                      }
                      return null;
                    })()}
                    <span className="text-base font-semibold text-gray-800">{getCategoryLabel(category)}</span>
                  </div>
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
                        onClick={() => {
                        onMenuSelect(item.id);
                        if (onLNBMenuClick) {
                          onLNBMenuClick(item.id);
                        }
                      }}
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