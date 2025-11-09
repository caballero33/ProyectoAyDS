import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/Card"
import { Input } from "../../../../../components/ui/Input"
import { Label } from "../../../../../components/ui/Label"
import { Button } from "../../../../../components/ui/Button"

export default function ShippingForm() {
  const [formData, setFormData] = useState({
    fecha: "",
    lote: "",
    producto: "Concentrado de Oro",
    cantidad: "",
    pureza: "",
    clienteDestino: "",
    transportista: "",
    observaciones: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("[v0] Datos de despacho:", formData)
    setFormData({
      fecha: "",
      lote: "",
      producto: "Concentrado de Oro",
      cantidad: "",
      pureza: "",
      clienteDestino: "",
      transportista: "",
      observaciones: "",
    })
  }

  return (
    <main className="flex-1 overflow-auto p-8 bg-background">
      <Card className="border-border max-w-2xl">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl">Ingreso de Datos - Despacho</CardTitle>
          <CardDescription className="text-primary-foreground/70">
            Registra material despachado e inventario
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha de Despacho</Label>
                <Input id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="producto">Producto</Label>
                <select
                  id="producto"
                  name="producto"
                  value={formData.producto}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  required
                >
                  <option value="Concentrado de Oro">Concentrado de Oro</option>
                  <option value="Concentrado de Cobre">Concentrado de Cobre</option>
                </select>
              </div>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pureza">Pureza Final (%)</Label>
                <Input
                  id="pureza"
                  name="pureza"
                  type="number"
                  step="0.01"
                  placeholder="Ej: 96.44"
                  value={formData.pureza}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clienteDestino">Cliente/Destino</Label>
                <Input
                  id="clienteDestino"
                  name="clienteDestino"
                  placeholder="Ej: Empresa ABC S.A."
                  value={formData.clienteDestino}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportista">Transportista</Label>
              <Input
                id="transportista"
                name="transportista"
                placeholder="Ej: Transporte XYZ"
                value={formData.transportista}
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
                    fecha: "",
                    lote: "",
                    producto: "Concentrado de Oro",
                    cantidad: "",
                    pureza: "",
                    clienteDestino: "",
                    transportista: "",
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
