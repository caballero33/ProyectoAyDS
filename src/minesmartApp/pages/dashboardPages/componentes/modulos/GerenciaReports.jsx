import { useState } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Button } from "../../../../../components/ui/Button"

export default function GerenciaReports() {
  const [reportType, setReportType] = useState("machinery")

  // Datos para Reporte de Fallas en Maquinaria
  const machineryFailures = {
    summary: {
      avgDowntime: "3.4H",
      totalFailures: 7,
      affectedMachines: 3,
    },
    details: [
      {
        fecha: "01/06/2024",
        maquina: "Molino #2",
        tipoFalla: "Mecánica",
        duracion: "4.5 h",
        estado: "Abierta",
        responsable: "Luis Gómez",
        descripcion: "Falla en eje",
      },
      {
        fecha: "02/06/2024",
        maquina: "Bomba #3",
        tipoFalla: "Eléctrica",
        duracion: "2.0 h",
        estado: "Cerrada",
        responsable: "Paola Machado",
        descripcion: "Cortocircuito",
      },
      {
        fecha: "03/06/2024",
        maquina: "Cinta #3",
        tipoFalla: "Proceso",
        duracion: "3.2 h",
        estado: "Cerrada",
        responsable: "Luis Gómez",
        descripcion: "Sobrecarga",
      },
    ],
  }

  // Datos para Reporte de Pureza Quincenal
  const purityData = {
    summary: {
      copperAvg: "87.34%",
      copperStdDev: "8.34%",
      goldAvg: "94.32%",
      goldStdDev: "4.31%",
    },
    chartData: [
      { lote: "01", oro: 91, cobre: 84 },
      { lote: "02", oro: 96, cobre: 91 },
      { lote: "03", oro: 94, cobre: 89 },
      { lote: "04", oro: 90, cobre: 87 },
      { lote: "05", oro: 99, cobre: 92 },
      { lote: "06", oro: 97, cobre: 78 },
      { lote: "07", oro: 89, cobre: 92 },
      { lote: "08", oro: 93, cobre: 82 },
      { lote: "09", oro: 87, cobre: 87 },
      { lote: "10", oro: 94, cobre: 88 },
    ],
    topLotes: {
      gold: "O-783",
      copper: "C-741",
      goldLow: "O-452",
      copperLow: "C-365",
    },
  }

  // Datos para Reporte de Producción Total
  const productionData = {
    summary: {
      monthlyProduction: "224 T",
      monthlyVariation: "13%",
      currentInventory: "346 T",
      goldProduction: "98 T",
      copperProduction: "126 T",
    },
    chartData: [
      { mes: "Enero", cobre: 113, oro: 108, total: 221 },
      { mes: "Febrero", cobre: 132, oro: 153, total: 285 },
      { mes: "Marzo", cobre: 91, oro: 134, total: 225 },
      { mes: "Abril", cobre: 112, oro: 109, total: 221 },
      { mes: "Mayo", cobre: 135, oro: 102, total: 237 },
      { mes: "Junio", cobre: 126, oro: 98, total: 224 },
    ],
  }

  // Datos para Reporte de Insumos
  const suppliesData = {
    summary: {
      totalConsumed: "8426 L",
      mostUsed: "I-001 Agua",
      monthlyVariation: "7.12%",
      avgPerBatch: "845 L",
      otherSupplies: "2145 L",
    },
    chartData: [
      { name: "Agua", value: 1950, color: "#2B5E7E" },
      { name: "Depresores", value: 1950, color: "#EC7E3A" },
      { name: "Reguladores de PH", value: 1587, color: "#DC2626" },
      { name: "Activadores", value: 1080, color: "#22C55E" },
      { name: "Espumantes", value: 1080, color: "#10B981" },
      { name: "Colectores", value: 799, color: "#06B6D4" },
    ],
  }

  return (
    <main className="flex-1 overflow-auto p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Botones para cambiar entre reportes */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            onClick={() => setReportType("machinery")}
            className={`${
              reportType === "machinery"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/20 text-primary hover:bg-primary/30"
            }`}
          >
            Fallas en Maquinaria
          </Button>
          <Button
            onClick={() => setReportType("purity")}
            className={`${
              reportType === "purity"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/20 text-primary hover:bg-primary/30"
            }`}
          >
            Pureza Promedio Quincenal
          </Button>
          <Button
            onClick={() => setReportType("production")}
            className={`${
              reportType === "production"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/20 text-primary hover:bg-primary/30"
            }`}
          >
            Producción Total del Mes
          </Button>
          <Button
            onClick={() => setReportType("supplies")}
            className={`${
              reportType === "supplies"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/20 text-primary hover:bg-primary/30"
            }`}
          >
            Insumos - Mayor Consumo
          </Button>
        </div>

        {/* REPORTE 1: FALLAS EN MAQUINARIA */}
        {reportType === "machinery" && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">N°: 00479</p>
                  </div>
                  <h1 className="text-3xl font-bold text-primary text-center flex-1">
                    Reporte de fallas en maquinaria
                  </h1>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Periodo: 01/06/2025 - 15/06/2025</p>
                </div>
              </div>

              <div className="bg-primary text-primary-foreground p-4 rounded-md mb-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="font-semibold">Tiempo promedio de paro:</p>
                  <p className="text-lg">{machineryFailures.summary.avgDowntime}</p>
                </div>
                <div>
                  <p className="font-semibold">Numero total de fallas registradas:</p>
                  <p className="text-lg">{machineryFailures.summary.totalFailures}</p>
                </div>
                <div>
                  <p className="font-semibold">Máquinas afectadas:</p>
                  <p className="text-lg">{machineryFailures.summary.affectedMachines}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent text-accent-foreground">
                      <th className="px-4 py-2 text-left font-semibold">Fecha</th>
                      <th className="px-4 py-2 text-left font-semibold">Máquina</th>
                      <th className="px-4 py-2 text-left font-semibold">Tipo de falla</th>
                      <th className="px-4 py-2 text-left font-semibold">Duración</th>
                      <th className="px-4 py-2 text-left font-semibold">Estado</th>
                      <th className="px-4 py-2 text-left font-semibold">Responsable</th>
                      <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machineryFailures.details.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                        <td className="px-4 py-2">{item.fecha}</td>
                        <td className="px-4 py-2">{item.maquina}</td>
                        <td className="px-4 py-2">{item.tipoFalla}</td>
                        <td className="px-4 py-2">{item.duracion}</td>
                        <td className="px-4 py-2">{item.estado}</td>
                        <td className="px-4 py-2">{item.responsable}</td>
                        <td className="px-4 py-2">{item.descripcion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Emitido: 30/10/2025</p>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Imprimir</Button>
              </div>
            </div>
          </div>
        )}

        {/* REPORTE 2: PUREZA PROMEDIO QUINCENAL */}
        {reportType === "purity" && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">N°: 00479</p>
                </div>
                <h1 className="text-3xl font-bold text-primary">Reporte de pureza promedio quincenal</h1>
                <div>
                  <p className="text-sm text-muted-foreground">Periodo: 01/06/2025 - 15/06/2025</p>
                </div>
              </div>

              <div className="bg-accent text-accent-foreground p-4 rounded-md mb-6 grid grid-cols-4 gap-4 text-center mb-6">
                <div>
                  <p className="font-semibold">Pureza promedio del cobre:</p>
                  <p className="text-lg">{purityData.summary.copperAvg}</p>
                </div>
                <div>
                  <p className="font-semibold">Desviación estándar:</p>
                  <p className="text-lg">{purityData.summary.copperStdDev}</p>
                </div>
                <div>
                  <p className="font-semibold">Pureza promedio del oro:</p>
                  <p className="text-lg">{purityData.summary.goldAvg}</p>
                </div>
                <div>
                  <p className="font-semibold">Desviación estándar:</p>
                  <p className="text-lg">{purityData.summary.goldStdDev}</p>
                </div>
              </div>

              <div className="border-4 border-purple-300 bg-gray-50 p-6 rounded-lg">
                <h3 className="text-center text-lg font-semibold mb-6 text-foreground">Pureza por lote de cobre</h3>
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={purityData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="lote"
                          label={{ value: "Bloques de producción", position: "insideBottomRight", offset: -5 }}
                        />
                        <YAxis label={{ value: "Pureza (%)", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="oro" fill="#2B5E7E" name="Oro" />
                        <Bar dataKey="cobre" fill="#EC7E3A" name="Cobre" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-48 text-sm">
                    <p className="font-semibold text-primary mb-4">Lote con mayor pureza:</p>
                    <p>
                      <span className="font-semibold">Oro:</span> {purityData.topLotes.gold}
                    </p>
                    <p>
                      <span className="font-semibold">Cobre:</span> {purityData.topLotes.copper}
                    </p>
                    <p className="font-semibold text-primary mt-4 mb-2">Lote con menor pureza:</p>
                    <p>
                      <span className="font-semibold">Oro:</span> {purityData.topLotes.goldLow}
                    </p>
                    <p>
                      <span className="font-semibold">Cobre:</span> {purityData.topLotes.copperLow}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Emitido: 30/10/2025</p>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Imprimir</Button>
              </div>
            </div>
          </div>
        )}

        {/* REPORTE 3: PRODUCCIÓN TOTAL DEL MES */}
        {reportType === "production" && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">N°: 00012</p>
                </div>
                <h1 className="text-3xl font-bold text-primary">Reporte de producción total del mes</h1>
                <div>
                  <p className="text-sm text-muted-foreground">Mes: Junio-2024</p>
                </div>
              </div>

              <div className="bg-accent text-accent-foreground p-4 rounded-md mb-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="font-semibold">Producción total del mes:</p>
                  <p className="text-lg">{productionData.summary.monthlyProduction}</p>
                </div>
                <div>
                  <p className="font-semibold">Variación con el mes anterior:</p>
                  <p className="text-lg">{productionData.summary.monthlyVariation}</p>
                </div>
                <div>
                  <p className="font-semibold">Inventario Actual:</p>
                  <p className="text-lg">{productionData.summary.currentInventory}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-center text-lg font-semibold mb-6 text-foreground">
                  Gráfico de producción total mensual
                </h3>
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={productionData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" label={{ value: "Meses", position: "insideBottomRight", offset: -5 }} />
                        <YAxis label={{ value: "Producción (T)", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="cobre" fill="#2B5E7E" name="Cobre" />
                        <Bar dataKey="oro" fill="#EC7E3A" name="Oro" />
                        <Bar dataKey="total" fill="#F59E0B" name="Total" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-56 text-sm">
                    <p className="text-primary font-semibold text-lg">{productionData.summary.goldProduction}</p>
                    <p className="text-foreground">Producción total de oro</p>
                    <p className="text-primary font-semibold text-lg mt-4">{productionData.summary.copperProduction}</p>
                    <p className="text-foreground">Producción total de Cobre</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Emitido: 30/10/2025</p>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Imprimir</Button>
              </div>
            </div>
          </div>
        )}

        {/* REPORTE 4: INSUMOS CON MAYOR CONSUMO */}
        {reportType === "supplies" && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">N°: 00479</p>
                </div>
                <h1 className="text-3xl font-bold text-primary">Reporte de insumos con mayor consumo por mes</h1>
              </div>

              <div className="bg-accent text-accent-foreground p-4 rounded-md mb-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="font-semibold">Total de insumos consumidos:</p>
                  <p className="text-lg">{suppliesData.summary.totalConsumed}</p>
                </div>
                <div>
                  <p className="font-semibold">Insumo mas usado:</p>
                  <p className="text-lg">{suppliesData.summary.mostUsed}</p>
                </div>
                <div>
                  <p className="font-semibold">Variación con el mes anterior:</p>
                  <p className="text-lg">{suppliesData.summary.monthlyVariation}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center gap-6">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={suppliesData.chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, value, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {suppliesData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-48 text-sm">
                    <p className="font-semibold text-primary text-lg">{suppliesData.summary.avgPerBatch}</p>
                    <p className="text-foreground mb-4">Promedio por lote procesado</p>
                    <p className="font-semibold text-primary text-lg">{suppliesData.summary.otherSupplies}</p>
                    <p className="text-foreground">Consumo de otros insumos</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Emitido: 30/10/2025</p>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Imprimir</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
