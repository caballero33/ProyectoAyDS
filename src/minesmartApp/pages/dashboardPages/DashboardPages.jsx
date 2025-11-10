import React, { useState } from "react"
import Header from "./componentes/Header"
import Sidebar from "./componentes/Sidebar"
import Content from "./componentes/Content"
import "./dashboard.css"

export default function DashboardPages() {
  const [activeModule, setActiveModule] = useState("")

  const handleSelectModule = (moduleKey) => {
    setActiveModule(moduleKey)
  }

  const handleSelectSubModule = (subModuleKey) => {
    console.log("submodule selected:", subModuleKey)
  }

  return (
    <div className="dashboard-shell">
      <Header />
      <div className="dashboard-body">
        <Sidebar activeModule={activeModule} onSelectModule={handleSelectModule} />
        <Content module={activeModule} onSelectSubModule={handleSelectSubModule} />
      </div>
    </div>
  )
}
