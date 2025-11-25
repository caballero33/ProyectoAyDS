import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { Bell, ChevronDown, LogOut, Search, X } from "lucide-react"
import { Button } from "../../../../components/ui/Button"
import { Input } from "../../../../components/ui/Input"
import { useAuth, ROLE_NAMES } from "../../../context/AuthContext"
import { collection, getDocs, query, where, orderBy, updateDoc, doc, onSnapshot } from "firebase/firestore"
import { db } from "../../../../lib/firebase"

const topNavItems = [
  { id: "overview", label: "Visión general" },
  { id: "operations", label: "Operaciones" },
  { id: "gestion", label: "Gestión" },
]

export default function Header({ activeNavItem = "overview", onNavItemSelect }) {
  const { user, userRole, userData, logout } = useAuth()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const profileMenuRef = useRef(null)
  const notificationsMenuRef = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Cargar notificaciones
  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshot(
      query(collection(db, "notifications"), orderBy("created_at", "desc")),
      (snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setNotifications(notifs)
        setUnreadCount(notifs.filter((n) => !n.read).length)
      },
      (error) => {
        console.error("Error cargando notificaciones:", error)
      }
    )

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    if (showProfileMenu || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProfileMenu, showNotifications])

  const handleNotificationClick = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, { read: true })
    } catch (error) {
      console.error("Error marcando notificación como leída:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)
      await Promise.all(
        unreadNotifications.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }))
      )
    } catch (error) {
      console.error("Error marcando todas como leídas:", error)
    }
  }

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return "—"
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
      if (isNaN(date.getTime())) return "—"
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return "Hace menos de 1 minuto"
      if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`
      if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`
      if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`
      return date.toLocaleDateString("es-PE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "—"
    }
  }

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
          <div ref={notificationsMenuRef} className="dashboard-actions__notification" style={{ position: "relative" }}>
            <Button
              size="sm"
              variant="ghost"
              className="dashboard-actions__icon dashboard-actions__icon--bell"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={18} />
            </Button>
            {unreadCount > 0 && <span className="dashboard-actions__badge">{unreadCount}</span>}
            {showNotifications && (
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
                  minWidth: "380px",
                  maxWidth: "420px",
                  maxHeight: "500px",
                  overflowY: "auto",
                  zIndex: 10001,
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid rgba(30, 44, 92, 0.1)",
                    background: "rgba(30, 44, 92, 0.02)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "sticky",
                    top: 0,
                    background: "#ffffff",
                    zIndex: 1,
                  }}
                >
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1e2c5c", margin: 0 }}>
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent)",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "0.25rem 0.5rem",
                      }}
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "rgba(30, 44, 92, 0.6)" }}>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>No hay notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        style={{
                          padding: "1rem 1.25rem",
                          borderBottom: "1px solid rgba(30, 44, 92, 0.08)",
                          cursor: "pointer",
                          background: notification.read ? "transparent" : "rgba(242, 92, 74, 0.05)",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = notification.read
                            ? "rgba(30, 44, 92, 0.02)"
                            : "rgba(242, 92, 74, 0.08)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = notification.read
                            ? "transparent"
                            : "rgba(242, 92, 74, 0.05)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: notification.read ? 500 : 600,
                                color: "#1e2c5c",
                                margin: "0 0 0.25rem 0",
                                lineHeight: "1.4",
                              }}
                            >
                              {notification.summary}
                            </p>
                            {notification.details && Object.keys(notification.details).length > 0 && (
                              <div style={{ fontSize: "0.75rem", color: "rgba(30, 44, 92, 0.6)", marginTop: "0.25rem" }}>
                                {Object.entries(notification.details)
                                  .filter(([key]) => !["created_at", "read"].includes(key))
                                  .slice(0, 2)
                                  .map(([key, value]) => (
                                    <span key={key} style={{ marginRight: "0.75rem" }}>
                                      {key === "zona" && `📍 ${value}`}
                                      {key === "lote" && `📦 ${value}`}
                                      {key === "cantidad" && `⚖️ ${value}`}
                                      {key === "pureza" && `💎 ${value}%`}
                                      {key === "cliente" && `👤 ${value}`}
                                    </span>
                                  ))}
                              </div>
                            )}
                            <p style={{ fontSize: "0.7rem", color: "rgba(30, 44, 92, 0.5)", margin: "0.5rem 0 0 0" }}>
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "var(--accent)",
                                flexShrink: 0,
                                marginTop: "0.25rem",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
