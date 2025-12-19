import React from 'react';

const StatusIndicator = ({ label, status, subtitle }) => {
  const statusConfig = {
    online: {
      color: 'bg-emerald-500',
      pulse: 'animate-pulse-slow',
      text: 'Conectado',
      textColor: 'text-emerald-400'
    },
    offline: {
      color: 'bg-red-500',
      pulse: '',
      text: 'Desconectado',
      textColor: 'text-red-400'
    },
    checking: {
      color: 'bg-amber-500',
      pulse: 'animate-pulse',
      text: 'Verificando...',
      textColor: 'text-amber-400'
    },
    monitoring: {
      color: 'bg-blue-500',
      pulse: 'animate-pulse-slow',
      text: 'Monitoreando',
      textColor: 'text-blue-400'
    },
    stopped: {
      color: 'bg-gray-500',
      pulse: '',
      text: 'Detenido',
      textColor: 'text-gray-400'
    }
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <div className="card flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
          {config.pulse && (
            <div className={`absolute inset-0 w-3 h-3 rounded-full ${config.color} ${config.pulse} opacity-75`}></div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textColor}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {config.text}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;
