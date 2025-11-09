import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/Card"
import { Input } from "../../../../../components/ui/Input"
import { Label } from "../../../../../components/ui/Label"
import { Button } from "../../../../../components/ui/Button"
export default function LabForm() {
  const [formData, setFormData] = useState({
    zona: "",
    idExtraccion: "",
    material: "oro",
    fechaEnvio: "",
    resultado: "",
    pureza: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("[v0] Datos de laboratorio:", formData)
    setFormData({ zona: "", idExtraccion: "", material: "oro", fechaEnvio: "", resultado: "", pureza: "" })
  }

  return (
    <main className="flex-1 overflow-auto p-8 bg-background">
      <Card className="border-border max-w-2xl">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl">Ingreso de Datos - Laboratorio</CardTitle>
          <CardDescription className="text-primary-foreground/70">
            Registra análisis de laboratorio de muestras
          </CardDescription>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="fechaEnvio">Fecha de Envío</Label>
                <Input
                  id="fechaEnvio"
                  name="fechaEnvio"
                  type="date"
                  value={formData.fechaEnvio}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resultado">Resultado</Label>
                <Input
                  id="resultado"
                  name="resultado"
                  placeholder="Ej: Apto, No apto, Requiere análisis"
                  value={formData.resultado}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pureza">Porcentaje de Pureza (%)</Label>
                <Input
                  id="pureza"
                  name="pureza"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 95.5"
                  value={formData.pureza}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Guardar Análisis
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData({
                    zona: "",
                    idExtraccion: "",
                    material: "oro",
                    fechaEnvio: "",
                    resultado: "",
                    pureza: "",
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
