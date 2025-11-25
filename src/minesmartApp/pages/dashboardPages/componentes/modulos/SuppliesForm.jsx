import { useEffect, useMemo, useState } from "react"
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table"
import { ClipboardList, PlusCircle, RefreshCcw, CheckCircle2, XCircle } from "lucide-react"
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

const initialSupply = {
  codigo: "",
  nombre: "",
  cantidadActual: "",
  cantidadMinima: "",
}

export default function SuppliesInventory() {
  const [inventory, setInventory] = useState([])
  const [newSupply, setNewSupply] = useState(initialSupply)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({
    cantidadActual: null,
    cantidadMinima: null,
  })

  useEffect(() => {
    const fetchSupplies = async () => {
      setLoading(true)
      setError(null)
      try {
        const snapshot = await getDocs(query(collection(db, "supplies"), orderBy("codigo")))
        const items = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            codigo: data.codigo ?? "",
            nombre: data.nombre ?? "",
            cantidadActual: Number(data.cantidad_actual ?? data.cantidadActual ?? 0),
            cantidadMinima: Number(data.cantidad_minima ?? data.cantidadMinima ?? 0),
          }
        })
        setInventory(items)
      } catch (err) {
        console.error(err)
        setError("No se pudo obtener el inventario de insumos.")
      } finally {
        setLoading(false)
      }
    }

    fetchSupplies()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Validación en tiempo real
    if (name === "cantidadActual" || name === "cantidadMinima") {
      // Permitir solo números y punto decimal
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        const validation = validateQuantity(value)
        setErrors((prev) => ({ ...prev, [name]: validation.error }))
        setNewSupply((prev) => ({ ...prev, [name]: value }))
      }
    } else {
      // Para otros campos, actualizar normalmente
      setNewSupply((prev) => ({ ...prev, [name]: value }))
    }
  }

  const resetForm = () => {
    setNewSupply(initialSupply)
    setErrors({ cantidadActual: null, cantidadMinima: null })
    setError(null)
    setSuccess(null)
  }

  const validateForm = () => {
    const newErrors = {
      cantidadActual: validateQuantity(newSupply.cantidadActual).error,
      cantidadMinima: validateQuantity(newSupply.cantidadMinima).error,
    }
    setErrors(newErrors)
    return !newErrors.cantidadActual && !newErrors.cantidadMinima
  }

  const handleAddSupply = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validar campos requeridos
    if (!newSupply.codigo || !newSupply.nombre || !newSupply.cantidadActual || !newSupply.cantidadMinima) {
      setError("Por favor completa todos los campos requeridos.")
      return
    }

    // Validar todos los campos antes de enviar
    if (!validateForm()) {
      setError("Por favor corrige los errores en el formulario antes de enviar.")
      return
    }

    setSubmitting(true)

    try {
      const cantidadActualValue = Number(newSupply.cantidadActual)
      const cantidadMinimaValue = Number(newSupply.cantidadMinima)

      // Validación final antes de guardar
      if (cantidadActualValue < 0) {
        throw new Error("La cantidad actual no puede ser negativa")
      }
      if (cantidadMinimaValue < 0) {
        throw new Error("La cantidad mínima no puede ser negativa")
      }

      const payload = {
        codigo: newSupply.codigo,
        nombre: newSupply.nombre,
        cantidad_actual: cantidadActualValue,
        cantidad_minima: cantidadMinimaValue,
        created_at: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "supplies"), payload)
      setInventory((prev) => [
        ...prev,
        {
          id: docRef.id,
          codigo: payload.codigo,
          nombre: payload.nombre,
          cantidadActual: payload.cantidad_actual,
          cantidadMinima: payload.cantidad_minima,
        },
      ])

      // Crear notificación
      const summary = generateNotificationSummary("supplies", {
        nombre: payload.nombre,
        cantidad: payload.cantidad_actual,
      })
      await createNotification("supplies", summary, {
        nombre: payload.nombre,
        codigo: payload.codigo,
        cantidad: payload.cantidad_actual,
        cantidad_minima: payload.cantidad_minima,
      })

      setSuccess("Enviado con éxito")
      setError(null)
      setErrors({ cantidadActual: null, cantidadMinima: null })
      
      // Limpiar formulario sin resetear el feedback
      setNewSupply(initialSupply)
      
      // Limpiar el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccess(null)
      }, 5000)
    } catch (err) {
      console.error(err)
      setError(err.message || "No se pudo agregar el insumo. Intenta nuevamente.")
      setSuccess(null)
    } finally {
      setSubmitting(false)
    }
  }

  const totals = useMemo(() => {
    const totalActual = inventory.reduce((acc, item) => acc + Number(item.cantidadActual), 0)
    const totalMinimo = inventory.reduce((acc, item) => acc + Number(item.cantidadMinima), 0)
    const cobertura = totalMinimo === 0 ? 0 : Math.round((totalActual / totalMinimo) * 100)
    return { totalActual, totalMinimo, cobertura }
  }, [inventory])

  return (
    <div className="flex-1 overflow-auto">
      <section className="dashboard-report">
        <div className="dashboard-report__container">
          <header className="dashboard-report__header">
            <div className="dashboard-report__title-block">
              <h2 className="dashboard-report__title">Inventario de insumos</h2>
            </div>
            <span className="dashboard-report__badge inline-flex items-center gap-2">
              <ClipboardList size={18} />
              Bodega
            </span>
          </header>

          <div className="dashboard-report__metrics">
            <div className="dashboard-report__metric">
              <span className="dashboard-report__metric-label">Insumos activos</span>
              <span className="dashboard-report__metric-value">{inventory.length}</span>
              <span>Referencias registradas en Firestore</span>
            </div>
            <div className="dashboard-report__metric dashboard-report__metric--alt">
              <span className="dashboard-report__metric-label">Cobertura</span>
              <span className="dashboard-report__metric-value">{totals.cobertura}%</span>
              <span>Comparado con el stock mínimo</span>
            </div>
            <div className="dashboard-report__metric">
              <span className="dashboard-report__metric-label">Total actual</span>
              <span className="dashboard-report__metric-value">{totals.totalActual}</span>
              <span>Unidades disponibles</span>
            </div>
          </div>

          <div className="dashboard-report__table">
            {loading && <p className="text-sm text-muted-foreground">Cargando inventario…</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && inventory.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay insumos registrados todavía.</p>
            )}

            {!loading && !error && inventory.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cantidad actual</TableHead>
                    <TableHead>Cantidad mínima</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id ?? item.codigo}>
                      <TableCell>{item.codigo}</TableCell>
                      <TableCell>{item.nombre}</TableCell>
                      <TableCell>{item.cantidadActual}</TableCell>
                      <TableCell>{item.cantidadMinima}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <footer className="dashboard-report__footer">
            <div>
              Stock actual: {totals.totalActual} · Stock mínimo requerido: {totals.totalMinimo}
            </div>
            <div className="dashboard-report__actions">
              <Button variant="secondary" size="sm" className="inline-flex items-center gap-2" onClick={resetForm}>
                <RefreshCcw size={16} />
                Limpiar formulario
              </Button>
            </div>
          </footer>
        </div>
      </section>

      <section className="dashboard-form">
        <div className="dashboard-form__card">
          <form onSubmit={handleAddSupply} className="space-y-5">
            <div className="dashboard-form__grid">
              <div>
                <label htmlFor="codigo" className="dashboard-form__label">
                  Código
                </label>
                <Input
                  id="codigo"
                  name="codigo"
                  placeholder="Ej: I-007"
                  value={newSupply.codigo}
                  onChange={handleInputChange}
                  required
                  className="dashboard-form__input"
                />
              </div>
              <div>
                <label htmlFor="nombre" className="dashboard-form__label">
                  Nombre del insumo
                </label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Ej: Agua"
                  value={newSupply.nombre}
                  onChange={handleInputChange}
                  required
                  className="dashboard-form__input"
                />
              </div>
            </div>

            <div className="dashboard-form__grid">
              <div>
                <label htmlFor="cantidadActual" className="dashboard-form__label">
                  Cantidad actual <span style={{ color: "#f25c4a" }}>*</span>
                </label>
                <Input
                  id="cantidadActual"
                  name="cantidadActual"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej: 1000"
                  value={newSupply.cantidadActual}
                  onChange={handleInputChange}
                  required
                  className={`dashboard-form__input ${errors.cantidadActual ? "dashboard-form__input--error" : ""}`}
                  style={errors.cantidadActual ? { borderColor: "#f25c4a" } : {}}
                />
                {errors.cantidadActual && (
                  <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.cantidadActual}</p>
                )}
                {!errors.cantidadActual && newSupply.cantidadActual && validateQuantity(newSupply.cantidadActual).valid && (
                  <p style={{ fontSize: "0.75rem", color: "rgba(34, 197, 94, 0.8)", marginTop: "0.25rem" }}>
                    ✓ Cantidad válida
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="cantidadMinima" className="dashboard-form__label">
                  Cantidad mínima <span style={{ color: "#f25c4a" }}>*</span>
                </label>
                <Input
                  id="cantidadMinima"
                  name="cantidadMinima"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej: 200"
                  value={newSupply.cantidadMinima}
                  onChange={handleInputChange}
                  required
                  className={`dashboard-form__input ${errors.cantidadMinima ? "dashboard-form__input--error" : ""}`}
                  style={errors.cantidadMinima ? { borderColor: "#f25c4a" } : {}}
                />
                {errors.cantidadMinima && (
                  <p style={{ fontSize: "0.75rem", color: "#f25c4a", marginTop: "0.25rem" }}>{errors.cantidadMinima}</p>
                )}
                {!errors.cantidadMinima && newSupply.cantidadMinima && validateQuantity(newSupply.cantidadMinima).valid && (
                  <p style={{ fontSize: "0.75rem", color: "rgba(34, 197, 94, 0.8)", marginTop: "0.25rem" }}>
                    ✓ Cantidad válida
                  </p>
                )}
              </div>
            </div>

            <div className="dashboard-form__actions">
              <Button type="submit" variant="accent" disabled={submitting} className="inline-flex items-center gap-2">
                <PlusCircle size={18} />
                {submitting ? "Guardando..." : "Agregar insumo"}
              </Button>
            </div>

            {(success || error) && (
              <div
                className={`dashboard-form__feedback ${
                  success ? "dashboard-form__feedback--success" : "dashboard-form__feedback--error"
                }`}
                style={{ display: "flex" }}
              >
                <div className="dashboard-form__feedback-icon">
                  {success ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </div>
                <div className="dashboard-form__feedback-message">{success || error}</div>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  )
}
