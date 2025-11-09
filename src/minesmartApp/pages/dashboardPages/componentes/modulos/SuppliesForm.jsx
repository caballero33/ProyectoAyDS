import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/Card"
import { Input } from "../../../../../components/ui/Input"
import { Label } from "../../../../../components/ui/Label"
import { Button } from "../../../../../components/ui/Button"

export default function SuppliesInventory() {
  const [inventory, setInventory] = useState([
    { codigo: "I-001", nombre: "Agua", cantidadActual: 5000, cantidadMinima: 1000 },
    { codigo: "I-002", nombre: "Depresores", cantidadActual: 2500, cantidadMinima: 500 },
    { codigo: "I-003", nombre: "Reguladores de PH", cantidadActual: 1200, cantidadMinima: 300 },
    { codigo: "I-004", nombre: "Activadores", cantidadActual: 800, cantidadMinima: 200 },
    { codigo: "I-005", nombre: "Espumantes", cantidadActual: 600, cantidadMinima: 150 },
    { codigo: "I-006", nombre: "Colectores", cantidadActual: 900, cantidadMinima: 250 },
  ])

  const [newSupply, setNewSupply] = useState({
    codigo: "",
    nombre: "",
    cantidadActual: "",
    cantidadMinima: "",
  })

  const handleAddSupply = (e) => {
    e.preventDefault()
    if (newSupply.codigo && newSupply.nombre && newSupply.cantidadActual && newSupply.cantidadMinima) {
      setInventory([...inventory, newSupply])
      setNewSupply({ codigo: "", nombre: "", cantidadActual: "", cantidadMinima: "" })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewSupply((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <main className="flex-1 overflow-auto p-8 bg-background">
      <div className="max-w-6xl space-y-6">
        <Card className="border-border">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-2xl">Inventario de Insumos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-accent text-accent-foreground">
                    <th className="px-4 py-2 text-left font-semibold">Código</th>
                    <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                    <th className="px-4 py-2 text-left font-semibold">Cantidad Actual</th>
                    <th className="px-4 py-2 text-left font-semibold">Cantidad Mínima</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-muted/50" : "bg-background"}>
                      <td className="px-4 py-2">{item.codigo}</td>
                      <td className="px-4 py-2">{item.nombre}</td>
                      <td className="px-4 py-2">{item.cantidadActual}</td>
                      <td className="px-4 py-2">{item.cantidadMinima}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-lg">Agregar Nuevo Insumo</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddSupply} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  placeholder="Ej: I-007"
                  value={newSupply.codigo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Insumo</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Ej: Agua"
                  value={newSupply.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidadActual">Cantidad Actual</Label>
                <Input
                  id="cantidadActual"
                  name="cantidadActual"
                  type="number"
                  placeholder="Ej: 1000"
                  value={newSupply.cantidadActual}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidadMinima">Cantidad Mínima</Label>
                <Input
                  id="cantidadMinima"
                  name="cantidadMinima"
                  type="number"
                  placeholder="Ej: 200"
                  value={newSupply.cantidadMinima}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground md:col-span-2">
                Agregar Insumo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
