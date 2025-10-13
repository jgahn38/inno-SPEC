import React from 'react';
import { Settings, ChevronDown, Image, Building2, Anchor, BarChart3, Database, Variable, Table, FolderOpen, Tag, Component, Code, Layout, Menu, Type, Monitor, Layers } from 'lucide-react';
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
  showProjectSelector?: boolean;
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
  lnbConfigs = [],
  showProjectSelector = true
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());

  // 클릭 핸들러 최적화
  const handleMenuClick = React.useCallback((menuId: string) => {
    onMenuSelect(menuId);
    onLNBMenuClick?.(menuId);
  }, [onMenuSelect, onLNBMenuClick]);

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
    }, {} as Record<string, { parent: LNBConfig | null; children: LNBConfig[] }>);
  }, [menuItems]);

  console.log('Grouped menus:', groupedMenus);

  // selectedProject가 null인 경우 처리
  if (!selectedProject && projects.length > 0) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>프로젝트를 선택해주세요</p>
        </div>
      </div>
    );
  }

  // 아이콘 렌더링 함수 (이모지와 Lucide 아이콘 모두 지원)
  const renderIcon = (iconName?: string, displayName?: string) => {
    // 이모지 아이콘인지 확인 (유니코드 문자 범위 체크)
    if (iconName && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconName)) {
      return <span className="text-xl flex items-center justify-center w-5 h-5 flex-shrink-0">{iconName}</span>;
    }
    
    // Lucide 아이콘 매핑
    const iconMap: Record<string, React.ComponentType<any>> = {
      'BarChart3': BarChart3,
      'Building2': Building2,
      'Database': Database,
      'Image': Image,
      'Anchor': Anchor,
      'Settings': Settings,
      'Table': Table,
      'Variable': Variable,
      'FolderOpen': FolderOpen,
      'Tag': Tag,
      'Component': Component,
      'Code': Code,
      'Layout': Layout,
      'Menu': Menu,
      'Type': Type,
      'Monitor': Monitor,
      'Layers': Layers,
      'screen': Image, // 화면 아이콘
      'menu': Menu, // 메뉴 아이콘
      'function': Code, // 함수 아이콘
    };
    
    // 아이콘이 없는 경우 displayName을 기반으로 기본 아이콘 선택
    if (!iconName || !iconMap[iconName]) {
      const defaultIconMap: Record<string, React.ComponentType<any>> = {
        'dashboard': BarChart3,
        '대시보드': BarChart3,
        'screens': Image,
        '화면': Image,
        'tables': Table,
        '테이블': Table,
        'functions': Variable,
        '함수': Variable,
        'sync': Settings,
        '동기화': Settings,
        'settings': Settings,
        '설정': Settings,
        'illustration': Image,
        '단면': Image,
        'project-settings': Settings,
        '프로젝트 설정': Settings,
      };
      
      const DefaultIconComponent = defaultIconMap[displayName || ''] || BarChart3;
      return <DefaultIconComponent className="h-5 w-5 flex-shrink-0" />;
    }
    
    const IconComponent = iconMap[iconName] || BarChart3;
    return <IconComponent className="h-5 w-5 flex-shrink-0" />;
  };


  return (
    <div 
      className="w-64 bg-white border-r border-gray-200 h-full flex flex-col shadow-sm"
      style={{
        '--menu-item-height': '40px',
        '--menu-item-padding': '12px',
        '--menu-spacing': '4px',
        '--project-selector-height': '63px'
      } as React.CSSProperties}
    >
      {/* 프로젝트 선택 영역 - 높이 고정으로 메뉴 영역 높이 일관성 확보 */}
      <div className="flex-shrink-0" style={{ height: showProjectSelector && selectedProject && selectedProject.name && projects.length > 0 ? 'var(--project-selector-height)' : '0px' }}>
        {showProjectSelector && selectedProject && selectedProject.name && projects.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200 bg-white h-full">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between p-2 text-left bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                    <FolderOpen className="h-3 w-3 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedProject.name || '프로젝트 로딩 중...'}</div>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          onProjectChange(project);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                          selectedProject.id === project.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded flex items-center justify-center ${
                            selectedProject.id === project.id ? 'bg-gray-200' : 'bg-gray-100'
                          }`}>
                            <FolderOpen className={`h-2.5 w-2.5 ${
                              selectedProject.id === project.id ? 'text-gray-700' : 'text-gray-600'
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
        )}
      </div>

      {/* 메뉴 목록 */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 flex flex-col" style={{ gap: 'var(--menu-spacing)' }}>
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
                const isActive = activeMenu === item.name || activeMenu === item.id;
                // console.log(`Sidebar - Checking menu: ${item.id} (${item.name}), activeMenu: ${activeMenu}, isActive: ${isActive}`);
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center px-3 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gray-200 text-gray-900 font-semibold'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      style={{ 
                        height: 'var(--menu-item-height)',
                        paddingTop: 'var(--menu-item-padding)',
                        paddingBottom: 'var(--menu-item-padding)'
                      }}
                    >
                      <div style={{ marginRight: '12px' }} className="flex-shrink-0">
                        {renderIcon(item.icon, item.displayName)}
                      </div>
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
                      className="w-full flex items-center justify-between px-3 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      style={{ 
                        height: 'var(--menu-item-height)',
                        paddingTop: 'var(--menu-item-padding)',
                        paddingBottom: 'var(--menu-item-padding)'
                      }}
                    >
                      <div className="flex items-center">
                        <div style={{ marginRight: '12px' }} className="flex-shrink-0">
                          {renderIcon(item.icon, item.displayName)}
                        </div>
                        <span>{item.displayName}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-2 flex flex-col" style={{ gap: 'var(--menu-spacing)' }}>
                        {item.children
                          ?.filter(child => child.isActive)
                          .sort((a, b) => a.order - b.order)
                          .map((child) => {
                            const isChildActive = activeMenu === child.name || activeMenu === child.id;
                            // console.log(`Sidebar - Checking child menu: ${child.id} (${child.name}), activeMenu: ${activeMenu}, isActive: ${isChildActive}`);
                            
                            return (
                              <button
                                key={child.id}
                                onClick={() => handleMenuClick(child.id)}
                                className={`w-full flex items-center px-3 text-sm rounded-lg transition-colors ${
                                  isChildActive
                                    ? 'bg-gray-200 text-gray-900 font-semibold'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                                style={{ 
                                  height: 'var(--menu-item-height)',
                                  paddingTop: 'var(--menu-item-padding)',
                                  paddingBottom: 'var(--menu-item-padding)'
                                }}
                              >
                                <div style={{ marginRight: '12px' }} className="flex-shrink-0">
                                  {renderIcon(child.icon, child.displayName)}
                                </div>
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
