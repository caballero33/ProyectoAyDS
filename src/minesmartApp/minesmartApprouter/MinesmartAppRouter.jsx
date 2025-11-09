import { Navigate, createBrowserRouter} from "react-router";
import DashboardPages from "../pages/dashboardPages/DashboardPages.jsx";
import LoginPage from "../auth/LoginPage.jsx";

export const router = createBrowserRouter([
    {
        path: "login/",
        element: <LoginPage/>
    },
    {
        path: "dashboard/",
        element: <DashboardPages/>
    },
    {
        path: '/',
        element: <Navigate to = "login/"/>
    }
]);