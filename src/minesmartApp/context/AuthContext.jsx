import { createContext, useContext, useEffect, useState } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../lib/firebase"

const AuthContext = createContext(null)

// Códigos especiales para cada tipo de cuenta
export const ROLE_CODES = {
  admin: "AURA_ADMIN_2024",
  operaciones: "AURA_OPER_2024",
  logistica: "AURA_LOG_2024",
  direccion: "AURA_DIR_2024",
}

export const ROLE_NAMES = {
  admin: "Administrador",
  operaciones: "Operaciones",
  logistica: "Logística",
  direccion: "Dirección",
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Obtener información del usuario desde Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserRole(data.role || null)
          setUserData({
            displayName: data.displayName || firebaseUser.email?.split("@")[0] || "Usuario",
            email: data.email || firebaseUser.email,
            role: data.role || null,
          })
        } else {
          setUserRole(null)
          setUserData({
            displayName: firebaseUser.email?.split("@")[0] || "Usuario",
            email: firebaseUser.email || "",
            role: null,
          })
        }
      } else {
        setUser(null)
        setUserRole(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      // El rol se carga automáticamente en onAuthStateChanged
      return { success: true, user: userCredential.user }
    } catch (error) {
      let errorMessage = "Error al iniciar sesión"
      if (error.code === "auth/invalid-email") {
        errorMessage = "Correo electrónico inválido"
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Usuario no encontrado"
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Contraseña incorrecta"
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Demasiados intentos. Intenta más tarde"
      }
      return { success: false, error: errorMessage }
    }
  }

  const register = async (email, password, roleCode, displayName) => {
    try {
      // Validar código de rol
      const role = Object.keys(ROLE_CODES).find((key) => ROLE_CODES[key] === roleCode)
      if (!role) {
        return { success: false, error: "Código de registro inválido" }
      }

      // Crear usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = userCredential.user

      // Guardar información del usuario en Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        email: email,
        displayName: displayName || email.split("@")[0],
        role: role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setUserRole(role)
      return { success: true, user: newUser }
    } catch (error) {
      let errorMessage = "Error al crear la cuenta"
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este correo electrónico ya está registrado"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Correo electrónico inválido"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña debe tener al menos 6 caracteres"
      }
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setUserRole(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: "Error al cerrar sesión" }
    }
  }

  const value = {
    user,
    userRole,
    userData,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}
