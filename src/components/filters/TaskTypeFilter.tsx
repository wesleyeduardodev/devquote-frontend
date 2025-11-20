import React from 'react';

export type TaskTypeFilterValue = 'TODOS' | 'BUG' | 'ENHANCEMENT' | 'NEW_FEATURE' | 'BACKUP' | 'DEPLOY' | 'LOGS' | 'DATABASE_APPLICATION' | 'NEW_SERVER' | 'MONITORING' | 'SUPPORT';
export type FlowType = 'TODOS' | 'DESENVOLVIMENTO' | 'OPERACIONAL';

interface TaskTypeFilterProps {
  value: TaskTypeFilterValue;
  onChange: (value: TaskTypeFilterValue) => void;
  flowType: FlowType;
  className?: string;
}

const developmentTypes = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'BUG', label: '🐛 Bug' },
  { value: 'ENHANCEMENT', label: '🔧 Melhoria' },
  { value: 'NEW_FEATURE', label: '✨ Nova Funcionalidade' }
];

const operationalTypes = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'BACKUP', label: '📦 Backup' },
  { value: 'DEPLOY', label: '🚀 Deploy' },
  { value: 'LOGS', label: '📄 Logs' },
  { value: 'DATABASE_APPLICATION', label: '🗄️ Aplicação de Banco' },
  { value: 'NEW_SERVER', label: '💻 Novo Servidor' },
  { value: 'MONITORING', label: '📊 Monitoramento' },
  { value: 'SUPPORT', label: '🛠️ Suporte' }
];

export const TaskTypeFilter: React.FC<TaskTypeFilterProps> = ({
  value,
  onChange,
  flowType,
  className = ''
}) => {
  const getOptions = () => {
    if (flowType === 'DESENVOLVIMENTO') {
      return developmentTypes;
    } else if (flowType === 'OPERACIONAL') {
      return operationalTypes;
    }
    return [{ value: 'TODOS', label: 'Todos' }];
  };

  const options = getOptions();
  const isDisabled = flowType === 'TODOS';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        Tipo:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TaskTypeFilterValue)}
        disabled={isDisabled}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
