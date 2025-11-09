
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/Card"
import { Input } from "../../../../../components/ui/Input"
import { Label } from "../../../../../components/ui/Label"
import { Button } from "../../../../../components/ui/Button"
export default function PlantaForm() {
  const [formData, setFormData] = useState({
    zona: "",
    material: "oro",
    idExtraccion: "",
    fecha: "",
    cantidad: "",
    turno: "turno1",
    lote: "",
    observaciones: "",
    tieneAveria: "no",
    maquina: "",
    tipoFalla: "",
    duracionFalla: "",
    estadoFalla: "abierta",
    responsableFalla: "",
    descripcionFalla: "",
  })

  const [consumoInsumos, setConsumoInsumos] = useState([])
  const [nuevoConsumo, setNuevoConsumo] = useState({
    nombreInsumo: "",
    cantidadUsada: "",
    proceso: "",
    fecha: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("[v0] Datos de planta:", formData)
    setFormData({
      zona: "",
      material: "oro",
      idExtraccion: "",
      fecha: "",
      cantidad: "",
      turno: "turno1",
      lote: "",
      observaciones: "",
      tieneAveria: "no",
      maquina: "",
      tipoFalla: "",
      duracionFalla: "",
      estadoFalla: "abierta",
      responsableFalla: "",
      descripcionFalla: "",
    })
  }

  const handleAddConsumo = (e) => {
    e.preventDefault()
    if (nuevoConsumo.nombreInsumo && nuevoConsumo.cantidadUsada && nuevoConsumo.proceso && nuevoConsumo.fecha) {
      setConsumoInsumos([...consumoInsumos, nuevoConsumo])
      setNuevoConsumo({ nombreInsumo: "", cantidadUsada: "", proceso: "", fecha: "" })
    }
  }

  const handleConsumoChange = (e) => {
    const { name, value } = e.target
    setNuevoConsumo((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <main className="flex-1 overflow-auto p-8 bg-background">
      <Card className="border-border max-w-4xl">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl">Ingreso de Datos - Planta de Procesamiento</CardTitle>
          <CardDescription className="text-primary-foreground/70">
            Registra datos de material procesado, fallas y consumo de insumos
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zona">Zona</Label>
                <Input
                  id="zona"
                  name="zona"
                  placeholder="Ej: Zona norte - sector A"
                  value={formData.zona}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <select
                  id="material"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="oro">Oro</option>
                  <option value="cobre">Cobre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idExtraccion">ID de Extracción</Label>
                <Input
                  id="idExtraccion"
                  name="idExtraccion"
                  placeholder="Ej: EXT-2024-001"
                  value={formData.idExtraccion}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad (KG)</Label>
                <Input
                  id="cantidad"
                  name="cantidad"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 150.5"
                  value={formData.cantidad}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="turno">Turno</Label>
                <select
                  id="turno"
                  name="turno"
                  value={formData.turno}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="turno1">Turno 1</option>
                  <option value="turno2">Turno 2</option>
                  <option value="turno3">Turno 3</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lote">Número de Lote</Label>
              <Input
                id="lote"
                name="lote"
                placeholder="Ej: LOTE-001"
                value={formData.lote}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                name="observaciones"
                placeholder="Observaciones adicionales..."
                value={formData.observaciones}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                rows="3"
              />
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Registro de Fallas en Máquina</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="tieneAveria">¿Presentó avería?</Label>
                  <select
                    id="tieneAveria"
                    name="tieneAveria"
                    value={formData.tieneAveria}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="no">No</option>
                    <option value="si">Sí</option>
                  </select>
                </div>
              </div>

              {formData.tieneAveria === "si" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maquina">Máquina Afectada</Label>
                      <Input
                        id="maquina"
                        name="maquina"
                        placeholder="Ej: Molino #2"
                        value={formData.maquina}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipoFalla">Tipo de Falla</Label>
                      <select
                        id="tipoFalla"
                        name="tipoFalla"
                        value={formData.tipoFalla}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Mecánica">Mecánica</option>
                        <option value="Eléctrica">Eléctrica</option>
                        <option value="Proceso">Proceso</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="duracionFalla">Duración (horas)</Label>
                      <Input
                        id="duracionFalla"
                        name="duracionFalla"
                        type="number"
                        step="0.1"
                        placeholder="Ej: 2.5"
                        value={formData.duracionFalla}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estadoFalla">Estado</Label>
                      <select
                        id="estadoFalla"
                        name="estadoFalla"
                        value={formData.estadoFalla}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="Abierta">Abierta</option>
                        <option value="Cerrada">Cerrada</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="responsableFalla">Responsable</Label>
                    <Input
                      id="responsableFalla"
                      name="responsableFalla"
                      placeholder="Nombre del técnico"
                      value={formData.responsableFalla}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="descripcionFalla">Descripción de Falla</Label>
                    <textarea
                      id="descripcionFalla"
                      name="descripcionFalla"
                      placeholder="Detalla la falla y acciones tomadas..."
                      value={formData.descripcionFalla}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      rows="3"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Registro de Consumo de Insumos</h3>

              <form onSubmit={handleAddConsumo} className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreInsumo">Nombre de Insumo</Label>
                    <select
                      id="nombreInsumo"
                      name="nombreInsumo"
                      value={nuevoConsumo.nombreInsumo}
                      onChange={handleConsumoChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Agua">Agua</option>
                      <option value="Depresores">Depresores</option>
                      <option value="Reguladores de PH">Reguladores de PH</option>
                      <option value="Activadores">Activadores</option>
                      <option value="Espumantes">Espumantes</option>
                      <option value="Colectores">Colectores</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cantidadUsada">Cantidad Usada (L)</Label>
                    <Input
                      id="cantidadUsada"
                      name="cantidadUsada"
                      type="number"
                      step="0.1"
                      placeholder="Ej: 100"
                      value={nuevoConsumo.cantidadUsada}
                      onChange={handleConsumoChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proceso">Proceso en el que se usó</Label>
                    <select
                      id="proceso"
                      name="proceso"
                      value={nuevoConsumo.proceso}
                      onChange={handleConsumoChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Flotación">Flotación</option>
                      <option value="Concentración">Concentración</option>
                      <option value="Espesamiento">Espesamiento</option>
                      <option value="Secado">Secado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                      id="fecha"
                      name="fecha"
                      type="date"
                      value={nuevoConsumo.fecha}
                      onChange={handleConsumoChange}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Registrar Consumo
                </Button>
              </form>

              {consumoInsumos.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent text-accent-foreground">
                        <th className="px-4 py-2 text-left font-semibold">Insumo</th>
                        <th className="px-4 py-2 text-left font-semibold">Cantidad (L)</th>
                        <th className="px-4 py-2 text-left font-semibold">Proceso</th>
                        <th className="px-4 py-2 text-left font-semibold">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumoInsumos.map((consumo, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-muted/50" : "bg-background"}>
                          <td className="px-4 py-2">{consumo.nombreInsumo}</td>
                          <td className="px-4 py-2">{consumo.cantidadUsada}</td>
                          <td className="px-4 py-2">{consumo.proceso}</td>
                          <td className="px-4 py-2">{consumo.fecha}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Guardar Datos
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData({
                    zona: "",
                    material: "oro",
                    idExtraccion: "",
                    fecha: "",
                    cantidad: "",
                    turno: "turno1",
                    lote: "",
                    observaciones: "",
                    tieneAveria: "no",
                    maquina: "",
                    tipoFalla: "",
                    duracionFalla: "",
                    estadoFalla: "abierta",
                    responsableFalla: "",
                    descripcionFalla: "",
                  })
                }
              >
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
