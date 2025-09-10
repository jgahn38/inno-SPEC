import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Building2 } from 'lucide-react';
import { Project, Bridge, CreateBridgeRequest } from '@inno-spec/shared';

interface ProjectSettingsProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({ project, onProjectUpdate }) => {
  const [bridges, setBridges] = useState<Bridge[]>(project.bridges || []);
  const [showAddBridgeModal, setShowAddBridgeModal] = useState(false);
  const [editingBridge, setEditingBridge] = useState<Bridge | null>(null);
  const [newBridge, setNewBridge] = useState<CreateBridgeRequest>({
    name: '',
    displayName: '',
    description: '',
    type: 'concrete',
    length: 0,
    width: 0,
    spanCount: 1,
    height: 0,
    constructionYear: new Date().getFullYear(),
    location: '',
    status: 'active'
  });

  useEffect(() => {
    setBridges(project.bridges || []);
  }, [project]);

  const handleAddBridge = () => {
    if (!newBridge.name.trim() || newBridge.length <= 0 || newBridge.width <= 0) {
      alert('교량명, 길이, 폭은 필수 입력 항목입니다.');
      return;
    }

    const bridge: Bridge = {
      ...newBridge,
      id: `bridge-${Date.now()}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedBridges = [...bridges, bridge];
    setBridges(updatedBridges);
    
    // 프로젝트 업데이트
    const updatedProject = {
      ...project,
      bridges: updatedBridges
    };
    onProjectUpdate(updatedProject);

    // 폼 초기화
    setNewBridge({
      name: '',
      displayName: '',
      description: '',
      type: 'concrete',
      length: 0,
      width: 0,
      spanCount: 1,
      height: 0,
      constructionYear: new Date().getFullYear(),
      location: '',
      status: 'active'
    });
    setShowAddBridgeModal(false);
  };

  const handleEditBridge = (bridge: Bridge) => {
    setEditingBridge(bridge);
    setNewBridge({
      name: bridge.name,
      displayName: bridge.displayName,
      description: bridge.description || '',
      type: bridge.type,
      length: bridge.length,
      width: bridge.width,
      spanCount: bridge.spanCount,
      height: bridge.height,
      constructionYear: bridge.constructionYear,
      location: bridge.location,
      status: bridge.status
    });
    setShowAddBridgeModal(true);
  };

  const handleUpdateBridge = () => {
    if (!editingBridge || !newBridge.name.trim() || newBridge.length <= 0 || newBridge.width <= 0) {
      alert('교량명, 길이, 폭은 필수 입력 항목입니다.');
      return;
    }

    const updatedBridges = bridges.map(bridge => 
      bridge.id === editingBridge.id 
        ? { ...bridge, ...newBridge, displayName: newBridge.displayName || newBridge.name, updatedAt: new Date() }
        : bridge
    );
    
    setBridges(updatedBridges);
    
    // 프로젝트 업데이트
    const updatedProject = {
      ...project,
      bridges: updatedBridges
    };
    onProjectUpdate(updatedProject);

    // 폼 초기화
    setEditingBridge(null);
    setNewBridge({
      name: '',
      displayName: '',
      description: '',
      type: 'concrete',
      length: 0,
      width: 0,
      spanCount: 1,
      height: 0,
      constructionYear: new Date().getFullYear(),
      location: '',
      status: 'active'
    });
    setShowAddBridgeModal(false);
  };

  const handleDeleteBridge = (bridgeId: string) => {
    if (confirm('정말로 이 교량을 삭제하시겠습니까?')) {
      const updatedBridges = bridges.filter(bridge => bridge.id !== bridgeId);
      setBridges(updatedBridges);
      
      // 프로젝트 업데이트
      const updatedProject = {
        ...project,
        bridges: updatedBridges
      };
      onProjectUpdate(updatedProject);
    }
  };

  const resetForm = () => {
    setNewBridge({
      name: '',
      displayName: '',
      description: '',
      type: 'concrete',
      length: 0,
      width: 0,
      spanCount: 1,
      height: 0,
      constructionYear: new Date().getFullYear(),
      location: '',
      status: 'active'
    });
    setEditingBridge(null);
    setShowAddBridgeModal(false);
  };

  const getBridgeTypeLabel = (type: string) => {
    switch (type) {
      case 'concrete': return '콘크리트';
      case 'steel': return '강교';
      case 'composite': return '합성교';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'maintenance': return '점검중';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 설정</h2>
            <p className="text-sm text-gray-600">프로젝트 정보 및 교량을 관리하세요.</p>
          </div>
        </div>

      {/* 프로젝트 기본 정보 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트명</label>
            <input
              type="text"
              value={project.name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <input
              type="text"
              value={project.description}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* 교량 관리 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">교량 관리</h3>
          <button
            onClick={() => setShowAddBridgeModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>교량 추가</span>
          </button>
        </div>

        {bridges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">등록된 교량이 없습니다</p>
            <p className="text-xs text-gray-500">"교량 추가" 버튼을 클릭하여 첫 번째 교량을 등록하세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">교량명</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">길이×폭</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">경간수</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bridges.map((bridge) => (
                  <tr key={bridge.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bridge.displayName || bridge.name}</div>
                        <div className="text-sm text-gray-500">{bridge.description}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getBridgeTypeLabel(bridge.type)}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bridge.length}m × {bridge.width}m
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bridge.spanCount}개
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bridge.status)}`}>
                        {getStatusLabel(bridge.status)}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditBridge(bridge)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBridge(bridge.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 교량 추가/수정 모달 */}
      {showAddBridgeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingBridge ? '교량 수정' : '교량 추가'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">교량명 *</label>
                  <input
                    type="text"
                    value={newBridge.name}
                    onChange={(e) => setNewBridge({ ...newBridge, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="교량명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">표시명</label>
                  <input
                    type="text"
                    value={newBridge.displayName}
                    onChange={(e) => setNewBridge({ ...newBridge, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="표시명을 입력하세요 (선택사항)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={newBridge.description}
                    onChange={(e) => setNewBridge({ ...newBridge, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="교량에 대한 설명을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                    <select
                      value={newBridge.type}
                      onChange={(e) => setNewBridge({ ...newBridge, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="concrete">콘크리트</option>
                      <option value="steel">강교</option>
                      <option value="composite">합성교</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                    <select
                      value={newBridge.status}
                      onChange={(e) => setNewBridge({ ...newBridge, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">활성</option>
                      <option value="inactive">비활성</option>
                      <option value="maintenance">점검중</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">길이 (m) *</label>
                    <input
                      type="number"
                      value={newBridge.length}
                      onChange={(e) => setNewBridge({ ...newBridge, length: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">폭 (m) *</label>
                    <input
                      type="number"
                      value={newBridge.width}
                      onChange={(e) => setNewBridge({ ...newBridge, width: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">높이 (m)</label>
                    <input
                      type="number"
                      value={newBridge.height}
                      onChange={(e) => setNewBridge({ ...newBridge, height: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">경간 수</label>
                    <input
                      type="number"
                      value={newBridge.spanCount}
                      onChange={(e) => setNewBridge({ ...newBridge, spanCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      step="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">준공년도</label>
                    <input
                      type="number"
                      value={newBridge.constructionYear}
                      onChange={(e) => setNewBridge({ ...newBridge, constructionYear: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1900"
                      max={new Date().getFullYear() + 10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                    <input
                      type="text"
                      value={newBridge.location}
                      onChange={(e) => setNewBridge({ ...newBridge, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="위치 정보"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={editingBridge ? handleUpdateBridge : handleAddBridge}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProjectSettings;
