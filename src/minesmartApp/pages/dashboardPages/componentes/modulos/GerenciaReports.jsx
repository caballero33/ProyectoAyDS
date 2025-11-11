import { useEffect, useMemo, useRef, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Button } from "../../../../../components/ui/Button"
import { Printer } from "lucide-react"
import { db } from "../../../../../lib/firebase"

const COLORS = ["#2B5E7E", "#EC7E3A", "#22C55E", "#6366F1", "#14B8A6", "#F97316", "#A855F7"]
const COMPANY_LOGO_URL = "https://res.cloudinary.com/dcm2dsjov/image/upload/v1762741683/images_gyxzku.png"

const formatNumber = (value, opts = {}) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return Number(value).toLocaleString("es-PE", { maximumFractionDigits: 2, ...opts })
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

const periodLabel = (dates) => {
  if (!dates.length) return "Periodo: sin registros"
  const sorted = [...dates].sort()
  const first = formatDate(sorted[0])
  const last = formatDate(sorted[sorted.length - 1])
  return first === last ? `Periodo: ${first}` : `Periodo: ${first} - ${last}`
}

const variationLabel = (current, previous) => {
  if (!previous || Number.isNaN(previous) || previous === 0) return "Variación: —"
  const variation = ((current - previous) / previous) * 100
  const sign = variation >= 0 ? "+" : ""
  return `Variación: ${sign}${variation.toFixed(1)}%`
}

const signedPercent = (current, previous) => {
  if (!previous || Number.isNaN(previous) || previous === 0) return "—"
  const variation = ((current - previous) / previous) * 100
  const sign = variation >= 0 ? "+" : ""
  return `${sign}${variation.toFixed(1)}%`
}

const parseDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return date
  const fallback = new Date(`${value}T00:00:00`)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

