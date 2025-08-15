import React, { useState } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';

interface TableRow {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  description: string;
}

interface InputTableProps {
  onCalculate: (data: TableRow[]) => void;
}

const InputTable: React.FC<InputTableProps> = ({ onCalculate }) => {
  const [data, setData] = useState<TableRow[]>([
    { id: '1', parameter: 'L', value: '30.0', unit: 'm', description: '교량 길이' },
    { id: '2', parameter: 'B', value: '12.0', unit: 'm', description: '교량 폭' },
    { id: '3', parameter: 'H', value: '2.5', unit: 'm', description: '거더 높이' },
    { id: '4', parameter: 'fc', value: '30.0', unit: 'MPa', description: '콘크리트 압축강도' },
    { id: '5', parameter: 'fy', value: '400.0', unit: 'MPa', description: '철근 항복강도' },
  ]);

  const addRow = () => {
    const newRow: TableRow = {
      id: Date.now().toString(),
      parameter: '',
      value: '',
      unit: '',
      description: ''
    };
    setData([...data, newRow]);
  };

  const deleteRow = (id: string) => {
    setData(data.filter(row => row.id !== id));
  };

  const updateCell = (id: string, field: keyof TableRow, value: string) => {
    setData(data.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleCalculate = () => {
    onCalculate(data);
  };

  return (
    <div className="space-y-4">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">설계 제원 입력</h2>
            <p className="text-sm text-gray-600">교량의 기본 설계 매개변수와 재료 특성을 입력하세요.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={addRow}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>행 추가</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                매개변수
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                값
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                단위
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                설명
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-16">
                삭제
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 border-b border-gray-100">
                  <input
                    type="text"
                    value={row.parameter}
                    onChange={(e) => updateCell(row.id, 'parameter', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="매개변수명"
                  />
                </td>
                <td className="px-4 py-3 border-b border-gray-100">
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => updateCell(row.id, 'value', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="값"
                  />
                </td>
                <td className="px-4 py-3 border-b border-gray-100">
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => updateCell(row.id, 'unit', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="단위"
                  />
                </td>
                <td className="px-4 py-3 border-b border-gray-100">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateCell(row.id, 'description', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="설명"
                  />
                </td>
                <td className="px-4 py-3 border-b border-gray-100 text-center">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InputTable;