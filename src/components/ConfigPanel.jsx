import React, { useState, useEffect } from 'react';
import { useElectron } from '../hooks/useElectron';

const ConfigPanel = ({ isOpen, onClose, currentConfig }) => {
  const electron = useElectron();
  const [config, setConfig] = useState({
    ruta: '',
    destino: '',
    autoStart: false,
    notifications: true,
    monitorInterval: 5000
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  const handleSelectFolder = async () => {
    const result = await electron.config.selectFolder();
    if (result?.success && result.path) {
      setConfig({ ...config, ruta: result.path });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess(false);

    try {
      // Validar configuración
      if (!config.ruta || config.ruta.trim() === '') {
        setError('Debe seleccionar una carpeta de PDFs');
        setIsSaving(false);
        return;
      }

      if (!config.destino || config.destino.trim() === '') {
        setError('Debe ingresar la URL del servidor');
        setIsSaving(false);
        return;
      }

      // Validar URL
      try {
        new URL(config.destino);
      } catch {
        setError('La URL del servidor no es válida');
        setIsSaving(false);
        return;
      }

      const result = await electron.config.save(config);

      if (result?.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result?.error || 'Error al guardar configuración');
      }
    } catch (err) {
      setError('Error inesperado al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Configuración</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Carpeta de PDFs */}
            <div>
              <label className="label">Carpeta de PDFs</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.ruta}
                  onChange={(e) => setConfig({ ...config, ruta: e.target.value })}
                  className="input flex-1"
                  placeholder="Selecciona la carpeta donde se guardan los PDFs"
                  readOnly
                />
                <button
                  onClick={handleSelectFolder}
                  className="btn-secondary flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Los archivos PDF se monitorearan en esta carpeta
              </p>
            </div>

            {/* URL del Servidor */}
            <div>
              <label className="label">URL del Servidor</label>
              <input
                type="text"
                value={config.destino}
                onChange={(e) => setConfig({ ...config, destino: e.target.value })}
                className="input"
                placeholder="http://www.ejemplo.com/api/endpoint"
              />
              <p className="text-xs text-gray-500 mt-1">
                Endpoint donde se enviarán los archivos PDF
              </p>
            </div>

            {/* Intervalo de Monitoreo */}
            <div>
              <label className="label">
                Intervalo de Verificación ({config.monitorInterval / 1000} segundos)
              </label>
              <input
                type="range"
                min="1000"
                max="30000"
                step="1000"
                value={config.monitorInterval}
                onChange={(e) => setConfig({ ...config, monitorInterval: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1s</span>
                <span>15s</span>
                <span>30s</span>
              </div>
            </div>

            {/* Auto-inicio */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Iniciar monitoreo automáticamente</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  El monitoreo comenzará al abrir la aplicación
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoStart}
                  onChange={(e) => setConfig({ ...config, autoStart: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Notificaciones */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Notificaciones de escritorio</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mostrar notificaciones cuando se envían archivos
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifications}
                  onChange={(e) => setConfig({ ...config, notifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700">Configuración guardada correctamente</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
