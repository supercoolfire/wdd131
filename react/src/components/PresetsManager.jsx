import { useState } from 'react'
import { usePresets } from '../contexts/PresetsContext'
import './PresetsManager.css'
import PresetEditor from './PresetEditor'

function PresetsManager() {
  const { presets, deletePreset, exportPresets, importPresets } = usePresets()
  const [editingPreset, setEditingPreset] = useState(null)
  const [showEditor, setShowEditor] = useState(false)

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (file) {
      importPresets(file)
    }
  }

  if (showEditor) {
    return (
      <PresetEditor
        preset={editingPreset}
        onClose={() => {
          setShowEditor(false)
          setEditingPreset(null)
        }}
      />
    )
  }

  return (
    <div className="presets-manager">
      <div className="presets-header">
        <h2>Presets Manager</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => {
            document.getElementById('import-file').click()
          }}>
            📥 Import
          </button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button className="btn btn-secondary" onClick={exportPresets}>
            📤 Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowEditor(true)}>
            ➕ New Preset
          </button>
        </div>
      </div>

      <div className="presets-grid">
        {presets.map(preset => (
          <div key={preset.id} className="preset-card">
            <div className="preset-header">
              <h3>{preset.name}</h3>
            </div>
            <div className="preset-details">
              <p>Aspect Ratio: {preset.aspectRatio.toFixed(2)}</p>
              <p>Crops: {preset.crops.length} sizes</p>
              <p>Quality: {preset.baseQuality}%</p>
              <p>Format: {preset.outputFormat.toUpperCase()}</p>
            </div>
            <div className="preset-actions">
              <button
                className="btn btn-small btn-secondary"
                onClick={() => {
                  setEditingPreset(preset)
                  setShowEditor(true)
                }}
              >
                Edit
              </button>
              <button
                className="btn btn-small btn-danger"
                onClick={() => deletePreset(preset.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PresetsManager
