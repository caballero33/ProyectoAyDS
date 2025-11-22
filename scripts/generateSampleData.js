import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import readline from "readline"

// Configuración de Firebase (misma que en el proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyAW-VPVlF4wKeLvSNgpfxcaLlsLPc6G-1w",
  authDomain: "minosadb.firebaseapp.com",
  projectId: "minosadb",
  storageBucket: "minosadb.firebasestorage.app",
  messagingSenderId: "1011602813793",
  appId: "1:1011602813793:web:f143d47fa9a55a3c604b20",
  measurementId: "G-EGMT011FW8",
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Zonas
const ZONAS = [
  "Zona Norte - Sector A",
  "Zona Sur - Sector B",
  "Zona Este - Sector C",
  "Zona Oeste - Sector D",
]

// Materiales
const MATERIALES = ["oro", "cobre"]

// Operadores de ejemplo
const OPERADORES = [
  "Juan López",
  "María García",
  "Carlos Rodríguez",
  "Ana Martínez",
  "Pedro Sánchez",
  "Laura Fernández",
]

// Máquinas
const MAQUINAS = ["Molino #1", "Molino #2", "Taladro #1", "Taladro #2", "Cinta transportadora"]

// Tipos de falla
const TIPOS_FALLA = ["Mecánica", "Eléctrica", "Proceso"]

// Clientes
const CLIENTES = ["Compañía Minera ABC", "Corporación XYZ", "Industria Minera 123", "Empresa Global SA"]

// Transportistas
const TRANSPORTISTAS = ["Transportes Rápidos", "Logística Nacional", "Envíos Express", "Distribuidora Central"]

// Insumos de ejemplo
const INSUMOS = [
  { nombre: "Cianuro de sodio", codigo: "CN-001", unidad: "kg" },
  { nombre: "Cal hidratada", codigo: "CA-002", unidad: "kg" },
  { nombre: "Ácido sulfúrico", codigo: "AS-003", unidad: "L" },
  { nombre: "Floculante", codigo: "FL-004", unidad: "kg" },
]

// Procesos
const PROCESOS = ["Flotación", "Concentración", "Espesamiento", "Secado"]

// Función para obtener fecha aleatoria en un rango
function getRandomDate(start, end) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
  return new Date(randomTime).toISOString().split("T")[0]
}

// Función para obtener fecha aleatoria en el pasado (últimos N días)
function getRandomPastDate(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  return date.toISOString().split("T")[0]
}

// Función para obtener elemento aleatorio de un array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

// Función para obtener número aleatorio en un rango
function getRandomNumber(min, max, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals))
}

// Función para generar número de lote
function generateLotNumber(prefix = null) {
  const prefixLetter = prefix || String.fromCharCode(65 + Math.floor(Math.random() * 26)) // A-Z
  const number = Math.floor(Math.random() * 900) + 100 // 100-999
  return `${prefixLetter}-${number}`
}

// Función para solicitar confirmación
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase().trim())
    })
  })
}

