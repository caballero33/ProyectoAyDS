import { useEffect, useState } from "react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/Card"
import { Search, Package, Clock, CheckCircle2, Truck, Factory, FlaskConical, Route } from "lucide-react"
import { db } from "../../../../../lib/firebase"

// Definir las etapas del proceso del lote
const LOT_STAGES = [
  { id: "extraction", label: "Material a procesar", icon: Route, color: "#f59e0b", description: "Registrado en extracción" },
  { id: "lab", label: "Análisis de muestras", icon: FlaskConical, color: "#6366f1", description: "Resultados de laboratorio" },
  { id: "plant", label: "Ingreso de producción", icon: Factory, color: "#8b5cf6", description: "Procesado en planta" },
  { id: "shipping", label: "Despachado", icon: Truck, color: "#ec4899", description: "Lote despachado" },
  { id: "sold", label: "Vendido", icon: CheckCircle2, color: "#22c55e", description: "Venta confirmada" },
]

const getStageStatus = (lotData) => {
  const stages = {
    extraction: false,
    lab: false,
    plant: false,
    shipping: false,
    sold: false,
  }

  let currentStage = "pending"
  let statusMessage = "Lote no encontrado"

  // Verificar si existe en extracción (primera etapa)
  if (lotData.extraction) {
    stages.extraction = true
    currentStage = "extraction"
    statusMessage = "Material registrado en extracción - Pendiente de análisis de laboratorio"

    // Verificar si existe en laboratorio
    if (lotData.lab && lotData.lab.length > 0) {
      stages.lab = true
      currentStage = "lab"
      statusMessage = "Análisis de laboratorio completado - Pendiente de ingreso en planta"

      // Verificar si existe en planta (esto indica que está listo para despacho)
      if (lotData.plant && lotData.plant.length > 0) {
        stages.plant = true
        currentStage = "shipping"
        statusMessage = "Producción registrada en planta - Listo para despacho"

        // Verificar si el lote está marcado como vendido en planta
        const soldPlant = lotData.plant.find((p) => p.vendido === true)
        if (soldPlant) {
          stages.sold = true
          currentStage = "sold"
          statusMessage = "Lote vendido - Proceso completado"
        } else {
          // Verificar si existe en despacho
          if (lotData.shipping && lotData.shipping.length > 0) {
            stages.shipping = true
            currentStage = "shipping"
            statusMessage = "Lote despachado - Pendiente de confirmación de venta"

            // Verificar si el lote está marcado como vendido en despacho
            const soldShipping = lotData.shipping.find((s) => s.vendido === true)
            if (soldShipping) {
              stages.sold = true
              currentStage = "sold"
              statusMessage = "Lote vendido - Proceso completado"
            }
          } else {
            currentStage = "plant"
            statusMessage = "Producción registrada en planta - Pendiente de despacho o venta"
          }
        }
      }
    }
  }

  return { stages, currentStage, statusMessage }
}

const formatDate = (dateString) => {
  if (!dateString) return "—"
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      const altDate = new Date(`${dateString}T00:00:00`)
      if (Number.isNaN(altDate.getTime())) return dateString
      return altDate.toLocaleDateString("es-PE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateString
  }
}

const getTimeAgo = (dateString) => {
  if (!dateString) return ""
  try {
    let date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      const altDate = new Date(`${dateString}T00:00:00`)
      if (Number.isNaN(altDate.getTime())) return ""
      date = altDate
    }
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "hace menos de 1 minuto"
    if (diffMins < 60) return `hace ${diffMins} minuto(s)`
    if (diffHours < 24) return `hace ${diffHours} hora(s)`
    return `hace ${diffDays} día(s)`
  } catch {
    return ""
  }
}

