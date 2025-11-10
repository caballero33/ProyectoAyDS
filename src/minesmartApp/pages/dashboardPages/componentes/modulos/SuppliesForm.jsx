import { useEffect, useMemo, useState } from "react"
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table"
import { ClipboardList, PlusCircle, RefreshCcw } from "lucide-react"
import { db } from "../../../../../lib/firebase"

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
  const [submitting, setSubmitting] = useState(false)

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
    setNewSupply((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setNewSupply(initialSupply)
  }

  const handleAddSupply = async (e) => {
    e.preventDefault()
    if (!newSupply.codigo || !newSupply.nombre || !newSupply.cantidadActual || !newSupply.cantidadMinima) return

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        codigo: newSupply.codigo,
        nombre: newSupply.nombre,
        cantidad_actual: Number(newSupply.cantidadActual),
        cantidad_minima: Number(newSupply.cantidadMinima),
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
      resetForm()
    } catch (err) {
      console.error(err)
      setError("No se pudo agregar el insumo. Intenta nuevamente.")
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
                  Cantidad actual
                </label>
                <Input
                  id="cantidadActual"
                  name="cantidadActual"
                  type="number"
                  placeholder="Ej: 1000"
                  value={newSupply.cantidadActual}
                  onChange={handleInputChange}
                  required
                  className="dashboard-form__input"
                />
              </div>
              <div>
                <label htmlFor="cantidadMinima" className="dashboard-form__label">
                  Cantidad mínima
                </label>
                <Input
                  id="cantidadMinima"
                  name="cantidadMinima"
                  type="number"
                  placeholder="Ej: 200"
                  value={newSupply.cantidadMinima}
                  onChange={handleInputChange}
                  required
                  className="dashboard-form__input"
                />
              </div>
            </div>

            <div className="dashboard-form__actions">
              <Button type="submit" variant="accent" disabled={submitting} className="inline-flex items-center gap-2">
                <PlusCircle size={18} />
                {submitting ? "Guardando..." : "Agregar insumo"}
              </Button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </section>
    </div>
  )
}
