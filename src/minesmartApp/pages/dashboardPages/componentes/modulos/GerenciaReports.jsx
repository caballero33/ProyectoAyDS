import { useEffect, useMemo, useRef, useState } from "react"
import { collection, getDocs, orderBy, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
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
  
  // Si es un Timestamp de Firestore
  if (value && typeof value === "object" && "toDate" in value) {
    const date = value.toDate()
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }
  }
  
  // Si es una cadena o número
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    const safeDate = new Date(`${value}T00:00:00`)
    if (Number.isNaN(safeDate.getTime())) return value
    return safeDate.toLocaleDateString("es-PE", {
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

// Funciones auxiliares para filtros
const getQuincenaFromDate = (dateString) => {
  if (!dateString) return null
  try {
    let date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      const altDate = new Date(`${dateString}T00:00:00`)
      if (Number.isNaN(altDate.getTime())) return null
      date = altDate
    }
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const quincena = day <= 15 ? 1 : 2
    return `${year}-${String(month).padStart(2, "0")}-Q${quincena}`
  } catch {
    return null
  }
}

const getQuincenasAvailable = (runs) => {
  const quincenas = new Set()
  
  // Obtener todas las quincenas desde el primer lote registrado
  runs.forEach((run) => {
    if (run.fecha) {
      const quincena = getQuincenaFromDate(run.fecha)
      if (quincena) quincenas.add(quincena)
    }
  })

  // Si hay quincenas, ordenarlas de más reciente a más antigua
  return Array.from(quincenas).sort((a, b) => {
    // Comparar por año, mes y quincena (invertido para más recientes primero)
    const [yearA, monthA, qA] = a.split("-")
    const [yearB, monthB, qB] = b.split("-")
    const quincenaA = parseInt(qA.replace("Q", ""))
    const quincenaB = parseInt(qB.replace("Q", ""))
    
    if (yearA !== yearB) return yearB.localeCompare(yearA)
    if (monthA !== monthB) return monthB.localeCompare(monthA)
    return quincenaB - quincenaA
  })
}

const getYearsAvailable = (runs) => {
  const years = new Set()
  runs.forEach((run) => {
    if (run.fecha) {
      try {
        const date = new Date(run.fecha)
        if (!Number.isNaN(date.getTime())) {
          years.add(date.getFullYear())
        } else {
          const altDate = new Date(`${run.fecha}T00:00:00`)
          if (!Number.isNaN(altDate.getTime())) {
            years.add(altDate.getFullYear())
          }
        }
      } catch {
        // Ignorar fechas inválidas
      }
    }
  })
  return Array.from(years).sort().reverse() // Más recientes primero
}

const getQuincenaStartEnd = (quincenaString) => {
  if (!quincenaString) return { start: null, end: null }
  const [year, month, q] = quincenaString.split("-")
  const quincena = parseInt(q.replace("Q", ""))
  const monthNum = parseInt(month)
  const yearNum = parseInt(year)

  let startDate, endDate
  if (quincena === 1) {
    startDate = new Date(yearNum, monthNum - 1, 1)
    endDate = new Date(yearNum, monthNum - 1, 15)
  } else {
    startDate = new Date(yearNum, monthNum - 1, 16)
    endDate = new Date(yearNum, monthNum, 0) // Último día del mes
  }

  return { start: startDate, end: endDate }
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
    shipping: [],
  })
  const [confirmingSale, setConfirmingSale] = useState(null)
  const reportRef = useRef(null)

  // Filtros
  const [filterQuincena, setFilterQuincena] = useState("") // Para pureza quincenal
  const [filterYear, setFilterYear] = useState("") // Para producción mensual
  const [filterFailureDateFrom, setFilterFailureDateFrom] = useState("") // Para fallas
  const [filterFailureDateTo, setFilterFailureDateTo] = useState("") // Para fallas
  const [isPrinting, setIsPrinting] = useState(false) // Para modo impresión

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [runsSnap, failuresSnap, labsSnap, consumptionsSnap, suppliesSnap, shippingSnap] = await Promise.all([
          getDocs(query(collection(db, "plant_runs"), orderBy("fecha", "desc"))),
          getDocs(query(collection(db, "plant_failures"), orderBy("created_at", "desc"))),
          getDocs(query(collection(db, "lab_analyses"), orderBy("fecha_envio", "desc"))),
          getDocs(query(collection(db, "plant_consumptions"), orderBy("fecha", "desc"))),
          getDocs(query(collection(db, "supplies"))),
          getDocs(query(collection(db, "shipping_records"), orderBy("fecha", "desc"))),
        ])

        const runs = runsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        const runById = runs.reduce((acc, run) => {
          acc[run.id] = run
          return acc
        }, {})

        const failures = failuresSnap.docs.map((doc) => {
          const payload = doc.data()
          const relatedRun = payload.plant_run_id ? runById[payload.plant_run_id] : undefined
          
          // Manejar la fecha correctamente (puede ser Timestamp, string o Date)
          let fecha = relatedRun?.fecha ?? payload.fecha ?? null
          if (fecha && typeof fecha === "object" && "toDate" in fecha) {
            // Si es un Timestamp de Firestore, convertir a string de fecha
            const dateObj = fecha.toDate()
            fecha = dateObj.toISOString().split("T")[0]
          } else if (fecha && typeof fecha === "object" && fecha instanceof Date) {
            // Si es un objeto Date, convertir a string
            fecha = fecha.toISOString().split("T")[0]
          }
          
          return {
            id: doc.id,
            fecha: fecha,
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
        const shipping = shippingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        setData({ runs, failures, labs, consumptions, supplies, shipping })
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
    // Filtrar fallas por fecha
    let filteredFailures = data.failures
    if (filterFailureDateFrom || filterFailureDateTo) {
      filteredFailures = data.failures.filter((item) => {
        if (!item.fecha) return false
        const itemDate = parseDate(item.fecha)
        if (!itemDate) return false

        const fromDate = filterFailureDateFrom ? parseDate(filterFailureDateFrom) : null
        const toDate = filterFailureDateTo ? parseDate(filterFailureDateTo) : null

        if (fromDate && itemDate < fromDate) return false
        if (toDate && itemDate > toDate) return false
        return true
      })
    }

    const durations = filteredFailures.map((item) => Number(item.duracion_horas || 0))
    const avgDowntime = durations.length ? `${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)} h` : "—"
    const machines = new Set(filteredFailures.map((item) => item.maquina).filter(Boolean))

    return {
      summary: {
        avgDowntime,
        totalFailures: filteredFailures.length,
        affectedMachines: machines.size,
      },
      details: filteredFailures
        .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))
        .map((item) => ({
          ...item,
          fechaFormatted: formatDate(item.fecha),
          duracionFormatted: item.duracion_horas ? `${Number(item.duracion_horas).toFixed(1)} h` : "—",
        })),
      meta: [
        `Registros: ${filteredFailures.length}`,
        periodLabel(filteredFailures.map((item) => item.fecha).filter(Boolean)),
      ],
    }
  }, [data.failures, filterFailureDateFrom, filterFailureDateTo])

  const purityStats = useMemo(() => {
    let runsWithPurity = data.runs
      .map((run) => {
        const purity = Number(run.pureza_final ?? run.pureza ?? NaN)
        const runDate = parseDate(run.fecha)
        return {
          ...run,
          pureza: purity,
          runDate: runDate ? startOfDay(runDate) : null,
        }
      })
      .filter((run) => Number.isFinite(run.pureza) && run.runDate)

    // Filtrar por quincena si está seleccionada
    if (filterQuincena) {
      const { start, end } = getQuincenaStartEnd(filterQuincena)
      if (start && end) {
        runsWithPurity = runsWithPurity.filter((run) => {
          if (!run.runDate) return false
          return run.runDate >= start && run.runDate <= end
        })
      }
    } else {
      // Si no hay filtro, mostrar últimas 2 semanas por defecto
      const today = startOfDay(new Date())
      const startWindow = new Date(today)
      startWindow.setDate(today.getDate() - 14)
      runsWithPurity = runsWithPurity.filter((run) => run.runDate && run.runDate >= startWindow && run.runDate <= today)
    }

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

    // Generar etiqueta del periodo
    let periodLabelStr = "Periodo: sin registros"
    if (runsInPeriod.length > 0) {
      if (filterQuincena) {
        const { start, end } = getQuincenaStartEnd(filterQuincena)
        if (start && end) {
          periodLabelStr = `Quincena: ${start.toLocaleDateString("es-PE")} - ${end.toLocaleDateString("es-PE")}`
        }
      } else {
        const sortedDates = runsInPeriod.map((r) => r.runDate).filter(Boolean).sort()
        if (sortedDates.length > 0) {
          const start = sortedDates[0]
          const end = sortedDates[sortedDates.length - 1]
          periodLabelStr = `Periodo: ${start.toLocaleDateString("es-PE")} - ${end.toLocaleDateString("es-PE")}`
        }
      }
    }

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
  }, [data.runs, filterQuincena])

  const productionStats = useMemo(() => {
    const monthKey = (value) => {
      if (!value) return "sin-fecha"
      return value.slice(0, 7)
    }

    // Filtrar por año si está seleccionado
    let filteredRuns = data.runs
    if (filterYear) {
      const yearNum = parseInt(filterYear)
      filteredRuns = data.runs.filter((run) => {
        if (!run.fecha) return false
        try {
          const date = new Date(run.fecha)
          if (!Number.isNaN(date.getTime())) {
            return date.getFullYear() === yearNum
          }
          const altDate = new Date(`${run.fecha}T00:00:00`)
          return !Number.isNaN(altDate.getTime()) && altDate.getFullYear() === yearNum
        } catch {
          return false
        }
      })
    }

    const monthly = new Map()
    filteredRuns.forEach((run) => {
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

    const goldProduction = filteredRuns
      .filter((run) => run.material === "oro")
      .reduce((acc, run) => acc + Number(run.cantidad_t ?? 0), 0)
    const copperProduction = filteredRuns
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
        `Lotes registrados: ${filteredRuns.length}`,
        periodLabel(filteredRuns.map((item) => item.fecha).filter(Boolean)),
        variationLabel(lastTotal, previousTotal),
        filterYear ? `Año: ${filterYear}` : "",
      ].filter(Boolean),
    }
  }, [data.runs, data.supplies, filterYear])

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
    { id: "sold-lots", label: "Lotes vendidos" },
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
    "sold-lots": {
      meta: [
        `Lotes despachados: ${data.shipping?.length || 0}`,
        periodLabel(data.shipping?.map((item) => item.fecha).filter(Boolean) || []),
      ],
      badge: "Despacho",
      metrics: [
        {
          label: "Lotes pendientes de venta",
          value: data.shipping?.filter((item) => !item.vendido).length || 0,
        },
        {
          label: "Lotes vendidos",
          value: data.shipping?.filter((item) => item.vendido).length || 0,
          alt: true,
        },
        {
          label: "Total despachados",
          value: data.shipping?.length || 0,
        },
      ],
    },
  }

  const activeConfig = tabConfig[reportType]
  const reportTitles = {
    machinery: "Reporte de fallas en maquinaria",
    purity: "Reporte de pureza promedio quincenal",
    production: "Reporte de producción total del mes",
    supplies: "Reporte de insumos con mayor consumo por mes",
    "sold-lots": "Lotes vendidos",
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
    
    // Activar modo impresión - esto hará que los gráficos usen dimensiones fijas
    setIsPrinting(true)
    
    // Mostrar pie de página antes de imprimir
    const footer = node.querySelector(".report-print-footer")
    if (footer) {
      footer.style.display = "block"
    }
    
    // Agregar clase para impresión
    node.classList.add("print-scope")
    
    // Esperar a que React re-renderice los gráficos con dimensiones fijas
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Esperar tiempo adicional para que React complete el re-renderizado
        setTimeout(() => {
          // Función para verificar si todos los gráficos están completamente renderizados
          const checkChartsRendered = () => {
            const svgElements = node.querySelectorAll("svg")
            if (svgElements.length === 0) return false
            
            let allReady = true
            
            svgElements.forEach((svg) => {
              // Forzar cálculo de dimensiones
              const svgRect = svg.getBoundingClientRect()
              if (svgRect.width === 0 || svgRect.height === 0) {
                allReady = false
              }
              
              // Asegurar que el SVG esté visible
              svg.style.display = "block"
              svg.style.visibility = "visible"
              svg.style.opacity = "1"
              
              // Forzar re-renderizado accediendo a todos los elementos
              const paths = svg.querySelectorAll("path, circle, text, line, g")
              paths.forEach((path) => {
                void path.getBoundingClientRect()
                // Asegurar visibilidad
                if (path instanceof HTMLElement || path instanceof SVGElement) {
                  path.style.display = "block"
                  path.style.visibility = "visible"
                  path.style.opacity = "1"
                }
              })
              
              // Verificar especialmente elementos del PieChart
              const pieElements = svg.querySelectorAll(".recharts-pie, .recharts-pie-sector, .recharts-label, .recharts-label-list")
              pieElements.forEach((el) => {
                void el.getBoundingClientRect()
                if (el instanceof HTMLElement || el instanceof SVGElement) {
                  el.style.display = "block"
                  el.style.visibility = "visible"
                  el.style.opacity = "1"
                }
              })
              
              // Asegurar que todos los elementos de texto (labels) estén visibles
              const textElements = svg.querySelectorAll("text, tspan")
              textElements.forEach((text) => {
                void text.getBoundingClientRect()
                if (text instanceof SVGTextElement) {
                  text.style.display = "block"
                  text.style.visibility = "visible"
                  text.style.opacity = "1"
                  text.style.fill = "black"
                }
              })
              
              // Asegurar que las líneas de etiqueta estén visibles
              const lines = svg.querySelectorAll("line")
              lines.forEach((line) => {
                void line.getBoundingClientRect()
                if (line instanceof SVGLineElement) {
                  line.style.display = "block"
                  line.style.visibility = "visible"
                  line.style.opacity = "1"
                }
              })
            })
            
            // Verificación específica para PieChart
            const pieSectors = node.querySelectorAll(".recharts-pie-sector")
            if (pieSectors.length > 0) {
              // Verificar que todos los sectores estén renderizados
              const sectorsReady = Array.from(pieSectors).every((sector) => {
                const rect = sector.getBoundingClientRect()
                const path = sector.querySelector("path")
                // Verificar que el sector tenga dimensiones y que el path exista
                return rect.width > 0 && rect.height > 0 && path !== null
              })
              
              // Verificar que las etiquetas estén presentes
              const labels = node.querySelectorAll(".recharts-label")
              const labelsVisible = labels.length === 0 || Array.from(labels).every((label) => {
                const rect = label.getBoundingClientRect()
                return rect.width > 0 && rect.height > 0
              })
              
              // Verificar que haya al menos una etiqueta de texto visible
              const textLabels = node.querySelectorAll("svg text")
              const hasTextLabels = textLabels.length > 0
              
              allReady = allReady && sectorsReady && labelsVisible && hasTextLabels
            }
            
            return allReady
          }
          
          // Intentar verificar múltiples veces hasta que esté listo
          let attempts = 0
          const maxAttempts = 40 // Aumentado a 40 intentos (8 segundos)
          
          const checkAndPrint = () => {
            attempts++
            const isReady = checkChartsRendered()
            
            if (isReady || attempts >= maxAttempts) {
              // Esperar un momento adicional más largo para asegurar renderizado completo
              const finalWait = isReady ? 1000 : 1500 // Más tiempo si no está completamente listo
              setTimeout(() => {
                window.print()
                
                // Limpiar después de imprimir
                setTimeout(() => {
                  setIsPrinting(false)
                  node.classList.remove("print-scope")
                  if (footer) {
                    footer.style.display = "none"
                  }
                }, 100)
              }, finalWait)
            } else {
              // Esperar un poco más y verificar de nuevo
              setTimeout(checkAndPrint, 200)
            }
          }
          
          // Iniciar verificación después de un tiempo inicial más largo
          setTimeout(checkAndPrint, 800) // Tiempo inicial aumentado antes de empezar a verificar
        }, 500) // Tiempo inicial para React re-renderice
      })
    })
  }

  const confirmSale = async (shippingId) => {
    setConfirmingSale(shippingId)
    try {
      const shippingRef = doc(db, "shipping_records", shippingId)
      await updateDoc(shippingRef, {
        vendido: true,
        fecha_venta: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      
      // Actualizar los datos locales
      setData((prev) => ({
        ...prev,
        shipping: prev.shipping.map((item) =>
          item.id === shippingId ? { ...item, vendido: true, fecha_venta: new Date() } : item
        ),
      }))
    } catch (err) {
      console.error(err)
      setError("No se pudo confirmar la venta. Intenta nuevamente.")
    } finally {
      setConfirmingSale(null)
    }
  }

  // Calcular quincenas y años disponibles
  const availableQuincenas = useMemo(() => getQuincenasAvailable(data.runs), [data.runs])
  const availableYears = useMemo(() => getYearsAvailable(data.runs), [data.runs])

  const renderMachinery = () => (
    <div className="dashboard-analytics-card">
      <div className="dashboard-analytics-card__header">
        <h3 className="dashboard-analytics-card__title">Detalle de fallas registradas</h3>
        <span className="dashboard-analytics-card__description">Seguimiento cronológico por equipo afectado.</span>
      </div>
      
      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "flex-end",
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "rgba(245, 248, 251, 0.8)",
          borderRadius: "0.75rem",
          border: "1px solid rgba(30, 44, 92, 0.1)",
        }}
      >
        <div style={{ flex: 1, maxWidth: "220px" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", color: "rgba(30, 44, 92, 0.8)" }}>
            Fecha desde
          </label>
          <Input
            type="date"
            value={filterFailureDateFrom}
            onChange={(e) => setFilterFailureDateFrom(e.target.value)}
            className="dashboard-form__input"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1, maxWidth: "220px" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", color: "rgba(30, 44, 92, 0.8)" }}>
            Fecha hasta
          </label>
          <Input
            type="date"
            value={filterFailureDateTo}
            onChange={(e) => setFilterFailureDateTo(e.target.value)}
            className="dashboard-form__input"
            style={{ width: "100%" }}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setFilterFailureDateFrom("")
            setFilterFailureDateTo("")
          }}
          style={{ 
            height: "fit-content", 
            marginBottom: "0",
            padding: "0.5rem 1rem",
            whiteSpace: "nowrap"
          }}
        >
          Limpiar filtros
        </Button>
      </div>
      {machineryStats.details.length === 0 ? (
        <p className="text-sm text-muted-foreground" style={{ padding: "1rem" }}>
          No hay registros de fallas en el periodo seleccionado.
        </p>
      ) : (
        <div className="dashboard-report__table">
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
        </div>
      )}
      <div className="dashboard-analytics-footer">
        <span>Última sincronización: {formatDate(new Date())}</span>
        <Button variant="accent" className="inline-flex items-center gap-2" onClick={handlePrint}>
          <Printer size={16} />
          Imprimir
        </Button>
      </div>
    </div>
  )

  const renderPurity = () => {
    // Formatear quincenas para mostrar
    const formatQuincenaLabel = (quincenaString) => {
      if (!quincenaString) return ""
      const [year, month, q] = quincenaString.split("-")
      const quincena = parseInt(q.replace("Q", ""))
      const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]
      const monthName = monthNames[parseInt(month) - 1]
      const quincenaName = quincena === 1 ? "Primera quincena" : "Segunda quincena"
      return `${quincenaName} de ${monthName} ${year}`
    }

    return (
      <>
        {/* Filtro de quincena */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "flex-end",
            marginBottom: "1rem",
            padding: "1rem",
            background: "rgba(245, 248, 251, 0.8)",
            borderRadius: "0.75rem",
            border: "1px solid rgba(30, 44, 92, 0.1)",
          }}
        >
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", color: "rgba(30, 44, 92, 0.8)" }}>
              Seleccionar quincena
            </label>
            <select
              value={filterQuincena}
              onChange={(e) => setFilterQuincena(e.target.value)}
              className="dashboard-form__input"
              style={{ width: "100%", maxWidth: "400px" }}
            >
              <option value="">Últimas 2 semanas (por defecto)</option>
              {availableQuincenas.length > 0 ? (
                availableQuincenas.map((quincena) => (
                  <option key={quincena} value={quincena}>
                    {formatQuincenaLabel(quincena)}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No hay quincenas disponibles
                </option>
              )}
            </select>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilterQuincena("")}
            style={{ height: "fit-content" }}
          >
            Limpiar filtro
          </Button>
        </div>

        <div className="dashboard-card-grid">
          <div className="dashboard-analytics-card" style={{ minHeight: 0 }}>
            <div className="dashboard-analytics-card__header">
              <h3 className="dashboard-analytics-card__title">Pureza por lote</h3>
              <span className="dashboard-analytics-card__description">Comparación de oro vs. cobre por bloque.</span>
            </div>
          <div style={{ height: 320, width: "100%", overflow: "hidden", position: "relative" }}>
            {purityStats.chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No hay análisis de laboratorio registrados.</p>
            ) : (
              isPrinting ? (
                <div style={{ width: "100%", height: "320px", display: "block", position: "relative" }}>
                  <BarChart width={700} height={320} data={purityStats.chartData} style={{ maxWidth: "100%" }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lote" label={{ value: "Bloques", position: "insideBottomRight", offset: -5 }} />
                    <YAxis label={{ value: "Pureza (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="oro" fill="#2B5E7E" name="Oro" />
                    <Bar dataKey="cobre" fill="#EC7E3A" name="Cobre" />
                  </BarChart>
                </div>
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
              )
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
  }

  const renderProduction = () => (
    <>
      {/* Filtro de año */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "flex-end",
          marginBottom: "1rem",
          padding: "1rem",
          background: "rgba(245, 248, 251, 0.8)",
          borderRadius: "0.75rem",
          border: "1px solid rgba(30, 44, 92, 0.1)",
        }}
      >
        <div style={{ flex: 1, maxWidth: "300px" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", color: "rgba(30, 44, 92, 0.8)" }}>
            Filtrar por año
          </label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="dashboard-form__input"
            style={{ width: "100%" }}
          >
            <option value="">Todos los años</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFilterYear("")}
          style={{ height: "fit-content" }}
        >
          Limpiar filtro
        </Button>
      </div>

      <div className="dashboard-card-grid">
        <div className="dashboard-analytics-card" style={{ minHeight: 0 }}>
          <div className="dashboard-analytics-card__header">
            <h3 className="dashboard-analytics-card__title">Producción total mensual</h3>
            <span className="dashboard-analytics-card__description">Desempeño por mineral y consolidado.</span>
          </div>
          <div style={{ height: 320, width: "100%", overflow: "hidden", position: "relative" }}>
            {productionStats.chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No hay lotes de producción registrados.</p>
            ) : (
              isPrinting ? (
                <div style={{ width: "100%", height: "320px", display: "block", position: "relative" }}>
                  <BarChart width={700} height={320} data={productionStats.chartData} style={{ maxWidth: "100%" }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" label={{ value: "Meses", position: "insideBottomRight", offset: -5 }} />
                    <YAxis label={{ value: "Toneladas", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cobre" fill="#2B5E7E" name="Cobre" />
                    <Bar dataKey="oro" fill="#EC7E3A" name="Oro" />
                    <Bar dataKey="total" fill="#F59E0B" name="Total" />
                  </BarChart>
                </div>
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
              )
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
          <div style={{ height: 320, width: "100%", overflow: "visible", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {suppliesStats.chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No hay consumos registrados.</p>
            ) : (
              isPrinting ? (
                <div style={{ width: "100%", height: "320px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "visible" }}>
                  <PieChart width={600} height={300} style={{ maxWidth: "100%" }}>
                    <Pie
                      data={suppliesStats.chartData}
                      cx={300}
                      cy={150}
                      labelLine
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {suppliesStats.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </div>
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
              )
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

  const renderSoldLots = () => {
    const pendingLots = data.shipping?.filter((item) => !item.vendido) || []
    const soldLots = data.shipping?.filter((item) => item.vendido) || []
    const allLots = [...pendingLots, ...soldLots].sort((a, b) => {
      const dateA = a.fecha || ""
      const dateB = b.fecha || ""
      return dateB.localeCompare(dateA)
    })

    return (
      <div className="dashboard-card-grid">
        <div className="dashboard-analytics-card">
          <div className="dashboard-analytics-card__header">
            <h3 className="dashboard-analytics-card__title">Lotes despachados</h3>
            <span className="dashboard-analytics-card__description">
              Gestión de ventas y confirmación de lotes despachados.
            </span>
          </div>
          {allLots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay lotes despachados registrados.</p>
          ) : (
            <table className="dashboard-analytics-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Fecha de despacho</th>
                  <th>Producto</th>
                  <th>Cantidad (kg)</th>
                  <th>Pureza (%)</th>
                  <th>Cliente</th>
                  <th>Transportista</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {allLots.map((item) => (
                  <tr key={item.id} style={item.vendido ? { opacity: 0.7 } : {}}>
                    <td>
                      <strong>{item.lote || "—"}</strong>
                    </td>
                    <td>{formatDate(item.fecha)}</td>
                    <td>{item.producto || "—"}</td>
                    <td>{formatNumber(item.cantidad_kg || 0)}</td>
                    <td>{formatNumber(item.pureza_final || 0)}%</td>
                    <td>{item.cliente_destino || "—"}</td>
                    <td>{item.transportista || "—"}</td>
                    <td>
                      {item.vendido ? (
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "0.5rem",
                            background: "rgba(34, 197, 94, 0.1)",
                            color: "#22c55e",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          ✓ Vendido
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
                    </td>
                    <td>
                      {!item.vendido && (
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => confirmSale(item.id)}
                          disabled={confirmingSale === item.id}
                          style={{ fontSize: "0.875rem" }}
                        >
                          {confirmingSale === item.id ? "Confirmando..." : "Confirmar venta"}
                        </Button>
                      )}
                      {item.vendido && item.fecha_venta && (
                        <span style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)" }}>
                          Vendido: {formatDate(item.fecha_venta)}
                        </span>
                      )}
                    </td>
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
  }

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
      case "sold-lots":
        return renderSoldLots()
      default:
        return null
    }
  }

  // Resetear filtros al cambiar de pestaña
  useEffect(() => {
    setFilterQuincena("")
    setFilterYear("")
    setFilterFailureDateFrom("")
    setFilterFailureDateTo("")
  }, [reportType])

  // Forzar re-renderizado de gráficos cuando se activa modo impresión
  useEffect(() => {
    if (isPrinting) {
      // Esperar un momento para que React complete el renderizado
      setTimeout(() => {
        // Forzar que los ResponsiveContainer se recalculen
        const chartContainers = reportRef.current?.querySelectorAll(".recharts-responsive-container, .recharts-wrapper, svg")
        chartContainers?.forEach((container) => {
          // Disparar evento de resize para forzar recálculo
          window.dispatchEvent(new Event("resize"))
          // Forzar reflow accediendo a dimensiones
          void container.offsetHeight
          void container.offsetWidth
          void container.getBoundingClientRect()
          
          // Asegurar visibilidad
          if (container instanceof HTMLElement) {
            container.style.display = "block"
            container.style.visibility = "visible"
            container.style.opacity = "1"
          }
        })
        
        // Forzar renderizado de elementos específicos del PieChart
        const pieSectors = reportRef.current?.querySelectorAll(".recharts-pie-sector, .recharts-pie, .recharts-label")
        pieSectors?.forEach((sector) => {
          void sector.getBoundingClientRect()
          if (sector instanceof HTMLElement) {
            sector.style.display = "block"
            sector.style.visibility = "visible"
            sector.style.opacity = "1"
          }
        })
      }, 100)
    }
  }, [isPrinting])

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
      
      <div className="report-print-footer" style={{ display: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", fontSize: "9pt", color: "#666", padding: "0.5rem 0" }}>
          <span style={{ fontWeight: 600 }}>AURA MINOSA - Sistema de Gestión Minera</span>
          <span style={{ fontWeight: 600 }}>Emitido: {issuedOn}</span>
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