export default function LotTracking() {
  const [searchLot, setSearchLot] = useState("")
  const [selectedLot, setSelectedLot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lotHistory, setLotHistory] = useState([])

  useEffect(() => {
    if (searchLot.trim()) {
      const timer = setTimeout(() => {
        fetchLotTracking(searchLot.trim())
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setSelectedLot(null)
      setLotHistory([])
    }
  }, [searchLot])

  const fetchLotTracking = async (lotNumber) => {
    setLoading(true)
    setError("")
    setSelectedLot(null)
    setLotHistory([])

    try {
      // Buscar en extracción
      const extractionQuery = query(collection(db, "extraction_records"), where("lote", "==", lotNumber))
      const extractionSnap = await getDocs(extractionQuery)

      if (extractionSnap.empty) {
        setError(`No se encontró ningún lote con el número: ${lotNumber}`)
        setLoading(false)
        return
      }

      const extractionDocs = extractionSnap.docs

      // Buscar en laboratorio (por número de lote)
      const labQuery = query(collection(db, "lab_analyses"), where("lote", "==", lotNumber))
      const labSnap = await getDocs(labQuery).catch(() => ({ empty: true, docs: [] }))
      const labDocs = labSnap.empty
        ? []
        : labSnap.docs.sort((a, b) => {
            const dateA = a.data().fecha_envio || ""
            const dateB = b.data().fecha_envio || ""
            return dateB.localeCompare(dateA)
          })

      // Buscar en planta (por lote - esto indica que ya pasó por lab y está listo para despacho)
      const plantQuery = query(collection(db, "plant_runs"), where("lote", "==", lotNumber))
      const plantSnap = await getDocs(plantQuery).catch(() => ({ empty: true, docs: [] }))
      const plantDocs = plantSnap.empty
        ? []
        : plantSnap.docs.sort((a, b) => {
            const dateA = a.data().fecha || ""
            const dateB = b.data().fecha || ""
            return dateB.localeCompare(dateA)
          })

      // Buscar en despacho
      const shippingQuery = query(collection(db, "shipping_records"), where("lote", "==", lotNumber))
      const shippingSnap = await getDocs(shippingQuery).catch(() => ({ empty: true, docs: [] }))
      const shippingDocs = shippingSnap.empty
        ? []
        : shippingSnap.docs.sort((a, b) => {
            const dateA = a.data().fecha || ""
            const dateB = b.data().fecha || ""
            return dateB.localeCompare(dateA)
          })

      // Construir datos del lote
      const latestExtraction = extractionDocs[0].data()
      const lotData = {
        lote: lotNumber,
        extraction: {
          id: extractionDocs[0].id,
          zona: latestExtraction.zona || "",
          material: latestExtraction.material || "",
          cantidad: latestExtraction.cantidad_t || latestExtraction.cantidad_kg || 0,
          fecha: latestExtraction.fecha || "",
          operador: latestExtraction.operador || "",
          condicion: latestExtraction.condicion || "",
          created_at: latestExtraction.created_at?.toDate?.() || null,
        },
        lab: labDocs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            zona: data.zona || "",
            fecha: data.fecha_envio || "",
            resultado: data.resultado || "",
            pureza: data.pureza || 0,
            humedad: data.humedad || 0,
            operador: data.operador || "",
            created_at: data.created_at?.toDate?.() || null,
          }
        }),
        plant: plantDocs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            zona: data.zona || "",
            fecha: data.fecha || "",
            cantidad: data.cantidad_t || data.cantidad_kg || 0,
            pureza_final: data.pureza_final || 0,
            turno: data.turno || "",
            operador: data.operador || "",
            vendido: data.vendido || false,
            fecha_venta: data.fecha_venta?.toDate?.() || data.fecha_venta || null,
            created_at: data.created_at?.toDate?.() || null,
          }
        }),
        shipping: shippingDocs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            fecha: data.fecha || "",
            cantidad: data.cantidad_kg || 0,
            pureza: data.pureza_final || 0,
            cliente: data.cliente_destino || "",
            transportista: data.transportista || "",
            vendido: data.vendido || false,
            fecha_venta: data.fecha_venta?.toDate?.() || data.fecha_venta || null,
            created_at: data.created_at?.toDate?.() || null,
          }
        }),
      }

      setSelectedLot(lotData)

      // Construir historial cronológico
      const history = []
      
      // Etapa 1: Extracción - Material a procesar por lote
      history.push({
        stage: "extraction",
        label: "Material registrado en extracción",
        fecha: lotData.extraction.fecha,
        created_at: lotData.extraction.created_at,
        details: `Reporte de material a procesar por lote - ${lotData.extraction.cantidad} t - ${lotData.extraction.material} - ${lotData.extraction.condicion}`,
        location: lotData.extraction.zona,
      })

      // Etapa 2: Laboratorio - Análisis de muestras por zona
      lotData.lab.forEach((lab) => {
        history.push({
          stage: "lab",
          label: "Resultados de análisis registrados",
          fecha: lab.fecha,
          created_at: lab.created_at,
          details: `Reporte de resultados de análisis de muestras por zona - Resultado: ${lab.resultado} - Pureza: ${lab.pureza}% - Humedad: ${lab.humedad}%`,
          location: lab.zona,
        })
      })

      // Etapa 3: Planta - Ingreso de producción (esto indica que está listo para despacho)
      lotData.plant.forEach((plant) => {
        if (plant.vendido) {
          // Si está vendido directamente desde planta
          history.push({
            stage: "plant",
            label: "Ingreso de producción registrado",
            fecha: plant.fecha,
            created_at: plant.created_at,
            details: `Cantidad producida: ${plant.cantidad} kg - Pureza final: ${plant.pureza_final}% - Turno: ${plant.turno}`,
            location: plant.zona,
          })
          history.push({
            stage: "sold",
            label: "Lote vendido",
            fecha: plant.fecha_venta || plant.fecha,
            created_at: plant.fecha_venta || plant.created_at,
            details: `Venta confirmada directamente desde planta - Cantidad: ${plant.cantidad} kg - Pureza: ${plant.pureza_final}%`,
            location: "Dirección",
          })
        } else {
          // Si no está vendido todavía
          history.push({
            stage: "plant",
            label: "Ingreso de producción registrado",
            fecha: plant.fecha,
            created_at: plant.created_at,
            details: `Cantidad producida: ${plant.cantidad} kg - Pureza final: ${plant.pureza_final}% - Turno: ${plant.turno} - Listo para despacho`,
            location: plant.zona,
          })
        }
      })

      // Etapa 4: Despacho - Lote despachado
      lotData.shipping.forEach((ship) => {
        history.push({
          stage: ship.vendido ? "sold" : "shipping",
          label: ship.vendido ? "Lote vendido" : "Lote despachado",
          fecha: ship.vendido && ship.fecha_venta ? ship.fecha_venta : ship.fecha,
          created_at: ship.vendido && ship.fecha_venta ? ship.fecha_venta : ship.created_at,
          details: ship.vendido
            ? `Venta confirmada - Cliente: ${ship.cliente} - Transportista: ${ship.transportista} - Cantidad: ${ship.cantidad} kg - Pureza: ${ship.pureza}%`
            : `Cliente: ${ship.cliente} - Transportista: ${ship.transportista} - Cantidad: ${ship.cantidad} kg - Pureza: ${ship.pureza}%`,
          location: "",
        })
      })

      // Ordenar por fecha (más antiguo primero para mostrar el flujo cronológico)
      history.sort((a, b) => {
        const dateA = a.created_at || new Date(a.fecha)
        const dateB = b.created_at || new Date(b.fecha)
        return dateA - dateB
      })

      setLotHistory(history)
    } catch (err) {
      console.error("Error al buscar el lote:", err)
      setError("Error al buscar el seguimiento del lote. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const { stages, currentStage, statusMessage } = selectedLot
    ? getStageStatus(selectedLot)
    : { stages: {}, currentStage: "pending", statusMessage: "Busca un lote para comenzar el seguimiento" }

  const currentStageInfo = LOT_STAGES.find((s) => s.id === currentStage)
  const currentStageIndex = LOT_STAGES.findIndex((s) => s.id === currentStage) !== -1
    ? LOT_STAGES.findIndex((s) => s.id === currentStage)
    : 0

  return (
    <main className="dashboard-content">
      <div className="dashboard-content__inner">
        <div className="dashboard-form__header">
          <p className="dashboard-form__eyebrow">Seguimiento de lotes</p>
          <h1 className="dashboard-form__title">Operaciones</h1>
          <p className="dashboard-form__subtitle">
            Rastrea el estado y la ubicación de tus lotes a través de todas las fases del proceso.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar lote</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="lot-search" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                  Número de lote
                </label>
                <div style={{ position: "relative" }}>
                  <Search
                    size={18}
                    style={{
                      position: "absolute",
                      left: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "rgba(30, 44, 92, 0.4)",
                    }}
                  />
                  <Input
                    id="lot-search"
                    type="text"
                    placeholder="Ej: O-123, LOTE-001"
                    value={searchLot}
                    onChange={(e) => setSearchLot(e.target.value)}
                    style={{ paddingLeft: "2.75rem", width: "100%" }}
                  />
                </div>
              </div>
            </div>
            {error && (
              <p style={{ marginTop: "1rem", color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>
            )}
            {loading && (
              <p style={{ marginTop: "1rem", color: "rgba(30, 44, 92, 0.6)", fontSize: "0.875rem" }}>
                Buscando lote...
              </p>
            )}
          </CardContent>
        </Card>

        {selectedLot && (
          <>
            <Card>
              <CardHeader>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <CardTitle style={{ marginBottom: "0.5rem" }}>Lote: {selectedLot.lote}</CardTitle>
                    <p style={{ fontSize: "0.875rem", color: "rgba(30, 44, 92, 0.6)", margin: 0 }}>
                      {selectedLot.extraction.material.toUpperCase()} · {selectedLot.extraction.cantidad} t ·{" "}
                      {selectedLot.extraction.zona}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: currentStageInfo?.color || "#f59e0b",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {currentStageInfo?.label || "Material a procesar"}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)", margin: 0 }}>
                      {currentStageInfo?.description || "Estado actual"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress Bar */}
                <div style={{ marginTop: "2rem", marginBottom: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      position: "relative",
                      marginBottom: "3rem",
                      padding: "0 1rem",
                    }}
                  >
                    {LOT_STAGES.map((stage, index) => {
                      const isActive = stages[stage.id] || false
                      const isCurrent = stage.id === currentStage
                      const isPassed = stages[stage.id] && !isCurrent
                      const Icon = stage.icon
                      
                      // Determinar si la línea debe estar activa
                      const isLineActive = isActive || (isCurrent && index > 0 && stages[LOT_STAGES[index - 1].id])

                      return (
                        <div
                          key={stage.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            flex: 1,
                            position: "relative",
                            zIndex: LOT_STAGES.length - index,
                          }}
                        >
                          {/* Línea de conexión */}
                          {index < LOT_STAGES.length - 1 && (
                            <div
                              style={{
                                position: "absolute",
                                top: "24px",
                                left: "calc(50% + 28px)",
                                width: "calc(100% - 56px)",
                                height: "3px",
                                background: isLineActive ? "#f59e0b" : "#e5e7eb",
                                zIndex: 0,
                                transition: "background 0.3s ease",
                              }}
                            />
                          )}
                          {/* Círculo de estado */}
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              background:
                                isActive || isPassed
                                  ? isCurrent
                                    ? stage.color
                                    : "#f59e0b"
                                  : "#e5e7eb",
                              color: isActive || isPassed ? "#ffffff" : "#9ca3af",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: isCurrent
                                ? `0 0 0 4px ${stage.color}33, 0 4px 12px rgba(0,0,0,0.15)`
                                : "0 2px 8px rgba(0,0,0,0.1)",
                              transition: "all 0.3s ease",
                              marginBottom: "0.75rem",
                              position: "relative",
                              zIndex: 1,
                            }}
                          >
                            <Icon size={24} />
                          </div>
                          {/* Etiqueta */}
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: isCurrent ? 700 : 400,
                              color: isCurrent
                                ? stage.color
                                : isActive || isPassed
                                ? "#f59e0b"
                                : "#9ca3af",
                              textAlign: "center",
                              maxWidth: "120px",
                              lineHeight: "1.2",
                            }}
                          >
                            {stage.label}
                          </span>
                          {/* Estado adicional */}
                            {isCurrent && (
                            <span
                              style={{
                                fontSize: "0.65rem",
                                color: stage.color,
                                marginTop: "0.25rem",
                                fontWeight: 600,
                              }}
                            >
                              {currentStage === "sold" ? "Vendido" : "En proceso"}
                            </span>
                          )}
                          {!isActive && !isCurrent && index <= currentStageIndex && (
                            <span
                              style={{
                                fontSize: "0.65rem",
                                color: "#9ca3af",
                                marginTop: "0.25rem",
                                fontStyle: "italic",
                              }}
                            >
                              Pendiente
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Status Message */}
                {lotHistory.length > 0 && (
                  <div
                    style={{
                      padding: "1.25rem",
                      background:
                        currentStage === "sold"
                          ? "rgba(34, 197, 94, 0.1)"
                          : currentStage === "shipping"
                          ? "rgba(236, 72, 153, 0.1)"
                          : "rgba(242, 92, 74, 0.08)",
                      borderRadius: "0.75rem",
                      border: `1px solid ${
                        currentStage === "sold"
                          ? "rgba(34, 197, 94, 0.3)"
                          : currentStage === "shipping"
                          ? "rgba(236, 72, 153, 0.3)"
                          : "rgba(242, 92, 74, 0.2)"
                      }`,
                      marginBottom: "1.5rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "rgba(30, 44, 92, 0.8)",
                        margin: 0,
                        lineHeight: "1.6",
                      }}
                    >
                      {statusMessage}
                      {lotHistory.length > 0 && lotHistory[lotHistory.length - 1]?.fecha && (
                        <span style={{ color: "rgba(30, 44, 92, 0.6)", display: "block", marginTop: "0.5rem" }}>
                          Última actualización: {formatDate(lotHistory[lotHistory.length - 1].fecha)} (
                          {getTimeAgo(lotHistory[lotHistory.length - 1].fecha)})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tracking Details */}
            {lotHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalles de seguimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {lotHistory.map((event, index) => {
                      const stageInfo = LOT_STAGES.find((s) => s.id === event.stage)
                      const Icon = stageInfo?.icon || Package
                      const isLastEvent = index === lotHistory.length - 1

                      return (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            gap: "1rem",
                            padding: "1rem",
                            background: isLastEvent
                              ? currentStage === "completed"
                                ? "rgba(34, 197, 94, 0.05)"
                                : "rgba(242, 92, 74, 0.05)"
                              : "transparent",
                            borderRadius: "0.75rem",
                            border: isLastEvent
                              ? currentStage === "completed"
                                ? "1px solid rgba(34, 197, 94, 0.2)"
                                : "1px solid rgba(242, 92, 74, 0.2)"
                              : "1px solid rgba(30, 44, 92, 0.1)",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background: stageInfo?.color || "#e5e7eb",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              boxShadow: isLastEvent
                                ? currentStage === "sold"
                                  ? `0 4px 12px rgba(34, 197, 94, 0.4)`
                                  : `0 4px 12px ${stageInfo?.color}40`
                                : "none",
                            }}
                          >
                            <Icon size={20} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "0.25rem",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                              }}
                            >
                              <p
                                style={{
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  margin: 0,
                                  color: "#1e2c5c",
                                }}
                              >
                                {event.label}
                              </p>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "rgba(30, 44, 92, 0.6)",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {formatDate(event.fecha)}
                              </span>
                            </div>
                            {event.location && (
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "rgba(30, 44, 92, 0.6)",
                                  margin: "0.25rem 0",
                                  fontWeight: 500,
                                }}
                              >
                                📍 {event.location}
                              </p>
                            )}
                            <p
                              style={{
                                fontSize: "0.875rem",
                                color: "rgba(30, 44, 92, 0.7)",
                                margin: "0.5rem 0 0 0",
                                lineHeight: "1.5",
                              }}
                            >
                              {event.details}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!selectedLot && !loading && !error && searchLot === "" && (
          <Card>
            <CardContent>
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <Package size={48} style={{ color: "rgba(30, 44, 92, 0.3)", marginBottom: "1rem" }} />
                <p style={{ fontSize: "1rem", color: "rgba(30, 44, 92, 0.6)", margin: 0 }}>
                  Ingresa un número de lote para comenzar el seguimiento
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
