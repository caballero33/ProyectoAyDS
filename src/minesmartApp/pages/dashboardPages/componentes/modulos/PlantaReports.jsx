import { useState, useMemo } from "react"
import { Input } from "../../../../../components/ui/Input"
import { Button } from "../../../../../components/ui/Button"
import { Printer } from "lucide-react"

const materialProcessData = [
  {
    id: 1,
    lote: "O-123",
    zona: "Zona norte - sector A",
    fecha: "2024-06-13",
    operador: "Juan López",
    cantidad: "7.3 t",
    tipoMaterial: "Oro",
    condicion: "Húmedo",
    observaciones: "Material de alta ley, con trazas de pirita.",
  },
  {
    id: 2,
    lote: "O-784",
    zona: "Zona sur - sector A",
    fecha: "2024-06-27",
    operador: "Juan López",
    cantidad: "5.8 t",
    tipoMaterial: "Oro",
    condicion: "Húmedo",
    observaciones: "Baja ley, requiere procesamiento adicional",
  },
  {
    id: 3,
    lote: "C-864",
    zona: "Zona Oeste - sector C",
    fecha: "2024-07-10",
    operador: "Luis Gómez",
    cantidad: "6.4 t",
    tipoMaterial: "Cobre",
    condicion: "Húmedo",
    observaciones: "Contaminación con arcilla, necesita lavado.",
  },
  {
    id: 4,
    lote: "C-684",
    zona: "Zona Oeste - sector B",
    fecha: "2024-07-21",
    operador: "Paola Machado",
    cantidad: "7.3 t",
    tipoMaterial: "Cobre",
    condicion: "Seco",
    observaciones: "Pureza alta, directamente a fundición.",
  },
  {
    id: 5,
    lote: "C-321",
    zona: "Zona Norte - sector C",
    fecha: "2024-07-31",
    operador: "Luis Gómez",
    cantidad: "7.4 t",
    tipoMaterial: "Cobre",
    condicion: "Húmedo",
    observaciones: "Presencia de sales, almacenar en zona controlada.",
  },
  {
    id: 6,
    lote: "O-345",
    zona: "Zona Este - sector A",
    fecha: "2024-08-04",
    operador: "Juan López",
    cantidad: "7.2 t",
    tipoMaterial: "Oro",
    condicion: "Crudo",
    observaciones: "Granulometría inconsistente",
  },
  {
    id: 7,
    lote: "O-954",
    zona: "Zona norte - sector B",
    fecha: "2024-08-15",
    operador: "Paola Machado",
    cantidad: "7.5 t",
    tipoMaterial: "Oro",
    condicion: "Seco",
    observaciones: "Alto contenido de azufre, evaluar impacto ambiental.",
  },
  {
    id: 8,
    lote: "O-653",
    zona: "Zona Sur - sector C",
    fecha: "2024-09-01",
    operador: "Juan López",
    cantidad: "5.7 t",
    tipoMaterial: "Oro",
    condicion: "Crudo",
    observaciones: "Se recomienda tratamiento para alcalinidad",
  },
  {
    id: 9,
    lote: "C-319",
    zona: "Zona Este - sector A",
    fecha: "2024-09-17",
    operador: "Juan López",
    cantidad: "7.2 t",
    tipoMaterial: "Cobre",
    condicion: "Seco",
    observaciones: "Tamaño de partícula óptimo para transporte.",
  },
  {
    id: 10,
    lote: "C-397",
    zona: "Zona Oeste - sector C",
    fecha: "2024-09-27",
    operador: "Luis Gómez",
    cantidad: "7.3 t",
    tipoMaterial: "Cobre",
    condicion: "Húmedo",
    observaciones: "Manipulación con equipo de protección especial.",
  },
  {
    id: 11,
    lote: "O-128",
    zona: "Zona norte - sector A",
    fecha: "2024-10-05",
    operador: "Patricia López",
    cantidad: "6.9 t",
    tipoMaterial: "Oro",
    condicion: "Seco",
    observaciones: "Calidad óptima para procesamiento inmediato",
  },
  {
    id: 12,
    lote: "C-442",
    zona: "Zona sur - sector B",
    fecha: "2024-10-12",
    operador: "Ana Martínez",
    cantidad: "8.1 t",
    tipoMaterial: "Cobre",
    condicion: "Húmedo",
    observaciones: "Requiere almacenamiento con drenaje adecuado",
  },
  {
    id: 13,
    lote: "O-256",
    zona: "Zona este - sector C",
    fecha: "2024-10-18",
    operador: "Roberto Sánchez",
    cantidad: "6.5 t",
    tipoMaterial: "Oro",
    condicion: "Crudo",
    observaciones: "Contenido mineral dentro de especificaciones",
  },
  {
    id: 14,
    lote: "C-531",
    zona: "Zona oeste - sector A",
    fecha: "2024-10-24",
    operador: "Francisca Ruiz",
    cantidad: "7.8 t",
    tipoMaterial: "Cobre",
    condicion: "Seco",
    observaciones: "Listo para etapa final de procesamiento",
  },
  {
    id: 15,
    lote: "O-667",
    zona: "Zona norte - sector B",
    fecha: "2024-10-28",
    operador: "Luis González",
    cantidad: "7.1 t",
    tipoMaterial: "Oro",
    condicion: "Húmedo",
    observaciones: "Necesita control de humedad antes de transporte",
  },
]

