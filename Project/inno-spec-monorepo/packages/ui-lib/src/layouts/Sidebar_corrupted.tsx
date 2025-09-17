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

  // ?�릭 ?�들??최적??
  const handleMenuClick = React.useCallback((menuId: string) => {
    onMenuSelect(menuId);
    onLNBMenuClick?.(menuId);
  }, [onMenuSelect, onLNBMenuClick]);

  // selectedProject가 null??경우 처리
  if (!selectedProject && projects.length > 0) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>?�로?�트�??�택?�주?�요</p>
        </div>
      </div>
    );
  }

  // ?�이�??�더�??�수 (?�모지?� Lucide ?�이�?모두 지??
  const renderIcon = (iconName?: string, displayName?: string) => {
    // ?�모지 ?�이콘인지 ?�인 (?�니코드 문자 범위 체크)
    if (iconName && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconName)) {
      return <span className="text-lg">{iconName}</span>;
    }
    
    // Lucide ?�이�?매핑
    const iconMap: Record<string, React.ComponentType<any>> = {
      'BarChart3': BarChart3,
      'Building2': Building2,
      'Database': Database,
      'Image': Image,
      'Anchor': Anchor,
      'Settings': Settings,
      'Table': Table,
      'Variable': Variable,
      'screen': Image, // ?�면 ?�이�?
      'menu': Settings, // 메뉴 ?�이�?
      'function': Variable, // ?�수 ?�이�?
    };
    
    // ?�이콘이 ?�는 경우 displayName??기반?�로 기본 ?�이�??�택
    if (!iconName || !iconMap[iconName]) {
      const defaultIconMap: Record<string, React.ComponentType<any>> = {
        'dashboard': BarChart3,
        '?�?�보??: BarChart3,
        'screens': Image,
        '?�면': Image,
        'tables': Table,
        '?�이�?: Table,
        'functions': Variable,
        '?�수': Variable,
        'sync': Settings,
        '?�기??: Settings,
        'settings': Settings,
        '?�정': Settings,
        'illustration': Image,
        '?�면': Image,
        'project-settings': Settings,
        '?�로?�트 ?�정': Settings,
      };
      
      const DefaultIconComponent = defaultIconMap[displayName || ''] || BarChart3;
      return <DefaultIconComponent className="h-4 w-4" />;
    }
    
    const IconComponent = iconMap[iconName] || BarChart3;
    return <IconComponent className="h-4 w-4" />;
  };

  // LNBConfig�?메뉴 ?�이?�으�?변??
  const convertLNBConfigToMenuItems = React.useCallback((configs: LNBConfig[]): LNBConfig[] => {
    const filtered = configs
      .filter(config => config.isActive)
      .sort((a, b) => a.order - b.order);
    return filtered;
  }, []);

  
  const menuItems = React.useMemo(() => convertLNBConfigToMenuItems(lnbConfigs), [lnbConfigs, convertLNBConfigToMenuItems]);

  // LNB 메뉴가 로드?????�위 메뉴?�을 ?�동?�로 Expand (초기 로드 ?�에�?
  React.useEffect(() => {
    if (menuItems.length > 0 && expandedCategories.size === 0) {
      const parentMenuIds = menuItems
        .filter(item => item.children && item.children.length > 0)
        .map(item => item.id);
      
      if (parentMenuIds.length > 0) {
        setExpandedCategories(new Set(parentMenuIds));
      }
    }
  }, [menuItems, expandedCategories.size]);

  // 메뉴가 ?�을 ??기본 메뉴 ?�시
  if (menuItems.length === 0) {
    return (
      <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="text-center text-gray-500">
            <p>LNB 메뉴�?로드?�는 �?..</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>메뉴�?구성?�주?�요</p>
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

  // LNBConfig�?그룹??(부�??�식 관�?처리)
  const groupedMenus = React.useMemo(() => {
    return menuItems.reduce((acc, item) => {
      if (item.children && item.children.length > 0) {
        // 부�?메뉴 (?�식???�는 경우)
        acc[item.id] = {
          parent: item,
          children: item.children
            .filter(child => child.isActive)
            .sort((a, b) => a.order - b.order)
        };
      } else {
        // ?�립 메뉴 (?�식???�는 경우)
        if (!acc['INDEPENDENT']) {
          acc['INDEPENDENT'] = { parent: null, children: [] };
        }
        acc['INDEPENDENT'].children.push(item);
      }
      return acc;
    }, {} as Record<string, { parent: LNBConfig | null, children: LNBConfig[] }>);
  }, [menuItems]);
  

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col shadow-sm">
      {/* ?�로?�트 ?�택 (showProjectSelector가 true?�고 ?�로?�트가 ?�을 ?�만 ?�시) */}
      {showProjectSelector && selectedProject && selectedProject.name && projects.length > 0 && (
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
                <div className="font-medium text-gray-900">{selectedProject.name || selectedProject.displayName || '?�로?�트 로딩 �?..'}</div>
                <div className="text-sm text-gray-500">{selectedProject.description || ''}</div>
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
      )}

      {/* 메뉴 목록 */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {(() => {
            // menuItems�?직접 ?�용?�여 order ?�서?��??�더�?
              name: m.displayName, 
              order: m.order 
            })));
            
            return menuItems.map((item) => {
              // ?�립 메뉴?��? ?�인
              const isIndependent = !item.children || item.children.length === 0;
              
              if (isIndependent) {
                // ?�립 메뉴 ?�더�?
                const isActive = activeMenu === item.name || activeMenu === item.id;
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gray-200 text-gray-900 font-semibold'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <div className="mr-5">
                        {renderIcon(item.icon, item.displayName)}
                      </div>
                      {item.displayName}
                    </button>
                  </div>
                );
              } else {
                // 부�?메뉴 ?�더�?
                const isExpanded = expandedCategories.has(item.id);
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleCategory(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="mr-5">
                          {renderIcon(item.icon, item.displayName)}
                        </div>
                        <span>{item.displayName}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-2 space-y-1">
                        {item.children
                          ?.filter(child => child.isActive)
                          .sort((a, b) => a.order - b.order)
                          .map((child) => {
                            const isChildActive = activeMenu === child.name || activeMenu === child.id;
                            
                            return (
                              <button
                                key={child.id}
                                onClick={() => handleMenuClick(child.id)}
                                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                  isChildActive
                                    ? 'bg-gray-200 text-gray-900 font-semibold'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                              >
                                <div className="mr-5">
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
