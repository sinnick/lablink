#!/bin/bash
# Script para capturar pantallas de LabLink PDF Monitor

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCREENSHOTS_DIR="$PROJECT_DIR/screenshots"

# Crear directorio si no existe
mkdir -p "$SCREENSHOTS_DIR"

# Buscar la ventana de LabLink
WINDOW_ID=$(xwininfo -tree -root 2>/dev/null | grep -i "lablink\|LabLink PDF Monitor" | head -1 | awk '{print $1}')

if [ -z "$WINDOW_ID" ]; then
    echo "Error: No se encontró la ventana de LabLink"
    echo "Asegúrate de que la aplicación está corriendo"
    exit 1
fi

# Generar nombre de archivo con timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_FILE="$SCREENSHOTS_DIR/lablink-$TIMESTAMP.png"

# Capturar la ventana usando import de ImageMagick
if command -v import &> /dev/null; then
    import -window "$WINDOW_ID" "$OUTPUT_FILE"
    if [ $? -eq 0 ]; then
        echo "Captura guardada: $OUTPUT_FILE"
        # Abrir con el visor de imágenes por defecto
        if command -v xdg-open &> /dev/null; then
            xdg-open "$OUTPUT_FILE" 2>/dev/null &
        fi
    else
        echo "Error al capturar la pantalla"
        exit 1
    fi
else
    echo "Error: Se requiere ImageMagick (import)"
    echo "Instalar con: sudo apt install imagemagick"
    exit 1
fi
