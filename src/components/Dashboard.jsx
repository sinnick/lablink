import React, { useState, useEffect, useCallback } from 'react';
import { useElectron, useElectronEvent } from '../hooks/useElectron';
import StatusIndicator from './StatusIndicator';
import FileQueue from './FileQueue';
import ActivityLog from './ActivityLog';
import ConfigPanel from './ConfigPanel';

const Dashboard = () => {
  const electron = useElectron();

  // Estado
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [config, setConfig] = useState(null);
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProcessed: 0,
    totalSent: 0,
    totalInvalid: 0,
    totalErrors: 0
  });

  // Cargar configuración inicial
  useEffect(() => {
    const loadConfig = async () => {
      if (electron.isElectron) {
        const result = await electron.config.get();
        if (result?.success) {
          setConfig(result.config);
          // Si no hay carpeta configurada, abrir panel de configuración
          if (!result.config.ruta || result.config.ruta === '') {
            setConfigPanelOpen(true);
          }
        }

        // Obtener estado del monitor
        const statusResult = await electron.monitor.getStatus();
        if (statusResult?.success) {
          setIsMonitoring(statusResult.isMonitoring);
          if (statusResult.stats) {
            setStats(statusResult.stats);
          }
        }
      }
    };

    loadConfig();
  }, [electron]);

  // Agregar actividad
  const addActivity = useCallback((type, data) => {
    const activity = {
      type,
      timestamp: data.timestamp || new Date().toISOString(),
      ...data
    };

    setActivities(prev => [activity, ...prev].slice(0, 100)); // Mantener solo las últimas 100
  }, []);

  // Actualizar archivo en la cola
  const updateFile = useCallback((fileName, updates) => {
    setFiles(prev => {
      const existingIndex = prev.findIndex(f => f.fileName === fileName);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...updates };
        return updated;
      } else {
        return [{ fileName, ...updates }, ...prev];
      }
    });
  }, []);

  // Remover archivo de la cola
  const removeFile = useCallback((fileName) => {
    setTimeout(() => {
      setFiles(prev => prev.filter(f => f.fileName !== fileName));
    }, 3000); // Mantener 3 segundos para que el usuario vea el resultado
  }, []);

  // Event Listeners
  useElectronEvent('file:detected', useCallback((data) => {
    updateFile(data.fileName, {
      status: 'detected',
      filePath: data.filePath
    });
    addActivity('detected', data);
  }, [updateFile, addActivity]));

  useElectronEvent('file:validating', useCallback((data) => {
    updateFile(data.fileName, { status: 'validating' });
  }, [updateFile]));

  useElectronEvent('file:valid', useCallback((data) => {
    updateFile(data.fileName, {
      status: 'valid',
      parts: data.parts
    });
  }, [updateFile]));

  useElectronEvent('file:invalid', useCallback((data) => {
    updateFile(data.fileName, {
      status: 'invalid',
      errors: data.errors
    });
    addActivity('invalid', {
      fileName: data.fileName,
      errors: data.errors,
      message: 'Archivo inválido'
    });
    removeFile(data.fileName);

    setStats(prev => ({
      ...prev,
      totalInvalid: prev.totalInvalid + 1,
      totalProcessed: prev.totalProcessed + 1
    }));
  }, [updateFile, addActivity, removeFile]));

  useElectronEvent('file:sending', useCallback((data) => {
    updateFile(data.fileName, {
      status: 'sending',
      progress: 0
    });
  }, [updateFile]));

  useElectronEvent('file:progress', useCallback((data) => {
    updateFile(data.fileName, {
      status: 'sending',
      progress: data.progress,
      fileSize: data.fileSize
    });
  }, [updateFile]));

  useElectronEvent('file:sent', useCallback((data) => {
    updateFile(data.fileName, {
      status: 'sent',
      progress: 100
    });
    addActivity('sent', {
      fileName: data.fileName,
      fileSize: data.fileSize,
      message: 'Archivo enviado correctamente'
    });
    removeFile(data.fileName);

    setStats(prev => ({
      ...prev,
      totalSent: prev.totalSent + 1,
      totalProcessed: prev.totalProcessed + 1
    }));

    // Mostrar notificación si está habilitado
    if (config?.notifications) {
      electron.notification.show('Archivo enviado', `${data.fileName} se envió correctamente`);
    }
  }, [updateFile, addActivity, removeFile, config, electron]));

  useElectronEvent('file:error', useCallback((data) => {
    updateFile(data.fileName, {
      status: 'error',
      error: data.error
    });
    addActivity('error', {
      fileName: data.fileName,
      error: data.error,
      message: 'Error al enviar archivo'
    });

    setStats(prev => ({
      ...prev,
      totalErrors: prev.totalErrors + 1,
      totalProcessed: prev.totalProcessed + 1
    }));
  }, [updateFile, addActivity]));

  useElectronEvent('server:status', useCallback((data) => {
    setServerOnline(data.online);
  }, []));

  useElectronEvent('monitor:status', useCallback((data) => {
    setIsMonitoring(data.monitoring);
    if (data.monitoring) {
      addActivity('monitor:started', {
        message: 'Monitoreo iniciado',
        path: data.path
      });
    } else {
      addActivity('monitor:stopped', {
        message: 'Monitoreo detenido'
      });
    }
  }, [addActivity]));

  useElectronEvent('menu:open-config', useCallback(() => {
    setConfigPanelOpen(true);
  }, []));

  // Handlers
  const handleToggleMonitor = async () => {
    if (!config || !config.ruta) {
      setConfigPanelOpen(true);
      return;
    }

    if (isMonitoring) {
      await electron.monitor.stop();
    } else {
      await electron.monitor.start();
    }
  };

  const handleRetryFile = async (filePath) => {
    await electron.file.retry(filePath);
  };

  const handleConfigClose = async () => {
    setConfigPanelOpen(false);
    // Recargar configuración
    const result = await electron.config.get();
    if (result?.success) {
      setConfig(result.config);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LabLink PDF Monitor</h1>
              <p className="text-xs text-gray-500">Monitor de archivos de laboratorio</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfigPanelOpen(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuración
            </button>

            <button
              onClick={handleToggleMonitor}
              className={isMonitoring ? 'btn-danger' : 'btn-success'}
            >
              {isMonitoring ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Detener Monitoreo
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Iniciar Monitoreo
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-6">
        <div className="h-full grid grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              <StatusIndicator
                label="Estado del Servidor"
                status={serverOnline ? 'online' : 'offline'}
                subtitle={config?.destino}
              />
              <StatusIndicator
                label="Monitoreo de Archivos"
                status={isMonitoring ? 'monitoring' : 'stopped'}
                subtitle={config?.ruta}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="card text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalProcessed}</p>
                <p className="text-xs text-gray-600 mt-1">Procesados</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-green-600">{stats.totalSent}</p>
                <p className="text-xs text-gray-600 mt-1">Enviados</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.totalInvalid}</p>
                <p className="text-xs text-gray-600 mt-1">Inválidos</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-red-600">{stats.totalErrors}</p>
                <p className="text-xs text-gray-600 mt-1">Errores</p>
              </div>
            </div>

            {/* File Queue */}
            <div className="flex-1 overflow-hidden">
              <FileQueue files={files} onRetry={handleRetryFile} />
            </div>
          </div>

          {/* Right Column - Activity Log */}
          <div className="overflow-hidden">
            <ActivityLog activities={activities} />
          </div>
        </div>
      </main>

      {/* Config Panel */}
      <ConfigPanel
        isOpen={configPanelOpen}
        onClose={handleConfigClose}
        currentConfig={config}
      />
    </div>
  );
};

export default Dashboard;
