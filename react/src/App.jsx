import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import ImageConverter from './components/ImageConverter'
import PresetsManager from './components/PresetsManager'
import Settings from './components/Settings'
import { PresetsProvider } from './contexts/PresetsContext'
import { SessionProvider } from './contexts/SessionContext'
import { SettingsProvider } from './contexts/SettingsContext'

function App() {
  const [activePage, setActivePage] = useState('converter')

  return (
    <SessionProvider>
      <PresetsProvider>
        <SettingsProvider>
          <div className="app">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <main className="main-content">
              {activePage === 'converter' && <ImageConverter />}
              {activePage === 'presets' && <PresetsManager />}
              {activePage === 'settings' && <Settings />}
            </main>
          </div>
        </SettingsProvider>
      </PresetsProvider>
    </SessionProvider>
  )
}

export default App
