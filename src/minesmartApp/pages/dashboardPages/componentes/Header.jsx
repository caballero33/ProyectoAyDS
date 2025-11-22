import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { Bell, ChevronDown, LifeBuoy, LogOut, Search, Settings } from "lucide-react"
import { Button } from "../../../../components/ui/Button"
import { Input } from "../../../../components/ui/Input"
import { useAuth, ROLE_NAMES } from "../../../context/AuthContext"

const topNavItems = [
  { id: "overview", label: "Visión general" },
  { id: "operations", label: "Operaciones" },
  { id: "resources", label: "Recursos" },
]

export default function Header({ activeNavItem = "overview", onNavItemSelect }) {
  const { user, userRole, userData, logout } = useAuth()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProfileMenu])

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate("/login/")
    }
  }

  const getUserInitials = () => {
    const displayName = userData?.displayName || user?.email?.split("@")[0] || "U"
    const names = displayName.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return displayName.substring(0, 2).toUpperCase()
  }

  const getUserName = () => {
    return userData?.displayName || user?.email?.split("@")[0] || "Usuario"
  }

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
          <div ref={profileMenuRef} style={{ position: "relative", zIndex: 10000 }}>
            <button
              className="dashboard-actions__profile"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ position: "relative" }}
            >
              <span className="dashboard-actions__profile-name">
                <strong>{getUserName()}</strong>
                <span className="dashboard-actions__profile-role">
                  {userRole ? ROLE_NAMES[userRole] : "Usuario"}
                </span>
              </span>
              <span className="dashboard-actions__avatar">{getUserInitials()}</span>
              <ChevronDown size={16} className="dashboard-accordion__chevron" />
            </button>
            {showProfileMenu && (
              <div
                className="profile-dropdown-menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.75rem)",
                  right: 0,
                  background: "#ffffff",
                  borderRadius: "1rem",
                  boxShadow: "0 12px 32px rgba(30, 44, 92, 0.25)",
                  border: "1px solid rgba(30, 44, 92, 0.12)",
                  minWidth: "240px",
                  zIndex: 10001,
                  overflow: "hidden",
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid rgba(30, 44, 92, 0.1)",
                    background: "rgba(30, 44, 92, 0.02)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                      color: "#1e2c5c",
                    }}
                  >
                    {getUserName()}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "rgba(30, 44, 92, 0.65)",
                      wordBreak: "break-word",
                    }}
                  >
                    {userData?.email || user?.email || ""}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1.25rem",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#dc2626",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220, 38, 38, 0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="dashboard-header__nav">
        <ul className="dashboard-topnav">
          {topNavItems.map((item, index) => (
            <li key={item.id}>
              <button
                className={`dashboard-topnav__btn ${activeNavItem === item.id ? "dashboard-topnav__btn--active" : ""}`}
                onClick={() => onNavItemSelect?.(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
