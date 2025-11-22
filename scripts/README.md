# Script de Limpieza de Base de Datos

Este script permite limpiar todas las colecciones de Firestore **excepto** la colección `users`, preservando así todos los usuarios creados en el sistema.

## ⚠️ Advertencia

Este script es **destructivo** y eliminará **todos los datos** de las siguientes colecciones:

- `soil_analyses` (Análisis de suelos)
- `extraction_records` (Registros de extracción)
- `lab_analyses` (Análisis de laboratorio)
- `plant_runs` (Registros de planta)
- `plant_failures` (Fallas de maquinaria)
- `plant_consumptions` (Consumos de insumos)
- `supplies` (Insumos/Inventario)
- `shipping_records` (Registros de despacho)

**La colección `users` NO será eliminada** y todos los usuarios del sistema se preservarán.

## 📋 Requisitos

1. Node.js instalado (versión 14 o superior)
2. Las dependencias del proyecto instaladas (`npm install`)
3. Acceso a la base de datos Firestore (con permisos de lectura y eliminación)

## 🚀 Uso

### Opción 1: Usando npm script (recomendado)

```bash
npm run clean-db
```

### Opción 2: Ejecutando directamente con Node

```bash
node scripts/cleanDatabase.js
```

## 📝 Proceso de Ejecución

1. El script mostrará una lista de todas las colecciones que se eliminarán
2. Solicitará confirmación antes de proceder
3. Debes escribir `si`, `s`, `yes` o `y` para confirmar
4. El script comenzará a eliminar los documentos de cada colección
5. Mostrará un resumen al finalizar

## 📊 Ejemplo de Salida

```
╔════════════════════════════════════════════════════════════╗
║     Script de Limpieza de Base de Datos Firestore        ║
╚════════════════════════════════════════════════════════════╝

⚠️  ADVERTENCIA: Este script eliminará TODOS los datos
   de las siguientes colecciones EXCEPTO 'users':

   • soil_analyses
   • extraction_records
   • lab_analyses
   • plant_runs
   • plant_failures
   • plant_consumptions
   • supplies
   • shipping_records

✅ Las siguientes colecciones se PRESERVARÁN:

   • users

¿Estás seguro de que deseas continuar? (escribe 'si' para confirmar): si

🔄 Iniciando limpieza de la base de datos...

────────────────────────────────────────────────────────────
📋 Limpiando colección: soil_analyses...
   ✓ Eliminados 15 documentos de "soil_analyses".
...

📊 RESUMEN DE LA LIMPIEZA:

   ✓ soil_analyses: 15 documentos eliminados
   ✓ extraction_records: 8 documentos eliminados
   ...

🎯 Total de documentos eliminados: 50

✅ Limpieza completada exitosamente!
   La colección 'users' ha sido preservada.
```

## 🔒 Permisos de Firestore

Asegúrate de que las reglas de seguridad de Firestore permitan la lectura y eliminación de documentos. Si tienes problemas, revisa las reglas en la consola de Firebase.

## 🛠️ Solución de Problemas

### Error de permisos

Si recibes un error de permisos, verifica que:
1. Las reglas de Firestore permitan la eliminación de documentos
2. Estás usando la configuración correcta de Firebase

### Error de conexión

Si no puede conectarse a Firebase, verifica que:
1. La configuración de Firebase en el script sea correcta
2. Tengas conexión a Internet
3. El proyecto Firebase esté activo

## 📝 Notas

- El script no puede eliminar colecciones vacías que no existen en la base de datos
- Si agregas nuevas colecciones al sistema, deberás actualizar la lista `KNOWN_COLLECTIONS` en el script
- Este script solo funciona con las colecciones listadas manualmente

