import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('imageConverterSettings')
    return saved ? JSON.parse(saved) : {
      outputFolder: '../images/output'
    }
  })

  useEffect(() => {
    localStorage.setItem('imageConverterSettings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export { SettingsProvider, useSettings }
