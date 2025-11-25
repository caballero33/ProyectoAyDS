
import { useEffect, useMemo, useState } from "react"
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table"
import { PlusCircle, CheckCircle2, XCircle } from "lucide-react"
import { db } from "../../../../../lib/firebase"
import { createNotification, generateNotificationSummary } from "../../../../../lib/notifications"

// Funciones de validación
const validatePercentage = (value, fieldName) => {
  if (!value || value === "") return { valid: true, error: null }
  const numValue = Number(value)
  if (Number.isNaN(numValue)) {
    return { valid: false, error: `${fieldName} debe ser un número válido` }
  }
  if (numValue < 1 || numValue > 100) {
    return { valid: false, error: `${fieldName} debe estar entre 1 y 100` }
  }
  return { valid: true, error: null }
}

const validateQuantity = (value) => {
  if (!value || value === "") return { valid: true, error: null }
  const numValue = Number(value)
  if (Number.isNaN(numValue)) {
    return { valid: false, error: "La cantidad debe ser un número válido" }
  }
  if (numValue < 0) {
    return { valid: false, error: "La cantidad no puede ser negativa" }
  }
  return { valid: true, error: null }
}

const validateDuration = (value) => {
  if (!value || value === "") return { valid: true, error: null }
  const numValue = Number(value)
  if (Number.isNaN(numValue)) {
    return { valid: false, error: "La duración debe ser un número válido" }
  }
  if (numValue <= 0) {
    return { valid: false, error: "La duración debe ser mayor a 0" }
  }
  return { valid: true, error: null }
}

const validateExtractionId = (value) => {
  if (!value || value === "") return { valid: true, error: null }
  // Formato: 3 letras - año (4 dígitos) - 3 números
  // Ejemplo: ABC-2024-123
  const extractionIdPattern = /^[A-Za-z]{3}-\d{4}-\d{3}$/
  if (!extractionIdPattern.test(value)) {
    return {
      valid: false,
      error: "El formato debe ser: 3 letras-año-3 números (ej: ABC-2024-123)",
    }
  }
  return { valid: true, error: null }
}

const initialForm = {
  zona: "",
  material: "oro",
  operador: "",
  condicion: "humedo",
  idExtraccion: "",
  fecha: "",
  cantidad: "",
  purezaFinal: "",
  turno: "mañana",
  lote: "",
  observaciones: "",
  tieneAveria: "no",
  maquina: "",
  tipoFalla: "",
  duracionFalla: "",
  estadoFalla: "abierta",
  responsableFalla: "",
  descripcionFalla: "",
}

const initialConsumo = {
  supplyId: "",
  nombreInsumo: "",
  cantidadUsada: "",
  proceso: "",
  fecha: "",
}

