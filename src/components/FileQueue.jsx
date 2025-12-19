import React from 'react';
import ProgressBar from './ProgressBar';

const FileQueue = ({ files, onRetry }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'detected':
        return (
          <div className="w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'validating':
        return (
          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-amber-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      case 'valid':
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'sending':
        return (
          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
        );
      case 'sent':
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'invalid':
        return (
          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      detected: 'Detectado',
      validating: 'Validando',
      valid: 'Válido',
      sending: 'Enviando',
      sent: 'Enviado',
      invalid: 'Inválido',
      error: 'Error'
    };
    return statusMap[status] || status;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  if (files.length === 0) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-gray-500 py-12">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium text-gray-400">No hay archivos en cola</p>
        <p className="text-xs mt-1">Los archivos detectados aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      <h3 className="text-base font-semibold text-gray-100 mb-3">Cola de Archivos</h3>
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 min-h-0">
        {files.map((file, index) => (
          <div
            key={`${file.fileName}-${index}`}
            className="bg-surface-light rounded-xl p-3 hover:bg-gray-600/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(file.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {file.fileName}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {getStatusText(file.status)}
                  </span>
                </div>

                {file.fileSize && (
                  <p className="text-xs text-gray-500 mb-2">
                    {formatFileSize(file.fileSize)}
                  </p>
                )}

                {file.status === 'sending' && file.progress !== undefined && (
                  <div className="mb-2">
                    <ProgressBar progress={file.progress} status="active" size="sm" />
                  </div>
                )}

                {file.errors && file.errors.length > 0 && (
                  <div className="mt-2">
                    {file.errors.map((error, idx) => (
                      <p key={idx} className="text-xs text-amber-400 mb-1">
                        • {error}
                      </p>
                    ))}
                  </div>
                )}

                {file.error && (
                  <p className="text-xs text-red-400 mt-2">
                    {file.error}
                  </p>
                )}

                {file.status === 'error' && onRetry && (
                  <button
                    onClick={() => onRetry(file.filePath)}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reintentar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileQueue;
