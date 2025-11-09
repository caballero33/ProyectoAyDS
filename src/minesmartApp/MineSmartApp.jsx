import { RouterProvider } from "react-router"
import { router } from "./minesmartApprouter/MinesmartAppRouter.jsx"

const MineSmartApp = () => {
  return (
    <RouterProvider router={router}/>
  )
}

export default MineSmartApp
