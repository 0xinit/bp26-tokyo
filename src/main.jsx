import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import './index.css'
import App from './App.jsx'

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID

const privyConfig = {
  loginMethods: ['twitter', 'wallet'],
  appearance: {
    theme: 'dark',
    accentColor: '#ff5f6d',
    showWalletLoginFirst: true,
  },
  embeddedWallets: { createOnLogin: 'users-without-wallets' },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrivyProvider appId={privyAppId || 'missing-app-id'} config={privyConfig}>
      <App appId={privyAppId} />
    </PrivyProvider>
  </StrictMode>
)
