import React, { useState } from "react"
import Header from "./componentes/Header"
import Sidebar from "./componentes/Sidebar"
import Content from "./componentes/Content"
import LotTracking from "./componentes/modulos/LotTracking"
import "./dashboard.css"

export default function DashboardPages() {
  const [activeModule, setActiveModule] = useState("")
  const [activeNavItem, setActiveNavItem] = useState("overview")

  const handleSelectModule = (moduleKey) => {
    setActiveModule(moduleKey)
  }

  const handleSelectSubModule = (subModuleKey) => {
    console.log("submodule selected:", subModuleKey)
  }

  const handleNavItemSelect = (navItemId) => {
    setActiveNavItem(navItemId)
    // Si se selecciona una sección del navbar, limpiar el módulo activo del sidebar
    if (navItemId !== "overview") {
      setActiveModule("")
    }
  }

  return (
    <div className="dashboard-shell">
      <Header activeNavItem={activeNavItem} onNavItemSelect={handleNavItemSelect} />
      <div className="dashboard-body">
        <Sidebar activeModule={activeModule} onSelectModule={handleSelectModule} />
        {activeNavItem === "operations" ? (
          <LotTracking />
        ) : (
          <Content module={activeModule} onSelectSubModule={handleSelectSubModule} />
        )}
      </div>
    </div>
  )
}
