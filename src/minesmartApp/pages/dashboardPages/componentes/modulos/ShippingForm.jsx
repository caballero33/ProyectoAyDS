import { useState } from "react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { CheckCircle2, XCircle } from "lucide-react"
import { db } from "../../../../../lib/firebase"
import { createNotification, generateNotificationSummary } from "../../../../../lib/notifications"

// Funciones de validación
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

const initialForm = {
  fecha: "",
  lote: "",
  producto: "Concentrado de Oro",
  cantidad: "",
  pureza: "",
  clienteDestino: "",
  transportista: "",
  observaciones: "",
}

export default function ShippingForm() {
  const [formData, setFormData] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: null, message: "" })
  const [errors, setErrors] = useState({
    cantidad: null,
    pureza: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    // Validación en tiempo real
    if (name === "cantidad") {
      // Permitir solo números y punto decimal
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        const validation = validateQuantity(value)
        setErrors((prev) => ({ ...prev, cantidad: validation.error }))
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else if (name === "pureza") {
      // Permitir solo números y punto decimal
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        const validation = validatePercentage(value, "La pureza")
        setErrors((prev) => ({ ...prev, pureza: validation.error }))
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else {
      // Para otros campos, actualizar normalmente
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const resetForm = () => {
    setFormData(initialForm)
    setErrors({ cantidad: null, pureza: null })
    setFeedback({ type: null, message: "" })
  }

  const validateForm = () => {
    const newErrors = {
      cantidad: validateQuantity(formData.cantidad).error,
      pureza: validatePercentage(formData.pureza, "La pureza").error,
    }
    setErrors(newErrors)
    return !newErrors.cantidad && !newErrors.pureza
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
      const cantidadValue = Number(formData.cantidad)
      const purezaValue = Number(formData.pureza)

      // Validación final antes de guardar
      if (cantidadValue < 0) {
        throw new Error("La cantidad no puede ser negativa")
      }
      if (purezaValue < 1 || purezaValue > 100) {
        throw new Error("La pureza debe estar entre 1 y 100")
      }

      await addDoc(collection(db, "shipping_records"), {
        fecha: formData.fecha,
        lote: formData.lote,
        producto: formData.producto,
        cantidad_kg: cantidadValue,
        pureza_final: purezaValue,
        cliente_destino: formData.clienteDestino,
        transportista: formData.transportista,
        observaciones: formData.observaciones,
        created_at: serverTimestamp(),
      })

      // Crear notificación
      const summary = generateNotificationSummary("shipping", {
        lote: formData.lote,
        cliente: formData.clienteDestino,
        cantidad: cantidadValue,
      })
      await createNotification("shipping", summary, {
        lote: formData.lote,
        cliente: formData.clienteDestino,
        cantidad: cantidadValue,
        pureza: purezaValue,
        transportista: formData.transportista,
      })

      setFeedback({ type: "success", message: "Enviado con éxito" })
      setErrors({ cantidad: null, pureza: null })
      
      // Limpiar formulario sin resetear el feedback
      setFormData(initialForm)
      
      // Limpiar el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setFeedback({ type: null, message: "" })
      }, 5000)
    } catch (err) {
      console.error(err)
      setFeedback({
        type: "error",
        message: err.message || "No se pudo guardar el despacho. Intenta nuevamente.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="dashboard-form">
      <div className="dashboard-form__header">
        <p className="dashboard-form__eyebrow">Ingreso de datos</p>
        <h1 className="dashboard-form__title">Despacho</h1>
        <p className="dashboard-form__subtitle">Registra los lotes listos para la venta y su trazabilidad logística.</p>
      </div>

      <div className="dashboard-form__card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="fecha" className="dashboard-form__label">
                Fecha de despacho
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
            <div>
              <label htmlFor="lote" className="dashboard-form__label">
                Número de lote
              </label>
              <Input
                id="lote"
                name="lote"
                placeholder="Ej: LOTE-001"
                value={formData.lote}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="producto" className="dashboard-form__label">
                Producto
              </label>
              <select
                id="producto"
                name="producto"
                value={formData.producto}
                onChange={handleChange}
                className="dashboard-form__input"
                required
              >
                <option value="Concentrado de Oro">Concentrado de Oro</option>
                <option value="Concentrado de Cobre">Concentrado de Cobre</option>
              </select>
            </div>
            <div>
              <label htmlFor="cantidad" className="dashboard-form__label">
                Cantidad (kg) <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                step="0.1"
                min="0"
                placeholder="Ej: 150.5"
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
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="pureza" className="dashboard-form__label">
                Pureza final (%) <span style={{ color: "#f25c4a" }}>*</span>
              </label>
              <Input
                id="pureza"
                name="pureza"
                type="number"
                step="0.01"
                min="1"
                max="100"
                placeholder="Ej: 96.44 (1-100)"
                value={formData.pureza}
                onChange={handleChange}
                required
                className={`dashboard-form__input ${errors.pureza ? "dashboard-form__input--error" : ""}`}
                style={errors.pureza ? { borderColor: "#f25c4a" } : {}}
              />
              {errors.pureza && (
                <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.pureza}</p>
              )}
              {!errors.pureza && formData.pureza && validatePercentage(formData.pureza, "La pureza").valid && (
                <p style={{ fontSize: "0.75rem", color: "rgba(34, 197, 94, 0.8)", marginTop: "0.25rem" }}>
                  ✓ Valor válido (1-100%)
                </p>
              )}
            </div>
            <div>
              <label htmlFor="clienteDestino" className="dashboard-form__label">
                Cliente / destino
              </label>
              <Input
                id="clienteDestino"
                name="clienteDestino"
                placeholder="Ej: Empresa ABC S.A."
                value={formData.clienteDestino}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="transportista" className="dashboard-form__label">
                Transportista
              </label>
              <Input
                id="transportista"
                name="transportista"
                placeholder="Ej: Transporte XYZ"
                value={formData.transportista}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
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
