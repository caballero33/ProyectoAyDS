import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { Calendar, MapPin, RefreshCcw } from "lucide-react"
import { db } from "../../../../../lib/firebase"

const ITEMS_PER_PAGE = 10

const normalizeDateInput = (value) => {
  if (!value) return null
  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) {
    direct.setHours(0, 0, 0, 0)
    return direct
  }
  const fallback = new Date(`${value}T00:00:00`)
  if (Number.isNaN(fallback.getTime())) return null
  fallback.setHours(0, 0, 0, 0)
  return fallback
}

const isWithinRange = (value, start, end) => {
  if (!start && !end) return true
  const date = normalizeDateInput(value)
  if (!date) return false
  if (start && date < start) return false
  if (end) {
    const endOfDay = new Date(end)
    endOfDay.setHours(23, 59, 59, 999)
    if (date > endOfDay) return false
  }
  return true
}

export default function ExtraccionReports() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroZona, setFiltroZona] = useState("")
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("")
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      setError(null)
      try {
        const snapshot = await getDocs(query(collection(db, "extraction_records"), orderBy("fecha", "desc")))
        const data = snapshot.docs.map((doc) => {
          const payload = doc.data()
          return {
            id: doc.id,
            zona: payload.zona ?? "",
            fecha: payload.fecha ?? "",
            material: payload.material ?? "",
            lote: payload.lote ?? "",
            cantidad: payload.cantidad_kg ?? 0,
            condicion: payload.condicion ?? "",
            observaciones: payload.observaciones ?? "",
          }
        })
        setRecords(data)
      } catch (err) {
        console.error(err)
        setError("No se pudieron obtener los registros de extracción.")
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [])

  const filteredData = useMemo(() => {
    const start = normalizeDateInput(filtroFechaDesde)
    const end = normalizeDateInput(filtroFechaHasta)
    return records.filter((item) => {
      const zonaMatch = filtroZona ? item.zona.toLowerCase().includes(filtroZona.toLowerCase()) : true
      const fechaMatch = isWithinRange(item.fecha, start, end)
      return zonaMatch && fechaMatch
    })
  }, [records, filtroZona, filtroFechaDesde, filtroFechaHasta])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE))
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1)
  }

  const clearFilters = () => {
    setFiltroZona("")
    setFiltroFechaDesde("")
    setFiltroFechaHasta("")
    setCurrentPage(1)
  }

  return (
    <section className="dashboard-report">
      <div className="dashboard-report__filters">
        <span className="inline-flex items-center gap-2 dashboard-report__filter-chip">
          <MapPin size={16} />
          <span>Zona</span>
          <Input
            id="filtro-zona"
            placeholder="Ej: Zona norte..."
            value={filtroZona}
            onChange={(e) => {
              setFiltroZona(e.target.value)
              setCurrentPage(1)
            }}
            className="dashboard-form__input"
          />
        </span>
        <span className="inline-flex items-center gap-2 dashboard-report__filter-chip">
          <Calendar size={16} />
          <span>Desde</span>
          <Input
            id="filtro-fecha-desde"
            type="date"
            value={filtroFechaDesde}
            onChange={(e) => {
              setFiltroFechaDesde(e.target.value)
              setCurrentPage(1)
            }}
            className="dashboard-form__input"
          />
        </span>
        <span className="inline-flex items-center gap-2 dashboard-report__filter-chip">
          <Calendar size={16} />
          <span>Hasta</span>
          <Input
            id="filtro-fecha-hasta"
            type="date"
            value={filtroFechaHasta}
            onChange={(e) => {
              setFiltroFechaHasta(e.target.value)
              setCurrentPage(1)
            }}
            className="dashboard-form__input"
          />
        </span>
        <Button variant="secondary" size="sm" onClick={clearFilters} className="inline-flex items-center gap-2">
          <RefreshCcw size={16} />
          Limpiar filtros
        </Button>
      </div>

      <div className="dashboard-report__container">
        <header className="dashboard-report__header">
          <div className="dashboard-report__title-block">
            <h2 className="dashboard-report__title">Reporte de extracción</h2>
          </div>
          <span className="dashboard-report__badge">Extracción</span>
        </header>

        <div className="dashboard-report__metrics">
          <div className="dashboard-report__metric">
            <span className="dashboard-report__metric-label">Registros filtrados</span>
            <span className="dashboard-report__metric-value">{filteredData.length}</span>
            <span>Total encontrado en Firestore</span>
          </div>
          <div className="dashboard-report__metric dashboard-report__metric--alt">
            <span className="dashboard-report__metric-label">Página</span>
            <span className="dashboard-report__metric-value">{currentPage}</span>
            <span>de {totalPages}</span>
          </div>
        </div>

        <div className="dashboard-report__table">
          {loading && <p className="text-sm text-muted-foreground">Cargando registros…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && filteredData.length === 0 && (
            <p className="text-sm text-muted-foreground">No se encontraron registros con los filtros aplicados.</p>
          )}

          {!loading && !error && filteredData.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Cantidad (kg)</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.zona}</TableCell>
                    <TableCell>{item.fecha}</TableCell>
                    <TableCell>{item.material}</TableCell>
                    <TableCell>{item.lote}</TableCell>
                    <TableCell>{item.cantidad}</TableCell>
                    <TableCell>{item.condicion}</TableCell>
                    <TableCell>{item.observaciones}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <footer className="dashboard-report__footer">
          <div>
            Mostrando {paginatedData.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} a {" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} registros
          </div>
          <div className="dashboard-report__pagination">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="dashboard-report__page-btn"
            >
              &laquo;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`dashboard-report__page-btn ${
                  currentPage === page ? "dashboard-report__page-btn--active" : ""
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="dashboard-report__page-btn"
            >
              &raquo;
            </button>
          </div>
        </footer>
      </div>
    </section>
  )
}
