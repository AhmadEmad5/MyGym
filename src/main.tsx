import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { DataProvider } from './hooks/useData'
import { LanguageProvider } from './lib/i18n'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import './styles/design-tokens.css'
import './styles/forma-shell.css'
import './styles/today.css'
import './styles/routes.css'
import './styles/onboarding.css'
import './styles/performance.css'
import './styles/routines.css'
import './styles/mobile-log.css'
import './styles/today-recovery.css'
import './styles/music-widget.css'
import './styles/gym-floor.css'
import './styles/mobile-refinement.css'
import './styles/gym-ergonomics.css'
import './styles/motion.css'


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <DataProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </DataProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
