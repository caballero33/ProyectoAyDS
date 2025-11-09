import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/Card"
import { Input } from "../../../../../components/ui/Input"
import { Label } from "../../../../../components/ui/Label"
import { Button } from "../../../../../components/ui/Button"

export default function ExtraccionForm() {
  const [formData, setFormData] = useState({
    zona: "",
    material: "oro",
    lote: "",
    fecha: "",
    cantidad: "",
    condicion: "",
    observaciones: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("[v0] Datos de extracción:", formData)
    setFormData({ zona: "", material: "oro", lote: "", fecha: "", cantidad: "", condicion: "", observaciones: "" })
  }

  return (
    <main className="flex-1 overflow-auto p-8 bg-background">
      <Card className="border-border max-w-2xl">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl">Ingreso de Datos - Extracción</CardTitle>
          <CardDescription className="text-primary-foreground/70">Registra los datos de extracción</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="lote">Número de Lote</Label>
                <Input
                  id="lote"
                  name="lote"
                  placeholder="Ej: O-123"
                  value={formData.lote}
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
                <Label htmlFor="condicion">Condición</Label>
                <Input
                  id="condicion"
                  name="condicion"
                  placeholder="Ej: Óptima, Buena, Regular"
                  value={formData.condicion}
                  onChange={handleChange}
                  required
                />
              </div>
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
                rows="4"
              />
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
                    lote: "",
                    fecha: "",
                    cantidad: "",
                    condicion: "",
                    observaciones: "",
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