const sampleAnalysisData = [
  {
    id: 1,
    idNum: "01",
    zona: "Zona norte - sector A",
    fecha: "2024-06-13",
    operador: "Juan López",
    loteExtraccion: "O-123",
    tipoMaterial: "Oro",
    humedad: "6.44%",
    resultado: "Aprobado",
    observaciones: "Muestra con alto contenido de arcilla.",
  },
  {
    id: 2,
    idNum: "02",
    zona: "Zona sur - sector A",
    fecha: "2024-06-27",
    operador: "Juan López",
    loteExtraccion: "O-784",
    tipoMaterial: "Oro",
    humedad: "7.23%",
    resultado: "Aprobado",
    observaciones: "Baja ley, requiere procesamiento adicional",
  },
  {
    id: 3,
    idNum: "03",
    zona: "Zona Oeste - sector C",
    fecha: "2024-07-10",
    operador: "Luis Gómez",
    loteExtraccion: "C-864",
    tipoMaterial: "Cobre",
    humedad: "8.63%",
    resultado: "Rechazado",
    observaciones: "Material friable y muy húmedo.",
  },
  {
    id: 4,
    idNum: "04",
    zona: "Zona Oeste - sector B",
    fecha: "2024-07-21",
    operador: "Paola Machado",
    loteExtraccion: "C-684",
    tipoMaterial: "Cobre",
    humedad: "6.44%",
    resultado: "Rechazado",
    observaciones: "Muestra con alto contenido de arcilla",
  },
  {
    id: 5,
    idNum: "05",
    zona: "Zona Norte - sector C",
    fecha: "2024-07-31",
    operador: "Luis Gómez",
    loteExtraccion: "C-321",
    tipoMaterial: "Cobre",
    humedad: "4.44%",
    resultado: "Rechazado",
    observaciones: "Muestra ligeramente húmeda.",
  },
  {
    id: 6,
    idNum: "06",
    zona: "Zona Este - sector A",
    fecha: "2024-08-04",
    operador: "Juan López",
    loteExtraccion: "O-345",
    tipoMaterial: "Oro",
    humedad: "9.32%",
    resultado: "Aprobado",
    observaciones: "Material friable y muy húmedo.",
  },
  {
    id: 7,
    idNum: "07",
    zona: "Zona norte - sector B",
    fecha: "2024-08-15",
    operador: "Paola Machado",
    loteExtraccion: "O-954",
    tipoMaterial: "Oro",
    humedad: "4.32%",
    resultado: "Aprobado",
    observaciones: "Muestra ligeramente húmeda.",
  },
  {
    id: 8,
    idNum: "08",
    zona: "Zona Sur - sector C",
    fecha: "2024-09-01",
    operador: "Juan López",
    loteExtraccion: "O-653",
    tipoMaterial: "Oro",
    humedad: "5.52%",
    resultado: "Aprobado",
    observaciones: "Se recomienda tratamiento para alcalinidad",
  },
  {
    id: 9,
    idNum: "09",
    zona: "Zona Este - sector A",
    fecha: "2024-09-17",
    operador: "Juan López",
    loteExtraccion: "C-319",
    tipoMaterial: "Cobre",
    humedad: "10.3%",
    resultado: "Rechazado",
    observaciones: "Material friable y muy húmedo.",
  },
  {
    id: 10,
    idNum: "10",
    zona: "Zona Oeste - sector C",
    fecha: "2024-09-27",
    operador: "Luis Gómez",
    loteExtraccion: "C-397",
    tipoMaterial: "Cobre",
    humedad: "5.96%",
    resultado: "Aprobado",
    observaciones: "Muestra con alto contenido de arcilla.",
  },
  {
    id: 11,
    idNum: "11",
    zona: "Zona norte - sector A",
    fecha: "2024-10-05",
    operador: "Patricia López",
    loteExtraccion: "O-128",
    tipoMaterial: "Oro",
    humedad: "6.12%",
    resultado: "Aprobado",
    observaciones: "Calidad óptima",
  },
  {
    id: 12,
    idNum: "12",
    zona: "Zona sur - sector B",
    fecha: "2024-10-12",
    operador: "Ana Martínez",
    loteExtraccion: "C-442",
    tipoMaterial: "Cobre",
    humedad: "7.89%",
    resultado: "Rechazado",
    observaciones: "Humedad elevada",
  },
]