const startOfDay = (value) => {
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export default function GerenciaReports() {
  const [reportType, setReportType] = useState("machinery")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    runs: [],
    failures: [],
    labs: [],
    consumptions: [],
    supplies: [],
  })
  const reportRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [runsSnap, failuresSnap, labsSnap, consumptionsSnap, suppliesSnap] = await Promise.all([
          getDocs(query(collection(db, "plant_runs"), orderBy("fecha", "desc"))),
          getDocs(query(collection(db, "plant_failures"), orderBy("created_at", "desc"))),
          getDocs(query(collection(db, "lab_analyses"), orderBy("fecha_envio", "desc"))),
          getDocs(query(collection(db, "plant_consumptions"), orderBy("fecha", "desc"))),
          getDocs(query(collection(db, "supplies"))),
        ])

        const runs = runsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        const runById = runs.reduce((acc, run) => {
          acc[run.id] = run
          return acc
        }, {})

        const failures = failuresSnap.docs.map((doc) => {
          const payload = doc.data()
          const relatedRun = payload.plant_run_id ? runById[payload.plant_run_id] : undefined
          return {
            id: doc.id,
            fecha: relatedRun?.fecha ?? payload.fecha ?? null,
            maquina: payload.maquina ?? "",
            tipo_falla: payload.tipo_falla ?? "",
            duracion_horas: Number(payload.duracion_horas ?? 0),
            estado: payload.estado ?? "",
            responsable: payload.responsable ?? "",
            descripcion: payload.descripcion ?? "",
          }
        })

        const labs = labsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        const consumptions = consumptionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        const supplies = suppliesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        setData({ runs, failures, labs, consumptions, supplies })
      } catch (err) {
        console.error(err)
        setError("No se pudo cargar la información gerencial.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const machineryStats = useMemo(() => {
    const durations = data.failures.map((item) => Number(item.duracion_horas || 0))
    const avgDowntime = durations.length ? `${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)} h` : "—"
    const machines = new Set(data.failures.map((item) => item.maquina).filter(Boolean))

    return {
    summary: {
        avgDowntime,
        totalFailures: data.failures.length,
        affectedMachines: machines.size,
    },
      details: data.failures
        .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))
        .map((item) => ({
          ...item,
          fechaFormatted: formatDate(item.fecha),
          duracionFormatted: item.duracion_horas ? `${Number(item.duracion_horas).toFixed(1)} h` : "—",
        })),
      meta: [
        `Registros: ${data.failures.length}`,
        periodLabel(data.failures.map((item) => item.fecha).filter(Boolean)),
      ],
    }
  }, [data.failures])

  const purityStats = useMemo(() => {
    const today = startOfDay(new Date())
    const startWindow = new Date(today)
    startWindow.setDate(today.getDate() - 14)

    const runsWithPurity = data.runs
      .map((run) => {
        const purity = Number(run.pureza_final ?? run.pureza ?? NaN)
        const runDate = parseDate(run.fecha)
        return {
          ...run,
          pureza: purity,
          runDate: runDate ? startOfDay(runDate) : null,
        }
      })
      .filter(
        (run) =>
          Number.isFinite(run.pureza) && run.runDate && run.runDate >= startWindow && run.runDate <= today
      )

    if (runsWithPurity.length === 0) {
      return {
        summary: {
          copperAvg: "—",
          copperStdDev: "—",
          goldAvg: "—",
          goldStdDev: "—",
        },
        chartData: [],
        tableRows: [],
        topLotes: { gold: "—", copper: "—", goldLow: "—", copperLow: "—" },
        periodLabel: "Periodo: sin registros",
        lotesEvaluados: 0,
      }
    }

    const runsInPeriod = runsWithPurity.sort((a, b) => {
      const aTime = a.runDate ? a.runDate.getTime() : 0
      const bTime = b.runDate ? b.runDate.getTime() : 0
      return bTime - aTime
    })
    const periodLabelStr = `Periodo: ${startWindow.toLocaleDateString("es-PE")} - ${today.toLocaleDateString("es-PE")}`

    const lotAggregation = new Map()
    runsInPeriod.forEach((run) => {
      const lote = run.lote || run.id.slice(0, 6)
      if (!lotAggregation.has(lote)) {
        lotAggregation.set(lote, {
          lote,
          oro: null,
          cobre: null,
          oroSum: 0,
          oroCount: 0,
          cobreSum: 0,
          cobreCount: 0,
        })
      }
      const entry = lotAggregation.get(lote)
      if (run.material === "oro") {
        entry.oroSum += run.pureza
        entry.oroCount += 1
        entry.oro = entry.oroSum / entry.oroCount
      }
      if (run.material === "cobre") {
        entry.cobreSum += run.pureza
        entry.cobreCount += 1
        entry.cobre = entry.cobreSum / entry.cobreCount
      }
    })

    const chartData = Array.from(lotAggregation.values()).map((item) => ({
      lote: item.lote,
      oro: item.oro !== null ? Number(item.oro.toFixed(2)) : null,
      cobre: item.cobre !== null ? Number(item.cobre.toFixed(2)) : null,
    }))

    const goldValues = runsInPeriod
      .filter((run) => run.material === "oro")
      .map((run) => run.pureza)
    const copperValues = runsInPeriod
      .filter((run) => run.material === "cobre")
      .map((run) => run.pureza)

    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
    const std = (arr, mean) =>
      arr.length ? Math.sqrt(arr.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / arr.length) : 0

    const goldAvg = avg(goldValues)
    const copperAvg = avg(copperValues)
    const goldStd = std(goldValues, goldAvg)
    const copperStd = std(copperValues, copperAvg)

    const lotsWithGold = chartData.filter((item) => item.oro !== null)
    const lotsWithCopper = chartData.filter((item) => item.cobre !== null)

    const maxGold = lotsWithGold.reduce((acc, item) => (acc && acc.oro > item.oro ? acc : item), null)
    const minGold = lotsWithGold.reduce((acc, item) => (acc && acc.oro < item.oro ? acc : item), null)
    const maxCopper = lotsWithCopper.reduce((acc, item) => (acc && acc.cobre > item.cobre ? acc : item), null)
    const minCopper = lotsWithCopper.reduce((acc, item) => (acc && acc.cobre < item.cobre ? acc : item), null)

    chartData.sort((a, b) => {
      const aValue = Math.max(a.oro ?? -Infinity, a.cobre ?? -Infinity)
      const bValue = Math.max(b.oro ?? -Infinity, b.cobre ?? -Infinity)
      return bValue - aValue
    })

    return {
      summary: {
        copperAvg: copperValues.length ? `${copperAvg.toFixed(2)}%` : "—",
        copperStdDev: copperValues.length ? `${copperStd.toFixed(2)}%` : "—",
        goldAvg: goldValues.length ? `${goldAvg.toFixed(2)}%` : "—",
        goldStdDev: goldValues.length ? `${goldStd.toFixed(2)}%` : "—",
      },
      chartData,
      tableRows: runsInPeriod.map((run) => ({
        id: run.id,
        lote: run.lote || run.id.slice(0, 6),
        material: run.material,
        pureza: Number.isFinite(run.pureza) ? `${run.pureza.toFixed(2)}%` : "—",
        fecha: run.fecha ? formatDate(run.fecha) : "—",
        operador: run.operador || "—",
      })),
      topLotes: {
        gold: maxGold?.lote ?? "—",
        copper: maxCopper?.lote ?? "—",
        goldLow: minGold?.lote ?? "—",
        copperLow: minCopper?.lote ?? "—",
      },
      periodLabel: periodLabelStr,
      lotesEvaluados: chartData.length,
    }
  }, [data.runs])

  const productionStats = useMemo(() => {
    const monthKey = (value) => {
      if (!value) return "sin-fecha"
      return value.slice(0, 7)
    }

    const monthly = new Map()
    data.runs.forEach((run) => {
      const key = monthKey(run.fecha)
      if (!monthly.has(key)) monthly.set(key, { mes: key, cobre: 0, oro: 0, total: 0 })
      const entry = monthly.get(key)
      const quantity = Number(run.cantidad_t ?? 0)
      entry.total += quantity
      if (run.material === "cobre") entry.cobre += quantity
      if (run.material === "oro") entry.oro += quantity
    })

    const chartData = Array.from(monthly.values())
      .filter((item) => item.mes !== "sin-fecha")
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map((item) => {
        const date = new Date(`${item.mes}-01T00:00:00`)
        const label = Number.isNaN(date.getTime())
          ? item.mes
          : date.toLocaleDateString("es-PE", { month: "short", year: "numeric" })
        return { ...item, mes: label }
      })

    const sortedKeys = Array.from(monthly.keys()).filter((key) => key !== "sin-fecha").sort()
    const latestKey = sortedKeys[sortedKeys.length - 1]
    const previousKey = sortedKeys[sortedKeys.length - 2]

    const lastTotal = latestKey ? monthly.get(latestKey)?.total ?? 0 : 0
    const previousTotal = previousKey ? monthly.get(previousKey)?.total ?? 0 : 0

    const goldProduction = data.runs
      .filter((run) => run.material === "oro")
      .reduce((acc, run) => acc + Number(run.cantidad_t ?? 0), 0)
    const copperProduction = data.runs
      .filter((run) => run.material === "cobre")
      .reduce((acc, run) => acc + Number(run.cantidad_t ?? 0), 0)

    const suppliesInventory = data.supplies.reduce(
      (acc, item) => acc + Number(item.cantidad_actual ?? item.cantidadActual ?? 0),
      0
    )

    return {
      summary: {
        monthlyProduction: lastTotal ? `${formatNumber(lastTotal)} t` : "—",
        monthlyVariation: previousTotal
          ? `${(((lastTotal - previousTotal) / previousTotal) * 100).toFixed(1)}%`
          : "—",
        currentInventory: suppliesInventory ? `${formatNumber(suppliesInventory)} u.` : "—",
        goldProduction: goldProduction ? `${formatNumber(goldProduction)} t` : "—",
        copperProduction: copperProduction ? `${formatNumber(copperProduction)} t` : "—",
      },
      chartData,
      tableRows: chartData.map((item) => ({
        mes: item.mes,
        cobre: `${formatNumber(item.cobre)} t`,
        oro: `${formatNumber(item.oro)} t`,
        total: `${formatNumber(item.total)} t`,
      })),
      meta: [
        `Lotes registrados: ${data.runs.length}`,
        periodLabel(data.runs.map((item) => item.fecha).filter(Boolean)),
        variationLabel(lastTotal, previousTotal),
      ],
    }
  }, [data.runs, data.supplies])

  const normalizeSupplyName = (value) => {
    if (!value) return "sin nombre"
    return value.toString().trim().toLowerCase()
  }

  const suppliesStats = useMemo(() => {
    const catalog = data.supplies.reduce((acc, item) => {
      acc.set(item.id, {
        nombre: item.nombre ?? "",
        unidad: item.unidad ?? "u.",
      })
      return acc
    }, new Map())

    const totalsByName = new Map()
    const totalsByMonth = new Map()
    const lotesConConsumo = new Set()

    data.consumptions.forEach((item) => {
      const cantidad = Number(item.cantidad ?? 0)
      const supplyId = item.insumo_id || item.insumo || "sin-insumo"
      const catalogEntry = supplyId && catalog.has(supplyId) ? catalog.get(supplyId) : null
      const displayName = catalogEntry?.nombre || item.insumo || "Sin nombre"
      const unidad = catalogEntry?.unidad || item.unidad || "u."
      const normalized = normalizeSupplyName(displayName)

      if (!totalsByName.has(normalized)) {
        totalsByName.set(normalized, { total: 0, name: displayName, unidad })
      }
      const entry = totalsByName.get(normalized)
      entry.total += cantidad
      if (!entry.unidad) entry.unidad = unidad
      if (!entry.name) entry.name = displayName

      const month = item.fecha ? item.fecha.slice(0, 7) : "sin-fecha"
      if (!totalsByMonth.has(month)) totalsByMonth.set(month, 0)
      totalsByMonth.set(month, totalsByMonth.get(month) + cantidad)

      if (item.plant_run_id) {
        lotesConConsumo.add(item.plant_run_id)
      }
    })

    const totalsArray = Array.from(totalsByName.values())
    const totalConsumed = totalsArray.reduce((acc, item) => acc + item.total, 0)
    const sortedSupplies = totalsArray.sort((a, b) => b.total - a.total)
    const mostUsedEntry = sortedSupplies[0]
    const mostUsedLabel = mostUsedEntry ? `${mostUsedEntry.name} (${formatNumber(mostUsedEntry.total)} ${mostUsedEntry.unidad})` : "—"
    const otherSupplies = sortedSupplies.slice(1).reduce((acc, item) => acc + item.total, 0)

    const sortedMonths = Array.from(totalsByMonth.entries())
      .filter(([month]) => month !== "sin-fecha")
      .sort(([a], [b]) => a.localeCompare(b))
    const lastMonthTotal = sortedMonths[sortedMonths.length - 1]?.[1] ?? 0
    const prevMonthTotal = sortedMonths[sortedMonths.length - 2]?.[1] ?? 0
    const monthlyVariation = signedPercent(lastMonthTotal, prevMonthTotal)

    const chartData = sortedSupplies.map((item, index) => ({
      name: item.name,
      value: item.total,
      color: COLORS[index % COLORS.length],
    }))

    const unidadPrincipal = mostUsedEntry?.unidad || "u."
    const avgPerBatch =
      lotesConConsumo.size > 0 && totalConsumed
        ? `${formatNumber(totalConsumed / lotesConConsumo.size)} ${unidadPrincipal}`
        : "—"

    return {
    summary: {
        totalConsumed: totalConsumed ? `${formatNumber(totalConsumed)} ${unidadPrincipal}` : "—",
        mostUsed: mostUsedLabel,
        monthlyVariation,
        avgPerBatch,
        otherSupplies: otherSupplies ? `${formatNumber(otherSupplies)} ${unidadPrincipal}` : "—",
      },
      chartData,
      tableRows: sortedSupplies.map((item) => ({
        name: item.name,
        total: `${formatNumber(item.total)} ${item.unidad || unidadPrincipal}`,
      })),
      meta: [
        `Movimientos: ${data.consumptions.length}`,
        `Lotes con consumo: ${lotesConConsumo.size}`,
        periodLabel(data.consumptions.map((item) => item.fecha).filter(Boolean)),
      ],
    }
  }, [data.consumptions, data.supplies])

  const tabs = [
    { id: "machinery", label: "Fallas en maquinaria" },
    { id: "purity", label: "Pureza quincenal" },
    { id: "production", label: "Producción mensual" },
    { id: "supplies", label: "Consumo de insumos" },
  ]

  const tabConfig = {
    machinery: {
      meta: machineryStats.meta,
      badge: "Operaciones",
      metrics: [
        { label: "Tiempo promedio de paro", value: machineryStats.summary.avgDowntime },
        { label: "Total de fallas", value: machineryStats.summary.totalFailures, alt: true },
        { label: "Máquinas afectadas", value: machineryStats.summary.affectedMachines },
      ],
    },
    purity: {
      meta: [purityStats.periodLabel, `Lotes evaluados: ${purityStats.lotesEvaluados}`],
      badge: "Laboratorio",
      metrics: [
        { label: "Pureza promedio cobre", value: purityStats.summary.copperAvg },
        { label: "Desviación cobre", value: purityStats.summary.copperStdDev, alt: true },
        { label: "Pureza promedio oro", value: purityStats.summary.goldAvg },
        { label: "Desviación oro", value: purityStats.summary.goldStdDev, alt: true },
    ],
    },
    production: {
      meta: productionStats.meta,
      badge: "Producción",
      metrics: [
        { label: "Producción total del último mes", value: productionStats.summary.monthlyProduction },
        { label: "Variación mensual", value: productionStats.summary.monthlyVariation, alt: true },
        { label: "Inventario actual", value: productionStats.summary.currentInventory },
        { label: "Producción oro", value: productionStats.summary.goldProduction },
        { label: "Producción cobre", value: productionStats.summary.copperProduction },
      ],
    },
    supplies: {
      meta: suppliesStats.meta,
      badge: "Insumos",
      metrics: [
        { label: "Consumo total", value: suppliesStats.summary.totalConsumed },
        { label: "Insumo más usado", value: suppliesStats.summary.mostUsed },
        { label: "Variación mensual", value: suppliesStats.summary.monthlyVariation, alt: true },
        { label: "Promedio por lote", value: suppliesStats.summary.avgPerBatch },
      ],
    },
  }

  const activeConfig = tabConfig[reportType]
  const reportTitles = {
    machinery: "Reporte de fallas en maquinaria",
    purity: "Reporte de pureza promedio quincenal",
    production: "Reporte de producción total del mes",
    supplies: "Reporte de insumos con mayor consumo por mes",
  }
  const reportTitle = reportTitles[reportType]
  const issuedOn = useMemo(() => new Date().toLocaleDateString("es-PE"), [])
  const printMetaLine = activeConfig?.meta?.filter(Boolean).join(" · ")

  const handlePrint = () => {
    const node = reportRef.current
    if (!node) {
      window.print()
      return
    }
    node.classList.add("print-scope")
    window.print()
    setTimeout(() => {
      node.classList.remove("print-scope")
    }, 0)
  }

  const renderMachinery = () => (
    <div className="dashboard-card-grid">
      <div className="dashboard-analytics-card">
        <div className="dashboard-analytics-card__header">
          <h3 className="dashboard-analytics-card__title">Detalle de fallas registradas</h3>
          <span className="dashboard-analytics-card__description">Seguimiento cronológico por equipo afectado.</span>
        </div>
        {machineryStats.details.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay registros de fallas en el periodo seleccionado.</p>
        ) : (
          <table className="dashboard-analytics-table">
                  <thead>
              <tr>
                <th>Fecha</th>
                <th>Máquina</th>
                <th>Tipo de falla</th>
                <th>Duración</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
              {machineryStats.details.map((item) => (
                <tr key={item.id}>
                  <td>{item.fechaFormatted}</td>
                  <td>{item.maquina || "—"}</td>
                  <td>{item.tipo_falla || "—"}</td>
                  <td>{item.duracionFormatted}</td>
                  <td>{item.estado || "—"}</td>
                  <td>{item.responsable || "—"}</td>
                  <td>{item.descripcion || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
        )}
        <div className="dashboard-analytics-footer">
          <span>Última sincronización: {formatDate(new Date())}</span>
          <Button variant="accent" className="inline-flex items-center gap-2" onClick={handlePrint}>
            <Printer size={16} />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  )

  const renderPurity = () => (
    <>
      <div className="dashboard-card-grid">
        <div className="dashboard-analytics-card" style={{ minHeight: 0 }}>
          <div className="dashboard-analytics-card__header">
            <h3 className="dashboard-analytics-card__title">Pureza por lote</h3>
            <span className="dashboard-analytics-card__description">Comparación de oro vs. cobre por bloque.</span>
                </div>
          <div style={{ height: 320 }}>
            {purityStats.chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No hay análisis de laboratorio registrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purityStats.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lote" label={{ value: "Bloques", position: "insideBottomRight", offset: -5 }} />
                        <YAxis label={{ value: "Pureza (%)", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="oro" fill="#2B5E7E" name="Oro" />
                        <Bar dataKey="cobre" fill="#EC7E3A" name="Cobre" />
                      </BarChart>
                    </ResponsiveContainer>
            )}
                  </div>
          <div className="dashboard-analytics-footer">
            <span>Lotes evaluados: {purityStats.chartData.length}</span>
            <Button variant="accent" className="inline-flex items-center gap-2" onClick={handlePrint}>
              <Printer size={16} />
              Imprimir
            </Button>
          </div>
                </div>
        <div className="dashboard-analytics-card">
          <div className="dashboard-analytics-card__header">
            <h3 className="dashboard-analytics-card__title">Lotes destacados</h3>
          </div>
          <div className="dashboard-analytics-card__description">
            Referencias con mejor y menor desempeño en la quincena.
              </div>
          <table className="dashboard-analytics-table">
            <tbody>
              <tr>
                <th>Oro - mayor pureza</th>
                <td>{purityStats.topLotes.gold}</td>
              </tr>
              <tr>
                <th>Cobre - mayor pureza</th>
                <td>{purityStats.topLotes.copper}</td>
              </tr>
              <tr>
                <th>Oro - menor pureza</th>
                <td>{purityStats.topLotes.goldLow}</td>
              </tr>
              <tr>
                <th>Cobre - menor pureza</th>
                <td>{purityStats.topLotes.copperLow}</td>
              </tr>
            </tbody>
          </table>
              </div>
            </div>
      <div className="dashboard-analytics-card">
        <div className="dashboard-analytics-card__header">
          <h3 className="dashboard-analytics-card__title">Detalle de lotes analizados</h3>
          <span className="dashboard-analytics-card__description">
            Información base utilizada para el cálculo quincenal.
          </span>
          </div>
        {purityStats.tableRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay registros disponibles.</p>
        ) : (
          <table className="dashboard-analytics-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Material</th>
                <th>Pureza</th>
                <th>Fecha</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              {purityStats.tableRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.lote}</td>
                  <td>{row.material}</td>
                  <td>{row.pureza}</td>
                  <td>{row.fecha}</td>
                  <td>{row.operador}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
                </div>
    </>
  )

  const renderProduction = () => (
    <>
      <div className="dashboard-card-grid">
        <div className="dashboard-analytics-card" style={{ minHeight: 0 }}>
          <div className="dashboard-analytics-card__header">
            <h3 className="dashboard-analytics-card__title">Producción total mensual</h3>
            <span className="dashboard-analytics-card__description">Desempeño por mineral y consolidado.</span>
                </div>
          <div style={{ height: 320 }}>
            {productionStats.chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No hay lotes de producción registrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionStats.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" label={{ value: "Meses", position: "insideBottomRight", offset: -5 }} />
                  <YAxis label={{ value: "Toneladas", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="cobre" fill="#2B5E7E" name="Cobre" />
                        <Bar dataKey="oro" fill="#EC7E3A" name="Oro" />
                        <Bar dataKey="total" fill="#F59E0B" name="Total" />
                      </BarChart>
                    </ResponsiveContainer>
            )}
                  </div>
        <div className="dashboard-analytics-footer">
          <span>Promedio mensual: {productionStats.summary.monthlyProduction}</span>
          <Button variant="accent" className="inline-flex items-center gap-2" onClick={handlePrint}>
            <Printer size={16} />
            Imprimir
          </Button>
        </div>
                </div>
              </div>
      <div className="dashboard-analytics-card">
        <div className="dashboard-analytics-card__header">
          <h3 className="dashboard-analytics-card__title">Detalle por mes</h3>
          <span className="dashboard-analytics-card__description">
            Totales utilizados para el consolidado mensual.
          </span>
              </div>
        {productionStats.tableRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay registros disponibles.</p>
        ) : (
          <table className="dashboard-analytics-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Cobre</th>
                <th>Oro</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {productionStats.tableRows.map((row) => (
                <tr key={row.mes}>
                  <td>{row.mes}</td>
                  <td>{row.cobre}</td>
                  <td>{row.oro}</td>
                  <td>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
                </div>
    </>
  )

  const renderSupplies = () => (
    <>
      <div className="dashboard-card-grid">
        <div className="dashboard-analytics-card" style={{ minHeight: 0 }}>
          <div className="dashboard-analytics-card__header">
            <h3 className="dashboard-analytics-card__title">Distribución de consumo</h3>
            <span className="dashboard-analytics-card__description">Participación por tipo de insumo en el periodo.</span>
                </div>
          <div style={{ height: 320 }}>
            {suppliesStats.chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No hay consumos registrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                    data={suppliesStats.chartData}
                          cx="50%"
                          cy="50%"
                    labelLine
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={110}
                          dataKey="value"
                        >
                    {suppliesStats.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="dashboard-analytics-card">
          <div className="dashboard-analytics-card__header">
            <h3 className="dashboard-analytics-card__title">Resumen operativo</h3>
          </div>
          <div className="dashboard-analytics-card__description">
            Indicadores clave para reposición y planificación de compras.
                  </div>
          <table className="dashboard-analytics-table">
            <tbody>
              <tr>
                <th>Total consumido</th>
                <td>{suppliesStats.summary.totalConsumed}</td>
              </tr>
              <tr>
                <th>Insumo más utilizado</th>
                <td>{suppliesStats.summary.mostUsed}</td>
              </tr>
              <tr>
                <th>Variación mensual</th>
                <td>{suppliesStats.summary.monthlyVariation}</td>
              </tr>
              <tr>
                <th>Consumo otros insumos</th>
                <td>{suppliesStats.summary.otherSupplies}</td>
              </tr>
            </tbody>
          </table>
        <div className="dashboard-analytics-footer">
          <span>Promedio por lote: {suppliesStats.summary.avgPerBatch}</span>
          <Button variant="accent" className="inline-flex items-center gap-2" onClick={handlePrint}>
            <Printer size={16} />
            Imprimir
          </Button>
        </div>
                </div>
              </div>
      <div className="dashboard-analytics-card">
        <div className="dashboard-analytics-card__header">
          <h3 className="dashboard-analytics-card__title">Detalle de consumos</h3>
          <span className="dashboard-analytics-card__description">
            Consolidado por insumo utilizado en los reportes.
          </span>
        </div>
        {suppliesStats.tableRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay consumos registrados.</p>
        ) : (
          <table className="dashboard-analytics-table">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Total consumido</th>
              </tr>
            </thead>
            <tbody>
              {suppliesStats.tableRows.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )

  const renderContent = () => {
    switch (reportType) {
      case "machinery":
        return renderMachinery()
      case "purity":
        return renderPurity()
      case "production":
        return renderProduction()
      case "supplies":
        return renderSupplies()
      default:
        return null
    }
  }

  return (
    <section className="dashboard-report" ref={reportRef}>
      <div className="dashboard-hero-block">
        <div className="dashboard-hero-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id)}
              className={`dashboard-hero-tab ${reportType === tab.id ? "dashboard-hero-tab--active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
              </div>

      <div className="report-print-header">
        <img src={COMPANY_LOGO_URL} alt="Aura Minosa" className="report-print-logo" />
        <div className="report-print-meta">
          <h1 className="report-print-title">{reportTitle}</h1>
          {printMetaLine && <span className="report-print-subtitle">{printMetaLine}</span>}
          <span className="report-print-subtitle">Emitido: {issuedOn}</span>
        </div>
      </div>

      <div className="dashboard-report__container">
        <header className="dashboard-report__header">
          <div className="dashboard-report__title-block">
            <div className="dashboard-report__meta">
              {activeConfig.meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <h2 className="dashboard-report__title">{reportTitle}</h2>
          </div>
          <span className="dashboard-report__badge">{activeConfig.badge}</span>
        </header>

        {loading && <p className="text-sm text-muted-foreground mb-4">Sincronizando datos…</p>}
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="dashboard-report__metrics">
          {activeConfig.metrics.map((metric) => (
            <div
              key={metric.label}
              className={`dashboard-report__metric ${metric.alt ? "dashboard-report__metric--alt" : ""}`}
            >
              <span className="dashboard-report__metric-label">{metric.label}</span>
              <span className="dashboard-report__metric-value">{metric.value}</span>
              {metric.detail && <span>{metric.detail}</span>}
            </div>
          ))}
        </div>

        {renderContent()}
      </div>
    </section>
  )
}
