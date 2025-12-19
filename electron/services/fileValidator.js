const path = require('path');

class FileValidator {
  constructor() {
    // Patrones de validación según el formato: LABORATORIO_PROTOCOLO_DNI.pdf
    this.patterns = {
      laboratorio: /^[0-9]{4}$/,        // 4 dígitos
      protocolo: /^[0-9]{1,8}$/,        // 1 a 8 dígitos
      dni: /^[0-9]{7,8}$/               // 7 u 8 dígitos
    };
  }

  /**
   * Valida un archivo PDF
   * @param {string} fileName - Nombre del archivo
   * @returns {Object} Resultado de la validación
   */
  validate(fileName) {
    const result = {
      isValid: false,
      fileName,
      errors: [],
      parts: {}
    };

    // Verificar que sea un PDF
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      result.errors.push('El archivo debe ser un PDF');
      return result;
    }

    // Remover la extensión .pdf
    const nameWithoutExt = fileName.slice(0, -4);

    // Separar por guión bajo
    const parts = nameWithoutExt.split('_');

    if (parts.length !== 3) {
      result.errors.push('El nombre debe tener el formato: LABORATORIO_PROTOCOLO_DNI.pdf');
      return result;
    }

    const [laboratorio, protocolo, dni] = parts;

    // Validar cada parte
    const validations = [
      {
        name: 'laboratorio',
        value: laboratorio,
        pattern: this.patterns.laboratorio,
        description: '4 dígitos para el código de laboratorio'
      },
      {
        name: 'protocolo',
        value: protocolo,
        pattern: this.patterns.protocolo,
        description: '1 a 8 dígitos para el número de protocolo'
      },
      {
        name: 'dni',
        value: dni,
        pattern: this.patterns.dni,
        description: '7 u 8 dígitos para el DNI'
      }
    ];

    validations.forEach(({ name, value, pattern, description }) => {
      result.parts[name] = value;

      if (!pattern.test(value)) {
        result.errors.push(`${name.toUpperCase()} inválido: se esperan ${description}, se obtuvo "${value}"`);
      }
    });

    // El archivo es válido si no hay errores
    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * Valida múltiples archivos
   * @param {Array<string>} fileNames - Array de nombres de archivos
   * @returns {Array<Object>} Resultados de validación
   */
  validateMany(fileNames) {
    return fileNames.map(fileName => this.validate(fileName));
  }

  /**
   * Filtra solo archivos PDF de un array de archivos
   * @param {Array<string>} files - Array de nombres de archivos
   * @returns {Array<string>} Archivos PDF
   */
  filterPDFs(files) {
    return files.filter(file => file.toLowerCase().endsWith('.pdf'));
  }
}

module.exports = FileValidator;