const ITEMS_PER_PAGE = 10

export default function PlantaReports() {
  const [reportType, setReportType] = useState("material")
  const [filterDate, setFilterDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const currentData = reportType === "material" ? materialProcessData : sampleAnalysisData

  const filteredData = useMemo(() => {
    if (!filterDate) return currentData
    return currentData.filter((item) => item.fecha === filterDate)
  }, [filterDate, currentData])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handlePrint = () => {
    window.print()
  }

  const getReportNumber = () => {
    const baseNum = 54
    return String(baseNum).padStart(5, "0")
  }

  const currentDate = new Date()
  const emissionDate = `${currentDate.getDate()}/${String(currentDate.getMonth() + 1).padStart(2, "0")}/${currentDate.getFullYear()}`

  return (
    <main className="flex-1 overflow-auto p-8 bg-gray-50">
      <div className="space-y-4">
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => {
              setReportType("material")
              setCurrentPage(1)
            }}
            className={`px-4 py-2 font-semibold rounded-lg ${
              reportType === "material" ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
          >
            Reporte Material a Procesar
          </Button>
          <Button
            onClick={() => {
              setReportType("analysis")
              setCurrentPage(1)
            }}
            className={`px-4 py-2 font-semibold rounded-lg ${
              reportType === "analysis" ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
          >
            Reporte Análisis de Muestras
          </Button>
        </div>

        {/* Filtro */}
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">Filtrar por:</span>
          <div className="flex items-center gap-2">
            <label className="bg-gray-300 px-3 py-2 rounded text-gray-700 font-medium flex items-center gap-2">
              <span>Fecha</span>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="ml-2 w-40 bg-white border border-gray-300"
              />
            </label>
          </div>
        </div>

        {/* Header del Reporte */}
        <div className="bg-gray-300 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <div className="text-gray-700 font-semibold text-sm">N°: {getReportNumber()}</div>
          <h1 className="text-xl font-bold text-blue-900">
            {reportType === "material"
              ? "Reporte de Material a procesar por Lote"
              : "Reporte de resultados de análisis de muestras por zona"}
          </h1>
          <div className="text-gray-700 font-semibold text-sm">Año: 2024</div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-500 text-white">
                  {reportType === "material" ? (
                    <>
                      <th className="px-3 py-2 text-left font-bold text-xs">Lote</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Zona</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Fecha</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Operador</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Cantidad</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Tipo de Material</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Condición</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Observaciones</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-2 text-left font-bold text-xs">ID</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Zona</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Fecha</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Operador</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Lote de extracción</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Tipo de Material</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Humedad</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Resultado</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Observaciones</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr key={item.id} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} hover:bg-gray-50`}>
                    {reportType === "material" ? (
                      <>
                        <td className="px-3 py-2 text-xs text-gray-700 font-medium">{item.lote}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.zona}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.fecha}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.operador}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.cantidad}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.tipoMaterial}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.condicion}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.observaciones}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-xs text-gray-700 font-medium">{item.idNum}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.zona}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.fecha}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.operador}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.loteExtraccion}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.tipoMaterial}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.humedad}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.resultado}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.observaciones}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pie de página con paginación */}
          <div className="bg-white px-6 py-4 border-t border-gray-300 flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-gray-600 text-xs">Emitido: {emissionDate}</p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                variant="outline"
                className="px-2 py-1 text-xs border-gray-400 bg-transparent"
              >
                Anterior
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 py-1 text-xs font-medium ${
                    currentPage === page ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  variant={currentPage === page ? "default" : "outline"}
                >
                  {page}
                </Button>
              ))}

              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
                className="px-2 py-1 text-xs border-gray-400 bg-transparent"
              >
                Siguiente
              </Button>
            </div>

            {/* Botón Imprimir */}
            <Button
              onClick={handlePrint}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2 rounded flex items-center gap-2"
            >
              <Printer size={18} />
              Imprimir
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
