import { Bell, ChevronDown, LifeBuoy, Search, Settings } from "lucide-react"
import { Button } from "../../../../components/ui/Button"
import { Input } from "../../../../components/ui/Input"

const topNavItems = [
  { id: "overview", label: "Visión general" },
  { id: "operations", label: "Operaciones" },
  { id: "analytics", label: "Analítica" },
  { id: "compliance", label: "Cumplimiento" },
  { id: "resources", label: "Recursos" },
]

export default function Header() {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__inner">
        <div className="dashboard-identity">
          <div className="dashboard-identity__brand">
            <img
              src="https://res.cloudinary.com/dcm2dsjov/image/upload/v1762741683/images_gyxzku.png"
              alt="Aura Minosa logo"
              className="dashboard-identity__logo"
            />
            <div className="dashboard-identity__copy">
              <span className="dashboard-identity__name">Aura Minosa</span>
              <span className="dashboard-identity__scope">Centro de control</span>
            </div>
          </div>

          <div className="dashboard-header__search">
            <Search className="dashboard-header__search-icon" />
            <Input
              type="search"
              placeholder="Buscar reportes, lotes, usuarios…"
              className="dashboard-search-input"
            />
          </div>
        </div>

        <div className="dashboard-actions">
          <Button size="sm" variant="accent" className="dashboard-actions__cta">
            Crear reporte
          </Button>
          <Button size="sm" variant="ghost" className="dashboard-actions__icon">
            <Settings size={18} />
          </Button>
          <div className="dashboard-actions__notification">
            <Button size="sm" variant="ghost" className="dashboard-actions__icon dashboard-actions__icon--bell">
              <Bell size={18} />
            </Button>
            <span className="dashboard-actions__badge">3</span>
          </div>
          <Button size="sm" variant="ghost" className="dashboard-actions__icon">
            <LifeBuoy size={18} />
          </Button>
          <div className="dashboard-actions__separator" />
          <button className="dashboard-actions__profile">
            <span className="dashboard-actions__profile-name">
              <strong>Alexandra Rivas</strong>
              <span className="dashboard-actions__profile-role">Gerencia planta</span>
            </span>
            <span className="dashboard-actions__avatar">AR</span>
            <ChevronDown size={16} className="dashboard-accordion__chevron" />
          </button>
        </div>
      </div>

      <nav className="dashboard-header__nav">
        <ul className="dashboard-topnav">
          {topNavItems.map((item, index) => (
            <li key={item.id}>
              <button className={`dashboard-topnav__btn ${index === 0 ? "dashboard-topnav__btn--active" : ""}`}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
