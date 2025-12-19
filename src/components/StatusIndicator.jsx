import React from 'react';

const StatusIndicator = ({ label, status, subtitle }) => {
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      pulse: 'animate-pulse-slow',
      text: 'Conectado',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    offline: {
      color: 'bg-red-500',
      pulse: '',
      text: 'Desconectado',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    checking: {
      color: 'bg-yellow-500',
      pulse: 'animate-pulse',
      text: 'Verificando...',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    monitoring: {
      color: 'bg-blue-500',
      pulse: 'animate-pulse-slow',
      text: 'Monitoreando',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    stopped: {
      color: 'bg-gray-500',
      pulse: '',
      text: 'Detenido',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700'
    }
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <div className={`${config.bgColor} rounded-lg p-4 flex items-start gap-3`}>
      <div className="flex-shrink-0 mt-1">
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
        <p className={`text-xs ${config.textColor} opacity-75 mt-0.5`}>
          {config.text}
        </p>
        {subtitle && (
          <p className={`text-xs ${config.textColor} opacity-60 mt-1`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;
