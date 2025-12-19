import React, { useState, useEffect, useRef } from 'react';
import { useElectron } from '../hooks/useElectron';

const ConfigPanel = ({ isOpen, onClose, onConfigSaved }) => {
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
  const [isLoading, setIsLoading] = useState(true);
  const hasLoaded = useRef(false);

  // Cargar configuración cuando el panel se abre
  useEffect(() => {
    const loadConfig = async () => {
      if (isOpen && !hasLoaded.current) {
        setIsLoading(true);
        try {
          const result = await electron.config.get();
          if (result?.success && result.config) {
            setConfig(prev => ({
              ...prev,
              ...result.config
            }));
          }
        } catch (err) {
          console.error('Error loading config:', err);
        } finally {
          setIsLoading(false);
          hasLoaded.current = true;
        }
      }
    };

    if (isOpen) {
      loadConfig();
    } else {
      // Reset cuando se cierra para la próxima vez
      hasLoaded.current = false;
    }
  }, [isOpen]);

  const handleSelectFolder = async () => {
    const result = await electron.config.selectFolder();
    if (result?.success && result.path) {
      // Usar callback form para evitar closure stale
      setConfig(prev => ({ ...prev, ruta: result.path }));
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Configuración</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-surface-light"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin">
          <div className="space-y-5">
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
                  className="btn-secondary flex-shrink-0 px-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
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
              <p className="text-xs text-gray-500 mt-1.5">
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
                min={1000}
                max={30000}
                step={1000}
                value={config.monitorInterval}
                onChange={(e) => setConfig({ ...config, monitorInterval: parseInt(e.target.value) })}
                className="w-full h-2 bg-surface-light rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1s</span>
                <span>15s</span>
                <span>30s</span>
              </div>
            </div>

            {/* Auto-inicio */}
            <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-200">Iniciar monitoreo automáticamente</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  El monitoreo comenzará al abrir la aplicación
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, autoStart: !config.autoStart })}
                className={`w-11 h-6 rounded-full transition-colors relative ${config.autoStart ? 'bg-primary-600' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.autoStart ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Notificaciones */}
            <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-200">Notificaciones de escritorio</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mostrar notificaciones cuando se envían archivos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, notifications: !config.notifications })}
                className={`w-11 h-6 rounded-full transition-colors relative ${config.notifications ? 'bg-primary-600' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-emerald-400">Configuración guardada correctamente</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-3">
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
