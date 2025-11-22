import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, deleteDoc, query } from "firebase/firestore"
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

// Colecciones que NO se deben eliminar (preservar)
const PRESERVED_COLLECTIONS = ["users"]

// Colecciones conocidas que se deben eliminar
const KNOWN_COLLECTIONS = [
  "soil_analyses",
  "extraction_records",
  "lab_analyses",
  "plant_runs",
  "plant_failures",
  "plant_consumptions",
  "supplies",
  "shipping_records",
]

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Función para obtener todas las colecciones
async function getAllCollections() {
  // Nota: El SDK web de Firebase no permite listar colecciones directamente
  // Por lo tanto, usaremos las colecciones conocidas
  // Si hay colecciones adicionales que no estén en la lista, deberán agregarse manualmente
  return KNOWN_COLLECTIONS
}

// Función para eliminar todos los documentos de una colección
async function deleteCollection(collectionName) {
  try {
    console.log(`\n📋 Limpiando colección: ${collectionName}...`)
    
    // Obtener todos los documentos de la colección
    const collectionRef = collection(db, collectionName)
    const snapshot = await getDocs(query(collectionRef))
    
    if (snapshot.empty) {
      console.log(`   ✓ La colección "${collectionName}" ya está vacía.`)
      return { collection: collectionName, deleted: 0, status: "empty" }
    }
    
    // Eliminar todos los documentos
    const deletePromises = []
    snapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, collectionName, document.id)))
    })
    
    await Promise.all(deletePromises)
    console.log(`   ✓ Eliminados ${snapshot.size} documentos de "${collectionName}".`)
    
    return { collection: collectionName, deleted: snapshot.size, status: "success" }
  } catch (error) {
    console.error(`   ✗ Error al limpiar "${collectionName}":`, error.message)
    return { collection: collectionName, deleted: 0, status: "error", error: error.message }
  }
}

// Función para solicitar confirmación al usuario
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

// Función principal
async function cleanDatabase() {
  console.log("╔════════════════════════════════════════════════════════════╗")
  console.log("║     Script de Limpieza de Base de Datos Firestore        ║")
  console.log("╚════════════════════════════════════════════════════════════╝")
  console.log("\n⚠️  ADVERTENCIA: Este script eliminará TODOS los datos")
  console.log("   de las siguientes colecciones EXCEPTO 'users':\n")
  
  const collectionsToDelete = await getAllCollections()
  
  collectionsToDelete.forEach((col) => {
    console.log(`   • ${col}`)
  })
  
  console.log("\n✅ Las siguientes colecciones se PRESERVARÁN:\n")
  PRESERVED_COLLECTIONS.forEach((col) => {
    console.log(`   • ${col}`)
  })
  
  const answer = await askConfirmation("\n¿Estás seguro de que deseas continuar? (escribe 'si' para confirmar): ")
  
  if (answer !== "si" && answer !== "s" && answer !== "yes" && answer !== "y") {
    console.log("\n❌ Operación cancelada. No se eliminó ningún dato.")
    process.exit(0)
  }
  
  console.log("\n🔄 Iniciando limpieza de la base de datos...\n")
  console.log("─".repeat(60))
  
  const results = []
  let totalDeleted = 0
  
  // Eliminar cada colección
  for (const collectionName of collectionsToDelete) {
    const result = await deleteCollection(collectionName)
    results.push(result)
    if (result.status === "success") {
      totalDeleted += result.deleted
    }
  }
  
  console.log("\n" + "─".repeat(60))
  console.log("\n📊 RESUMEN DE LA LIMPIEZA:\n")
  
  results.forEach((result) => {
    if (result.status === "success") {
      console.log(`   ✓ ${result.collection}: ${result.deleted} documentos eliminados`)
    } else if (result.status === "empty") {
      console.log(`   ○ ${result.collection}: ya estaba vacía`)
    } else {
      console.log(`   ✗ ${result.collection}: Error - ${result.error}`)
    }
  })
  
  console.log(`\n🎯 Total de documentos eliminados: ${totalDeleted}`)
  console.log("\n✅ Limpieza completada exitosamente!")
  console.log("   La colección 'users' ha sido preservada.\n")
  
  process.exit(0)
}

// Manejo de errores no capturados
process.on("unhandledRejection", (error) => {
  console.error("\n❌ Error no manejado:", error)
  process.exit(1)
})

process.on("SIGINT", () => {
  console.log("\n\n⚠️  Operación interrumpida por el usuario.")
  process.exit(0)
})

// Ejecutar el script
cleanDatabase().catch((error) => {
  console.error("\n❌ Error fatal:", error)
  process.exit(1)
})

