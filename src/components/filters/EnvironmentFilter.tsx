import React from 'react';

export type EnvironmentFilterValue = 'TODOS' | 'PRODUCAO' | 'DESENVOLVIMENTO' | 'HOMOLOGACAO';

interface EnvironmentFilterProps {
  value: EnvironmentFilterValue;
  onChange: (value: EnvironmentFilterValue) => void;
  className?: string;
}

export const EnvironmentFilter: React.FC<EnvironmentFilterProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-text-secondary">
        Ambiente:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as EnvironmentFilterValue)}
        className="px-3 py-2 w-full border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm bg-surface-1"
      >
        <option value="TODOS">Todos</option>
        <option value="PRODUCAO">Produção</option>
        <option value="DESENVOLVIMENTO">Desenvolvimento</option>
        <option value="HOMOLOGACAO">Homologação</option>
      </select>
    </div>
  );
};
