import React from 'react';

const ProgressBar = ({ progress = 0, status = 'active', size = 'md', showPercentage = true }) => {
  const statusColors = {
    active: 'bg-blue-500',
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500'
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2'
  };

  const color = statusColors[status] || statusColors.active;
  const height = sizes[size] || sizes.md;

  // Asegurar que el progreso esté entre 0 y 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      {showPercentage && (
        <div className="flex items-center justify-end mb-1">
          <span className="text-xs font-medium text-gray-400">
            {Math.round(normalizedProgress)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-700 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${normalizedProgress}%` }}
        >
          {status === 'active' && normalizedProgress > 0 && normalizedProgress < 100 && (
            <div className="h-full w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
