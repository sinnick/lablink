const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const log = require('electron-log');
const FileValidator = require('./fileValidator');
const FileSender = require('./fileSender');

class FileMonitor {
  constructor(configManager, eventCallback) {
    this.configManager = configManager;
    this.eventCallback = eventCallback || (() => {});
    this.validator = new FileValidator();
    this.sender = null;
    this.watcher = null;
    this.monitoring = false;
    this.processingFiles = new Set();
    this.serverHealthCheckInterval = null;

    // Estadísticas
    this.stats = {
      totalProcessed: 0,
      totalSent: 0,
      totalInvalid: 0,
      totalErrors: 0,
      lastCheck: null
    };

    this.initialize();
  }

  initialize() {
    const config = this.configManager.getConfig();

    // Crear instancia del sender
    this.sender = new FileSender(
      config.destino,
      (progress) => this.handleProgress(progress)
    );

    // Auto-iniciar si está configurado
    if (config.autoStart && config.ruta) {
      setTimeout(() => this.start(), 2000);
    }
  }

  /**
   * Inicia el monitoreo de archivos
   */
  start() {
    const config = this.configManager.getConfig();

    if (!config.ruta || config.ruta === '') {
      log.warn('No hay carpeta configurada para monitorear');
      this.emit('monitor:status', {
        monitoring: false,
        error: 'No hay carpeta configurada'
      });
      return;
    }

    if (this.monitoring) {
      log.info('El monitoreo ya está activo');
      return;
    }

    try {
      log.info(`Iniciando monitoreo de carpeta: ${config.ruta}`);

      // Configurar watcher de chokidar
      this.watcher = chokidar.watch(path.join(config.ruta, '*.pdf'), {
        ignored: /(^|[\/\\])\../, // Ignorar archivos ocultos
        persistent: true,
        ignoreInitial: false, // Procesar archivos existentes
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        }
      });

      // Eventos del watcher
      this.watcher
        .on('add', (filePath) => this.handleNewFile(filePath))
        .on('error', (error) => {
          log.error('Error en el watcher:', error);
          this.emit('monitor:error', { error: error.message });
        })
        .on('ready', () => {
          log.info('Monitoreo iniciado y listo');
          this.monitoring = true;
          this.emit('monitor:status', {
            monitoring: true,
            path: config.ruta
          });
        });

      // Iniciar verificación de salud del servidor
      this.startServerHealthCheck();

    } catch (error) {
      log.error('Error al iniciar monitoreo:', error);
      this.emit('monitor:error', { error: error.message });
    }
  }

  /**
   * Detiene el monitoreo de archivos
   */
  stop() {
    if (!this.monitoring) {
      log.info('El monitoreo ya está detenido');
      return;
    }

    log.info('Deteniendo monitoreo');

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.serverHealthCheckInterval) {
      clearInterval(this.serverHealthCheckInterval);
      this.serverHealthCheckInterval = null;
    }

    this.monitoring = false;

    this.emit('monitor:status', {
      monitoring: false
    });
  }

  /**
   * Maneja un archivo nuevo detectado
   * @param {string} filePath - Ruta del archivo
   */
  async handleNewFile(filePath) {
    const fileName = path.basename(filePath);

    // Evitar procesar el mismo archivo múltiples veces
    if (this.processingFiles.has(fileName)) {
      return;
    }

    this.processingFiles.add(fileName);

    log.info(`Archivo detectado: ${fileName}`);

    this.emit('file:detected', {
      fileName,
      filePath,
      timestamp: new Date().toISOString()
    });

    try {
      // Validar archivo
      this.emit('file:validating', { fileName });

      const validation = this.validator.validate(fileName);

      if (validation.isValid) {
        log.info(`Archivo válido: ${fileName}`);

        this.emit('file:valid', {
          fileName,
          parts: validation.parts
        });

        // Enviar archivo
        await this.sendFile(filePath, fileName);

      } else {
        log.warn(`Archivo inválido: ${fileName}`, validation.errors);

        this.emit('file:invalid', {
          fileName,
          errors: validation.errors
        });

        // Mover a carpeta de inválidos
        await this.moveToInvalid(filePath);

        this.stats.totalInvalid++;
      }

      this.stats.totalProcessed++;

    } catch (error) {
      log.error(`Error procesando archivo ${fileName}:`, error);

      this.emit('file:error', {
        fileName,
        error: error.message
      });

      this.stats.totalErrors++;

    } finally {
      this.processingFiles.delete(fileName);
    }
  }

  /**
   * Envía un archivo al servidor
   * @param {string} filePath - Ruta del archivo
   * @param {string} fileName - Nombre del archivo
   */
  async sendFile(filePath, fileName) {
    this.emit('file:sending', {
      fileName,
      filePath
    });

    const result = await this.sender.send(filePath, fileName);

    if (result.success) {
      log.info(`Archivo enviado exitosamente: ${fileName}`);

      this.emit('file:sent', {
        fileName,
        response: result.response,
        fileSize: result.fileSize
      });

      // Mover a carpeta de enviados
      const config = this.configManager.getConfig();
      const sentFolder = path.join(config.ruta, 'enviados');
      await this.sender.moveFile(filePath, sentFolder);

      this.stats.totalSent++;

    } else {
      log.error(`Error al enviar archivo ${fileName}:`, result.error);

      this.emit('file:error', {
        fileName,
        error: result.error,
        errorType: result.errorType
      });

      this.stats.totalErrors++;
    }
  }

  /**
   * Mueve un archivo a la carpeta de inválidos
   * @param {string} filePath - Ruta del archivo
   */
  async moveToInvalid(filePath) {
    const config = this.configManager.getConfig();
    const invalidFolder = path.join(config.ruta, 'no validos');
    await this.sender.moveFile(filePath, invalidFolder);
  }

  /**
   * Maneja el progreso de la carga
   * @param {Object} progress - Datos de progreso
   */
  handleProgress(progress) {
    this.emit('file:progress', progress);
  }

  /**
   * Emite un evento al renderer
   * @param {string} eventName - Nombre del evento
   * @param {Object} data - Datos del evento
   */
  emit(eventName, data) {
    this.eventCallback(eventName, {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    });
  }

  /**
   * Inicia verificación periódica del servidor
   */
  startServerHealthCheck() {
    // Verificar inmediatamente
    this.checkServerHealth();

    // Verificar cada 30 segundos
    this.serverHealthCheckInterval = setInterval(() => {
      this.checkServerHealth();
    }, 30000);
  }

  /**
   * Verifica la salud del servidor
   */
  async checkServerHealth() {
    const health = await this.sender.checkServerHealth();

    this.emit('server:status', {
      online: health.online,
      error: health.error,
      errorType: health.errorType
    });

    this.stats.lastCheck = new Date().toISOString();
  }

  /**
   * Reintenta enviar un archivo
   * @param {string} filePath - Ruta del archivo
   */
  async retryFile(filePath) {
    const fileName = path.basename(filePath);
    log.info(`Reintentando archivo: ${fileName}`);

    await this.handleNewFile(filePath);
  }

  /**
   * Actualiza la configuración
   * @param {Object} newConfig - Nueva configuración
   */
  updateConfig(newConfig) {
    const wasMonitoring = this.monitoring;

    // Detener monitoreo si estaba activo
    if (wasMonitoring) {
      this.stop();
    }

    // Actualizar URL del servidor en el sender
    if (newConfig.destino) {
      this.sender.updateServerUrl(newConfig.destino);
    }

    // Reiniciar monitoreo si estaba activo y hay carpeta configurada
    if (wasMonitoring && newConfig.ruta) {
      setTimeout(() => this.start(), 1000);
    }
  }

  /**
   * Obtiene el estado del monitoreo
   * @returns {boolean}
   */
  isMonitoring() {
    return this.monitoring;
  }

  /**
   * Obtiene las estadísticas
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Resetea las estadísticas
   */
  resetStats() {
    this.stats = {
      totalProcessed: 0,
      totalSent: 0,
      totalInvalid: 0,
      totalErrors: 0,
      lastCheck: this.stats.lastCheck
    };
  }
}

module.exports = FileMonitor;
