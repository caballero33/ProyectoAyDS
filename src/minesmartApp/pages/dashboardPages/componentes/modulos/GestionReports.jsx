import { useState, useEffect, useMemo } from "react"
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table"
import { Search, Edit2, Trash2, Filter, X, Save, XCircle } from "lucide-react"
import { db } from "../../../../../lib/firebase"

// Definición de tipos de reportes
const REPORT_TYPES = [
  { id: "all", label: "Todos los reportes", collection: null },
  { id: "soil_analyses", label: "Análisis de Suelos", collection: "soil_analyses" },
  { id: "extraction_records", label: "Extracción", collection: "extraction_records" },
  { id: "lab_analyses", label: "Laboratorio", collection: "lab_analyses" },
  { id: "plant_runs", label: "Planta", collection: "plant_runs" },
  { id: "shipping_records", label: "Despacho", collection: "shipping_records" },
  { id: "supplies", label: "Insumos", collection: "supplies" },
]

// Función para normalizar fechas
const normalizeDate = (dateValue) => {
  if (!dateValue) return null
  if (typeof dateValue === "string") {
    const date = new Date(dateValue)
    return isNaN(date.getTime()) ? null : date
  }
  if (dateValue?.toDate) {
    return dateValue.toDate()
  }
  if (dateValue instanceof Date) {
    return dateValue
  }
  return null
}

