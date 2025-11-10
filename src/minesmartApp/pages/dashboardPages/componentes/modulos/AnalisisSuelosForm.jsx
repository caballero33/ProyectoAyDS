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

export default function AnalisisSuelosForm() {
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
      await addDoc(collection(db, "soil_analyses"), {
        zona: formData.zona,
        fecha: formData.fecha,
        analista: formData.analista,
        resultado_ph: Number(formData.ph),
        pureza: Number(formData.pureza),
        humedad: Number(formData.humedad),
        zona_apta: formData.apta === "si",
        observaciones: formData.observaciones,
        created_at: serverTimestamp(),
      })

      setFeedback({ type: "success", message: "Análisis registrado correctamente." })
      resetForm()
    } catch (err) {
      console.error(err)
      setFeedback({ type: "error", message: "No se pudo guardar el análisis. Intenta nuevamente." })
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
                Resultado de pH
              </label>
              <Input
                id="ph"
                name="ph"
                type="number"
                step="0.1"
                placeholder="Ej: 7.5"
                value={formData.ph}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
            <div>
              <label htmlFor="pureza" className="dashboard-form__label">
                Pureza (%)
              </label>
              <Input
                id="pureza"
                name="pureza"
                type="number"
                step="0.1"
                placeholder="Ej: 85.5"
                value={formData.pureza}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
          </div>

          <div className="dashboard-form__grid">
            <div>
              <label htmlFor="humedad" className="dashboard-form__label">
                Humedad (%)
              </label>
              <Input
                id="humedad"
                name="humedad"
                type="number"
                step="0.1"
                placeholder="Ej: 6.5"
                value={formData.humedad}
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

