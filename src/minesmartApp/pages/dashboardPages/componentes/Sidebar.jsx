import { ChevronDown } from "lucide-react"
import { useState } from "react"

const modules = [
  { id: "soil", label: "Análisis de suelos", hasSubModules: true },
  { id: "extraction", label: "Extracción", hasSubModules: true },
  { id: "lab", label: "Laboratorio", hasSubModules: true },
  { id: "plant", label: "Planta", hasSubModules: true },
  { id: "shipping", label: "Despacho", hasSubModules: true },
  { id: "supplies", label: "Insumos", hasSubModules: true },
  { id: "management", label: "Gerencia", hasSubModules: true },
]

export default function Sidebar({ activeModule, onSelectModule }) {
  const [expanded, setExpanded] = useState(new Set(["soil"]))

  const toggleExpand = (id) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpanded(newExpanded)
  }

  const getSubModules = (moduleId) => {
    switch (moduleId) {
      case "soil":
        return [{ id: "soil-data", label: "Ingreso de datos" }]
      case "extraction":
        return [
          { id: "extraction-data", label: "Ingreso de datos" },
          { id: "extraction-reports", label: "Reportes" },
        ]
      case "lab":
        return [{ id: "lab-data", label: "Ingreso de datos" }]
      case "plant":
        return [
          { id: "plant-data", label: "Ingreso de datos" },
          { id: "plant-reports", label: "Reportes" },
        ]
      case "shipping":
        return [{ id: "shipping-reports", label: "Reportes" }]
      case "supplies":
        return [{ id: "supplies", label: "Inventario" }]
      case "management":
        return [{ id: "management-reports", label: "Reportes Sintetizados" }]
      default:
        return []
    }
  }

  return (
    <aside className="w-56 bg-primary text-primary-foreground p-6 overflow-y-auto">
      <nav className="space-y-3">
        {modules.map((module) => (
          <div key={module.id}>
            <button
              onClick={() => toggleExpand(module.id)}
              className={`w-full px-4 py-3 rounded-full text-sm font-medium transition-all flex items-center justify-between ${
                activeModule === module.id || activeModule?.startsWith(module.id + "-")
                  ? "bg-accent text-accent-foreground"
                  : "bg-primary-foreground/15 hover:bg-primary-foreground/25"
              }`}
            >
              <span>{module.label}</span>
              {module.hasSubModules && (
                <ChevronDown
                  size={18}
                  className={`transition-transform ${expanded.has(module.id) ? "rotate-180" : ""}`}
                />
              )}
            </button>

            {module.hasSubModules && expanded.has(module.id) && (
              <div className="ml-4 mt-2 space-y-2">
                {getSubModules(module.id).map((subModule) => (
                  <button
                    key={subModule.id}
                    onClick={() => onSelectModule(subModule.id)}
                    className={`w-full px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeModule === subModule.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-accent/20 text-accent-foreground hover:bg-accent/30"
                    }`}
                  >
                    {subModule.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
