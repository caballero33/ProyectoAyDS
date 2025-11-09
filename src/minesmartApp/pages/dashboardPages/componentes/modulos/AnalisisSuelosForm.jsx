import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/Card"
import { Input } from "../../../../../components/ui/Input"
import { Label } from "../../../../../components/ui/Label"
import { Button } from "../../../../../components/ui/Button"

export default function AnalisisSuelosForm() {
  const [formData, setFormData] = useState({
    zona: "",
    fecha: "",
    ph: "",
    pureza: "",
    humedad: "",
    apta: "no",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("[v0] Datos de análisis de suelo:", formData)
    setFormData({ zona: "", fecha: "", ph: "", pureza: "", humedad: "", apta: "no" })
  }

  return (
    <main className="flex-1 overflow-auto p-8 bg-background">
      <Card className="border-border max-w-2xl">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl">Ingreso de Datos - Análisis de Suelos</CardTitle>
          <CardDescription className="text-primary-foreground/70">Ingresa los parámetros del análisis</CardDescription>
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
                <Label htmlFor="fecha">Fecha</Label>
                <Input id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ph">Resultado de pH</Label>
                <Input
                  id="ph"
                  name="ph"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 7.5"
                  value={formData.ph}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pureza">Pureza (%)</Label>
                <Input
                  id="pureza"
                  name="pureza"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 85.5"
                  value={formData.pureza}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="humedad">Humedad (%)</Label>
                <Input
                  id="humedad"
                  name="humedad"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 6.5"
                  value={formData.humedad}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apta">¿Zona Apta?</Label>
                <select
                  id="apta"
                  name="apta"
                  value={formData.apta}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Guardar Datos
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({ zona: "", fecha: "", ph: "", pureza: "", humedad: "", apta: "no" })}
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

