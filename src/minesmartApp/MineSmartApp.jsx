import { RouterProvider } from "react-router"
import { router } from "./minesmartApprouter/MinesmartAppRouter.jsx"
import { AuthProvider } from "./context/AuthContext"

const MineSmartApp = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default MineSmartApp
