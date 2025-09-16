import React from 'react';
import { Settings, ChevronDown, Image, Building2, Anchor, BarChart3, Database, Variable, Table, FolderOpen } from 'lucide-react';
import { Project, Bridge as BridgeType, LNBConfig } from '@inno-spec/shared';

export interface SidebarProps {
  activeMenu: string;
  onMenuSelect: (menu: string) => void;
  selectedProject: Project | null;
  selectedBridge: BridgeType | null;
  projects: Project[];
  onProjectChange: (project: Project) => void;
  onBridgeChange: (bridge: BridgeType) => void;
  onLNBMenuClick?: (menuId: string) => void;
  lnbConfigs?: LNBConfig[];
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ 
  activeMenu, 
  onMenuSelect, 
  selectedProject, 
  selectedBridge: _selectedBridge,
  projects, 
  onProjectChange,
  onBridgeChange: _onBridgeChange,
  onLNBMenuClick,
  lnbConfigs = []
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());

  // 클릭 핸들러 최적화
  const handleMenuClick = React.useCallback((menuId: string) => {
    onMenuSelect(menuId);
    onLNBMenuClick?.(menuId);
  }, [onMenuSelect, onLNBMenuClick]);

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

  // 아이콘 매핑 함수
  const getIconComponent = (iconName?: string): React.ComponentType<any> => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'BarChart3': BarChart3,
      'Building2': Building2,
      'Database': Database,
      'Image': Image,
      'Anchor': Anchor,
      'Settings': Settings,
      'Table': Table,
      'Variable': Variable,
    };
    return iconMap[iconName || ''] || BarChart3;
  };

  // LNBConfig를 메뉴 아이템으로 변환
  const convertLNBConfigToMenuItems = React.useCallback((configs: LNBConfig[]): LNBConfig[] => {
    console.log('Converting LNB configs:', configs);
    const filtered = configs
      .filter(config => config.isActive)
      .sort((a, b) => a.order - b.order);
    console.log('Filtered menu items:', filtered);
    return filtered;
  }, []);

  console.log('Sidebar received lnbConfigs prop:', lnbConfigs);
  console.log('Sidebar lnbConfigs type:', typeof lnbConfigs);
  console.log('Sidebar lnbConfigs length:', lnbConfigs?.length);
  
  const menuItems = React.useMemo(() => convertLNBConfigToMenuItems(lnbConfigs), [lnbConfigs, convertLNBConfigToMenuItems]);
  console.log('Sidebar - lnbConfigs:', lnbConfigs);
  console.log('Sidebar - menuItems:', menuItems);

  // LNB 메뉴가 로드된 후 상위 메뉴들을 자동으로 Expand (초기 로드 시에만)
  React.useEffect(() => {
    if (menuItems.length > 0 && expandedCategories.size === 0) {
      const parentMenuIds = menuItems
        .filter(item => item.children && item.children.length > 0)
        .map(item => item.id);
      
      if (parentMenuIds.length > 0) {
        setExpandedCategories(new Set(parentMenuIds));
        console.log('Auto-expanding parent menus:', parentMenuIds);
      }
    }
  }, [menuItems, expandedCategories.size]);

  // 메뉴가 없을 때 기본 메뉴 표시
  if (menuItems.length === 0) {
    return (
      <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="text-center text-gray-500">
            <p>LNB 메뉴를 로드하는 중...</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>메뉴를 구성해주세요</p>
          </div>
        </div>
      </div>
    );
  }

  const toggleCategory = React.useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(category)) {
        newExpanded.delete(category);
      } else {
        newExpanded.add(category);
      }
      return newExpanded;
    });
  }, []);

  // LNBConfig를 그룹화 (부모-자식 관계 처리)
  const groupedMenus = React.useMemo(() => {
    return menuItems.reduce((acc, item) => {
      console.log('Processing menu item:', item);
      if (item.children && item.children.length > 0) {
        // 부모 메뉴 (자식이 있는 경우)
        console.log('Parent menu with children:', item.displayName, item.children);
        acc[item.id] = {
          parent: item,
          children: item.children
            .filter(child => child.isActive)
            .sort((a, b) => a.order - b.order)
        };
      } else {
        // 독립 메뉴 (자식이 없는 경우)
        console.log('Independent menu:', item.displayName);
        if (!acc['INDEPENDENT']) {
          acc['INDEPENDENT'] = { parent: null, children: [] };
        }
        acc['INDEPENDENT'].children.push(item);
      }
      return acc;
    }, {} as Record<string, { parent: LNBConfig | null, children: LNBConfig[] }>);
  }, [menuItems]);
  
  console.log('Grouped menus:', groupedMenus);

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col shadow-sm">
      {/* 프로젝트 선택 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-2 text-left bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                <FolderOpen className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{selectedProject.name}</div>
                <div className="text-sm text-gray-500">{selectedProject.description}</div>
              </div>
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
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${
                        selectedProject.id === project.id ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <FolderOpen className={`h-2.5 w-2.5 ${
                          selectedProject.id === project.id ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-gray-500">{project.description}</div>
                      </div>
                    </div>
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
          {(() => {
            // menuItems를 직접 사용하여 order 순서대로 렌더링
            console.log('Rendering menuItems in order:', menuItems.map(m => ({ 
              name: m.displayName, 
              order: m.order 
            })));
            
            return menuItems.map((item) => {
              // 독립 메뉴인지 확인
              const isIndependent = !item.children || item.children.length === 0;
              
              if (isIndependent) {
                // 독립 메뉴 렌더링
                const IconComponent = getIconComponent(item.icon);
                const isActive = activeMenu === item.name || activeMenu === item.id;
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gray-200 text-gray-900 font-semibold'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="h-4 w-4 mr-3" />
                      {item.displayName}
                    </button>
                  </div>
                );
              } else {
                // 부모 메뉴 렌더링
                const isExpanded = expandedCategories.has(item.id);
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleCategory(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        {(() => {
                          const ParentIconComponent = getIconComponent(item.icon);
                          return <ParentIconComponent className="h-4 w-4 mr-3" />;
                        })()}
                        <span>{item.displayName}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-2 space-y-1">
                        {item.children
                          .filter(child => child.isActive)
                          .sort((a, b) => a.order - b.order)
                          .map((child) => {
                            const ChildIconComponent = getIconComponent(child.icon);
                            const isChildActive = activeMenu === child.name || activeMenu === child.id;
                            
                            return (
                              <button
                                key={child.id}
                                onClick={() => handleMenuClick(child.id)}
                                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                  isChildActive
                                    ? 'bg-gray-200 text-gray-900 font-semibold'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                              >
                                <ChildIconComponent className="h-4 w-4 mr-3" />
                                {child.displayName}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              }
            });
          })()}
        </nav>
      </div>
    </div>
  );
});

export default Sidebar;
