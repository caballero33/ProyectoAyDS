import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/Card"
import { Input } from "../../../../../components/ui/Input"
import { Label } from "../../../../../components/ui/Label"
import { Button } from "../../../../../components/ui/Button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const mockData = [
  {
    id: "01",
    zona: "Zona norte - sector A",
    fecha: "13/06/2024",
    material: "Oro",
    lote: "LT-2024-001",
    cantidad: 150.5,
    condicion: "Óptima",
    observaciones: "Calidad premium",
  },
  {
    id: "02",
    zona: "Zona sur - sector A",
    fecha: "27/06/2024",
    material: "Cobre",
    lote: "LT-2024-002",
    cantidad: 200.0,
    condicion: "Buena",
    observaciones: "Requiere refinación",
  },
  {
    id: "03",
    zona: "Zona Oeste - sector C",
    fecha: "10/07/2024",
    material: "Oro",
    lote: "LT-2024-003",
    cantidad: 120.3,
    condicion: "Aceptable",
    observaciones: "Baja pureza",
  },
  {
    id: "04",
    zona: "Zona Oeste - sector B",
    fecha: "21/07/2024",
    material: "Cobre",
    lote: "LT-2024-004",
    cantidad: 180.7,
    condicion: "Óptima",
    observaciones: "Material excepcional",
  },
  {
    id: "05",
    zona: "Zona norte - sector C",
    fecha: "31/07/2024",
    material: "Oro",
    lote: "LT-2024-005",
    cantidad: 165.2,
    condicion: "Buena",
    observaciones: "Contenido férreo normal",
  },
  {
    id: "06",
    zona: "Zona Este - sector A",
    fecha: "04/08/2024",
    material: "Cobre",
    lote: "LT-2024-006",
    cantidad: 195.8,
    condicion: "Óptima",
    observaciones: "Procesamiento exitoso",
  },
  {
    id: "07",
    zona: "Zona Sur - sector B",
    fecha: "15/08/2024",
    material: "Oro",
    lote: "LT-2024-007",
    cantidad: 140.2,
    condicion: "Buena",
    observaciones: "Rendimiento normal",
  },
  {
    id: "08",
    zona: "Zona norte - sector B",
    fecha: "22/08/2024",
    material: "Cobre",
    lote: "LT-2024-008",
    cantidad: 210.5,
    condicion: "Óptima",
    observaciones: "Superior al promedio",
  },
  {
    id: "09",
    zona: "Zona Este - sector C",
    fecha: "28/08/2024",
    material: "Oro",
    lote: "LT-2024-009",
    cantidad: 175.3,
    condicion: "Buena",
    observaciones: "Pureza aceptable",
  },
  {
    id: "10",
    zona: "Zona Sur - sector C",
    fecha: "05/09/2024",
    material: "Cobre",
    lote: "LT-2024-010",
    cantidad: 220.1,
    condicion: "Óptima",
    observaciones: "Material premium",
  },
  {
    id: "11",
    zona: "Zona norte - sector A",
    fecha: "12/09/2024",
    material: "Oro",
    lote: "LT-2024-011",
    cantidad: 155.8,
    condicion: "Aceptable",
    observaciones: "Requiere análisis",
  },
  {
    id: "12",
    zona: "Zona Oeste - sector A",
    fecha: "18/09/2024",
    material: "Cobre",
    lote: "LT-2024-012",
    cantidad: 205.5,
    condicion: "Buena",
    observaciones: "Procesamiento normal",
  },
]

const ITEMS_PER_PAGE = 10

export default function ExtraccionReports() {
  const [filtroZona, setFiltroZona] = useState("")
  const [filtroFecha, setFiltroFecha] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredData = useMemo(() => {
    return mockData.filter((item) => {
      const zonaMatch = item.zona.toLowerCase().includes(filtroZona.toLowerCase())
      const fechaMatch = item.fecha.includes(filtroFecha)
      return zonaMatch && fechaMatch
    })
  }, [filtroZona, filtroFecha])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const clearFilters = () => {
    setFiltroZona("")
    setFiltroFecha("")
    setCurrentPage(1)
  }

  return (
    <main className="flex-1 overflow-auto p-8 bg-background">
      <Card className="border-border">
        <CardHeader className="bg-primary text-primary-foreground pb-4">
          <CardTitle className="text-2xl">Reportes de Extracción</CardTitle>
          <CardDescription className="text-primary-foreground/70">
            Reporte detallado de resultados de extracción
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted p-4 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="filtro-zona">Zona</Label>
                <Input
                  id="filtro-zona"
                  placeholder="Filtrar por zona..."
                  value={filtroZona}
                  onChange={(e) => {
                    setFiltroZona(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filtro-fecha">Fecha</Label>
                <Input
                  id="filtro-fecha"
                  placeholder="DD/MM/YYYY"
                  value={filtroFecha}
                  onChange={(e) => {
                    setFiltroFecha(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Acciones</Label>
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-accent hover:bg-accent">
                    <TableHead className="text-accent-foreground font-bold py-2 px-3">ID</TableHead>
                    <TableHead className="text-accent-foreground font-bold py-2 px-3">Zona</TableHead>
                    <TableHead className="text-accent-foreground font-bold py-2 px-3">Fecha</TableHead>
                    <TableHead className="text-accent-foreground font-bold py-2 px-3">Material</TableHead>
                    <TableHead className="text-accent-foreground font-bold py-2 px-3">Lote</TableHead>
                    <TableHead className="text-accent-foreground font-bold py-2 px-3">Cantidad (KG)</TableHead>
                    <TableHead className="text-accent-foreground font-bold py-2 px-3">Condición</TableHead>
                    <TableHead className="text-accent-foreground font-bold py-2 px-3">Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item, idx) => (
                    <TableRow key={item.id} className={`${idx % 2 === 0 ? "bg-muted/30" : ""} hover:bg-muted/50`}>
                      <TableCell className="font-medium text-foreground py-2 px-3 text-sm">{item.id}</TableCell>
                      <TableCell className="text-foreground py-2 px-3 text-sm">{item.zona}</TableCell>
                      <TableCell className="text-foreground py-2 px-3 text-sm">{item.fecha}</TableCell>
                      <TableCell className="py-2 px-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                            item.material === "Oro"
                              ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200"
                              : "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200"
                          }`}
                        >
                          {item.material}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground py-2 px-3 text-sm">{item.lote}</TableCell>
                      <TableCell className="text-foreground font-medium py-2 px-3 text-sm">{item.cantidad}</TableCell>
                      <TableCell className="py-2 px-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                            item.condicion === "Óptima"
                              ? "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200"
                              : item.condicion === "Buena"
                                ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200"
                                : "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200"
                          }`}
                        >
                          {item.condicion}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground text-xs py-2 px-3">{item.observaciones}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Mostrando {paginatedData.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} a{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} registros
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handlePreviousPage} disabled={currentPage === 1} size="sm" variant="outline">
                  <ChevronLeft size={18} />
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      size="sm"
                      variant={currentPage === page ? "default" : "outline"}
                      className={currentPage === page ? "bg-accent text-accent-foreground" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button onClick={handleNextPage} disabled={currentPage === totalPages} size="sm" variant="outline">
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Imprimir Reporte</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
