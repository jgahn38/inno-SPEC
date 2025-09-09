import React, { useState, useEffect } from 'react';
import { X, Check, Info } from 'lucide-react';
import { LayerInfo } from '../services/CADParserService';

interface LayerSelectionModalProps {
  isOpen: boolean;
  layers: LayerInfo[];
  onClose: () => void;
  onConfirm: (selectedLayers: string[]) => void;
  fileName: string;
}

const LayerSelectionModal: React.FC<LayerSelectionModalProps> = ({
  isOpen,
  layers,
  onClose,
  onConfirm,
  fileName
}) => {
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set());
  // const [layerVisibility, setLayerVisibility] = useState<Map<string, boolean>>(new Map()); // 사용하지 않음

  useEffect(() => {
    if (isOpen && layers.length > 0) {
      // 기본적으로 모든 레이어 선택
      const allLayerNames = new Set(layers.map(layer => layer.name));
      setSelectedLayers(allLayerNames);
      
      // 모든 레이어를 보이도록 설정
      const visibilityMap = new Map<string, boolean>();
      layers.forEach(layer => {
        visibilityMap.set(layer.name, true);
      });
      // setLayerVisibility(visibilityMap); // 사용하지 않음
    }
  }, [isOpen, layers]);

  const handleLayerToggle = (layerName: string) => {
    const newSelected = new Set(selectedLayers);
    if (newSelected.has(layerName)) {
      newSelected.delete(layerName);
    } else {
      newSelected.add(layerName);
    }
    setSelectedLayers(newSelected);
  };

  const handleSelectAll = () => {
    const allLayerNames = new Set(layers.map(layer => layer.name));
    setSelectedLayers(allLayerNames);
  };

  const handleSelectNone = () => {
    setSelectedLayers(new Set());
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedLayers));
  };

  const getEntityTypeIcon = (entityTypes: Record<string, number>) => {
    const types = Object.keys(entityTypes);
    if (types.includes('LINE')) return '📏';
    if (types.includes('CIRCLE')) return '⭕';
    if (types.includes('ARC')) return '🌙';
    if (types.includes('TEXT')) return '📝';
    if (types.includes('POLYLINE')) return '📐';
    return '📄';
  };

  const getEntityTypeText = (entityTypes: Record<string, number>) => {
    return Object.entries(entityTypes)
      .map(([type, count]) => `${type}(${count})`)
      .join(', ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">레이어 선택</h3>
              <p className="text-sm text-gray-500 mt-1">파일: {fileName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* 선택 통계 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-600 mr-2" />
              <div className="text-sm text-blue-800">
                <strong>{selectedLayers.size}</strong>개 레이어 선택됨 (전체 {layers.length}개 중)
                <br />
                총 엔티티 수: {layers
                  .filter(layer => selectedLayers.has(layer.name))
                  .reduce((sum, layer) => sum + layer.entityCount, 0)}개
              </div>
            </div>
          </div>

          {/* 전체 선택/해제 버튼 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                전체 선택
              </button>
              <button
                onClick={handleSelectNone}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                전체 해제
              </button>
            </div>
            <div className="text-sm text-gray-500">
              레이어를 선택하여 불러올 CAD 객체를 결정하세요
            </div>
          </div>

          {/* 레이어 목록 */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    선택
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    레이어명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    객체 유형
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    개수
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    색상
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    선 종류
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {layers.map((layer) => (
                  <tr
                    key={layer.name}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedLayers.has(layer.name) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleLayerToggle(layer.name)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {selectedLayers.has(layer.name) ? (
                          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {getEntityTypeIcon(layer.entityTypes)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {layer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getEntityTypeText(layer.entityTypes)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {layer.entityCount}개
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {layer.color !== undefined ? (
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded border border-gray-300 mr-2"
                            style={{
                              backgroundColor: `hsl(${(layer.color * 40) % 360}, 70%, 50%)`
                            }}
                          ></div>
                          <span className="text-sm text-gray-500">{layer.color}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {layer.linetype || 'CONTINUOUS'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedLayers.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              선택한 레이어로 불러오기 ({selectedLayers.size}개)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerSelectionModal;
