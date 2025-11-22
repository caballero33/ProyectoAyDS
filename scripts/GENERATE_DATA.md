# Script Generador de Datos de Ejemplo

Este script genera datos de ejemplo realistas para MineSmart, distribuidos a lo largo de todo el año actual en las 4 zonas principales.

## 📋 Descripción

El script crea datos coherentes y relacionados entre sí para todas las colecciones principales:

- **Análisis de suelos** (soil_analyses): 15-20 por zona
- **Inventario de insumos** (supplies): 4 insumos básicos
- **Registros de extracción** (extraction_records): 8-12 por zona
- **Análisis de laboratorio** (lab_analyses): Para el 90% de los lotes
- **Registros de planta** (plant_runs): Para el 80% de los lotes con lab
- **Fallas de maquinaria** (plant_failures): Para el 30% de las plantas
- **Consumo de insumos** (plant_consumptions): Para el 60% de las plantas
- **Registros de despacho** (shipping_records): Para el 60% de las plantas (70% vendidos)

## 🚀 Uso

### Opción 1: Usando npm script (recomendado)

```bash
npm run generate-data
```

### Opción 2: Ejecutando directamente con Node

```bash
node scripts/generateSampleData.js
```

## 📅 Datos Generados

### Zonas
- Zona Norte - Sector A
- Zona Sur - Sector B
- Zona Este - Sector C
- Zona Oeste - Sector D

### Período
- Desde: 1 de enero del año actual
- Hasta: Fecha actual

### Lotes
- Formato: Letra-XXX (ej: O-123, C-456)
- Prefijo "O" para oro, "C" para cobre
- Cada zona tiene 8-12 lotes únicos

### Relaciones entre Datos
1. Los **análisis de suelos** se crean primero para cada zona
2. Los **registros de extracción** usan las zonas de los análisis
3. Los **análisis de laboratorio** se vinculan con los lotes de extracción
4. Los **registros de planta** se vinculan con lotes que pasaron por lab
5. Los **registros de despacho** se vinculan con registros de planta
6. Las **fallas** y **consumos** se vinculan con registros de planta específicos

## ⚠️ Notas Importantes

1. **No sobrescribe datos existentes**: Solo agrega nuevos registros
2. **Datos realistas**: Los valores están en rangos lógicos:
   - pH: 4-9
   - Pureza: 60-98%
   - Humedad: 3-15%
   - Cantidad: 5-20 toneladas
3. **Fechas coherentes**: Las fechas respetan la secuencia lógica del proceso
4. **Relaciones preservadas**: Los lotes se mantienen consistentes a través de las etapas

## 📊 Volumen Esperado

Para 4 zonas, el script generará aproximadamente:
- ~70 análisis de suelos
- ~40 registros de extracción
- ~35 análisis de laboratorio
- ~30 registros de planta
- ~10 fallas de maquinaria
- ~20 consumos de insumos
- ~20 registros de despacho
- 4 insumos en inventario

**Total: ~230 registros**

## 🔄 Re-ejecutar

Puedes ejecutar el script múltiples veces para agregar más datos. Cada ejecución generará nuevos lotes y registros.

## 🛠️ Personalización

Si necesitas modificar los rangos o cantidades, edita las constantes en el archivo:
- `ZONAS`: Zonas disponibles
- `OPERADORES`: Lista de operadores
- `MAQUINAS`: Lista de máquinas
- `INSUMOS`: Lista de insumos
- Cantidades por zona (valores aleatorios dentro de rangos)

