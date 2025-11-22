import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { db } from "../../../../../lib/firebase"

const initialForm = {
  zona: "",
  fecha: "",
  analista: "",
  ph: "",
  pureza: "",
  humedad: "",
  apta: "no",
  observaciones: "",
}

// Funciones de validación
const validatePH = (value) => {
  if (!value || value === "") return { valid: true, error: null } // Permitir campo vacío mientras se escribe
  const numValue = Number(value)
  if (Number.isNaN(numValue)) {
    return { valid: false, error: "El pH debe ser un número válido" }
  }
  if (numValue < 0 || numValue > 14) {
    return { valid: false, error: "El pH debe estar entre 0 y 14" }
  }
  return { valid: true, error: null }
}

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

export default function AnalisisSuelosForm() {
  const [formData, setFormData] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: null, message: "" })
  const [errors, setErrors] = useState({
    ph: null,
    pureza: null,
    humedad: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    // Permitir solo números, punto decimal y guión negativo mientras se escribe
    if (name === "ph" || name === "pureza" || name === "humedad") {
      // Permitir vacío, números, punto decimal y un solo guión al inicio
      if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
        // Validación en tiempo real
        if (name === "ph") {
          const validation = validatePH(value)
          setErrors((prev) => ({ ...prev, ph: validation.error }))
          setFormData((prev) => ({ ...prev, [name]: value }))
        } else if (name === "pureza") {
          const validation = validatePercentage(value, "La pureza")
          setErrors((prev) => ({ ...prev, pureza: validation.error }))
          setFormData((prev) => ({ ...prev, [name]: value }))
        } else if (name === "humedad") {
          const validation = validatePercentage(value, "La humedad")
          setErrors((prev) => ({ ...prev, humedad: validation.error }))
          setFormData((prev) => ({ ...prev, [name]: value }))
        }
      }
    } else {
      // Para otros campos, actualizar normalmente
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const resetForm = () => {
    setFormData(initialForm)
    setErrors({ ph: null, pureza: null, humedad: null })
    setFeedback({ type: null, message: "" })
  }

  const validateForm = () => {
    const newErrors = {
      ph: validatePH(formData.ph).error,
      pureza: validatePercentage(formData.pureza, "La pureza").error,
      humedad: validatePercentage(formData.humedad, "La humedad").error,
    }
    setErrors(newErrors)
    return !newErrors.ph && !newErrors.pureza && !newErrors.humedad
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
      const phValue = Number(formData.ph)
      const purezaValue = Number(formData.pureza)
      const humedadValue = Number(formData.humedad)

      // Validación final antes de guardar
      if (phValue < 0 || phValue > 14) {
        throw new Error("El pH debe estar entre 0 y 14")
      }
      if (purezaValue < 1 || purezaValue > 100) {
        throw new Error("La pureza debe estar entre 1 y 100")
      }
      if (humedadValue < 1 || humedadValue > 100) {
        throw new Error("La humedad debe estar entre 1 y 100")
      }

      await addDoc(collection(db, "soil_analyses"), {
        zona: formData.zona,
        fecha: formData.fecha,
        analista: formData.analista,
        resultado_ph: phValue,
        pureza: purezaValue,
        humedad: humedadValue,
        zona_apta: formData.apta === "si",
        observaciones: formData.observaciones,
        created_at: serverTimestamp(),
      })

      setFeedback({ type: "success", message: "Análisis registrado correctamente." })
      resetForm()
      setErrors({ ph: null, pureza: null, humedad: null })
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
        <h1 className="dashboard-form__title">Análisis de suelos</h1>
        <p className="dashboard-form__subtitle">Ingresa los parámetros del análisis para registrar la campaña.</p>
      </div>

      <div className="dashboard-form__card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="zona" className="dashboard-form__label">
                Zona
              </label>
              <Input
                id="zona"
                name="zona"
                placeholder="Ej: Zona norte - sector A"
                value={formData.zona}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
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
              <label htmlFor="analista" className="dashboard-form__label">
                Analista responsable
              </label>
              <Input
                id="analista"
                name="analista"
                placeholder="Ej: Juan López"
                value={formData.analista}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
            <div>
              <label htmlFor="apta" className="dashboard-form__label">
                ¿Zona apta?
              </label>
              <select
                id="apta"
                name="apta"
                value={formData.apta}
                onChange={handleChange}
                className="dashboard-form__input"
              >
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="ph" className="dashboard-form__label">
                Resultado de pH <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              <Input
                id="ph"
                name="ph"
                type="number"
                step="0.1"
                min="0"
                max="14"
                placeholder="Ej: 7.5 (0-14)"
                value={formData.ph}
                onChange={handleChange}
                required
                className={`dashboard-form__input ${errors.ph ? "dashboard-form__input--error" : ""}`}
                style={errors.ph ? { borderColor: "#f25c4a" } : {}}
              />
              {errors.ph && (
                <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.ph}</p>
              )}
              {!errors.ph && formData.ph && (
                <p style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)", marginTop: "0.25rem" }}>
                  Valor válido (0-14)
                </p>
              )}
            </div>
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
                placeholder="Ej: 85.5 (1-100)"
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
          </div>

          <div className="dashboard-form__grid">
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
                placeholder="Ej: 6.5 (1-100)"
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
              placeholder="Añade notas relevantes del análisis..."
              value={formData.observaciones}
              onChange={handleChange}
              className="dashboard-form__input"
              rows={3}
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

