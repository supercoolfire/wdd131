import { useState, useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import './Settings.css'

function Settings() {
  const { settings, updateSettings } = useSettings()
  const [outputFolder, setOutputFolder] = useState(settings.outputFolder)

  useEffect(() => {
    setOutputFolder(settings.outputFolder)
  }, [settings])

  const saveSettings = () => {
    updateSettings({ outputFolder })
    alert('Settings saved!')
  }

  return (
    <div className="settings">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure your image converter preferences</p>
      </div>

      <div className="settings-section">
        <h3>Output Configuration</h3>
        <div className="form-group">
          <label htmlFor="outputFolder">Output Folder Path</label>
          <input
            id="outputFolder"
            type="text"
            value={outputFolder}
            onChange={(e) => setOutputFolder(e.target.value)}
            placeholder="e.g., ../images/output"
          />
          <p className="help-text">
            Path where converted images will be saved (relative to project root)
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Authentication (Future)</h3>
        <p className="placeholder-text">Authentication features will be added in a future update.</p>
      </div>

      <button className="btn btn-primary" onClick={saveSettings}>
        Save Settings
      </button>
    </div>
  )
}

export default Settings
