import { useState } from "react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { db } from "../../../../../lib/firebase"

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
      const cantidadTon = Number(formData.cantidad)

      await addDoc(collection(db, "extraction_records"), {
        zona: formData.zona,
        material: formData.material,
        lote: formData.lote,
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
      setFeedback({ type: "error", message: "No se pudo guardar el registro. Intenta nuevamente." })
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
                Número de lote
              </label>
              <Input
                id="lote"
                name="lote"
                placeholder="Ej: O-123"
                value={formData.lote}
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
              <label htmlFor="cantidad" className="dashboard-form__label">
                Cantidad (t)
              </label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                step="0.1"
                placeholder="Ej: 7.3"
                value={formData.cantidad}
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
