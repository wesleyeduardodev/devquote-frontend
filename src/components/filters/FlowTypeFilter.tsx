import React from 'react';

export type FlowTypeFilterValue = 'TODOS' | 'DESENVOLVIMENTO' | 'OPERACIONAL';

interface FlowTypeFilterProps {
  value: FlowTypeFilterValue;
  onChange: (value: FlowTypeFilterValue) => void;
  className?: string;
}

export const FlowTypeFilter: React.FC<FlowTypeFilterProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        Fluxo:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FlowTypeFilterValue)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
      >
        <option value="TODOS">Todos</option>
        <option value="DESENVOLVIMENTO">Desenvolvimento</option>
        <option value="OPERACIONAL">Operacional</option>
      </select>
    </div>
  );
};
