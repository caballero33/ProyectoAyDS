import { Navigate, createBrowserRouter } from "react-router"
import DashboardPages from "../pages/dashboardPages/DashboardPages.jsx"
import LoginPage from "../auth/LoginPage.jsx"
import ProtectedRoute from "../components/ProtectedRoute.jsx"

export const router = createBrowserRouter([
  {
    path: "login/",
    element: <LoginPage />,
  },
  {
    path: "dashboard/",
    element: (
      <ProtectedRoute>
        <DashboardPages />
      </ProtectedRoute>
    ),
  },
  {
    path: "/",
    element: <Navigate to="login/" replace />,
  },
])