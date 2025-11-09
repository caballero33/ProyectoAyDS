import React, { useState } from "react"
import Header from "./componentes/Header"
import Sidebar from "./componentes/Sidebar"
import Content from "./componentes/Content" 

export default function DashboardPages() {
 
  const [activeModule, setActiveModule] = useState("")

  
  const handleSelectModule = (moduleKey) => {
    setActiveModule(moduleKey)
  }

  const handleSelectSubModule = (subModuleKey) => {
  
    console.log("submodule selected:", subModuleKey)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar recibirá activeModule y la función para cambiarlo */}
        <Sidebar activeModule={activeModule} onSelectModule={handleSelectModule} />

        {/* Content renderiza según el módulo activo */}
        <Content module={activeModule} onSelectSubModule={handleSelectSubModule} />
      </div>
    </div>
  )
}