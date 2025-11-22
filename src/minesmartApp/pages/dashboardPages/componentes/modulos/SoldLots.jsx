import { useEffect, useState } from "react"
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, where, serverTimestamp } from "firebase/firestore"
import { Button } from "../../../../../components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table"
import { Input } from "../../../../../components/ui/Input"
import { Package, RefreshCcw, CheckCircle2 } from "lucide-react"
import { db } from "../../../../../lib/firebase"

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return Number(value).toLocaleString("es-PE", { maximumFractionDigits: 2 })
}

const formatDate = (value) => {
  if (!value) return "—"
  
  // Si es un Timestamp de Firestore
  if (value && typeof value === "object" && "toDate" in value) {
    try {
      const date = value.toDate()
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      }
    } catch {
      return "—"
    }
  }
  
  // Si tiene la estructura de Timestamp serializado (seconds, nanoseconds)
  if (value && typeof value === "object" && "seconds" in value && "nanoseconds" in value) {
    try {
      const date = new Date(value.seconds * 1000 + value.nanoseconds / 1000000)
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      }
    } catch {
      return "—"
    }
  }
  
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      const safeDate = new Date(`${value}T00:00:00`)
      return Number.isNaN(safeDate.getTime()) ? "—" : safeDate.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

export default function SoldLots() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterLot, setFilterLot] = useState("")
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmingSale, setConfirmingSale] = useState(null)

  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    setError(null)
    try {
      // Obtener registros de planta (ingreso de producción)
      const plantSnapshot = await getDocs(query(collection(db, "plant_runs"), orderBy("fecha", "desc")))
      const plantRows = plantSnapshot.docs.map((doc) => {
        const data = doc.data()
        const rawMaterial = data.material ?? ""
        const producto = rawMaterial === "oro" 
          ? "Concentrado de Oro" 
          : rawMaterial === "cobre" 
          ? "Concentrado de Cobre" 
          : rawMaterial || ""
        
        // Calcular cantidad en kg
        const cantidadKg = data.cantidad_kg 
          ?? (typeof data.cantidad_t === "number" ? data.cantidad_t * 1000 : null)
          ?? 0
        
        // Convertir fecha_venta si es Timestamp
        let fechaVenta = null
        if (data.fecha_venta) {
          if (data.fecha_venta && typeof data.fecha_venta === "object" && "toDate" in data.fecha_venta) {
            fechaVenta = data.fecha_venta.toDate()
          } else if (data.fecha_venta && typeof data.fecha_venta === "object" && "seconds" in data.fecha_venta) {
            fechaVenta = new Date(data.fecha_venta.seconds * 1000 + (data.fecha_venta.nanoseconds || 0) / 1000000)
          } else {
            fechaVenta = data.fecha_venta
          }
        }
        
        return {
          id: doc.id,
          tipo: "planta", // Identificador para saber que viene de planta
          lote: data.lote || "",
          fecha: data.fecha || "",
          producto: producto,
          cantidad_kg: cantidadKg,
          pureza_final: data.pureza_final || null,
          zona: data.zona || "",
          turno: data.turno || "",
          operador: data.operador || "",
          vendido: data.vendido || false,
          fecha_venta: fechaVenta,
          cliente_destino: null, // Los registros de planta no tienen cliente todavía
          transportista: null, // Los registros de planta no tienen transportista todavía
        }
      })

      // Obtener registros de despacho
      const shippingSnapshot = await getDocs(query(collection(db, "shipping_records"), orderBy("fecha", "desc")))
      const shippingRows = shippingSnapshot.docs.map((doc) => {
        const data = doc.data()
        
        // Convertir fecha_venta si es Timestamp
        let fechaVenta = null
        if (data.fecha_venta) {
          if (data.fecha_venta && typeof data.fecha_venta === "object" && "toDate" in data.fecha_venta) {
            fechaVenta = data.fecha_venta.toDate()
          } else if (data.fecha_venta && typeof data.fecha_venta === "object" && "seconds" in data.fecha_venta) {
            fechaVenta = new Date(data.fecha_venta.seconds * 1000 + (data.fecha_venta.nanoseconds || 0) / 1000000)
          } else {
            fechaVenta = data.fecha_venta
          }
        }
        
        return {
          id: doc.id,
          tipo: "despacho", // Identificador para saber que viene de despacho
          lote: data.lote || "",
          fecha: data.fecha || "",
          producto: data.producto || "",
          cantidad_kg: data.cantidad_kg || 0,
          pureza_final: data.pureza_final || null,
          cliente_destino: data.cliente_destino || "",
          transportista: data.transportista || "",
          vendido: data.vendido || false,
          fecha_venta: fechaVenta,
        }
      })

      // Combinar ambos tipos de registros y ordenar por fecha (más recientes primero)
      const allRows = [...plantRows, ...shippingRows].sort((a, b) => {
        const dateA = a.fecha || ""
        const dateB = b.fecha || ""
        return dateB.localeCompare(dateA)
      })

      setRecords(allRows)
    } catch (err) {
      console.error(err)
      setError("No se pudieron obtener los registros de producción y despacho.")
    } finally {
      setLoading(false)
    }
  }

  const confirmSale = async (recordId, recordType) => {
    setConfirmingSale(recordId)
    try {
      // Determinar la colección según el tipo de registro
      const collectionName = recordType === "planta" ? "plant_runs" : "shipping_records"
      const recordRef = doc(db, collectionName, recordId)
      
      // Obtener los datos del registro antes de actualizarlo
      const record = records.find((item) => item.id === recordId)
      if (!record) {
        throw new Error("Registro no encontrado")
      }
      
      // Si es un registro de planta, crear automáticamente un registro de despacho si no existe
      if (recordType === "planta") {
        // Verificar si ya existe un registro de despacho para este lote
        const shippingQuery = query(collection(db, "shipping_records"), where("lote", "==", record.lote))
        const existingShipping = await getDocs(shippingQuery)
        
        if (existingShipping.empty) {
          // Crear registro de despacho automáticamente
          const rawMaterial = record.producto || ""
          const producto = rawMaterial.includes("Oro") 
            ? "Concentrado de Oro" 
            : rawMaterial.includes("Cobre") 
            ? "Concentrado de Cobre" 
            : rawMaterial || "Concentrado"
          
          await addDoc(collection(db, "shipping_records"), {
            fecha: record.fecha || new Date().toISOString().split("T")[0],
            lote: record.lote || "",
            producto: producto,
            cantidad_kg: record.cantidad_kg || 0,
            pureza_final: record.pureza_final || null,
            cliente_destino: "Venta directa", // Valor por defecto
            transportista: "Por confirmar", // Valor por defecto
            vendido: true, // Ya viene marcado como vendido
            fecha_venta: serverTimestamp(),
            observaciones: "Registro de despacho creado automáticamente al confirmar venta desde planta",
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          })
        } else {
          // Si ya existe un registro de despacho, también marcarlo como vendido
          const shippingDoc = existingShipping.docs[0]
          const shippingRef = doc(db, "shipping_records", shippingDoc.id)
          await updateDoc(shippingRef, {
            vendido: true,
            fecha_venta: serverTimestamp(),
            updated_at: serverTimestamp(),
          })
        }
      }
      
      // Actualizar el registro original como vendido
      await updateDoc(recordRef, {
        vendido: true,
        fecha_venta: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      // Recargar los registros para obtener el nuevo registro de despacho si se creó
      await fetchRecords()
    } catch (err) {
      console.error(err)
      setError("No se pudo confirmar la venta. Intenta nuevamente.")
    } finally {
      setConfirmingSale(null)
    }
  }

  const filteredData = records.filter((item) =>
    filterLot ? (item.lote || "").toLowerCase().includes(filterLot.toLowerCase()) : true
  )

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE))
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const pendingCount = filteredData.filter((item) => !item.vendido).length
  const soldCount = filteredData.filter((item) => item.vendido).length
  const totalCantidad = filteredData.reduce((acc, item) => acc + Number(item.cantidad_kg || item.cantidad || 0), 0)

  const resetFilters = () => {
    setFilterLot("")
    setCurrentPage(1)
  }

  return (
    <section className="dashboard-form">
      <div className="dashboard-form__header">
        <p className="dashboard-form__eyebrow">Gestión de ventas</p>
        <h1 className="dashboard-form__title">Lotes vendidos</h1>
        <p className="dashboard-form__subtitle">
          Cambia el estado de los lotes de producción y despachados a vendido para completar el seguimiento del proceso.
        </p>
      </div>

      <div className="dashboard-form__card">
        <div className="dashboard-report__filters" style={{ marginBottom: "1.5rem" }}>
          <Input
            type="text"
            placeholder="Buscar por número de lote..."
            value={filterLot}
            onChange={(e) => {
              setFilterLot(e.target.value)
              setCurrentPage(1)
            }}
            className="dashboard-form__input"
            style={{ maxWidth: "400px" }}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" size="sm" className="inline-flex items-center gap-2" onClick={fetchRecords}>
              <RefreshCcw size={16} />
              Actualizar
            </Button>
            <Button variant="secondary" size="sm" className="inline-flex items-center gap-2" onClick={resetFilters}>
              Limpiar
            </Button>
          </div>
        </div>

        <div className="dashboard-report__metrics">
          <div className="dashboard-report__metric">
            <span className="dashboard-report__metric-label">Total de lotes</span>
            <span className="dashboard-report__metric-value">{filteredData.length}</span>
            <span>Producción y despachos</span>
          </div>
          <div className="dashboard-report__metric dashboard-report__metric--alt">
            <span className="dashboard-report__metric-label">Pendientes de venta</span>
            <span className="dashboard-report__metric-value">{pendingCount}</span>
            <span>Lotes sin confirmar</span>
          </div>
          <div className="dashboard-report__metric">
            <span className="dashboard-report__metric-label">Lotes vendidos</span>
            <span className="dashboard-report__metric-value">{soldCount}</span>
            <span>Ventas confirmadas</span>
          </div>
          <div className="dashboard-report__metric dashboard-report__metric--alt">
            <span className="dashboard-report__metric-label">Cantidad total (kg)</span>
            <span className="dashboard-report__metric-value">{formatNumber(totalCantidad)}</span>
            <span>Suma de la columna cantidad</span>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Cargando lotes…</p>}
        {error && (
          <p className="text-sm text-red-600" style={{ padding: "1rem", background: "rgba(220, 38, 38, 0.1)", borderRadius: "0.5rem" }}>
            {error}
          </p>
        )}
        {!loading && !error && filteredData.length === 0 && (
          <p className="text-sm text-muted-foreground" style={{ padding: "2rem", textAlign: "center" }}>
            No hay lotes de producción o despachados que coincidan con los filtros.
          </p>
        )}

        {!loading && !error && filteredData.length > 0 && (
          <div className="dashboard-report__table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad (kg)</TableHead>
                  <TableHead>Pureza (%)</TableHead>
                  <TableHead>Cliente / Destino</TableHead>
                  <TableHead>Transportista</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow
                    key={row.id}
                    style={row.vendido ? { opacity: 0.7, background: "rgba(34, 197, 94, 0.05)" } : {}}
                  >
                    <TableCell>
                      <strong>{row.lote || "—"}</strong>
                    </TableCell>
                    <TableCell>{formatDate(row.fecha)}</TableCell>
                    <TableCell>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.375rem",
                          background: row.tipo === "planta" ? "rgba(139, 92, 246, 0.1)" : "rgba(236, 72, 153, 0.1)",
                          color: row.tipo === "planta" ? "#8b5cf6" : "#ec4899",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {row.tipo === "planta" ? "Planta" : "Despacho"}
                      </span>
                    </TableCell>
                    <TableCell>{row.producto || "—"}</TableCell>
                    <TableCell>{formatNumber(row.cantidad_kg || row.cantidad)}</TableCell>
                    <TableCell>{formatNumber(row.pureza_final)}%</TableCell>
                    <TableCell>{row.cliente_destino || "—"}</TableCell>
                    <TableCell>{row.transportista || "—"}</TableCell>
                    <TableCell>
                      {row.vendido ? (
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "0.5rem",
                            background: "rgba(34, 197, 94, 0.1)",
                            color: "#22c55e",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <CheckCircle2 size={14} />
                          Vendido
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "0.5rem",
                            background: "rgba(242, 92, 74, 0.1)",
                            color: "#f25c4a",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          Pendiente
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!row.vendido && (
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => confirmSale(row.id, row.tipo)}
                          disabled={confirmingSale === row.id}
                          className="inline-flex items-center gap-2"
                        >
                          {confirmingSale === row.id ? (
                            "Confirmando..."
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              Confirmar venta
                            </>
                          )}
                        </Button>
                      )}
                      {row.vendido && row.fecha_venta && (
                        <span style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)" }}>
                          Vendido: {formatDate(row.fecha_venta)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && !error && filteredData.length > 0 && (
          <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(30, 44, 92, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.875rem", color: "rgba(30, 44, 92, 0.6)" }}>
              Mostrando {paginatedData.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} a{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} registros
            </div>
            <div className="dashboard-report__pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="dashboard-report__page-btn"
              >
                &laquo;
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`dashboard-report__page-btn ${currentPage === page ? "dashboard-report__page-btn--active" : ""}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="dashboard-report__page-btn"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

