import { useState } from "react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { db } from "../../../../../lib/firebase"

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData(initialForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFeedback({ type: null, message: "" })

    try {
      await addDoc(collection(db, "shipping_records"), {
        fecha: formData.fecha,
        lote: formData.lote,
        producto: formData.producto,
        cantidad_kg: Number(formData.cantidad),
        pureza_final: Number(formData.pureza),
        cliente_destino: formData.clienteDestino,
        transportista: formData.transportista,
        observaciones: formData.observaciones,
        created_at: serverTimestamp(),
      })

      setFeedback({ type: "success", message: "Registro de despacho guardado correctamente." })
      resetForm()
    } catch (err) {
      console.error(err)
      setFeedback({ type: "error", message: "No se pudo guardar el despacho. Intenta nuevamente." })
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
                Cantidad (kg)
              </label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                step="0.1"
                placeholder="Ej: 150.5"
                value={formData.cantidad}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="pureza" className="dashboard-form__label">
                Pureza final (%)
              </label>
              <Input
                id="pureza"
                name="pureza"
                type="number"
                step="0.01"
                placeholder="Ej: 96.44"
                value={formData.pureza}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
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
            <p className={`text-sm ${feedback.type === "error" ? "text-red-600" : "text-green-600"}`}>
              {feedback.message}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
