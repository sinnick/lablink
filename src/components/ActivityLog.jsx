import React, { useState } from 'react';

const ActivityLog = ({ activities }) => {
  const [filter, setFilter] = useState('all');

  const getStatusDot = (type) => {
    const colors = {
      sent: 'bg-emerald-400',
      invalid: 'bg-amber-400',
      error: 'bg-red-400',
      'monitor:started': 'bg-blue-400',
      'monitor:stopped': 'bg-gray-400',
      detected: 'bg-gray-400',
    };
    return <div className={`w-1.5 h-1.5 rounded-full ${colors[type] || 'bg-gray-400'}`} />;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const getActivityText = (activity) => {
    if (activity.fileName) return activity.fileName;
    if (activity.type === 'monitor:started') return 'Monitoreo iniciado';
    if (activity.type === 'monitor:stopped') return 'Monitoreo detenido';
    return activity.message || activity.type;
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(activity => activity.type === filter);

  const stats = {
    total: activities.length,
    sent: activities.filter(a => a.type === 'sent').length,
    invalid: activities.filter(a => a.type === 'invalid').length,
    error: activities.filter(a => a.type === 'error').length,
  };

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-100 mb-2">Actividad</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              filter === 'all' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            Todo {stats.total}
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              filter === 'sent' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            Env {stats.sent}
          </button>
          <button
            onClick={() => setFilter('invalid')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              filter === 'invalid' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            Inv {stats.invalid}
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              filter === 'error' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            Err {stats.error}
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 py-4">
            <p className="text-xs">Sin actividad</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredActivities.map((activity, index) => (
              <div
                key={`${activity.timestamp}-${index}`}
                className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-surface-light transition-colors group"
              >
                {getStatusDot(activity.type)}
                <span className="text-xs text-gray-300 truncate flex-1">
                  {getActivityText(activity)}
                </span>
                <span className="text-[10px] text-gray-600 group-hover:text-gray-500">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
