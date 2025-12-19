import { useEffect, useCallback } from 'react';

// Hook para interactuar con Electron API
export const useElectron = () => {
  const api = window.electronAPI;

  // Verificar si estamos en Electron
  const isElectron = () => {
    return api !== undefined;
  };

  // Configuración
  const getConfig = useCallback(async () => {
    if (!isElectron()) return null;
    return await api.getConfig();
  }, [api]);

  const saveConfig = useCallback(async (config) => {
    if (!isElectron()) return null;
    return await api.saveConfig(config);
  }, [api]);

  const selectFolder = useCallback(async () => {
    if (!isElectron()) return null;
    return await api.selectFolder();
  }, [api]);

  // Monitoreo
  const startMonitor = useCallback(async () => {
    if (!isElectron()) return null;
    return await api.startMonitor();
  }, [api]);

  const stopMonitor = useCallback(async () => {
    if (!isElectron()) return null;
    return await api.stopMonitor();
  }, [api]);

  const getMonitorStatus = useCallback(async () => {
    if (!isElectron()) return null;
    return await api.getMonitorStatus();
  }, [api]);

  // Archivos
  const retryFile = useCallback(async (filePath) => {
    if (!isElectron()) return null;
    return await api.retryFile(filePath);
  }, [api]);

  // Notificaciones
  const showNotification = useCallback(async (title, body) => {
    if (!isElectron()) return null;
    return await api.showNotification(title, body);
  }, [api]);

  // Logs
  const getLogs = useCallback(async () => {
    if (!isElectron()) return null;
    return await api.getLogs();
  }, [api]);

  return {
    isElectron: isElectron(),
    config: {
      get: getConfig,
      save: saveConfig,
      selectFolder,
    },
    monitor: {
      start: startMonitor,
      stop: stopMonitor,
      getStatus: getMonitorStatus,
    },
    file: {
      retry: retryFile,
    },
    notification: {
      show: showNotification,
    },
    logs: {
      get: getLogs,
    },
  };
};

// Hook para escuchar eventos de Electron
export const useElectronEvent = (eventName, callback) => {
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const eventHandlers = {
      'file:detected': api.onFileDetected,
      'file:validating': api.onFileValidating,
      'file:valid': api.onFileValid,
      'file:invalid': api.onFileInvalid,
      'file:sending': api.onFileSending,
      'file:progress': api.onFileProgress,
      'file:sent': api.onFileSent,
      'file:error': api.onFileError,
      'server:status': api.onServerStatus,
      'monitor:status': api.onMonitorStatus,
      'config:loaded': api.onConfigLoaded,
      'menu:open-config': api.onMenuOpenConfig,
    };

    const handler = eventHandlers[eventName];
    if (handler) {
      handler(callback);
    }

    // Cleanup
    return () => {
      // Los listeners de Electron persisten, así que no necesitamos cleanup
      // a menos que queramos removerlos explícitamente
    };
  }, [eventName, callback]);
};

export default useElectron;
