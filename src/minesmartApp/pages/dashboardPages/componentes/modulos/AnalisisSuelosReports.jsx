import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table"
import { Calendar, MapPin, RefreshCcw } from "lucide-react"
import { db } from "../../../../../lib/firebase"

const ITEMS_PER_PAGE = 10

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return Number(value).toLocaleString("es-PE", { maximumFractionDigits: 2 })
}

export default function AnalisisSuelosReports() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterZone, setFilterZone] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      setError(null)
      try {
        const snapshot = await getDocs(query(collection(db, "soil_analyses"), orderBy("fecha", "desc")))
        const rows = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            zona: data.zona ?? "",
            fecha: data.fecha ?? "",
            analista: data.analista ?? "",
            resultadoPh: data.resultado_ph ?? data.ph ?? null,
            pureza: data.pureza ?? null,
            humedad: data.humedad ?? null,
            zonaApta: data.zona_apta === true || data.zona_apta === "si",
            observaciones: data.observaciones ?? "",
          }
        })
        setRecords(rows)
      } catch (err) {
        console.error(err)
        setError("No se pudieron obtener los análisis de suelo.")
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [])

  const filteredData = useMemo(() => {
    return records.filter((item) => {
      const matchesZone = filterZone ? item.zona.toLowerCase().includes(filterZone.toLowerCase()) : true
      const matchesDate = filterDate ? (item.fecha ?? "").startsWith(filterDate) : true
      return matchesZone && matchesDate
    })
  }, [records, filterZone, filterDate])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE))
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const aptCount = filteredData.filter((item) => item.zonaApta).length
  const averagePh = filteredData.length
    ? filteredData.reduce((acc, item) => acc + Number(item.resultadoPh || 0), 0) / filteredData.length
    : 0
  const averageHumidity = filteredData.length
    ? filteredData.reduce((acc, item) => acc + Number(item.humedad || 0), 0) / filteredData.length
    : 0

  const resetFilters = () => {
    setFilterZone("")
    setFilterDate("")
    setCurrentPage(1)
  }

  return (
    <section className="dashboard-report">
      <div className="dashboard-report__filters">
        <span className="inline-flex items-center gap-2 dashboard-report__filter-chip">
          <MapPin size={16} />
          <span>Zona</span>
          <Input
            placeholder="Ej: Zona norte"
            value={filterZone}
            onChange={(e) => {
              setFilterZone(e.target.value)
              setCurrentPage(1)
            }}
            className="dashboard-form__input"
          />
        </span>
        <span className="inline-flex items-center gap-2 dashboard-report__filter-chip">
          <Calendar size={16} />
          <span>Fecha</span>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value)
              setCurrentPage(1)
            }}
            className="dashboard-form__input"
          />
        </span>
        <Button variant="secondary" size="sm" className="inline-flex items-center gap-2" onClick={resetFilters}>
          <RefreshCcw size={16} />
          Limpiar filtros
        </Button>
      </div>

      <div className="dashboard-report__container">
        <header className="dashboard-report__header">
          <div className="dashboard-report__title-block">
            <h2 className="dashboard-report__title">Reporte de resultados de análisis de suelo</h2>
          </div>
          <span className="dashboard-report__badge">Exploración</span>
        </header>

        <div className="dashboard-report__metrics">
          <div className="dashboard-report__metric">
            <span className="dashboard-report__metric-label">Registros filtrados</span>
            <span className="dashboard-report__metric-value">{filteredData.length}</span>
            <span>Analíticas obtenidas desde Firestore</span>
          </div>
          <div className="dashboard-report__metric dashboard-report__metric--alt">
            <span className="dashboard-report__metric-label">Zonas aptas</span>
            <span className="dashboard-report__metric-value">{aptCount}</span>
            <span>
              {filteredData.length === 0
                ? "Sin registros"
                : `${Math.round((aptCount / filteredData.length) * 100)}% del total`}
            </span>
          </div>
          <div className="dashboard-report__metric">
            <span className="dashboard-report__metric-label">pH promedio</span>
            <span className="dashboard-report__metric-value">{formatNumber(averagePh)}</span>
            <span>Muestras filtradas</span>
          </div>
          <div className="dashboard-report__metric">
            <span className="dashboard-report__metric-label">Humedad promedio</span>
            <span className="dashboard-report__metric-value">{formatNumber(averageHumidity)}%</span>
            <span>De la selección actual</span>
          </div>
        </div>

        <div className="dashboard-report__table">
          {loading && <p className="text-sm text-muted-foreground">Cargando resultados…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && filteredData.length === 0 && (
            <p className="text-sm text-muted-foreground">No se encontraron análisis que coincidan con los filtros.</p>
          )}

          {!loading && !error && filteredData.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Analista</TableHead>
                  <TableHead>Resultado pH</TableHead>
                  <TableHead>Pureza (%)</TableHead>
                  <TableHead>Humedad (%)</TableHead>
                  <TableHead>Zona apta</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell>{row.zona || "—"}</TableCell>
                    <TableCell>{row.fecha || "—"}</TableCell>
                    <TableCell>{row.analista || "—"}</TableCell>
                    <TableCell>{formatNumber(row.resultadoPh)}</TableCell>
                    <TableCell>{formatNumber(row.pureza)}</TableCell>
                    <TableCell>{formatNumber(row.humedad)}</TableCell>
                    <TableCell>{row.zonaApta ? "Sí" : "No"}</TableCell>
                    <TableCell>{row.observaciones || "—"}</TableCell>
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
                className={`dashboard-report__page-btn ${
                  currentPage === page ? "dashboard-report__page-btn--active" : ""
                }`}
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
        </footer>
      </div>
    </section>
  )
}
