import { useState, useEffect } from "react"
import { addDoc, collection, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { db } from "../../../../../lib/firebase"

// Funciones de validación
const validatePercentage = (value, fieldName) => {
  if (!value || value === "") return { valid: true, error: null } // Permitir campo vacío mientras se escribe
  const numValue = Number(value)
  if (Number.isNaN(numValue)) {
    return { valid: false, error: `${fieldName} debe ser un número válido` }
  }
  if (numValue < 1 || numValue > 100) {
    return { valid: false, error: `${fieldName} debe estar entre 1 y 100` }
  }
  return { valid: true, error: null }
}

const initialForm = {
  zona: "",
  lote: "",
  operador: "",
  material: "oro",
  fechaEnvio: "",
  resultado: "",
  pureza: "",
  humedad: "",
  observaciones: "",
}

export default function LabForm() {
  const [formData, setFormData] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: null, message: "" })
  const [availableZones, setAvailableZones] = useState([])
  const [availableLots, setAvailableLots] = useState([])
  const [loadingZones, setLoadingZones] = useState(true)
  const [loadingLots, setLoadingLots] = useState(true)
  const [errors, setErrors] = useState({
    zona: null,
    lote: null,
    pureza: null,
    humedad: null,
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

  const handleChange = (e) => {
    const { name, value } = e.target

    // Validación en tiempo real
    if (name === "pureza") {
      // Permitir solo números y punto decimal
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        const validation = validatePercentage(value, "La pureza")
        setErrors((prev) => ({ ...prev, pureza: validation.error }))
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else if (name === "humedad") {
      // Permitir solo números y punto decimal
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        const validation = validatePercentage(value, "La humedad")
        setErrors((prev) => ({ ...prev, humedad: validation.error }))
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else {
      // Para otros campos, actualizar normalmente
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const resetForm = () => {
    setFormData(initialForm)
    setErrors({ zona: null, lote: null, pureza: null, humedad: null })
    setFeedback({ type: null, message: "" })
  }

  const validateForm = () => {
    const newErrors = {
      zona: formData.zona === "" ? "Debes seleccionar una zona registrada" : null,
      lote: formData.lote === "" ? "Debes seleccionar un lote registrado" : null,
      pureza: validatePercentage(formData.pureza, "La pureza").error,
      humedad: validatePercentage(formData.humedad, "La humedad").error,
    }
    setErrors(newErrors)
    return !newErrors.zona && !newErrors.lote && !newErrors.pureza && !newErrors.humedad
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

      if (!availableLots.includes(formData.lote)) {
        throw new Error("El lote seleccionado no está registrado en extracción.")
      }

      const purezaValue = Number(formData.pureza)
      const humedadValue = Number(formData.humedad)

      if (purezaValue < 1 || purezaValue > 100) {
        throw new Error("La pureza debe estar entre 1 y 100")
      }
      if (humedadValue < 1 || humedadValue > 100) {
        throw new Error("La humedad debe estar entre 1 y 100")
      }

      await addDoc(collection(db, "lab_analyses"), {
        zona: formData.zona,
        lote: formData.lote,
        operador: formData.operador,
        material: formData.material,
        fecha_envio: formData.fechaEnvio,
        resultado: formData.resultado,
        pureza: purezaValue,
        humedad: humedadValue,
        observaciones: formData.observaciones,
        created_at: serverTimestamp(),
      })

      setFeedback({ type: "success", message: "Análisis de laboratorio registrado correctamente." })
      resetForm()
    } catch (err) {
      console.error(err)
      setFeedback({
        type: "error",
        message: err.message || "No se pudo guardar el análisis. Intenta nuevamente.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="dashboard-form">
      <div className="dashboard-form__header">
        <p className="dashboard-form__eyebrow">Ingreso de datos</p>
        <h1 className="dashboard-form__title">Laboratorio</h1>
        <p className="dashboard-form__subtitle">
          Registra los resultados de laboratorio para vincularlos con cada extracción.
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
              <label htmlFor="lote" className="dashboard-form__label">
                Número de lote <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              {loadingLots ? (
                <Input
                  id="lote"
                  name="lote"
                  placeholder="Cargando lotes..."
                  disabled
                  className="dashboard-form__input"
                />
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
                  {!errors.lote && formData.lote && (
                    <p style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)", marginTop: "0.25rem" }}>
                      Lote registrado en extracción
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="operador" className="dashboard-form__label">
                Operador
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
              <label htmlFor="fechaEnvio" className="dashboard-form__label">
                Fecha de envío
              </label>
              <Input
                id="fechaEnvio"
                name="fechaEnvio"
                type="date"
                value={formData.fechaEnvio}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
            <div>
              <label htmlFor="resultado" className="dashboard-form__label">
                Resultado
              </label>
              <Input
                id="resultado"
                name="resultado"
                placeholder="Ej: Aprobado, Rechazado"
                value={formData.resultado}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="pureza" className="dashboard-form__label">
                Pureza (%) <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              <Input
                id="pureza"
                name="pureza"
                type="number"
                step="0.1"
                min="1"
                max="100"
                placeholder="Ej: 95.5 (1-100)"
                value={formData.pureza}
                onChange={handleChange}
                required
                className={`dashboard-form__input ${errors.pureza ? "dashboard-form__input--error" : ""}`}
                style={errors.pureza ? { borderColor: "#f25c4a" } : {}}
              />
              {errors.pureza && (
                <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.pureza}</p>
              )}
              {!errors.pureza && formData.pureza && (
                <p style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)", marginTop: "0.25rem" }}>
                  Valor válido (1-100%)
                </p>
              )}
            </div>
            <div>
              <label htmlFor="humedad" className="dashboard-form__label">
                Humedad (%) <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              <Input
                id="humedad"
                name="humedad"
                type="number"
                step="0.1"
                min="1"
                max="100"
                placeholder="Ej: 6.4 (1-100)"
                value={formData.humedad}
                onChange={handleChange}
                required
                className={`dashboard-form__input ${errors.humedad ? "dashboard-form__input--error" : ""}`}
                style={errors.humedad ? { borderColor: "#f25c4a" } : {}}
              />
              {errors.humedad && (
                <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.humedad}</p>
              )}
              {!errors.humedad && formData.humedad && (
                <p style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)", marginTop: "0.25rem" }}>
                  Valor válido (1-100%)
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="observaciones" className="dashboard-form__label">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              placeholder="Notas relevantes del análisis..."
              value={formData.observaciones}
              onChange={handleChange}
              className="dashboard-form__input"
              rows={3}
            />
          </div>

          <div className="dashboard-form__actions">
            <Button type="submit" variant="accent" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar análisis"}
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
