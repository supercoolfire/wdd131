import { useState, useCallback } from 'react'
import { usePresets } from '../contexts/PresetsContext'
import Cropper from 'react-easy-crop'
import './PresetEditor.css'

function PresetEditor({ preset, onClose }) {
  const { addPreset, updatePreset } = usePresets()
  const isEditing = !!preset

  const [formData, setFormData] = useState({
    name: preset?.name || '',
    aspectRatio: preset?.aspectRatio || 16/9,
    baseQuality: preset?.baseQuality || 80,
    dynamicQualityScaling: preset?.dynamicQualityScaling ?? true,
    lossy: preset?.lossy ?? true,
    outputFormat: preset?.outputFormat || 'webp',
    folderSuffix: preset?.folderSuffix ?? false,
    crops: preset?.crops || [
      { fileSuffix: '-small', width: 500 },
      { fileSuffix: '-medium', width: 1000 },
      { fileSuffix: '-large', width: 1500 }
    ],
    cropPosition: preset?.cropPosition || { x: 0.5, y: 0.5 },
    zoom: preset?.zoom || 1
  })

  const [sampleImage, setSampleImage] = useState(null)
  const [crop, setCrop] = useState(formData.cropPosition)
  const [zoom, setZoom] = useState(formData.zoom)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCrop(croppedArea)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const presetData = { ...formData, cropPosition: crop, zoom }
    if (isEditing) {
      updatePreset(preset.id, presetData)
    } else {
      addPreset(presetData)
    }
    onClose()
  }

  const handleCropChange = (index, field, value) => {
    const newCrops = [...formData.crops]
    newCrops[index] = { ...newCrops[index], [field]: value }
    setFormData({ ...formData, crops: newCrops })
  }

  const addCrop = () => {
    setFormData({
      ...formData,
      crops: [...formData.crops, { fileSuffix: '', width: 500 }]
    })
  }

  const removeCrop = (index) => {
    setFormData({
      ...formData,
      crops: formData.crops.filter((_, i) => i !== index)
    })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setSampleImage(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const aspectRatioOptions = [
    { value: 16/9, label: '16:9 (Landscape)' },
    { value: 4/3, label: '4:3 (Landscape)' },
    { value: 3/4, label: '3:4 (Portrait)' },
    { value: 9/16, label: '9:16 (Portrait)' }
  ]

  return (
    <div className="preset-editor">
      <div className="editor-header">
        <h2>{isEditing ? 'Edit Preset' : 'Create New Preset'}</h2>
        <button className="btn btn-secondary" onClick={onClose}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-layout">
          <div className="form-left">
            <div className="form-section">
              <h3>Basic Settings</h3>
              
              <div className="form-group">
                <label>Preset Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Aspect Ratio</label>
                <select
                  value={formData.aspectRatio}
                  onChange={(e) => setFormData({ ...formData, aspectRatio: parseFloat(e.target.value) })}
                >
                  {aspectRatioOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Base Quality: {formData.baseQuality}%</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.baseQuality}
                  onChange={(e) => setFormData({ ...formData, baseQuality: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Output Format</label>
                <select
                  value={formData.outputFormat}
                  onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                >
                  <option value="webp">WebP</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="avif">AVIF</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-checkbox">
                  <input
                    type="checkbox"
                    id="dynamicQuality"
                    checked={formData.dynamicQualityScaling}
                    onChange={(e) => setFormData({ ...formData, dynamicQualityScaling: e.target.checked })}
                  />
                  <label htmlFor="dynamicQuality">Dynamic Quality Scaling</label>
                </div>
                <div className="form-checkbox">
                  <input
                    type="checkbox"
                    id="lossy"
                    checked={formData.lossy}
                    onChange={(e) => setFormData({ ...formData, lossy: e.target.checked })}
                  />
                  <label htmlFor="lossy">Lossy Compression</label>
                </div>
                <div className="form-checkbox">
                  <input
                    type="checkbox"
                    id="folderSuffix"
                    checked={formData.folderSuffix}
                    onChange={(e) => setFormData({ ...formData, folderSuffix: e.target.checked })}
                  />
                  <label htmlFor="folderSuffix">Use Folder Suffix</label>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header">
                <h3>Crop Sizes</h3>
                <button type="button" className="btn btn-small btn-secondary" onClick={addCrop}>
                  ➕ Add Size
                </button>
              </div>
              
              {formData.crops.map((crop, index) => (
                <div key={index} className="crop-item">
                  <input
                    type="text"
                    placeholder="Suffix (e.g., -small)"
                    value={crop.fileSuffix}
                    onChange={(e) => handleCropChange(index, 'fileSuffix', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Width"
                    value={crop.width}
                    onChange={(e) => handleCropChange(index, 'width', parseInt(e.target.value) || 0)}
                  />
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => removeCrop(index)}
                    disabled={formData.crops.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-right">
            <div className="form-section">
              <h3>Crop Position Preview</h3>
              <div className="crop-preview-section">
                {!sampleImage ? (
                  <div className="upload-placeholder">
                    <p>Upload a sample image to preview crop position</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      id="sample-image-upload"
                    />
                    <label htmlFor="sample-image-upload" className="btn btn-primary">
                      Choose Image
                    </label>
                  </div>
                ) : (
                  <>
                    <div className="crop-container">
                      <Cropper
                        image={sampleImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={formData.aspectRatio}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        cropShape="rect"
                        showGrid={true}
                      />
                    </div>
                    <div className="crop-controls">
                      <label>Zoom: {zoom.toFixed(1)}x</label>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSampleImage(null)}
                    >
                      Change Image
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {isEditing ? 'Update Preset' : 'Create Preset'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PresetEditor
