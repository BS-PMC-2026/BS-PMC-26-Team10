import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import './i18n'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PayPalScriptProvider options={{
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
      currency: "ILS",
      intent: "capture"
    }}>
      <App />
    </PayPalScriptProvider>
  </StrictMode>,
)