import AnalisisSuelosForm from "./modulos/AnalisisSuelosForm"
import ExtraccionForm from "./modulos/ExtraccionForm"
import ExtraccionReports from "./modulos/ExtraccionReports"
import LabForm from "./modulos/LabForm"
import PlantaForm from "./modulos/PlantaForm"
import PlantaReports from "./modulos/PlantaReports"
import GerenciaReports from "./modulos/GerenciaReports"
import SuppliesInventory from "./modulos/SuppliesForm"
import ShippingForm from "./modulos/ShippingForm"
import ShippingReports from "./modulos/ShippingReports"

export default function Content({ module }) {
  if (!module) {
    return (
      <main className="flex-1 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Bienvenido a Aura</h2>
          <p className="text-muted-foreground">Selecciona un módulo para comenzar</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-auto">
      {module === "soil-data" && <AnalisisSuelosForm />}
      {module === "extraction-data" && <ExtraccionForm />}
      {module === "extraction-reports" && <ExtraccionReports />}
      {module === "lab-data" && <LabForm />}
      {module === "plant-data" && <PlantaForm />}
      {module === "plant-reports" && <PlantaReports />}
      {module === "shipping-reports" && <ShippingReports />} {/* Solo reportes */}
      {module === "supplies" && <SuppliesInventory />} {/* Solo inventario */}
      {module === "management-reports" && <GerenciaReports />}
      {!module.includes("-") && module !== "supplies" && (
        <div className="p-8">
          <p className="text-muted-foreground">Módulo en construcción</p>
        </div>
      )}
    </main>
  )
}

