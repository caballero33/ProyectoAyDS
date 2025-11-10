import { useState } from "react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { db } from "../../../../../lib/firebase"

const initialForm = {
  zona: "",
  idExtraccion: "",
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
      await addDoc(collection(db, "lab_analyses"), {
        zona: formData.zona,
        extraction_id: formData.idExtraccion,
        operador: formData.operador,
        material: formData.material,
        fecha_envio: formData.fechaEnvio,
        resultado: formData.resultado,
        pureza: Number(formData.pureza),
        humedad: Number(formData.humedad),
        observaciones: formData.observaciones,
        created_at: serverTimestamp(),
      })

      setFeedback({ type: "success", message: "Análisis de laboratorio registrado correctamente." })
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
              <label htmlFor="idExtraccion" className="dashboard-form__label">
                ID de extracción
              </label>
              <Input
                id="idExtraccion"
                name="idExtraccion"
                placeholder="Ej: EXT-2024-001"
                value={formData.idExtraccion}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
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
                Pureza (%)
              </label>
              <Input
                id="pureza"
                name="pureza"
                type="number"
                step="0.1"
                placeholder="Ej: 95.5"
                value={formData.pureza}
                onChange={handleChange}
                required
                className="dashboard-form__input"
              />
            </div>
            <div>
              <label htmlFor="humedad" className="dashboard-form__label">
                Humedad (%)
              </label>
              <Input
                id="humedad"
                name="humedad"
                type="number"
                step="0.1"
                placeholder="Ej: 6.4"
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
