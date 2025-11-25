import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

// Función helper para crear notificaciones
export const createNotification = async (type, summary, details = {}) => {
  try {
    const notificationData = {
      type, // Tipo de reporte: "soil_analysis", "extraction", "lab", "plant", "shipping", "supplies"
      summary, // Resumen corto del reporte
      details, // Detalles adicionales (zona, lote, cantidad, etc.)
      read: false,
      created_at: serverTimestamp(),
    }

    await addDoc(collection(db, "notifications"), notificationData)
    return { success: true }
  } catch (error) {
    console.error("Error creando notificación:", error)
    return { success: false, error: error.message }
  }
}

// Función para generar resumen según el tipo de reporte
export const generateNotificationSummary = (type, data) => {
  switch (type) {
    case "soil_analysis":
      return `Análisis de suelos registrado - Zona: ${data.zona || "N/A"}`
    case "extraction":
      return `Extracción registrada - Lote: ${data.lote || "N/A"} - ${data.cantidad || 0} t`
    case "lab":
      return `Análisis de laboratorio registrado - Lote: ${data.lote || "N/A"} - Pureza: ${data.pureza || 0}%`
    case "plant":
      return `Producción de planta registrada - Lote: ${data.lote || "N/A"} - ${data.cantidad || 0} kg`
    case "shipping":
      return `Despacho registrado - Lote: ${data.lote || "N/A"} - Cliente: ${data.cliente || "N/A"}`
    case "supplies":
      return `Insumo agregado - ${data.nombre || "N/A"} - Cantidad: ${data.cantidad || 0}`
    default:
      return "Reporte registrado"
  }
}


