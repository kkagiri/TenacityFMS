import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'

import '@/assets/scss/app.scss'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_BASE_URL}>
      <AppProvidersWrapper>
        <App />
      </AppProvidersWrapper>
    </BrowserRouter>
  </StrictMode>,
)
