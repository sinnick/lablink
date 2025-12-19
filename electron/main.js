const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const FileMonitor = require('./services/fileMonitor');
const ConfigManager = require('./services/configManager');

// Configurar logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Hot reload en desarrollo
if (!app.isPackaged) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (e) {
    log.warn('electron-reload no disponible:', e.message);
  }
}

let mainWindow = null;
let tray = null;
let fileMonitor = null;
let isQuitting = false;
let configManagerInstance = null;

// Singleton para ConfigManager
function getConfigManager() {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager();
  }
  return configManagerInstance;
}

// Desarrollo o producción
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const VITE_DEV_SERVER_URL = 'http://localhost:5174';

// Helper para obtener el path del ícono
function getIconPath() {
  const iconPath = path.join(__dirname, '../build/icon.ico');
  return fs.existsSync(iconPath) ? iconPath : null;
}

function createWindow() {
  const windowOptions = {
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#f3f4f6'
  };

  const iconPath = getIconPath();
  if (iconPath) {
    windowOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // Cargar la aplicación
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('Ventana principal mostrada');
  });

  // Minimizar a bandeja en lugar de cerrar
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      // Mostrar notificación
      if (Notification.isSupported()) {
        const notifOptions = {
          title: 'LabLink PDF Monitor',
          body: 'La aplicación continúa ejecutándose en segundo plano'
        };
        const iconPath = getIconPath();
        if (iconPath) {
          notifOptions.icon = iconPath;
        }
        new Notification(notifOptions).show();
      }
    }
    return false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

function createTray() {
  const iconPath = getIconPath();
  if (!iconPath) {
    log.warn('No se encontró el ícono, omitiendo creación de bandeja del sistema');
    return;
  }

  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar LabLink',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Monitoreo',
      submenu: [
        {
          label: 'Iniciar',
          click: () => {
            if (fileMonitor) {
              fileMonitor.start();
            }
          }
        },
        {
          label: 'Detener',
          click: () => {
            if (fileMonitor) {
              fileMonitor.stop();
            }
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('LabLink PDF Monitor');

  tray.on('click', () => {
    mainWindow.show();
  });

  log.info('Bandeja del sistema creada');
}

function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Configuración',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu:open-config');
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Monitoreo',
      submenu: [
        {
          label: 'Iniciar',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (fileMonitor) {
              fileMonitor.start();
            }
          }
        },
        {
          label: 'Detener',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (fileMonitor) {
              fileMonitor.stop();
            }
          }
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollo' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de LabLink',
              message: 'LabLink PDF Monitor',
              detail: 'Versión 1.0.0\n\nAplicación de monitoreo y envío de PDFs de laboratorio.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Inicializar la aplicación
app.whenReady().then(() => {
  log.info('Aplicación iniciada');
  createWindow();
  createTray();
  initializeServices();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // No cerrar la app, solo ocultar
    if (!isQuitting) {
      return;
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  if (fileMonitor) {
    fileMonitor.stop();
  }
});

// Inicializar servicios
function initializeServices() {
  const configManager = getConfigManager();

  // Crear instancia del monitor de archivos
  fileMonitor = new FileMonitor(configManager, (eventName, data) => {
    // Enviar eventos al renderer
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send(eventName, data);
    }
  });

  log.info('Servicios inicializados');
}

// ==================== IPC HANDLERS ====================

// Configuración
ipcMain.handle('config:get', async () => {
  try {
    const configManager = getConfigManager();
    return { success: true, config: configManager.getConfig() };
  } catch (error) {
    log.error('Error al obtener configuración:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config:save', async (event, newConfig) => {
  try {
    const configManager = getConfigManager();
    configManager.saveConfig(newConfig);

    // Reiniciar el monitor con la nueva configuración
    if (fileMonitor) {
      fileMonitor.updateConfig(newConfig);
    }

    return { success: true };
  } catch (error) {
    log.error('Error al guardar configuración:', error);
    return { success: false, error: error.message };
  }
});

// Selector de carpeta
ipcMain.handle('folder:select', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Seleccionar carpeta de PDFs'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }

  return { success: false };
});

// Monitoreo
ipcMain.handle('monitor:start', async () => {
  try {
    if (fileMonitor) {
      fileMonitor.start();
      return { success: true };
    }
    return { success: false, error: 'Monitor no inicializado' };
  } catch (error) {
    log.error('Error al iniciar monitoreo:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('monitor:stop', async () => {
  try {
    if (fileMonitor) {
      fileMonitor.stop();
      return { success: true };
    }
    return { success: false, error: 'Monitor no inicializado' };
  } catch (error) {
    log.error('Error al detener monitoreo:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('monitor:status', async () => {
  try {
    if (fileMonitor) {
      return {
        success: true,
        isMonitoring: fileMonitor.isMonitoring(),
        stats: fileMonitor.getStats()
      };
    }
    return { success: false, error: 'Monitor no inicializado' };
  } catch (error) {
    log.error('Error al obtener estado del monitor:', error);
    return { success: false, error: error.message };
  }
});

// Reintentar archivo
ipcMain.handle('file:retry', async (event, filePath) => {
  try {
    if (fileMonitor) {
      await fileMonitor.retryFile(filePath);
      return { success: true };
    }
    return { success: false, error: 'Monitor no inicializado' };
  } catch (error) {
    log.error('Error al reintentar archivo:', error);
    return { success: false, error: error.message };
  }
});

// Notificación
ipcMain.handle('notification:show', async (event, { title, body }) => {
  try {
    if (Notification.isSupported()) {
      const notifOptions = { title, body };
      const iconPath = getIconPath();
      if (iconPath) {
        notifOptions.icon = iconPath;
      }
      new Notification(notifOptions).show();
      return { success: true };
    }
    return { success: false, error: 'Notificaciones no soportadas' };
  } catch (error) {
    log.error('Error al mostrar notificación:', error);
    return { success: false, error: error.message };
  }
});

// Logs
ipcMain.handle('logs:get', async () => {
  try {
    const logPath = log.transports.file.getFile().path;
    return { success: true, path: logPath };
  } catch (error) {
    log.error('Error al obtener logs:', error);
    return { success: false, error: error.message };
  }
});

log.info('Handlers IPC registrados');
