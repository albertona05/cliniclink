# Pruebas de Rendimiento de ClinicLink

## Descripción
Este conjunto de pruebas de rendimiento está diseñado para evaluar el rendimiento y la escalabilidad del backend de ClinicLink bajo diferentes condiciones de carga.

## Requisitos Previos
- Node.js instalado (versión 14 o superior)
- NPM (Node Package Manager)
- El servidor backend debe estar ejecutándose en `http://localhost:3000`

## Instalación
```bash
npm install -g artillery@latest
```

## Ejecución de las Pruebas
1. Asegúrate de que el servidor backend esté en ejecución
2. Ejecuta las pruebas:
   ```bash
   artillery run performance-tests.yml --output report.json
   ```
3. Genera el reporte HTML:
   ```bash
   artillery report report.json
   ```

## Escenarios de Prueba

### 1. Flujo de Autenticación y Gestión de Pacientes
- Login de usuario
- Búsqueda de pacientes
- Registro de nuevo paciente

### 2. Flujo de Gestión de Pruebas Médicas
- Creación de nueva prueba
- Consulta de detalles
- Finalización de prueba

### 3. Flujo de Historial Médico
- Consulta de historial
- Consulta de citas

## Fases de Carga
1. **Calentamiento**: 60 segundos, 5 usuarios/segundo
2. **Carga Media**: 120 segundos, incremento de 10 a 20 usuarios/segundo
3. **Carga Alta**: 180 segundos, incremento de 20 a 30 usuarios/segundo

## Interpretación de Resultados

### Métricas Clave
- **Latencia**: Tiempo de respuesta promedio
- **Throughput**: Solicitudes por segundo
- **Códigos de Error**: Tasa de errores
- **Percentiles**: p95 y p99 de tiempos de respuesta

### Umbrales Recomendados
- Tiempo de respuesta p95 < 1000ms
- Tasa de error < 1%
- Throughput sostenido > 100 req/s

## Solución de Problemas
- Verifica que el servidor esté ejecutándose en el puerto correcto
- Asegúrate de tener suficiente memoria disponible
- Revisa los logs del servidor durante las pruebas

## Notas Adicionales
- Las pruebas incluyen datos de ejemplo que deben ser ajustados según el entorno
- Se recomienda ejecutar las pruebas en un entorno similar al de producción
- Los resultados pueden variar según las características del hardware