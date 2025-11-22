import { useState, useEffect } from "react"
import { addDoc, collection, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { db } from "../../../../../lib/firebase"

// Funciones de validación
const validateLotNumber = (value) => {
  if (!value || value === "") return { valid: true, error: null }
  // Formato: Letra-NNN (una letra, guión, 3 números)
  const lotPattern = /^[A-Za-z]-[0-9]{3}$/
  if (!lotPattern.test(value)) {
    return {
      valid: false,
      error: "El formato debe ser Letra-XXX (ej: O-123, A-456). Una letra, guión y 3 números.",
    }
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

const initialForm = {
  zona: "",
  material: "oro",
  lote: "",
  fecha: "",
  cantidad: "",
  operador: "",
  condicion: "humedo",
  observaciones: "",
}

export default function ExtraccionForm() {
  const [formData, setFormData] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: null, message: "" })
  const [availableZones, setAvailableZones] = useState([])
  const [loadingZones, setLoadingZones] = useState(true)
  const [errors, setErrors] = useState({
    zona: null,
    lote: null,
    cantidad: null,
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
        setFeedback({ type: "error", message: "No se pudieron cargar las zonas disponibles." })
      } finally {
        setLoadingZones(false)
      }
    }
    fetchZones()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Validación en tiempo real
    if (name === "lote") {
      // Convertir a mayúscula automáticamente la letra y permitir solo formato Letra-NNN
      let formattedValue = value
      if (value.length > 0) {
        // Convertir primera letra a mayúscula
        if (/^[a-zA-Z]$/.test(value[0])) {
          formattedValue = value[0].toUpperCase() + value.slice(1)
        }
        // Permitir solo letras, guión y números después del primer carácter
        formattedValue = formattedValue.replace(/[^A-Za-z0-9-]/g, "")
        // Limitar a 5 caracteres (Letra-XXX)
        if (formattedValue.length > 5) {
          formattedValue = formattedValue.slice(0, 5)
        }
      }
      const validation = validateLotNumber(formattedValue)
      setErrors((prev) => ({ ...prev, lote: validation.error }))
      setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    } else if (name === "cantidad") {
      // Permitir solo números y punto decimal
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        const validation = validateQuantity(value)
        setErrors((prev) => ({ ...prev, cantidad: validation.error }))
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else {
      // Para otros campos, actualizar normalmente
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const resetForm = () => {
    setFormData(initialForm)
    setErrors({ zona: null, lote: null, cantidad: null })
    setFeedback({ type: null, message: "" })
  }

  const validateForm = () => {
    const newErrors = {
      zona: formData.zona === "" ? "Debes seleccionar una zona registrada" : null,
      lote: validateLotNumber(formData.lote).error,
      cantidad: validateQuantity(formData.cantidad).error,
    }
    setErrors(newErrors)
    return !newErrors.zona && !newErrors.lote && !newErrors.cantidad
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeedback({ type: null, message: "" })

    // Validar todos los campos antes de enviar
    if (!validateForm()) {
      setFeedback({
        type: "error",
        message: "Por favor corrige los errores en el formulario antes de enviar.",
      })
      return
    }

    setSubmitting(true)

    try {
      // Validación final
      if (!availableZones.includes(formData.zona)) {
        throw new Error("La zona seleccionada no está registrada en análisis de suelos.")
      }

      const lotValidation = validateLotNumber(formData.lote)
      if (!lotValidation.valid) {
        throw new Error(lotValidation.error)
      }

      const cantidadTon = Number(formData.cantidad)
      if (cantidadTon < 0) {
        throw new Error("La cantidad no puede ser negativa")
      }

      // Normalizar formato del lote (mayúscula en la letra)
      const normalizedLot = formData.lote.charAt(0).toUpperCase() + formData.lote.slice(1).toUpperCase()

      await addDoc(collection(db, "extraction_records"), {
        zona: formData.zona,
        material: formData.material,
        lote: normalizedLot,
        fecha: formData.fecha,
        cantidad_t: cantidadTon,
        cantidad_kg: Number.isFinite(cantidadTon) ? cantidadTon * 1000 : null,
        operador: formData.operador,
        condicion: formData.condicion,
        observaciones: formData.observaciones,
        created_at: serverTimestamp(),
      })

      setFeedback({ type: "success", message: "Registro de extracción guardado correctamente." })
      resetForm()
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
        <h1 className="dashboard-form__title">Extracción</h1>
        <p className="dashboard-form__subtitle">
          Registra la jornada de extracción para mantener la trazabilidad de lotes y materiales.
        </p>
      </div>

      <div className="dashboard-form__card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="zona" className="dashboard-form__label">
                Zona <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              {loadingZones ? (
                <Input
                  id="zona"
                  name="zona"
                  placeholder="Cargando zonas..."
                  disabled
                  className="dashboard-form__input"
                />
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
                  {!errors.zona && formData.zona && (
                    <p style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)", marginTop: "0.25rem" }}>
                      Zona registrada en análisis de suelos
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
              <label htmlFor="lote" className="dashboard-form__label">
                Número de lote <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              <Input
                id="lote"
                name="lote"
                placeholder="Ej: O-123 (Letra-XXX)"
                value={formData.lote}
                onChange={handleChange}
                required
                maxLength={5}
                className={`dashboard-form__input ${errors.lote ? "dashboard-form__input--error" : ""}`}
                style={errors.lote ? { borderColor: "#f25c4a" } : {}}
              />
              {errors.lote && (
                <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.lote}</p>
              )}
              {!errors.lote && formData.lote && (
                <p style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)", marginTop: "0.25rem" }}>
                  Formato válido: Letra-XXX (ej: O-123)
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
                Cantidad (t) <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                step="0.1"
                min="0"
                placeholder="Ej: 7.3"
                value={formData.cantidad}
                onChange={handleChange}
                required
                className={`dashboard-form__input ${errors.cantidad ? "dashboard-form__input--error" : ""}`}
                style={errors.cantidad ? { borderColor: "#f25c4a" } : {}}
              />
              {errors.cantidad && (
                <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.cantidad}</p>
              )}
              {!errors.cantidad && formData.cantidad && (
                <p style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)", marginTop: "0.25rem" }}>
                  Cantidad válida
                </p>
              )}
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
                required
                className="dashboard-form__input"
              >
                <option value="">Seleccionar...</option>
                <option value="humedo">Húmedo</option>
                <option value="seco">Seco</option>
                <option value="crudo">Crudo</option>
              </select>
            </div>
          </div>

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
              rows={4}
            />
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
            <p className={`text-sm ${feedback.type === "error" ? "text-red-600" : "text-green-600"}`}>
              {feedback.message}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
