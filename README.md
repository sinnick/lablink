# LabLink PDF Monitor

Aplicación de escritorio para monitoreo y envío automático de archivos PDF de laboratorio.

## 🚀 Características

- ✅ **Monitoreo en tiempo real** de carpetas PDF
- ✅ **Validación automática** de nombres de archivo (formato: `LABORATORIO_PROTOCOLO_DNI.pdf`)
- ✅ **Envío automático** a servidor remoto
- ✅ **Interfaz elegante** con React y Tailwind CSS
- ✅ **Indicadores de estado** en tiempo real
- ✅ **Cola de archivos** con progreso de transferencia
- ✅ **Registro de actividades** filtrable
- ✅ **Notificaciones de escritorio** de Windows
- ✅ **Icono en bandeja del sistema** (system tray)
- ✅ **Panel de configuración** completo

## 📋 Requisitos

- Node.js 14 o superior
- Windows (principal), Linux, macOS

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install
```

## 🎯 Desarrollo

```bash
# Modo desarrollo (con hot reload)
npm run electron:dev
```

Esto iniciará:
1. Servidor de desarrollo de Vite en http://localhost:5173
2. Aplicación Electron con DevTools abierto

## 📦 Construcción

```bash
# Construir la aplicación
npm run build

# Crear instalador para Windows
npm run dist
```

El instalador se generará en la carpeta `dist/`.

## ⚙️ Configuración

Al iniciar la aplicación por primera vez, se abrirá el panel de configuración donde debes:

1. **Seleccionar carpeta de PDFs**: La carpeta que se monitoreará
2. **URL del servidor**: Endpoint donde se enviarán los archivos
3. **Configurar opciones**:
   - Auto-inicio del monitoreo
   - Notificaciones
   - Intervalo de verificación

### Formato de archivos

Los archivos PDF deben seguir este formato de nombre:

```
LABORATORIO_PROTOCOLO_DNI.pdf
```

Donde:
- **LABORATORIO**: 4 dígitos (ej: `0120`)
- **PROTOCOLO**: 1-8 dígitos (ej: `00067973`)
- **DNI**: 7-8 dígitos (ej: `45023292`)

Ejemplo válido: `0120_00067973_45023292.pdf`

### Organización de archivos

La aplicación creará automáticamente estas subcarpetas:
- `/enviados` - Archivos enviados correctamente
- `/no validos` - Archivos que no cumplen el formato

## 🎨 Interfaz

La interfaz incluye:

- **Indicadores de estado**: Servidor y monitoreo
- **Estadísticas**: Procesados, enviados, inválidos, errores
- **Cola de archivos**: Lista de archivos en proceso con progreso
- **Registro de actividad**: Historial filtrable de todas las operaciones

## 🔧 Scripts disponibles

```bash
npm run dev              # Servidor Vite para desarrollo
npm run build            # Construir aplicación React
npm run preview          # Vista previa de build
npm run electron:dev     # Modo desarrollo completo (Electron + Vite)
npm run electron:build   # Construir app Electron
npm run dist             # Crear instalador Windows
```

## 📁 Estructura del proyecto

```
lablink/
├── electron/               # Proceso principal de Electron
│   ├── main.js            # Entry point de Electron
│   ├── preload.js         # Script de preload (IPC seguro)
│   └── services/          # Servicios backend
│       ├── configManager.js
│       ├── fileMonitor.js
│       ├── fileSender.js
│       └── fileValidator.js
├── src/                   # Aplicación React
│   ├── components/        # Componentes UI
│   ├── hooks/            # Custom hooks
│   ├── App.jsx
│   └── main.jsx
├── build/                 # Assets de construcción
├── dist/                  # Build de producción
├── config.json           # Configuración de usuario
└── package.json
```

## 🔐 Seguridad

- ✅ Context Isolation habilitado
- ✅ Node Integration deshabilitado en renderer
- ✅ IPC seguro mediante contextBridge
- ✅ Validación de configuración

## 🐛 Desarrollo

### Logs

Los logs se guardan automáticamente en:
- **Windows**: `%APPDATA%/lablink/logs/`
- **Linux**: `~/.config/lablink/logs/`
- **macOS**: `~/Library/Logs/lablink/`

### DevTools

En modo desarrollo, las DevTools de Chrome se abren automáticamente.

## 📝 Notas

- La aplicación continúa ejecutándose en segundo plano cuando se cierra la ventana
- Usa el icono de la bandeja del sistema para mostrar/cerrar la aplicación
- Los archivos solo se procesan cuando el monitoreo está activo
- Se verifica la conectividad del servidor cada 30 segundos

## 🎯 TODO

- [ ] Agregar icono personalizado (actualmente usa icono por defecto)
- [ ] Agregar auto-actualización
- [ ] Soporte para múltiples carpetas
- [ ] Exportar logs

## 📄 Licencia

ISC
