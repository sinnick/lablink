import { useEffect } from 'react';

// Hook para interactuar con Electron API
export const useElectron = () => {
  const api = window.electronAPI;
  const isElectronEnv = api !== undefined;

  return {
    isElectron: isElectronEnv,
    config: {
      get: async () => {
        if (!api) return null;
        return await api.getConfig();
      },
      save: async (config) => {
        if (!api) return null;
        return await api.saveConfig(config);
      },
      selectFolder: async () => {
        if (!api) return null;
        return await api.selectFolder();
      },
    },
    monitor: {
      start: async () => {
        if (!api) return null;
        return await api.startMonitor();
      },
      stop: async () => {
        if (!api) return null;
        return await api.stopMonitor();
      },
      getStatus: async () => {
        if (!api) return null;
        return await api.getMonitorStatus();
      },
    },
    file: {
      retry: async (filePath) => {
        if (!api) return null;
        return await api.retryFile(filePath);
      },
    },
    notification: {
      show: async (title, body) => {
        if (!api) return null;
        return await api.showNotification(title, body);
      },
    },
    logs: {
      get: async () => {
        if (!api) return null;
        return await api.getLogs();
      },
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