// Función para generar datos de ejemplo
async function generateSampleData() {
  console.log("╔════════════════════════════════════════════════════════════╗")
  console.log("║     Generador de Datos de Ejemplo para MineSmart         ║")
  console.log("╚════════════════════════════════════════════════════════════╝")
  console.log("\n⚠️  Este script generará datos de ejemplo para:")
  console.log("   • Análisis de suelos")
  console.log("   • Registros de extracción")
  console.log("   • Análisis de laboratorio")
  console.log("   • Registros de planta")
  console.log("   • Fallas de maquinaria")
  console.log("   • Consumo de insumos")
  console.log("   • Registros de despacho")
  console.log("\n📅 Período: Todo el año actual")
  console.log("📍 Zonas: Norte, Sur, Este, Oeste")

  const answer = await askConfirmation("\n¿Continuar? (escribe 'si' para confirmar): ")

  if (answer !== "si" && answer !== "s" && answer !== "yes" && answer !== "y") {
    console.log("\n❌ Operación cancelada.")
    process.exit(0)
  }

  console.log("\n🔄 Generando datos de ejemplo...\n")
  console.log("─".repeat(60))

  const currentYear = new Date().getFullYear()
  const startDate = `${currentYear}-01-01`
  const endDate = new Date().toISOString().split("T")[0]

  let soilCount = 0
  let extractionCount = 0
  let labCount = 0
  let plantCount = 0
  let failureCount = 0
  let consumptionCount = 0
  let shippingCount = 0

  try {
    // 1. Generar análisis de suelos (15-20 por zona)
    console.log("\n📋 Generando análisis de suelos...")
    for (const zona of ZONAS) {
      const count = Math.floor(Math.random() * 6) + 15 // 15-20 por zona
      for (let i = 0; i < count; i++) {
        await addDoc(collection(db, "soil_analyses"), {
          zona: zona,
          fecha: getRandomDate(startDate, endDate),
          analista: getRandomElement(OPERADORES),
          resultado_ph: getRandomNumber(4, 9),
          pureza: getRandomNumber(60, 98),
          humedad: getRandomNumber(3, 15),
          zona_apta: Math.random() > 0.3, // 70% aptas
          observaciones: Math.random() > 0.7 ? "Condiciones normales" : "",
          created_at: serverTimestamp(),
        })
        soilCount++
      }
    }
    console.log(`   ✓ ${soilCount} análisis de suelos creados`)

    // 2. Generar insumos en inventario
    console.log("\n📦 Generando inventario de insumos...")
    for (const insumo of INSUMOS) {
      await addDoc(collection(db, "supplies"), {
        nombre: insumo.nombre,
        codigo: insumo.codigo,
        unidad: insumo.unidad,
        cantidad_actual: Math.floor(Math.random() * 5000) + 1000, // 1000-6000
        created_at: serverTimestamp(),
      })
    }
    console.log(`   ✓ ${INSUMOS.length} insumos creados en inventario`)

    // 3. Generar registros de extracción (8-12 por zona)
    console.log("\n⛏️  Generando registros de extracción...")
    const lotesGenerados = new Map() // Mapa de zona -> array de lotes

    for (const zona of ZONAS) {
      const lotesZona = []
      const count = Math.floor(Math.random() * 5) + 8 // 8-12 por zona

      for (let i = 0; i < count; i++) {
        const material = getRandomElement(MATERIALES)
        const lote = generateLotNumber(material === "oro" ? "O" : "C")
        lotesZona.push({ lote, material, fecha: getRandomDate(startDate, endDate) })

        await addDoc(collection(db, "extraction_records"), {
          zona: zona,
          material: material,
          lote: lote,
          fecha: lotesZona[lotesZona.length - 1].fecha,
          cantidad_t: getRandomNumber(5, 20),
          cantidad_kg: getRandomNumber(5000, 20000),
          operador: getRandomElement(OPERADORES),
          condicion: getRandomElement(["humedo", "seco", "crudo"]),
          observaciones: Math.random() > 0.8 ? "Material extraído correctamente" : "",
          created_at: serverTimestamp(),
        })
        extractionCount++
      }
      lotesGenerados.set(zona, lotesZona)
    }
    console.log(`   ✓ ${extractionCount} registros de extracción creados`)

    // 4. Generar análisis de laboratorio (para el 90% de los lotes)
    console.log("\n🧪 Generando análisis de laboratorio...")
    const lotesConLab = new Map() // Mapa de zona -> array de lotes que pasaron por lab
    
    for (const [zona, lotes] of lotesGenerados.entries()) {
      const lotesLab = []
      for (const loteData of lotes) {
        if (Math.random() < 0.9) {
          // 90% de los lotes tienen análisis de laboratorio
          // Fecha de lab debe ser después de extracción (1-10 días después)
          const fechaExtraccion = new Date(loteData.fecha)
          const diasDespues = Math.floor(Math.random() * 10) + 1
          fechaExtraccion.setDate(fechaExtraccion.getDate() + diasDespues)
          const fechaLab = fechaExtraccion.toISOString().split("T")[0]
          
          await addDoc(collection(db, "lab_analyses"), {
            zona: zona,
            lote: loteData.lote,
            operador: getRandomElement(OPERADORES),
            material: loteData.material,
            fecha_envio: fechaLab,
            resultado: Math.random() > 0.2 ? "Aprobado" : "Rechazado",
            pureza: getRandomNumber(65, 99),
            humedad: getRandomNumber(4, 12),
            observaciones: Math.random() > 0.7 ? "Análisis completado" : "",
            created_at: serverTimestamp(),
          })
          // Guardar el lote con su fecha de lab para usarlo después
          lotesLab.push({ ...loteData, fechaLab: fechaLab })
          labCount++
        }
      }
      if (lotesLab.length > 0) {
        lotesConLab.set(zona, lotesLab)
      }
    }
    console.log(`   ✓ ${labCount} análisis de laboratorio creados`)

    // 5. Generar registros de planta (para el 80% de los lotes con lab)
    console.log("\n🏭 Generando registros de planta...")
    const plantRunsData = []

    for (const [zona, lotes] of lotesConLab.entries()) {
      for (const loteData of lotes) {
        if (Math.random() < 0.8) {
          // 80% de los lotes que pasaron por lab van a planta
          const cantidad_t = getRandomNumber(5, 18)
          // Fecha de planta debe ser después de la fecha de lab
          const fechaLab = new Date(loteData.fechaLab || loteData.fecha)
          const diasDespues = Math.floor(Math.random() * 20) + 1 // 1-20 días después del lab
          fechaLab.setDate(fechaLab.getDate() + diasDespues)
          const fechaPlanta = fechaLab.toISOString().split("T")[0]

          const plantRun = {
            zona: zona,
            material: loteData.material,
            operador: getRandomElement(OPERADORES),
            condicion: getRandomElement(["humedo", "seco", "crudo"]),
            fecha: fechaPlanta,
            cantidad_t: cantidad_t,
            cantidad_kg: cantidad_t * 1000,
            pureza_final: getRandomNumber(70, 98),
            turno: getRandomElement(["Mañana", "Tarde", "Noche"]),
            lote: loteData.lote,
            observaciones: Math.random() > 0.8 ? "Producción exitosa" : "",
            created_at: serverTimestamp(),
          }

          const plantDocRef = await addDoc(collection(db, "plant_runs"), plantRun)
          plantRunsData.push({ id: plantDocRef.id, ...plantRun, fecha: fechaPlanta })
          plantCount++

          // 30% de probabilidad de tener falla
          if (Math.random() < 0.3) {
            await addDoc(collection(db, "plant_failures"), {
              plant_run_id: plantDocRef.id,
              maquina: getRandomElement(MAQUINAS),
              tipo_falla: getRandomElement(TIPOS_FALLA),
              duracion_horas: getRandomNumber(0.5, 8),
              estado: Math.random() > 0.5 ? "cerrada" : "abierta",
              responsable: getRandomElement(OPERADORES),
              descripcion: `Falla ${getRandomElement(TIPOS_FALLA).toLowerCase()} en ${getRandomElement(MAQUINAS)}`,
              created_at: serverTimestamp(),
            })
            failureCount++
          }

          // 60% de probabilidad de tener consumo de insumos
          if (Math.random() < 0.6) {
            const insumoCount = Math.floor(Math.random() * 2) + 1 // 1-2 insumos
            for (let i = 0; i < insumoCount; i++) {
              await addDoc(collection(db, "plant_consumptions"), {
                plant_run_id: plantDocRef.id,
                insumo: getRandomElement(INSUMOS).nombre,
                insumo_id: "", // En producción deberías tener el ID real
                cantidad: getRandomNumber(50, 500),
                proceso: getRandomElement(PROCESOS),
                fecha: fechaPlanta,
                created_at: serverTimestamp(),
              })
              consumptionCount++
            }
          }
        }
      }
    }
    console.log(`   ✓ ${plantCount} registros de planta creados`)
    console.log(`   ✓ ${failureCount} fallas de maquinaria registradas`)
    console.log(`   ✓ ${consumptionCount} consumos de insumos registrados`)

    // 6. Generar registros de despacho (para el 60% de los registros de planta)
    console.log("\n🚚 Generando registros de despacho...")
    for (const plantRun of plantRunsData) {
      if (Math.random() < 0.6) {
        // 60% de los registros de planta tienen despacho
        const material = plantRun.material
        const producto = material === "oro" ? "Concentrado de Oro" : "Concentrado de Cobre"
        const vendido = Math.random() < 0.7 // 70% ya vendidos
        
        // Fecha de despacho debe ser después de la fecha de planta
        const fechaPlanta = new Date(plantRun.fecha)
        const diasDespues = Math.floor(Math.random() * 20) + 1 // 1-20 días después
        fechaPlanta.setDate(fechaPlanta.getDate() + diasDespues)
        const fechaDespacho = fechaPlanta.toISOString().split("T")[0]
        
        let fechaVenta = null
        if (vendido) {
          // Fecha de venta debe ser después o igual a fecha de despacho
          const fechaVentaObj = new Date(fechaDespacho)
          const diasVenta = Math.floor(Math.random() * 15) // 0-15 días después del despacho
          fechaVentaObj.setDate(fechaVentaObj.getDate() + diasVenta)
          fechaVenta = fechaVentaObj.toISOString().split("T")[0]
        }

        await addDoc(collection(db, "shipping_records"), {
          fecha: fechaDespacho,
          lote: plantRun.lote,
          producto: producto,
          cantidad_kg: plantRun.cantidad_kg,
          pureza_final: plantRun.pureza_final,
          cliente_destino: getRandomElement(CLIENTES),
          transportista: getRandomElement(TRANSPORTISTAS),
          vendido: vendido,
          fecha_venta: fechaVenta,
          observaciones: Math.random() > 0.8 ? "Despacho exitoso" : "",
          created_at: serverTimestamp(),
        })
        shippingCount++
      }
    }
    console.log(`   ✓ ${shippingCount} registros de despacho creados`)

    console.log("\n" + "─".repeat(60))
    console.log("\n📊 RESUMEN DE DATOS GENERADOS:\n")
    console.log(`   ✓ Análisis de suelos: ${soilCount}`)
    console.log(`   ✓ Registros de extracción: ${extractionCount}`)
    console.log(`   ✓ Análisis de laboratorio: ${labCount}`)
    console.log(`   ✓ Registros de planta: ${plantCount}`)
    console.log(`   ✓ Fallas de maquinaria: ${failureCount}`)
    console.log(`   ✓ Consumos de insumos: ${consumptionCount}`)
    console.log(`   ✓ Registros de despacho: ${shippingCount}`)
    console.log(`   ✓ Insumos en inventario: ${INSUMOS.length}`)

    const total = soilCount + extractionCount + labCount + plantCount + failureCount + consumptionCount + shippingCount + INSUMOS.length
    console.log(`\n🎯 Total de registros creados: ${total}`)
    console.log("\n✅ ¡Datos de ejemplo generados exitosamente!\n")

    process.exit(0)
  } catch (error) {
    console.error("\n❌ Error al generar datos:", error)
    process.exit(1)
  }
}

// Manejo de errores
process.on("unhandledRejection", (error) => {
  console.error("\n❌ Error no manejado:", error)
  process.exit(1)
})

process.on("SIGINT", () => {
  console.log("\n\n⚠️  Operación interrumpida por el usuario.")
  process.exit(0)
})

// Ejecutar el script
generateSampleData().catch((error) => {
  console.error("\n❌ Error fatal:", error)
  process.exit(1)
})

