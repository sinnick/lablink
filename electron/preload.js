const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuración
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  selectFolder: () => ipcRenderer.invoke('folder:select'),

  // Monitoreo
  startMonitor: () => ipcRenderer.invoke('monitor:start'),
  stopMonitor: () => ipcRenderer.invoke('monitor:stop'),
  getMonitorStatus: () => ipcRenderer.invoke('monitor:status'),

  // Archivos
  retryFile: (filePath) => ipcRenderer.invoke('file:retry', filePath),

  // Notificaciones
  showNotification: (title, body) => ipcRenderer.invoke('notification:show', { title, body }),

  // Logs
  getLogs: () => ipcRenderer.invoke('logs:get'),

  // Listeners para eventos del main process
  onFileDetected: (callback) => {
    ipcRenderer.on('file:detected', (event, data) => callback(data));
  },

  onFileValidating: (callback) => {
    ipcRenderer.on('file:validating', (event, data) => callback(data));
  },

  onFileValid: (callback) => {
    ipcRenderer.on('file:valid', (event, data) => callback(data));
  },

  onFileInvalid: (callback) => {
    ipcRenderer.on('file:invalid', (event, data) => callback(data));
  },

  onFileSending: (callback) => {
    ipcRenderer.on('file:sending', (event, data) => callback(data));
  },

  onFileProgress: (callback) => {
    ipcRenderer.on('file:progress', (event, data) => callback(data));
  },

  onFileSent: (callback) => {
    ipcRenderer.on('file:sent', (event, data) => callback(data));
  },

  onFileError: (callback) => {
    ipcRenderer.on('file:error', (event, data) => callback(data));
  },

  onServerStatus: (callback) => {
    ipcRenderer.on('server:status', (event, data) => callback(data));
  },

  onMonitorStatus: (callback) => {
    ipcRenderer.on('monitor:status', (event, data) => callback(data));
  },

  onConfigLoaded: (callback) => {
    ipcRenderer.on('config:loaded', (event, data) => callback(data));
  },

  onMenuOpenConfig: (callback) => {
    ipcRenderer.on('menu:open-config', () => callback());
  },

  // Remover listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
