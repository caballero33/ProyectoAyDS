import { User } from "lucide-react"
import { Button } from "../../../../components/ui/Button"

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground px-8 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center font-bold text-accent-foreground">
          A
        </div>
        <span className="text-2xl font-bold">aura</span>
        <span className="text-xs text-primary-foreground/70 ml-1">360° MINING</span>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm">
          Dashboards
        </Button>
        <Button variant="secondary" size="sm">
          Usuarios
        </Button>
        <Button variant="destructive" size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Cerrar sesion
        </Button>
        <button className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
          <User size={20} className="text-foreground" />
        </button>
      </div>
    </header>
  )
}