export default function PlantaForm() {
  const [formData, setFormData] = useState(initialForm)
  const [consumoInsumos, setConsumoInsumos] = useState([])
  const [nuevoConsumo, setNuevoConsumo] = useState(initialConsumo)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: null, message: "" })
  const [inventory, setInventory] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(true)
  const [consumoError, setConsumoError] = useState("")
  const [availableZones, setAvailableZones] = useState([])
  const [availableLots, setAvailableLots] = useState([])
  const [loadingZones, setLoadingZones] = useState(true)
  const [loadingLots, setLoadingLots] = useState(true)
  const [errors, setErrors] = useState({
    zona: null,
    lote: null,
    idExtraccion: null,
    purezaFinal: null,
    cantidad: null,
    duracionFalla: null,
  })
  const [consumoErrors, setConsumoErrors] = useState({
    cantidadUsada: null,
  })

  // Cargar zonas disponibles desde análisis de suelos
  useEffect(() => {
    const fetchZones = async () => {
      setLoadingZones(true)
      try {
        const snapshot = await getDocs(query(collection(db, "soil_analyses"), orderBy("zona")))
        const zones = new Set()
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.zona && data.zona.trim() !== "") {
            zones.add(data.zona.trim())
          }
        })
        setAvailableZones(Array.from(zones).sort())
      } catch (err) {
        console.error("Error al cargar zonas:", err)
      } finally {
        setLoadingZones(false)
      }
    }
    fetchZones()
  }, [])

  // Cargar lotes disponibles desde extracción
  useEffect(() => {
    const fetchLots = async () => {
      setLoadingLots(true)
      try {
        const snapshot = await getDocs(query(collection(db, "extraction_records"), orderBy("lote")))
        const lots = new Set()
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.lote && data.lote.trim() !== "") {
            lots.add(data.lote.trim())
          }
        })
        setAvailableLots(Array.from(lots).sort())
      } catch (err) {
        console.error("Error al cargar lotes:", err)
      } finally {
        setLoadingLots(false)
      }
    }
    fetchLots()
  }, [])

  const inventoryIndex = useMemo(() => {
    return inventory.reduce((acc, item) => {
      acc[item.id] = item
      return acc
    }, {})
  }, [inventory])

  const getRemainingStock = (supplyId) => {
    const supply = inventoryIndex[supplyId]
    if (!supply) return 0
    const alreadyRegistered = consumoInsumos
      .filter((item) => item.supplyId === supplyId)
      .reduce((acc, item) => acc + Number(item.cantidadUsada || 0), 0)
    return Math.max(supply.cantidadActual - alreadyRegistered, 0)
  }

  useEffect(() => {
    const fetchInventory = async () => {
      setLoadingInventory(true)
      try {
        const snapshot = await getDocs(query(collection(db, "supplies"), orderBy("nombre")))
        const supplies = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            nombre: data.nombre ?? "",
            codigo: data.codigo ?? "",
            cantidadActual: Number(data.cantidad_actual ?? data.cantidadActual ?? 0),
            unidad: data.unidad ?? "",
          }
        })
        setInventory(supplies)
      } catch (error) {
        console.error("No se pudo cargar el inventario de insumos", error)
      } finally {
        setLoadingInventory(false)
      }
    }

    fetchInventory()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Validación en tiempo real
    if (name === "idExtraccion") {
      // Convertir a mayúsculas automáticamente las letras y permitir formato: LLL-YYYY-NNN
      let formattedValue = value
      if (value.length > 0) {
        // Convertir letras a mayúsculas y mantener números y guiones
        formattedValue = value
          .toUpperCase()
          .replace(/[^A-Z0-9-]/g, "") // Solo letras, números y guiones
          .slice(0, 13) // Limitar a 13 caracteres (ABC-2024-123)
      }
      const validation = validateExtractionId(formattedValue)
      setErrors((prev) => ({ ...prev, idExtraccion: validation.error }))
      setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    } else if (name === "purezaFinal") {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        const validation = validatePercentage(value, "La pureza")
        setErrors((prev) => ({ ...prev, purezaFinal: validation.error }))
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else if (name === "cantidad") {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        const validation = validateQuantity(value)
        setErrors((prev) => ({ ...prev, cantidad: validation.error }))
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else if (name === "duracionFalla") {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        const validation = validateDuration(value)
        setErrors((prev) => ({ ...prev, duracionFalla: validation.error }))
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else {
      // Para otros campos, actualizar normalmente
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSupplySelect = (e) => {
    const supplyId = e.target.value
    const supply = inventoryIndex[supplyId]
    setNuevoConsumo((prev) => ({
      ...prev,
      supplyId,
      nombreInsumo: supply?.nombre ?? "",
    }))
    setConsumoError("")
    setConsumoErrors({ cantidadUsada: null })
    
    // Si hay una cantidad ingresada, validar nuevamente con el nuevo insumo
    if (nuevoConsumo.cantidadUsada) {
      const numValue = Number(nuevoConsumo.cantidadUsada)
      if (!Number.isNaN(numValue) && numValue > 0) {
        const remainingStock = getRemainingStock(supplyId)
        if (numValue > remainingStock) {
          setConsumoErrors((prev) => ({
            ...prev,
            cantidadUsada: `No puedes consumir más del stock disponible (${remainingStock} ${supply?.unidad || "u."})`,
          }))
        } else {
          setConsumoErrors({ cantidadUsada: null })
        }
      }
    }
  }

  const handleConsumoChange = (e) => {
    const { name, value } = e.target
    setNuevoConsumo((prev) => ({ ...prev, [name]: value }))
    setConsumoError("")
    
    // Validación en tiempo real para cantidadUsada
    if (name === "cantidadUsada") {
      const numValue = Number(value)
      
      // Validar que no sea negativo
      if (value !== "" && (Number.isNaN(numValue) || numValue < 0)) {
        setConsumoErrors((prev) => ({
          ...prev,
          cantidadUsada: "La cantidad no puede ser negativa",
        }))
        return
      }
      
      // Validar que no exceda el stock disponible
      if (nuevoConsumo.supplyId && value !== "" && !Number.isNaN(numValue) && numValue > 0) {
        const remainingStock = getRemainingStock(nuevoConsumo.supplyId)
        if (numValue > remainingStock) {
          const supply = inventoryIndex[nuevoConsumo.supplyId]
          setConsumoErrors((prev) => ({
            ...prev,
            cantidadUsada: `No puedes consumir más del stock disponible (${remainingStock} ${supply?.unidad || "u."})`,
          }))
          return
        }
      }
      
      // Si pasa todas las validaciones, limpiar el error
      setConsumoErrors((prev) => ({
        ...prev,
        cantidadUsada: null,
      }))
    }
  }

  const handleAddConsumo = (e) => {
    e.preventDefault()
    setConsumoError("")

    if (!nuevoConsumo.supplyId || !nuevoConsumo.cantidadUsada || !nuevoConsumo.proceso || !nuevoConsumo.fecha) {
      setConsumoError("Completa todos los campos para registrar el consumo.")
      return
    }

    const selectedSupply = inventoryIndex[nuevoConsumo.supplyId]
    if (!selectedSupply) {
      setConsumoError("Selecciona un insumo válido del inventario.")
      return
    }

    const quantityToUse = Number(nuevoConsumo.cantidadUsada)

    // Validar que no sea negativo
    if (Number.isNaN(quantityToUse) || quantityToUse < 0) {
      setConsumoError("La cantidad no puede ser negativa.")
      setConsumoErrors({ cantidadUsada: "La cantidad no puede ser negativa" })
      return
    }

    // Validar que sea mayor a 0
    if (quantityToUse <= 0) {
      setConsumoError("La cantidad debe ser mayor a 0.")
      setConsumoErrors({ cantidadUsada: "La cantidad debe ser mayor a 0" })
      return
    }

    // Validar que no exceda el stock disponible
    const remainingStock = getRemainingStock(nuevoConsumo.supplyId)

    if (quantityToUse > remainingStock) {
      setConsumoError(
        `No puedes consumir ${quantityToUse} unidades. Stock disponible: ${remainingStock} ${selectedSupply.unidad || "u."}`
      )
      setConsumoErrors({
        cantidadUsada: `No puedes consumir más del stock disponible (${remainingStock} ${selectedSupply.unidad || "u."})`,
      })
      return
    }

    setConsumoInsumos((prev) => [
      ...prev,
      { ...nuevoConsumo, cantidadUsada: quantityToUse, nombreInsumo: selectedSupply.nombre },
    ])
    setNuevoConsumo(initialConsumo)
    setConsumoErrors({ cantidadUsada: null })
  }

  const validateForm = () => {
    const newErrors = {
      zona: formData.zona === "" ? "Debes seleccionar una zona registrada" : null,
      lote: formData.lote === "" ? "Debes seleccionar un lote registrado" : null,
      idExtraccion: formData.idExtraccion === "" ? "El ID de extracción es requerido" : validateExtractionId(formData.idExtraccion).error,
      purezaFinal: formData.purezaFinal ? validatePercentage(formData.purezaFinal, "La pureza").error : null,
      cantidad: validateQuantity(formData.cantidad).error,
      duracionFalla:
        formData.tieneAveria === "si" && formData.duracionFalla
          ? validateDuration(formData.duracionFalla).error
          : null,
    }
    setErrors(newErrors)
    return !newErrors.zona && !newErrors.lote && !newErrors.idExtraccion && !newErrors.purezaFinal && !newErrors.cantidad && !newErrors.duracionFalla
  }

  const resetForm = () => {
    setFormData(initialForm)
    setConsumoInsumos([])
    setNuevoConsumo(initialConsumo)
    setConsumoError("")
    setErrors({ zona: null, lote: null, idExtraccion: null, purezaFinal: null, cantidad: null, duracionFalla: null })
    setFeedback({ type: null, message: "" })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeedback({ type: null, message: "" })
    setConsumoError("")

    // Validar todos los campos antes de enviar
    if (!validateForm()) {
      setFeedback({
        type: "error",
        message: "Por favor corrige los errores en el formulario antes de enviar.",
      })
      return
    }

    setSubmitting(true)

    const hasInvalidConsumption = consumoInsumos.some((consumo) => {
      const supply = inventoryIndex[consumo.supplyId]
      if (!supply) return true
      const totalForSupply = consumoInsumos
        .filter((item) => item.supplyId === consumo.supplyId)
        .reduce((acc, item) => acc + Number(item.cantidadUsada || 0), 0)
      return totalForSupply > supply.cantidadActual
    })

    if (hasInvalidConsumption) {
      setConsumoError("Verifica las cantidades consumidas. No puedes exceder el stock disponible en bodega.")
      setSubmitting(false)
      return
    }

    try {
      // Validación final
      if (!availableZones.includes(formData.zona)) {
        throw new Error("La zona seleccionada no está registrada en análisis de suelos.")
      }

      if (!availableLots.includes(formData.lote)) {
        throw new Error("El lote seleccionado no está registrado en extracción.")
      }

      const extractionIdValidation = validateExtractionId(formData.idExtraccion)
      if (!extractionIdValidation.valid) {
        throw new Error(extractionIdValidation.error)
      }

      const cantidadValue = Number(formData.cantidad)
      if (cantidadValue < 0) {
        throw new Error("La cantidad producida no puede ser negativa")
      }

      if (formData.purezaFinal) {
        const purezaValue = Number(formData.purezaFinal)
        if (purezaValue < 1 || purezaValue > 100) {
          throw new Error("La pureza debe estar entre 1 y 100")
        }
      }

      const runRef = await addDoc(collection(db, "plant_runs"), {
        zona: formData.zona,
        material: formData.material,
        operador: formData.operador,
        condicion: formData.condicion,
        extraction_id: formData.idExtraccion,
        fecha: formData.fecha,
        cantidad_t: cantidadValue,
        cantidad_kg: cantidadValue,
        pureza_final: formData.purezaFinal ? Number(formData.purezaFinal) : null,
        turno: formData.turno,
        lote: formData.lote,
        observaciones: formData.observaciones,
        created_at: serverTimestamp(),
      })

      // Crear notificación
      const summary = generateNotificationSummary("plant", {
        lote: formData.lote,
        cantidad: cantidadValue,
        pureza_final: formData.purezaFinal,
      })
      await createNotification("plant", summary, {
        lote: formData.lote,
        zona: formData.zona,
        cantidad: cantidadValue,
        pureza_final: formData.purezaFinal,
        turno: formData.turno,
      })

      if (formData.tieneAveria === "si") {
        const duracionValue = formData.duracionFalla ? Number(formData.duracionFalla) : 0
        if (duracionValue <= 0) {
          throw new Error("La duración de la falla debe ser mayor a 0 horas")
        }

        await addDoc(collection(db, "plant_failures"), {
          plant_run_id: runRef.id,
          maquina: formData.maquina,
          tipo_falla: formData.tipoFalla,
          duracion_horas: duracionValue,
          estado: formData.estadoFalla,
          responsable: formData.responsableFalla,
          descripcion: formData.descripcionFalla,
          created_at: serverTimestamp(),
        })
      }

      if (consumoInsumos.length > 0) {
        const consumptionBySupply = consumoInsumos.reduce((acc, consumo) => {
          acc[consumo.supplyId] = (acc[consumo.supplyId] || 0) + Number(consumo.cantidadUsada || 0)
          return acc
        }, {})

        await Promise.all(
          consumoInsumos.map((consumo) =>
            addDoc(collection(db, "plant_consumptions"), {
              plant_run_id: runRef.id,
              insumo: consumo.nombreInsumo,
              insumo_id: consumo.supplyId,
              cantidad: Number(consumo.cantidadUsada),
              proceso: consumo.proceso,
              fecha: consumo.fecha,
              created_at: serverTimestamp(),
            })
          )
        )

        await Promise.all(
          Object.entries(consumptionBySupply).map(([supplyId, total]) => {
            const supplyDoc = doc(db, "supplies", supplyId)
            return updateDoc(supplyDoc, {
              cantidad_actual: increment(-Number(total)),
            })
          })
        )

        setInventory((prev) =>
          prev.map((item) => {
            const consumed = consumptionBySupply[item.id]
            if (!consumed) return item
            return { ...item, cantidadActual: Math.max(item.cantidadActual - consumed, 0) }
          })
        )
      }

      setFeedback({ type: "success", message: "Enviado con éxito" })
      setErrors({ zona: null, lote: null, idExtraccion: null, purezaFinal: null, cantidad: null, duracionFalla: null })
      setConsumoError("")
      
      // Limpiar formulario sin resetear el feedback
      setFormData(initialForm)
      setConsumoInsumos([])
      setNuevoConsumo(initialConsumo)
      
      // Limpiar el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setFeedback({ type: null, message: "" })
      }, 5000)
    } catch (err) {
      console.error(err)
      setFeedback({
        type: "error",
        message: err.message || "No se pudo guardar el registro. Intenta nuevamente.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="dashboard-form">
      <div className="dashboard-form__header">
        <p className="dashboard-form__eyebrow">Ingreso de datos</p>
        <h1 className="dashboard-form__title">Planta de procesamiento</h1>
        <p className="dashboard-form__subtitle">
          Registra el material procesado, incidentes operativos y consumo de insumos críticos.
        </p>
      </div>

      <div className="dashboard-form__card">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="zona" className="dashboard-form__label">
                Zona <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              {loadingZones ? (
                <Input id="zona" name="zona" placeholder="Cargando zonas..." disabled className="dashboard-form__input" />
              ) : availableZones.length === 0 ? (
                <>
                  <Input
                    id="zona"
                    name="zona"
                    placeholder="No hay zonas registradas"
                    disabled
                    className="dashboard-form__input"
                    style={{ borderColor: "#f25c4a" }}
                  />
                  <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>
                    Primero debes registrar zonas en Análisis de Suelos.
                  </p>
                </>
              ) : (
                <>
                  <select
                    id="zona"
                    name="zona"
                    value={formData.zona}
                    onChange={handleChange}
                    required
                    className={`dashboard-form__input ${errors.zona ? "dashboard-form__input--error" : ""}`}
                    style={errors.zona ? { borderColor: "#f25c4a" } : {}}
                  >
                    <option value="">Seleccionar zona...</option>
                    {availableZones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                  {errors.zona && (
                    <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.zona}</p>
                  )}
                  {!errors.zona && formData.zona && availableZones.includes(formData.zona) && (
                    <p style={{ fontSize: "0.75rem", color: "rgba(34, 197, 94, 0.8)", marginTop: "0.25rem" }}>
                      ✓ Zona registrada
                    </p>
                  )}
                </>
              )}
            </div>
            <div>
              <label htmlFor="material" className="dashboard-form__label">
                Material
              </label>
              <select
                id="material"
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="dashboard-form__input"
              >
                <option value="oro">Oro</option>
                <option value="cobre">Cobre</option>
              </select>
            </div>
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="operador" className="dashboard-form__label">
                Operador responsable
              </label>
              <Input
                id="operador"
                name="operador"
                placeholder="Ej: Juan López"
                value={formData.operador}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
            <div>
              <label htmlFor="condicion" className="dashboard-form__label">
                Condición del material
              </label>
              <select
                id="condicion"
                name="condicion"
                value={formData.condicion}
                onChange={handleChange}
                className="dashboard-form__input"
              >
                <option value="humedo">Húmedo</option>
                <option value="seco">Seco</option>
                <option value="crudo">Crudo</option>
              </select>
            </div>
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="idExtraccion" className="dashboard-form__label">
                ID de extracción <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              <Input
                id="idExtraccion"
                name="idExtraccion"
                placeholder="Ej: ABC-2024-123"
                value={formData.idExtraccion}
                onChange={handleChange}
                required
                maxLength={13}
                className={`dashboard-form__input ${errors.idExtraccion ? "dashboard-form__input--error" : ""}`}
                style={errors.idExtraccion ? { borderColor: "#f25c4a" } : {}}
              />
              {errors.idExtraccion && (
                <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.idExtraccion}</p>
              )}
              {!errors.idExtraccion && formData.idExtraccion && validateExtractionId(formData.idExtraccion).valid && (
                <p style={{ fontSize: "0.75rem", color: "rgba(34, 197, 94, 0.8)", marginTop: "0.25rem" }}>
                  ✓ Formato válido: 3 letras-año-3 números (ej: ABC-2024-123)
                </p>
              )}
            </div>
            <div>
              <label htmlFor="fecha" className="dashboard-form__label">
                Fecha
              </label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="cantidad" className="dashboard-form__label">
                Cantidad producida (kg) <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 7.35"
                value={formData.cantidad}
                onChange={handleChange}
                required
                className={`dashboard-form__input ${errors.cantidad ? "dashboard-form__input--error" : ""}`}
                style={errors.cantidad ? { borderColor: "#f25c4a" } : {}}
              />
              {errors.cantidad && (
                <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.cantidad}</p>
              )}
              {!errors.cantidad && formData.cantidad && validateQuantity(formData.cantidad).valid && (
                <p style={{ fontSize: "0.75rem", color: "rgba(34, 197, 94, 0.8)", marginTop: "0.25rem" }}>
                  ✓ Cantidad válida
                </p>
              )}
            </div>
            <div>
              <label htmlFor="purezaFinal" className="dashboard-form__label">
                Pureza final (%) <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              <Input
                id="purezaFinal"
                name="purezaFinal"
                type="number"
                step="0.1"
                min="1"
                max="100"
                placeholder="Ej: 96.5 (1-100)"
                value={formData.purezaFinal}
                onChange={handleChange}
                required
                className={`dashboard-form__input ${errors.purezaFinal ? "dashboard-form__input--error" : ""}`}
                style={errors.purezaFinal ? { borderColor: "#f25c4a" } : {}}
              />
              {errors.purezaFinal && (
                <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.purezaFinal}</p>
              )}
              {!errors.purezaFinal && formData.purezaFinal && validatePercentage(formData.purezaFinal, "La pureza").valid && (
                <p style={{ fontSize: "0.75rem", color: "rgba(34, 197, 94, 0.8)", marginTop: "0.25rem" }}>
                  ✓ Valor válido (1-100%)
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="turno" className="dashboard-form__label">
              Turno
            </label>
            <select id="turno" name="turno" value={formData.turno} onChange={handleChange} className="dashboard-form__input">
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="noche">Noche</option>
            </select>
          </div>

          <div>
            <label htmlFor="lote" className="dashboard-form__label">
              Número de lote <span style={{ color: "#f25c4a" }}>*</span>
            </label>
            {loadingLots ? (
              <Input id="lote" name="lote" placeholder="Cargando lotes..." disabled className="dashboard-form__input" />
            ) : availableLots.length === 0 ? (
              <>
                <Input
                  id="lote"
                  name="lote"
                  placeholder="No hay lotes registrados"
                  disabled
                  className="dashboard-form__input"
                  style={{ borderColor: "#f25c4a" }}
                />
                <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>
                  Primero debes registrar lotes en Extracción.
                </p>
              </>
            ) : (
              <>
                <select
                  id="lote"
                  name="lote"
                  value={formData.lote}
                  onChange={handleChange}
                  required
                  className={`dashboard-form__input ${errors.lote ? "dashboard-form__input--error" : ""}`}
                  style={errors.lote ? { borderColor: "#f25c4a" } : {}}
                >
                  <option value="">Seleccionar lote...</option>
                  {availableLots.map((lot) => (
                    <option key={lot} value={lot}>
                      {lot}
                    </option>
                  ))}
                </select>
                {errors.lote && (
                  <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.lote}</p>
                )}
                {!errors.lote && formData.lote && availableLots.includes(formData.lote) && (
                  <p style={{ fontSize: "0.75rem", color: "rgba(34, 197, 94, 0.8)", marginTop: "0.25rem" }}>
                    ✓ Lote registrado en extracción
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="observaciones" className="dashboard-form__label">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              placeholder="Observaciones adicionales..."
              value={formData.observaciones}
              onChange={handleChange}
              className="dashboard-form__input"
              rows={3}
            />
          </div>

          <div className="border-t border-[rgba(30,44,92,0.12)] pt-6 space-y-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Registro de fallas en máquina</h3>

            <div className="dashboard-form__grid">
              <div>
                <label htmlFor="tieneAveria" className="dashboard-form__label">
                  ¿Presentó avería?
                </label>
                <select
                  id="tieneAveria"
                  name="tieneAveria"
                  value={formData.tieneAveria}
                  onChange={handleChange}
                  className="dashboard-form__input"
                >
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </div>
            </div>

            {formData.tieneAveria === "si" && (
              <div className="space-y-5">
                <div className="dashboard-form__grid">
                  <div>
                    <label htmlFor="maquina" className="dashboard-form__label">
                      Máquina afectada
                    </label>
                    <Input
                      id="maquina"
                      name="maquina"
                      placeholder="Ej: Molino #2"
                      value={formData.maquina}
                      onChange={handleChange}
                      className="dashboard-form__input"
                    />
                  </div>
                  <div>
                    <label htmlFor="tipoFalla" className="dashboard-form__label">
                      Tipo de falla
                    </label>
                    <select
                      id="tipoFalla"
                      name="tipoFalla"
                      value={formData.tipoFalla}
                      onChange={handleChange}
                      className="dashboard-form__input"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Mecánica">Mecánica</option>
                      <option value="Eléctrica">Eléctrica</option>
                      <option value="Proceso">Proceso</option>
                    </select>
                  </div>
                </div>

                <div className="dashboard-form__grid">
                  <div>
                    <label htmlFor="duracionFalla" className="dashboard-form__label">
                      Duración (horas) <span style={{ color: "#f25c4a" }}>*</span>
                    </label>
                    <Input
                      id="duracionFalla"
                      name="duracionFalla"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="Ej: 2.5"
                      value={formData.duracionFalla}
                      onChange={handleChange}
                      required={formData.tieneAveria === "si"}
                      className={`dashboard-form__input ${errors.duracionFalla ? "dashboard-form__input--error" : ""}`}
                      style={errors.duracionFalla ? { borderColor: "#f25c4a" } : {}}
                    />
                    {errors.duracionFalla && (
                      <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>
                        {errors.duracionFalla}
                      </p>
                    )}
                    {!errors.duracionFalla && formData.duracionFalla && validateDuration(formData.duracionFalla).valid && (
                      <p style={{ fontSize: "0.75rem", color: "rgba(34, 197, 94, 0.8)", marginTop: "0.25rem" }}>
                        ✓ Duración válida (horas positivas)
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="estadoFalla" className="dashboard-form__label">
                      Estado
                    </label>
                    <select
                      id="estadoFalla"
                      name="estadoFalla"
                      value={formData.estadoFalla}
                      onChange={handleChange}
                      className="dashboard-form__input"
                    >
                      <option value="abierta">Abierta</option>
                      <option value="cerrada">Cerrada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="responsableFalla" className="dashboard-form__label">
                    Responsable
                  </label>
                  <Input
                    id="responsableFalla"
                    name="responsableFalla"
                    placeholder="Nombre del técnico"
                    value={formData.responsableFalla}
                    onChange={handleChange}
                    className="dashboard-form__input"
                  />
                </div>

                <div>
                  <label htmlFor="descripcionFalla" className="dashboard-form__label">
                    Descripción de la falla
                  </label>
                  <textarea
                    id="descripcionFalla"
                    name="descripcionFalla"
                    placeholder="Detalla la falla y acciones tomadas..."
                    value={formData.descripcionFalla}
                    onChange={handleChange}
                    className="dashboard-form__input"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[rgba(30,44,92,0.12)] pt-6 space-y-5">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Registro de consumo de insumos</h3>

            {loadingInventory && <p className="text-sm text-muted-foreground">Cargando inventario disponible…</p>}

            <div className="dashboard-form__grid">
              <div>
                <label htmlFor="nombreInsumo" className="dashboard-form__label">
                  Nombre de insumo
                </label>
                <select
                  id="nombreInsumo"
                  name="supplyId"
                  value={nuevoConsumo.supplyId}
                  onChange={handleSupplySelect}
                  className="dashboard-form__input"
                  disabled={loadingInventory || inventory.length === 0}
                >
                  <option value="">Seleccionar...</option>
                  {inventory.map((item) => {
                    const restante = getRemainingStock(item.id)
                    return (
                      <option key={item.id} value={item.id} disabled={restante <= 0}>
                        {item.nombre} · Disponible: {restante} {item.unidad || "u."}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="cantidadUsada" className="dashboard-form__label">
                  Cantidad a consumir <span style={{ color: "#f25c4a" }}>*</span>
                </label>
                <Input
                  id="cantidadUsada"
                  name="cantidadUsada"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej: 100"
                  value={nuevoConsumo.cantidadUsada}
                  onChange={handleConsumoChange}
                  className={`dashboard-form__input ${consumoErrors.cantidadUsada ? "dashboard-form__input--error" : ""}`}
                  style={consumoErrors.cantidadUsada ? { borderColor: "#f25c4a" } : {}}
                  disabled={loadingInventory || inventory.length === 0}
                />
                {consumoErrors.cantidadUsada && (
                  <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>
                    {consumoErrors.cantidadUsada}
                  </p>
                )}
                {!consumoErrors.cantidadUsada && nuevoConsumo.cantidadUsada && nuevoConsumo.supplyId && (
                  <p style={{ fontSize: "0.75rem", color: "rgba(34, 197, 94, 0.8)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <CheckCircle2 size={16} /> Cantidad válida
                  </p>
                )}
                {nuevoConsumo.supplyId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Stock disponible: {getRemainingStock(nuevoConsumo.supplyId)}{" "}
                    {inventoryIndex[nuevoConsumo.supplyId]?.unidad || "u."}
                  </p>
                )}
              </div>
            </div>

            <div className="dashboard-form__grid">
              <div>
                <label htmlFor="proceso" className="dashboard-form__label">
                  Proceso
                </label>
                <select
                  id="proceso"
                  name="proceso"
                  value={nuevoConsumo.proceso}
                  onChange={handleConsumoChange}
                  className="dashboard-form__input"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Flotación">Flotación</option>
                  <option value="Concentración">Concentración</option>
                  <option value="Espesamiento">Espesamiento</option>
                  <option value="Secado">Secado</option>
                </select>
              </div>
              <div>
                <label htmlFor="fechaConsumo" className="dashboard-form__label">
                  Fecha
                </label>
                <Input
                  id="fechaConsumo"
                  name="fecha"
                  type="date"
                  value={nuevoConsumo.fecha}
                  onChange={handleConsumoChange}
                  className="dashboard-form__input"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleAddConsumo}
              className="inline-flex items-center gap-2"
              disabled={loadingInventory || inventory.length === 0}
            >
              <PlusCircle size={18} />
              Registrar insumo
            </Button>

            {consumoError && <p className="text-sm text-red-600">{consumoError}</p>}

            {inventory.length === 0 && !loadingInventory && (
              <p className="text-sm text-muted-foreground">
                No hay insumos disponibles en bodega. Registra el stock desde la sección de inventario antes de reportar
                consumos.
              </p>
            )}

            {consumoInsumos.length > 0 && (
              <div className="dashboard-report__table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Proceso</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumoInsumos.map((consumo, index) => (
                      <TableRow key={`${consumo.nombreInsumo}-${consumo.fecha}-${index}`}>
                        <TableCell>{consumo.nombreInsumo}</TableCell>
                        <TableCell>
                          {consumo.cantidadUsada} {inventoryIndex[consumo.supplyId]?.unidad || "u."}
                        </TableCell>
                        <TableCell>{consumo.proceso}</TableCell>
                        <TableCell>{consumo.fecha}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="dashboard-form__actions">
            <Button type="submit" variant="accent" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar datos"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Limpiar
            </Button>
          </div>

          {feedback.message && (
            <div
              className={`dashboard-form__feedback ${
                feedback.type === "success" ? "dashboard-form__feedback--success" : "dashboard-form__feedback--error"
              }`}
              style={{ display: "flex" }}
            >
              <div className="dashboard-form__feedback-icon">
                {feedback.type === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
              <div className="dashboard-form__feedback-message">{feedback.message}</div>
            </div>
          )}
        </form>
      </div>
    </section>
  )
}
