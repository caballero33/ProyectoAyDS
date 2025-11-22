import { ChevronDown, ClipboardList, Factory, FlaskConical, Layers, PieChart, Route, Truck } from "lucide-react"
import { useMemo, useState } from "react"
import { useAuth } from "../../../context/AuthContext"

const navigationBlueprint = [
  {
    title: "Operaciones",
    roles: ["admin", "operaciones"], // Solo admin y operaciones
    items: [
      {
        id: "soil",
        label: "Exploración y suelos",
        icon: Layers,
        children: [{ id: "soil-data", label: "Ingreso de datos" }],
      },
      {
        id: "extraction",
        label: "Extracción",
        icon: Route,
        children: [
          { id: "extraction-data", label: "Registro de jornada" },
          { id: "extraction-soil-reports", label: "Reporte de analisis" },
        ],
      },
      {
        id: "lab",
        label: "Laboratorio",
        icon: FlaskConical,
        children: [{ id: "lab-data", label: "Resultados de análisis" }],
      },
      {
        id: "plant",
        label: "Planta",
        icon: Factory,
        children: [
          { id: "plant-data", label: "Ingreso de producción" },
          { id: "plant-reports", label: "Reportes operativos" },
        ],
      },
    ],
  },
  {
    title: "Logística y soporte",
    roles: ["admin", "logistica"], // Solo admin y logística
    items: [
      {
        id: "shipping",
        label: "Despacho",
        icon: Truck,
        children: [{ id: "shipping-reports", label: "Estado de despachos" }],
      },
      {
        id: "supplies",
        label: "Insumos",
        icon: ClipboardList,
        children: [{ id: "supplies", label: "Inventario general" }],
      },
    ],
  },
  {
    title: "Dirección",
    roles: ["admin", "direccion"], // Solo admin y dirección
    items: [
      {
        id: "management",
        label: "Gerencia",
        icon: PieChart,
        children: [
          { id: "management-reports", label: "Reportes sintetizados" },
          { id: "sold-lots-management", label: "Confirmar ventas" },
        ],
      },
    ],
  },
]

export default function Sidebar({ activeModule, onSelectModule }) {
  const { userRole } = useAuth()
  const [expanded, setExpanded] = useState(new Set(["soil", "extraction", "management"]))

  const navigation = useMemo(() => {
    if (!userRole) return []

    // Administrador ve todo
    if (userRole === "admin") {
      return navigationBlueprint
    }

    // Filtrar secciones según el rol del usuario
    return navigationBlueprint.filter((section) => section.roles?.includes(userRole))
  }, [userRole])

  const toggleExpand = (id) => {
    const nextExpanded = new Set(expanded)
    if (nextExpanded.has(id)) {
      nextExpanded.delete(id)
    } else {
      nextExpanded.add(id)
    }
    setExpanded(nextExpanded)
  }

  const isActiveParent = (parentId) => activeModule?.startsWith(parentId)

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar__panel">
        <p className="dashboard-sidebar__title">Panel</p>
        <h2 className="dashboard-hero__title" style={{ fontSize: "1.25rem" }}>
          Gestión integral de operaciones
        </h2>
        <p className="dashboard-hero__copy" style={{ fontSize: "0.86rem", marginTop: "0.65rem" }}>
          Monitorea la cadena productiva y toma acciones preventivas desde un único lugar.
        </p>
      </div>

      <nav className="dashboard-sidebar__nav">
        {navigation.map((section) => (
          <div key={section.title} className="dashboard-sidebar__group">
            <p className="dashboard-sidebar__title">{section.title}</p>
            {section.items.map((item) => {
              const Icon = item.icon
              const isOpen = expanded.has(item.id)
              const isActive = isActiveParent(item.id)

              return (
                <div
                  key={item.id}
                  className={`dashboard-accordion ${isActive ? "dashboard-accordion--active" : ""} ${
                    isOpen ? "dashboard-accordion--expanded" : ""
                  }`}
                >
                  <button className="dashboard-accordion__trigger" onClick={() => toggleExpand(item.id)}>
                    <span className="dashboard-accordion__trigger-left">
                      <span className="dashboard-accordion__icon">
                        <Icon size={18} />
                      </span>
                      {item.label}
                    </span>
                    <ChevronDown size={16} className="dashboard-accordion__chevron" />
                  </button>

                  {isOpen && item.children?.length > 0 && (
                    <div className="dashboard-submenu">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => onSelectModule(child.id)}
                          className={`dashboard-submenu__button ${
                            activeModule === child.id ? "dashboard-submenu__button--active" : ""
                          }`}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
