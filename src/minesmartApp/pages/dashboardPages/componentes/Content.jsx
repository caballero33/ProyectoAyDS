import AnalisisSuelosForm from "./modulos/AnalisisSuelosForm"
import AnalisisSuelosReports from "./modulos/AnalisisSuelosReports"
import ExtraccionForm from "./modulos/ExtraccionForm"
import LabForm from "./modulos/LabForm"
import PlantaForm from "./modulos/PlantaForm"
import PlantaReports from "./modulos/PlantaReports"
import GerenciaReports from "./modulos/GerenciaReports"
import SuppliesInventory from "./modulos/SuppliesForm"
import ShippingForm from "./modulos/ShippingForm"
import ShippingReports from "./modulos/ShippingReports"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/Card"
import { Button } from "../../../../components/ui/Button"

const highlightCards = [
  {
    title: "Producción mensual",
    value: "224 T",
    variation: "+13% vs. mes anterior",
    description: "Seguimiento integrado de cobre y oro.",
    gradient: "linear-gradient(140deg, #1e2c5c, #324a93)",
  },
  {
    title: "Alertas activas",
    value: "5",
    variation: "3 críticas • 2 preventivas",
    description: "Mitiga riesgos en excavación, seguridad y energía.",
    gradient: "linear-gradient(140deg, #f25c4a, #f38e78)",
  },
  {
    title: "Pureza promedio",
    value: "94.3%",
    variation: "Oro · últimas 4 semanas",
    description: "Integra resultados de laboratorio en tiempo real.",
    gradient: "linear-gradient(140deg, #2fa887, #3cc9a0)",
  },
  {
    title: "Nivel de inventario",
    value: "84%",
    variation: "Insumos críticos al día",
    description: "Prioriza reposiciones automáticas y disparos logísticos.",
    gradient: "linear-gradient(140deg, #3f70d8, #4a8ff0)",
  },
]

const workflowSteps = [
  {
    step: "1",
    title: "Registrar jornada de extracción",
    detail: "Incluye lotes, condición geológica y equipos asignados.",
  },
  {
    step: "2",
    title: "Actualizar ensayos de laboratorio",
    detail: "Valida pureza, humedad y envía alertas automáticamente.",
  },
  {
    step: "3",
    title: "Liberar material en planta y despacho",
    detail: "Alinea stock con compromisos comerciales y logística.",
  },
]

const roadmapEntries = [
  {
    title: "Integración con ERP",
    detail: "Conciliación automática de inventarios y costos por lote.",
  },
  {
    title: "Alertas predictivas",
    detail: "Modelos de riesgo para maquinaria crítica y control ambiental.",
  },
  {
    title: "Reportes ejecutivos",
    detail: "Tableros de síntesis para directorio y gobierno corporativo.",
  },
]

export default function Content({ module }) {
  if (!module) {
    return (
      <main className="dashboard-content">
        <div className="dashboard-content__inner">
          <section className="dashboard-hero">
            <p className="dashboard-hero__eyebrow">Tableros inteligentes</p>
            <h2 className="dashboard-hero__title">Orquesta la operación minera de punta a punta</h2>
            <p className="dashboard-hero__copy">
              Visualiza KPIs transversales, comparte contexto con tus equipos y toma decisiones anticipadas gracias a
              la trazabilidad de extracción, laboratorio, planta y logística.
            </p>
            <div className="dashboard-hero__actions">
              <Button variant="accent">Configurar tablero</Button>
              <Button variant="outline">Explorar módulos</Button>
            </div>
          </section>

          <section className="dashboard-kpis">
            {highlightCards.map((card) => (
              <article key={card.title} className="dashboard-kpi-card" style={{ background: card.gradient }}>
                <span className="dashboard-kpi-card__title">{card.title}</span>
                <span className="dashboard-kpi-card__value">{card.value}</span>
                <span className="dashboard-kpi-card__meta">{card.variation}</span>
                <p className="dashboard-kpi-card__copy">{card.description}</p>
              </article>
            ))}
          </section>

          <section className="dashboard-workflow">
            <Card>
              <CardHeader>
                <CardTitle>Flujo de trabajo recomendado</CardTitle>
                <CardDescription>
                  Sincroniza tareas entre exploración, laboratorio y despacho para garantizar continuidad operativa.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="dashboard-workflow__list">
                  {workflowSteps.map((task) => (
                    <div key={task.step} className="dashboard-workflow__item">
                      <span className="dashboard-workflow__step">{task.step}</span>
                      <div>
                        <h3 className="dashboard-workflow__item-title">{task.title}</h3>
                        <p className="dashboard-workflow__item-copy">{task.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximas actualizaciones</CardTitle>
                <CardDescription>Qué viene para el panel de Aura Minosa.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="dashboard-roadmap">
                  {roadmapEntries.map((entry) => (
                    <div key={entry.title}>
                      <p className="dashboard-roadmap__entry-title">{entry.title}</p>
                      <p className="dashboard-roadmap__entry-copy">{entry.detail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard-content">
      {module === "soil-data" && <AnalisisSuelosForm />}
      {module === "extraction-data" && <ExtraccionForm />}
      {module === "extraction-soil-reports" && <AnalisisSuelosReports />}
      {module === "lab-data" && <LabForm />}
      {module === "plant-data" && <PlantaForm />}
      {module === "plant-reports" && <PlantaReports />}
      {module === "shipping-reports" && <ShippingReports />}
      {module === "supplies" && <SuppliesInventory />}
      {module === "management-reports" && <GerenciaReports />}
      {!module?.includes("-") && module !== "supplies" && module !== "shipping-reports" && (
        <div className="dashboard-content__inner">
          <Card flat>
            <CardContent>
              <p className="dashboard-roadmap__entry-copy">Módulo en construcción</p>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
