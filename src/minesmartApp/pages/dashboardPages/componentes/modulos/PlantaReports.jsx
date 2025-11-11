import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table"
import { Calendar, Layers, Microscope, RefreshCcw } from "lucide-react"
import { db } from "../../../../../lib/firebase"

const ITEMS_PER_PAGE = 10

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return Number(value).toLocaleString("es-PE", { maximumFractionDigits: 2 })
}

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return `${Number(value).toLocaleString("es-PE", { maximumFractionDigits: 2 })}%`
}

const formatDate = (value) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    const safeDate = new Date(`${value}T00:00:00`)
    return Number.isNaN(safeDate.getTime()) ? value : safeDate.toLocaleDateString("es-PE")
  }
  return date.toLocaleDateString("es-PE")
}

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

const conditionLabel = (value) => {
  if (!value) return "—"
  const map = { humedo: "Húmedo", seco: "Seco", crudo: "Crudo" }
  const normalized = value.toString().toLowerCase()
  return map[normalized] || value
}

const capitalize = (value) => {
  if (!value) return "—"
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function PlantaReports() {
  const [reportType, setReportType] = useState("material")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [filterMaterial, setFilterMaterial] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [materialData, setMaterialData] = useState([])
  const [analysisData, setAnalysisData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [extractionSnap, labsSnap] = await Promise.all([
          getDocs(query(collection(db, "extraction_records"), orderBy("fecha", "desc"))),
          getDocs(query(collection(db, "lab_analyses"), orderBy("fecha_envio", "desc"))),
        ])

        const runs = extractionSnap.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            lote: data.lote ?? "",
            zona: data.zona ?? "",
            fecha: data.fecha ?? "",
            material: data.material ?? "",
            operador: data.operador ?? "",
            condicion: data.condicion ?? "",
            cantidad: Number(data.cantidad_t ?? data.cantidad ?? data.cantidad_kg ?? 0),
            observaciones: data.observaciones ?? "",
          }
        })

        const labs = labsSnap.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            zona: data.zona ?? "",
            fecha: data.fecha_envio ?? "",
            operador: data.operador ?? "",
            loteExtraccion: data.extraction_id ?? "",
            material: data.material ?? "",
            humedad: data.humedad ?? null,
            resultado: data.resultado ?? "",
            observaciones: data.observaciones ?? "",
          }
        })

        setMaterialData(runs)
        setAnalysisData(labs)
      } catch (err) {
        console.error(err)
        setError("No se pudieron obtener los registros de planta.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const dataset = reportType === "material" ? materialData : analysisData

  const filteredData = useMemo(() => {
    const start = normalizeDateInput(filterStartDate)
    const end = normalizeDateInput(filterEndDate)
    return dataset.filter((item) => {
      const matchesDate = isWithinRange(item.fecha, start, end)
      const matchesMaterial =
        reportType === "material"
          ? filterMaterial
            ? (item.material ?? "") === filterMaterial
            : true
          : true
      return matchesDate && matchesMaterial
    })
  }, [dataset, filterStartDate, filterEndDate, filterMaterial, reportType])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE))
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1)
  }

  const resetFilters = () => {
    setFilterStartDate("")
    setFilterEndDate("")
    setFilterMaterial("")
    setCurrentPage(1)
  }

  const tableConfig =
    reportType === "material"
      ? {
          title: "Reporte de material a procesar por lote",
          badge: "Planta",
          icon: <Layers size={18} />,
          columns: [
            { key: "lote", label: "Lote" },
            { key: "zona", label: "Zona" },
            { key: "fecha", label: "Fecha" },
            { key: "operador", label: "Operador" },
            { key: "cantidad", label: "Cantidad" },
            { key: "material", label: "Material" },
            { key: "condicion", label: "Condición" },
            { key: "observaciones", label: "Observaciones" },
          ],
        }
      : {
          title: "Reporte de resultados de análisis de muestras por zona",
          badge: "Laboratorio",
          icon: <Microscope size={18} />,
          columns: [
            { key: "__index", label: "ID" },
            { key: "zona", label: "Zona" },
            { key: "fecha", label: "Fecha" },
            { key: "operador", label: "Operador" },
            { key: "loteExtraccion", label: "Lote de extracción" },
            { key: "material", label: "Material" },
            { key: "humedad", label: "Humedad" },
            { key: "resultado", label: "Resultado" },
            { key: "observaciones", label: "Observaciones" },
          ],
        }

  const metrics =
    reportType === "material"
      ? [
          {
            label: "Lotes registrados",
            value: filteredData.length,
            detail: "Datos sincronizados desde Firestore",
          },
          {
            label: "Toneladas acumuladas",
            value: `${formatNumber(filteredData.reduce((acc, item) => acc + Number(item.cantidad || 0), 0))} t`,
            detail: "Suma de la columna cantidad",
            alt: true,
          },
        ]
      : [
          {
            label: "Muestras evaluadas",
            value: filteredData.length,
            detail: "En el rango filtrado",
          },
          {
            label: "Humedad promedio",
            value:
              filteredData.length === 0
                ? "—"
                : formatPercent(
                    filteredData.reduce((acc, item) => acc + Number(item.humedad || 0), 0) / filteredData.length
                  ),
            detail: "Calculado sobre resultados cargados",
            alt: true,
          },
        ]

  return (
    <section className="dashboard-report">
      <div className="dashboard-hero-tabs" style={{ marginBottom: "1.5rem", maxWidth: "fit-content" }}>
        <button
          type="button"
          onClick={() => {
            setReportType("material")
            setCurrentPage(1)
          }}
          className={`dashboard-hero-tab ${reportType === "material" ? "dashboard-hero-tab--active" : ""}`}
        >
          Material a procesar por lote
        </button>
        <button
          type="button"
          onClick={() => {
            setReportType("analysis")
            setCurrentPage(1)
          }}
          className={`dashboard-hero-tab ${reportType === "analysis" ? "dashboard-hero-tab--active" : ""}`}
        >
          Resultados de análisis por zona
        </button>
      </div>

      <div className="dashboard-report__filters">
        <span className="inline-flex items-center gap-2 dashboard-report__filter-chip">
          <Calendar size={16} />
          <span>Desde</span>
          <Input
            type="date"
            value={filterStartDate}
            onChange={(e) => {
              setFilterStartDate(e.target.value)
              setCurrentPage(1)
            }}
            className="dashboard-form__input"
          />
        </span>
        <span className="inline-flex items-center gap-2 dashboard-report__filter-chip">
          <Calendar size={16} />
          <span>Hasta</span>
          <Input
            type="date"
            value={filterEndDate}
            onChange={(e) => {
              setFilterEndDate(e.target.value)
              setCurrentPage(1)
            }}
            className="dashboard-form__input"
          />
        </span>
        {reportType === "material" && (
          <span className="inline-flex items-center gap-2 dashboard-report__filter-chip">
            <Layers size={16} />
            <span>Material</span>
            <select
              value={filterMaterial}
              onChange={(e) => {
                setFilterMaterial(e.target.value)
                setCurrentPage(1)
              }}
              className="dashboard-form__input"
            >
              <option value="">Todos</option>
              <option value="oro">Oro</option>
              <option value="cobre">Cobre</option>
            </select>
          </span>
        )}
        <Button variant="secondary" size="sm" className="inline-flex items-center gap-2" onClick={resetFilters}>
          <RefreshCcw size={16} />
          Limpiar filtros
        </Button>
      </div>

      <div className="dashboard-report__container">
        <header className="dashboard-report__header">
          <div className="dashboard-report__title-block">
            <h2 className="dashboard-report__title">{tableConfig.title}</h2>
          </div>
          <span className="dashboard-report__badge inline-flex items-center gap-2">
            {tableConfig.icon}
            {tableConfig.badge}
          </span>
        </header>

        <div className="dashboard-report__metrics">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={`dashboard-report__metric ${metric.alt ? "dashboard-report__metric--alt" : ""}`}
            >
              <span className="dashboard-report__metric-label">{metric.label}</span>
              <span className="dashboard-report__metric-value">{metric.value}</span>
              <span>{metric.detail}</span>
            </div>
          ))}
        </div>

        <div className="dashboard-report__table">
          {loading && <p className="text-sm text-muted-foreground">Cargando información…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && filteredData.length === 0 && (
            <p className="text-sm text-muted-foreground">No se encontraron registros con los filtros seleccionados.</p>
          )}

          {!loading && !error && filteredData.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  {tableConfig.columns.map((column) => (
                    <TableHead key={column.label}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={row.id}>
                    {tableConfig.columns.map((column) => {
                      let value = row[column.key]

                      if (column.key === "__index") {
                        value = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                      } else if (column.key === "fecha") {
                        value = formatDate(row.fecha)
                      } else if (column.key === "cantidad") {
                        const amount = formatNumber(row.cantidad)
                        value = amount === "—" ? "—" : `${amount} t`
                      } else if (column.key === "material") {
                        value = capitalize(row.material)
                      } else if (column.key === "condicion") {
                        value = conditionLabel(row.condicion)
                      } else if (column.key === "humedad") {
                        value = formatPercent(row.humedad)
                      }

                      if (value === undefined || value === null || value === "") {
                        value = "—"
                      }

                      return <TableCell key={column.label}>{value}</TableCell>
                    })}
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
            <button onClick={handlePreviousPage} disabled={currentPage === 1} className="dashboard-report__page-btn">
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
