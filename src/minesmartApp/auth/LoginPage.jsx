import { useState } from "react"
import { useNavigate } from "react-router"
import { useAuth, ROLE_CODES, ROLE_NAMES } from "../context/AuthContext"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [roleCode, setRoleCode] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!email || !password) {
      setError("Por favor completa todos los campos")
      return
    }

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      setSuccess("Inicio de sesión exitoso")
      navigate("/dashboard/")
    } else {
      setError(result.error || "Error al iniciar sesión")
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!email || !password || !confirmPassword || !displayName || !roleCode) {
      setError("Por favor completa todos los campos")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)
    const result = await register(email, password, roleCode.trim(), displayName)
    setLoading(false)

    if (result.success) {
      setSuccess("Cuenta creada exitosamente. Redirigiendo...")
      setTimeout(() => {
        navigate("/dashboard/")
      }, 1500)
    } else {
      setError(result.error || "Error al crear la cuenta")
    }
  }

  const getRoleHint = (code) => {
    const role = Object.keys(ROLE_CODES).find((key) => ROLE_CODES[key] === code.trim())
    return role ? ROLE_NAMES[role] : null
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1d2545, #27365a 55%, #1d2545 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img
            src="https://res.cloudinary.com/dcm2dsjov/image/upload/v1762741683/images_gyxzku.png"
            alt="Aura Minosa logo"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              marginBottom: "1rem",
              boxShadow: "0 10px 24px rgba(0, 0, 0, 0.3)",
            }}
          />
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: "0.5rem",
            }}
          >
            Aura Minosa
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.9rem" }}>
            Sistema de gestión integral de operaciones mineras
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "Iniciar sesión" : "Crear cuenta"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Ingresa tus credenciales para acceder al sistema"
                : "Completa el formulario para crear tu cuenta. Necesitarás un código de registro especial."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isLogin ? handleLogin : handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", boxSizing: "border-box" }}>
              {!isLogin && (
                <div style={{ width: "100%", boxSizing: "border-box" }}>
                  <label htmlFor="displayName" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                    Nombre completo
                  </label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={!isLogin}
                    style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
                  />
                </div>
              )}

              <div style={{ width: "100%", boxSizing: "border-box" }}>
                <label htmlFor="email" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ width: "100%", boxSizing: "border-box" }}>
                <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
                />
              </div>

              {!isLogin && (
                <>
                  <div style={{ width: "100%", boxSizing: "border-box" }}>
                    <label htmlFor="confirmPassword" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                      Confirmar contraseña
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirma tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={!isLogin}
                      style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ width: "100%", boxSizing: "border-box" }}>
                    <label htmlFor="roleCode" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                      Código de registro
                    </label>
                    <Input
                      id="roleCode"
                      type="text"
                      placeholder="Ingresa el código especial"
                      value={roleCode}
                      onChange={(e) => {
                        setRoleCode(e.target.value)
                        setError("")
                      }}
                      required={!isLogin}
                      style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
                    />
                    {roleCode && (
                      <p
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "0.75rem",
                          color: getRoleHint(roleCode) ? "#22c55e" : "#f59e0b",
                        }}
                      >
                        {getRoleHint(roleCode) ? `✓ ${getRoleHint(roleCode)}` : "⚠ Código no reconocido"}
                      </p>
                    )}
                    <details style={{ marginTop: "0.75rem" }}>
                      <summary
                        style={{
                          fontSize: "0.75rem",
                          color: "rgba(30, 44, 92, 0.6)",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        Ver códigos de registro
                      </summary>
                      <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "rgba(30, 44, 92, 0.05)", borderRadius: "0.5rem", fontSize: "0.75rem" }}>
                        <p style={{ marginBottom: "0.25rem" }}>
                          <strong>Administrador:</strong> {ROLE_CODES.admin}
                        </p>
                        <p style={{ marginBottom: "0.25rem" }}>
                          <strong>Operaciones:</strong> {ROLE_CODES.operaciones}
                        </p>
                        <p style={{ marginBottom: "0.25rem" }}>
                          <strong>Logística:</strong> {ROLE_CODES.logistica}
                        </p>
                        <p>
                          <strong>Dirección:</strong> {ROLE_CODES.direccion}
                        </p>
                      </div>
                    </details>
                  </div>
                </>
              )}

              {error && (
                <div
                  style={{
                    padding: "0.75rem",
                    background: "#fee2e2",
                    color: "#dc2626",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    padding: "0.75rem",
                    background: "#d1fae5",
                    color: "#059669",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {success}
                </div>
              )}

              <Button type="submit" variant="accent" disabled={loading} style={{ width: "100%", marginTop: "0.5rem" }}>
                {loading ? "Procesando..." : isLogin ? "Iniciar sesión" : "Crear cuenta"}
              </Button>
            </form>

            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(30, 44, 92, 0.1)", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError("")
                  setSuccess("")
                  setPassword("")
                  setConfirmPassword("")
                  setRoleCode("")
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                {isLogin ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Iniciar sesión"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}