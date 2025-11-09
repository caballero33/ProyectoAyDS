import { useState } from "react"
import { Button } from "../../../../../components/ui/Button"

export default function ShippingReports() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterProduct, setFilterProduct] = useState("")
  const itemsPerPage = 10

  // Datos de ejemplo - Inventario para despacho
  const reportData = [
    {
      id: 1,
      lote: "01",
      fechaProcesamiento: "01/06/2024",
      producto: "Concentrado de Oro",
      cantidad: "7.3 Kg",
      purezaFinal: "96.44%",
      observaciones: "Parámetros dentro de especificación",
    },
    {
      id: 2,
      lote: "02",
      fechaProcesamiento: "02/06/2024",
      producto: "Concentrado de Oro",
      cantidad: "5.8 Kg",
      purezaFinal: "87.23%",
      observaciones: "Humedad en rango ideal",
    },
    {
      id: 3,
      lote: "03",
      fechaProcesamiento: "03/06/2024",
      producto: "Concentrado de Cobre",
      cantidad: "6.4 Kg",
      purezaFinal: "98.63%",
      observaciones: "Pureza del concentrado alta.",
    },
    {
      id: 4,
      lote: "04",
      fechaProcesamiento: "04/06/2024",
      producto: "Concentrado de Cobre",
      cantidad: "7.3 Kg",
      purezaFinal: "86.44%",
      observaciones: "Granulometría estándar.",
    },
    {
      id: 5,
      lote: "05",
      fechaProcesamiento: "05/06/2024",
      producto: "Concentrado de Cobre",
      cantidad: "7.4 Kg",
      purezaFinal: "84.44%",
      observaciones: "Granulometría estándar.",
    },
    {
      id: 6,
      lote: "06",
      fechaProcesamiento: "05/06/2024",
      producto: "Concentrado de Oro",
      cantidad: "7.2 Kg",
      purezaFinal: "99.32%",
      observaciones: "Pureza del concentrado alta.",
    },
    {
      id: 7,
      lote: "07",
      fechaProcesamiento: "06/06/2024",
      producto: "Concentrado de Oro",
      cantidad: "7.5 Kg",
      purezaFinal: "94.32%",
      observaciones: "Pureza del concentrado alta.",
    },
    {
      id: 8,
      lote: "08",
      fechaProcesamiento: "06/06/2024",
      producto: "Concentrado de Oro",
      cantidad: "5.7 Kg",
      purezaFinal: "85.52%",
      observaciones: "Lote visualmente homogéneo.",
    },
    {
      id: 9,
      lote: "09",
      fechaProcesamiento: "07/06/2024",
      producto: "Concentrado de Cobre",
      cantidad: "7.2 Kg",
      purezaFinal: "80.3%",
      observaciones: "Granulometría estándar.",
    },
    {
      id: 10,
      lote: "10",
      fechaProcesamiento: "07/06/2024",
      producto: "Concentrado de Cobre",
      cantidad: "7.3 Kg",
      purezaFinal: "95.96%",
      observaciones: "Pureza del concentrado alta.",
    },
    {
      id: 11,
      lote: "11",
      fechaProcesamiento: "08/06/2024",
      producto: "Concentrado de Oro",
      cantidad: "6.8 Kg",
      purezaFinal: "92.15%",
      observaciones: "Lote en óptimas condiciones.",
    },
    {
      id: 12,
      lote: "12",
      fechaProcesamiento: "08/06/2024",
      producto: "Concentrado de Cobre",
      cantidad: "7.1 Kg",
      purezaFinal: "88.77%",
      observaciones: "Material procesado correctamente.",
    },
    {
      id: 13,
      lote: "13",
      fechaProcesamiento: "09/06/2024",
      producto: "Concentrado de Oro",
      cantidad: "6.9 Kg",
      purezaFinal: "93.44%",
      observaciones: "Libre de contaminantes.",
    },
    {
      id: 14,
      lote: "14",
      fechaProcesamiento: "09/06/2024",
      producto: "Concentrado de Cobre",
      cantidad: "7.0 Kg",
      purezaFinal: "89.21%",
      observaciones: "Especificaciones cumplidas.",
    },
    {
      id: 15,
      lote: "15",
      fechaProcesamiento: "10/06/2024",
      producto: "Concentrado de Oro",
      cantidad: "7.4 Kg",
      purezaFinal: "96.88%",
      observaciones: "Calidad premium garantizada.",
    },
  ]

  // Filtrar datos por producto
  const filteredData = filterProduct
    ? reportData.filter((item) => item.producto.toLowerCase().includes(filterProduct.toLowerCase()))
    : reportData

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedData = filteredData.slice(startIdx, endIdx)

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handlePageClick = (page) => {
    setCurrentPage(page)
  }

  const handlePrint = () => {
    window.print()
  }

  const getMonth = () => {
    const date = new Date()
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    return months[date.getMonth()]
  }

  return (
    <div className="p-8 bg-white min-h-screen flex flex-col">
      {/* Filter Section */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-foreground">Filtrar por:</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Producto"
            value={filterProduct}
            onChange={(e) => {
              setFilterProduct(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Report Header */}
      <div className="bg-gray-300 px-6 py-4 rounded-lg mb-6 flex justify-between items-center">
        <div className="flex gap-8">
          <div className="font-bold text-sm text-foreground">
            N°: <span className="font-bold">00479</span>
          </div>
          <h2 className="text-2xl font-bold text-blue-900">Reporte de material listo para la venta</h2>
        </div>
        <div className="text-sm font-medium text-foreground">
          Mes: <span className="font-bold">{getMonth()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-6 flex-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-accent text-white">
              <th className="px-4 py-2 text-left font-semibold text-xs">Lote</th>
              <th className="px-4 py-2 text-left font-semibold text-xs">Fecha de Procesamiento</th>
              <th className="px-4 py-2 text-left font-semibold text-xs">Producto</th>
              <th className="px-4 py-2 text-left font-semibold text-xs">Cantidad</th>
              <th className="px-4 py-2 text-left font-semibold text-xs">Pureza Final</th>
              <th className="px-4 py-2 text-left font-semibold text-xs">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={row.id} className={`${index % 2 === 0 ? "bg-gray-200" : "bg-white"} border-b border-gray-300`}>
                <td className="px-4 py-2 text-xs text-foreground">{row.lote}</td>
                <td className="px-4 py-2 text-xs text-foreground">{row.fechaProcesamiento}</td>
                <td className="px-4 py-2 text-xs text-foreground">{row.producto}</td>
                <td className="px-4 py-2 text-xs text-foreground">{row.cantidad}</td>
                <td className="px-4 py-2 text-xs text-foreground">{row.purezaFinal}</td>
                <td className="px-4 py-2 text-xs text-foreground">{row.observaciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination and Footer */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            variant="outline"
            className="px-3 py-1 text-xs bg-transparent"
          >
            Anterior
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                currentPage === page ? "bg-accent text-white" : "bg-gray-200 text-foreground hover:bg-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
          <Button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            variant="outline"
            className="px-3 py-1 text-xs bg-transparent"
          >
            Siguiente
          </Button>
        </div>

        <div className="text-xs text-foreground text-center flex-1">
          Emitido: {new Date().toLocaleDateString("es-ES")}
        </div>

        <Button
          onClick={handlePrint}
          className="bg-accent hover:bg-accent/90 text-white px-6 py-2 text-xs font-medium rounded-lg"
        >
          Imprimir
        </Button>
      </div>
    </div>
  )
}
