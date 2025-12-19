const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const axios = require('axios');
const log = require('electron-log');

class FileSender {
  constructor(serverUrl, onProgress) {
    this.serverUrl = serverUrl;
    this.onProgress = onProgress || (() => {});
    this.activeUploads = new Map();
  }

  /**
   * Envía un archivo PDF al servidor
   * @param {string} filePath - Ruta completa del archivo
   * @param {string} fileName - Nombre del archivo
   * @returns {Promise<Object>} Resultado del envío
   */
  async send(filePath, fileName) {
    const uploadId = `${fileName}-${Date.now()}`;

    try {
      log.info(`Iniciando envío de archivo: ${fileName}`);

      // Obtener tamaño del archivo
      const stats = fsSync.statSync(filePath);
      const fileSize = stats.size;

      this.activeUploads.set(uploadId, {
        fileName,
        filePath,
        fileSize,
        progress: 0,
        status: 'uploading'
      });

      // Leer archivo en base64
      this.onProgress({
        fileName,
        status: 'reading',
        progress: 0,
        fileSize
      });

      const fileContent = await fs.readFile(filePath, 'base64');

      this.onProgress({
        fileName,
        status: 'uploading',
        progress: 25,
        fileSize
      });

      // Enviar al servidor
      const response = await axios({
        method: 'post',
        url: this.serverUrl,
        data: {
          filename: fileName,
          pdf: fileContent
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 segundos timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            25 + (progressEvent.loaded / progressEvent.total) * 75
          );

          this.onProgress({
            fileName,
            status: 'uploading',
            progress: percentCompleted,
            fileSize,
            uploaded: progressEvent.loaded,
            total: progressEvent.total
          });
        }
      });

      log.info(`Archivo enviado exitosamente: ${fileName}`, response.data);

      this.activeUploads.delete(uploadId);

      return {
        success: true,
        fileName,
        response: response.data,
        fileSize
      };

    } catch (error) {
      log.error(`Error al enviar archivo ${fileName}:`, error.message);

      this.activeUploads.delete(uploadId);

      return {
        success: false,
        fileName,
        error: error.response?.data || error.message,
        errorType: this.categorizeError(error)
      };
    }
  }

  /**
   * Mueve un archivo a una carpeta específica
   * @param {string} filePath - Ruta del archivo origen
   * @param {string} targetFolder - Carpeta destino
   * @returns {Promise<Object>} Resultado de la operación
   */
  async moveFile(filePath, targetFolder) {
    try {
      const fileName = path.basename(filePath);
      const targetPath = path.join(targetFolder, fileName);

      // Asegurar que la carpeta destino existe
      await this.ensureDir(targetFolder);

      // Mover archivo
      await fs.rename(filePath, targetPath);

      log.info(`Archivo movido: ${fileName} -> ${targetFolder}`);

      return {
        success: true,
        fileName,
        newPath: targetPath
      };

    } catch (error) {
      log.error(`Error al mover archivo:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Asegura que un directorio existe, creándolo si es necesario
   * @param {string} dirPath - Ruta del directorio
   */
  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      log.info(`Directorio creado: ${dirPath}`);
    }
  }

  /**
   * Categoriza el tipo de error
   * @param {Error} error - Error capturado
   * @returns {string} Tipo de error
   */
  categorizeError(error) {
    if (error.code === 'ENOENT') {
      return 'file_not_found';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return 'connection_error';
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return 'timeout';
    } else if (error.response) {
      return 'server_error';
    } else {
      return 'unknown';
    }
  }

  /**
   * Verifica la conectividad con el servidor
   * @returns {Promise<Object>} Estado de la conexión
   */
  async checkServerHealth() {
    try {
      // Intentar hacer una petición OPTIONS al servidor
      const response = await axios({
        method: 'options',
        url: this.serverUrl,
        timeout: 5000
      });

      return {
        online: true,
        statusCode: response.status
      };

    } catch (error) {
      // Si el servidor responde con 405 (Method Not Allowed) o 400-499,
      // significa que está online pero no acepta ese método
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        return {
          online: true,
          statusCode: error.response.status
        };
      }

      log.warn('Servidor no disponible:', error.message);

      return {
        online: false,
        error: error.message,
        errorType: this.categorizeError(error)
      };
    }
  }

  /**
   * Actualiza la URL del servidor
   * @param {string} newUrl - Nueva URL
   */
  updateServerUrl(newUrl) {
    this.serverUrl = newUrl;
    log.info(`URL del servidor actualizada: ${newUrl}`);
  }

  /**
   * Obtiene el estado de las cargas activas
   * @returns {Array} Lista de cargas activas
   */
  getActiveUploads() {
    return Array.from(this.activeUploads.values());
  }

  /**
   * Cancela todas las cargas activas
   */
  cancelAll() {
    this.activeUploads.clear();
  }
}

module.exports = FileSender;
