import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactDOM from 'react-dom/client';
import './index.css'
import MineSmartApp from './minesmartApp/MineSmartApp.jsx'
import { BrowserRouter } from "react-router";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MineSmartApp />
  </StrictMode>,
)