// Función para formatear fechas
const formatDate = (dateValue) => {
  const date = normalizeDate(dateValue)
  if (!date) return "—"
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Función para obtener campos relevantes según el tipo de reporte
const getRelevantFields = (reportType, data) => {
  switch (reportType) {
    case "soil_analyses":
      return {
        zona: data.zona || "",
        fecha: data.fecha || "",
        analista: data.analista || "",
        ph: data.ph || data.resultado_ph || "",
        pureza: data.pureza || "",
        humedad: data.humedad || "",
        observaciones: data.observaciones || "",
      }
    case "extraction_records":
      return {
        lote: data.lote || "",
        zona: data.zona || "",
        fecha: data.fecha || "",
        material: data.material || "",
        cantidad: data.cantidad_t || data.cantidad || data.cantidad_kg || "",
        operador: data.operador || "",
        condicion: data.condicion || "",
        observaciones: data.observaciones || "",
      }
    case "lab_analyses":
      return {
        lote: data.lote || "",
        zona: data.zona || "",
        fecha: data.fecha_envio || data.fecha || "",
        resultado: data.resultado || "",
        pureza: data.pureza || "",
        humedad: data.humedad || "",
        operador: data.operador || "",
        observaciones: data.observaciones || "",
      }
    case "plant_runs":
      return {
        lote: data.lote || "",
        zona: data.zona || "",
        fecha: data.fecha || "",
        cantidad: data.cantidad_t || data.cantidad || data.cantidad_kg || "",
        pureza_final: data.pureza_final || "",
        turno: data.turno || "",
        operador: data.operador || "",
        observaciones: data.observaciones || "",
      }
    case "shipping_records":
      return {
        lote: data.lote || "",
        fecha: data.fecha || "",
        cliente: data.cliente_destino || data.cliente || "",
        cantidad: data.cantidad_kg || data.cantidad || "",
        pureza_final: data.pureza_final || data.pureza || "",
        transportista: data.transportista || "",
        observaciones: data.observaciones || "",
      }
    case "supplies":
      return {
        nombre: data.nombre || "",
        categoria: data.categoria || "",
        cantidad: data.cantidad || "",
        unidad: data.unidad || "",
        proveedor: data.proveedor || "",
        observaciones: data.observaciones || "",
      }
    default:
      return {}
  }
}

export default function GestionReports() {
  const [selectedType, setSelectedType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Cargar reportes
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError(null)
      try {
        const allReports = []

        if (selectedType === "all") {
          // Cargar todos los tipos de reportes
          for (const type of REPORT_TYPES.slice(1)) {
            try {
              const snapshot = await getDocs(query(collection(db, type.collection), orderBy("created_at", "desc")))
              snapshot.docs.forEach((doc) => {
                allReports.push({
                  id: doc.id,
                  type: type.id,
                  typeLabel: type.label,
                  ...doc.data(),
                })
              })
            } catch (err) {
              console.error(`Error cargando ${type.label}:`, err)
            }
          }
        } else {
          // Cargar solo el tipo seleccionado
          const type = REPORT_TYPES.find((t) => t.id === selectedType)
          if (type && type.collection) {
            const snapshot = await getDocs(query(collection(db, type.collection), orderBy("created_at", "desc")))
            snapshot.docs.forEach((doc) => {
              allReports.push({
                id: doc.id,
                type: type.id,
                typeLabel: type.label,
                ...doc.data(),
              })
            })
          }
        }

        setReports(allReports)
      } catch (err) {
        console.error("Error cargando reportes:", err)
        setError("No se pudieron cargar los reportes.")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [selectedType])

  // Filtrar reportes según búsqueda
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports

    const term = searchTerm.toLowerCase()
    return reports.filter((report) => {
      const fields = getRelevantFields(report.type, report)
      const searchableText = Object.values(fields)
        .concat([report.typeLabel])
        .join(" ")
        .toLowerCase()

      return searchableText.includes(term)
    })
  }, [reports, searchTerm])

  // Iniciar edición
  const handleEdit = (report) => {
    setEditingId(report.id)
    const fields = getRelevantFields(report.type, report)
    setEditData(fields)
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  // Guardar cambios
  const handleSave = async (report) => {
    try {
      const type = REPORT_TYPES.find((t) => t.id === report.type)
      if (!type || !type.collection) return

      const reportRef = doc(db, type.collection, report.id)

      // Preparar datos para actualizar según el tipo
      let updateData = {}
      switch (report.type) {
        case "soil_analyses":
          updateData = {
            zona: editData.zona || "",
            fecha: editData.fecha || "",
            analista: editData.analista || "",
            ph: editData.ph ? Number(editData.ph) : null,
            pureza: editData.pureza ? Number(editData.pureza) : null,
            humedad: editData.humedad ? Number(editData.humedad) : null,
            observaciones: editData.observaciones || "",
            updated_at: serverTimestamp(),
          }
          break
        case "extraction_records":
          updateData = {
            lote: editData.lote || "",
            zona: editData.zona || "",
            fecha: editData.fecha || "",
            material: editData.material || "",
            cantidad_t: editData.cantidad ? Number(editData.cantidad) : null,
            operador: editData.operador || "",
            condicion: editData.condicion || "",
            observaciones: editData.observaciones || "",
            updated_at: serverTimestamp(),
          }
          break
        case "lab_analyses":
          updateData = {
            lote: editData.lote || "",
            zona: editData.zona || "",
            fecha_envio: editData.fecha || "",
            resultado: editData.resultado || "",
            pureza: editData.pureza ? Number(editData.pureza) : null,
            humedad: editData.humedad ? Number(editData.humedad) : null,
            operador: editData.operador || "",
            observaciones: editData.observaciones || "",
            updated_at: serverTimestamp(),
          }
          break
        case "plant_runs":
          updateData = {
            lote: editData.lote || "",
            zona: editData.zona || "",
            fecha: editData.fecha || "",
            cantidad_t: editData.cantidad ? Number(editData.cantidad) : null,
            pureza_final: editData.pureza_final ? Number(editData.pureza_final) : null,
            turno: editData.turno || "",
            operador: editData.operador || "",
            observaciones: editData.observaciones || "",
            updated_at: serverTimestamp(),
          }
          break
        case "shipping_records":
          updateData = {
            lote: editData.lote || "",
            fecha: editData.fecha || "",
            cliente_destino: editData.cliente || "",
            cantidad_kg: editData.cantidad ? Number(editData.cantidad) : null,
            pureza_final: editData.pureza_final ? Number(editData.pureza_final) : null,
            transportista: editData.transportista || "",
            observaciones: editData.observaciones || "",
            updated_at: serverTimestamp(),
          }
          break
        case "supplies":
          updateData = {
            nombre: editData.nombre || "",
            categoria: editData.categoria || "",
            cantidad: editData.cantidad ? Number(editData.cantidad) : null,
            unidad: editData.unidad || "",
            proveedor: editData.proveedor || "",
            observaciones: editData.observaciones || "",
            updated_at: serverTimestamp(),
          }
          break
      }

      await updateDoc(reportRef, updateData)
      setEditingId(null)
      setEditData({})

      // Recargar el reporte actualizado
      const updatedSnapshot = await getDocs(query(collection(db, type.collection), orderBy("created_at", "desc")))
      const updatedReports = reports.map((r) => {
        if (r.id === report.id && r.type === report.type) {
          const updatedDoc = updatedSnapshot.docs.find((d) => d.id === report.id)
          return updatedDoc ? { id: updatedDoc.id, type: report.type, typeLabel: report.typeLabel, ...updatedDoc.data() } : r
        }
        return r
      })
      setReports(updatedReports)
    } catch (err) {
      console.error("Error actualizando reporte:", err)
      setError("No se pudo actualizar el reporte.")
    }
  }

  // Eliminar reporte
  const handleDelete = async (report) => {
    try {
      const type = REPORT_TYPES.find((t) => t.id === report.type)
      if (!type || !type.collection) return

      await deleteDoc(doc(db, type.collection, report.id))
      setReports(reports.filter((r) => !(r.id === report.id && r.type === report.type)))
      setDeleteConfirm(null)
    } catch (err) {
      console.error("Error eliminando reporte:", err)
      setError("No se pudo eliminar el reporte.")
    }
  }

  // Renderizar campo editable
  const renderEditableField = (label, fieldName, value, type = "text") => {
    if (editingId) {
      const isTextarea = fieldName === "observaciones"
      return (
        <div style={{ marginBottom: "0.5rem", gridColumn: isTextarea ? "1 / -1" : "auto" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem", color: "rgba(30, 44, 92, 0.7)" }}>
            {label}
          </label>
          {isTextarea ? (
            <textarea
              value={editData[fieldName] || ""}
              onChange={(e) => setEditData({ ...editData, [fieldName]: e.target.value })}
              style={{
                width: "100%",
                fontSize: "0.875rem",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(30, 44, 92, 0.14)",
                minHeight: "80px",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          ) : (
            <Input
              type={type}
              value={editData[fieldName] || ""}
              onChange={(e) => setEditData({ ...editData, [fieldName]: e.target.value })}
              style={{ width: "100%", fontSize: "0.875rem" }}
            />
          )}
        </div>
      )
    }
    return (
      <div style={{ marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(30, 44, 92, 0.6)" }}>{label}:</span>{" "}
        <span style={{ fontSize: "0.875rem", color: "rgba(30, 44, 92, 0.8)" }}>{value || "—"}</span>
      </div>
    )
  }

  return (
    <main className="dashboard-content">
      <div className="dashboard-content__inner">
        <div className="dashboard-form__header">
          <p className="dashboard-form__eyebrow">Gestión de reportes</p>
          <h1 className="dashboard-form__title">Gestión</h1>
          <p className="dashboard-form__subtitle">Busca, edita y elimina reportes de todas las secciones del sistema.</p>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Filtro por tipo */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                  Tipo de reporte
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {REPORT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`dashboard-hero-tab ${selectedType === type.id ? "dashboard-hero-tab--active" : ""}`}
                      style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Búsqueda */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                  Buscar por zona, lote, operador, etc.
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
                    type="text"
                    placeholder="Ej: O-123, Zona A, Juan Pérez..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: "2.75rem", width: "100%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de reportes */}
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <CardTitle>
                Reportes {selectedType !== "all" && `(${REPORT_TYPES.find((t) => t.id === selectedType)?.label})`}
              </CardTitle>
              <span style={{ fontSize: "0.875rem", color: "rgba(30, 44, 92, 0.6)" }}>
                {filteredReports.length} {filteredReports.length === 1 ? "reporte" : "reportes"}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <p style={{ color: "rgba(30, 44, 92, 0.6)" }}>Cargando reportes...</p>
              </div>
            ) : error ? (
              <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "0.5rem", color: "#dc2626" }}>
                {error}
              </div>
            ) : filteredReports.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <p style={{ color: "rgba(30, 44, 92, 0.6)" }}>No se encontraron reportes.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {filteredReports.map((report) => {
                  const fields = getRelevantFields(report.type, report)
                  const isEditing = editingId === report.id
                  const isDeleting = deleteConfirm === report.id

                  return (
                    <div
                      key={`${report.type}-${report.id}`}
                      style={{
                        border: "1px solid rgba(30, 44, 92, 0.12)",
                        borderRadius: "1rem",
                        padding: "1.5rem",
                        background: isEditing ? "rgba(242, 92, 74, 0.05)" : "rgba(255, 255, 255, 0.95)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <div>
                          <div
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "0.5rem",
                              background: "linear-gradient(135deg, #f25c4a, #f38e78)",
                              color: "#fff",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              marginBottom: "0.5rem",
                            }}
                          >
                            {report.typeLabel}
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.5)", margin: 0 }}>
                            ID: {report.id.substring(0, 8)}... • Creado: {formatDate(report.created_at)}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {!isEditing && !isDeleting && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(report)}
                                style={{ minWidth: "auto", padding: "0.5rem 0.75rem" }}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteConfirm(report.id)}
                                style={{ minWidth: "auto", padding: "0.5rem 0.75rem" }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </>
                          )}
                          {isEditing && (
                            <>
                              <Button
                                size="sm"
                                variant="accent"
                                onClick={() => handleSave(report)}
                                style={{ minWidth: "auto", padding: "0.5rem 0.75rem" }}
                              >
                                <Save size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                style={{ minWidth: "auto", padding: "0.5rem 0.75rem" }}
                              >
                                <X size={16} />
                              </Button>
                            </>
                          )}
                          {isDeleting && (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(report)}
                                style={{ minWidth: "auto", padding: "0.5rem 0.75rem" }}
                              >
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirm(null)}
                                style={{ minWidth: "auto", padding: "0.5rem 0.75rem" }}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {isDeleting ? (
                        <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "0.5rem", color: "#dc2626" }}>
                          ¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                          {Object.entries(fields).map(([key, value]) => {
                            const labels = {
                              zona: "Zona",
                              fecha: "Fecha",
                              analista: "Analista",
                              ph: "pH",
                              pureza: "Pureza (%)",
                              humedad: "Humedad (%)",
                              lote: "Lote",
                              material: "Material",
                              cantidad: "Cantidad",
                              operador: "Operador",
                              condicion: "Condición",
                              resultado: "Resultado",
                              pureza_final: "Pureza Final (%)",
                              turno: "Turno",
                              cliente: "Cliente",
                              transportista: "Transportista",
                              nombre: "Nombre",
                              categoria: "Categoría",
                              unidad: "Unidad",
                              proveedor: "Proveedor",
                              observaciones: "Observaciones",
                            }

                            return renderEditableField(labels[key] || key, key, value, key === "fecha" ? "date" : "text")
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

