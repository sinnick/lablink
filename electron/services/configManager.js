const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ConfigManager {
  constructor() {
    // Usar la ruta del proyecto en desarrollo, userData en producción
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
      this.configPath = path.join(process.cwd(), 'config.json');
    } else {
      const userDataPath = app.getPath('userData');
      this.configPath = path.join(userDataPath, 'config.json');

      // Si no existe config en userData, copiar el default
      if (!fs.existsSync(this.configPath)) {
        const defaultConfigPath = path.join(process.resourcesPath, 'config.json');
        if (fs.existsSync(defaultConfigPath)) {
          fs.copyFileSync(defaultConfigPath, this.configPath);
        }
      }
    }

    this.defaultConfig = {
      ruta: '',
      destino: 'http://www.labinfo.com.ar/api/lablink/pdf',
      autoStart: false,
      notifications: true,
      monitorInterval: 5000
    };

    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(data);

        // Merge con valores por defecto para mantener retrocompatibilidad
        return {
          ...this.defaultConfig,
          ...config
        };
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }

    // Si no existe o hay error, crear archivo con config por defecto
    this.saveConfig(this.defaultConfig);
    return { ...this.defaultConfig };
  }

  saveConfig(newConfig) {
    try {
      // Validar configuración
      if (!this.validateConfig(newConfig)) {
        throw new Error('Configuración inválida');
      }

      this.config = {
        ...this.config,
        ...newConfig
      };

      // Asegurar que el directorio existe
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 4),
        'utf8'
      );

      return true;
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      throw error;
    }
  }

  validateConfig(config) {
    // Validar que existe la ruta si está configurada
    if (config.ruta && config.ruta !== '') {
      if (!fs.existsSync(config.ruta)) {
        throw new Error(`La ruta no existe: ${config.ruta}`);
      }
    }

    // Validar URL del servidor
    if (config.destino) {
      try {
        new URL(config.destino);
      } catch {
        throw new Error('URL del servidor inválida');
      }
    }

    return true;
  }

  getConfig() {
    return { ...this.config };
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    this.saveConfig(this.config);
  }

  getConfigPath() {
    return this.configPath;
  }
}

module.exports = ConfigManager;
