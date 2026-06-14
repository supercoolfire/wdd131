import { useState, useEffect } from 'react'
import { usePresets } from '../contexts/PresetsContext'
import { useSettings } from '../contexts/SettingsContext'
import { useSession } from '../contexts/SessionContext'
import CropModal from './CropModal'
import './ImageConverter.css'

function ImageConverter() {
  const { presets } = usePresets()
  const { settings } = useSettings()
  const { sessionId, uploadedFiles, setUploadedFiles, fileCrops } = useSession()
  
  const [assignments, setAssignments] = useState({})
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processingComplete, setProcessingComplete] = useState(false)
  const [outputPath, setOutputPath] = useState(null)
  const [lastClickedPreset, setLastClickedPreset] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  // Load uploaded files from server when session loads!
  useEffect(() => {
    async function fetchUploadedFiles() {
      try {
        const res = await fetch(`/api/files/${sessionId}`)
        if (res.ok) {
          const files = await res.json()
          setUploadedFiles(files)
        }
      } catch (err) {
        console.error('Error loading uploaded files:', err)
      }
    }
    fetchUploadedFiles()
  }, [sessionId, setUploadedFiles])

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    await Promise.all(files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionId', sessionId)

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const fileInfo = await res.json()
        setUploadedFiles(prev => [...prev, fileInfo])
      } catch (err) {
        console.error('Error uploading file:', err)
      }
    }))
  }

  const handleUrlUpload = async () => {
    // For URL upload, we'd fetch the image and upload it
    alert('URL upload coming soon!')
  }

  const handleRemoveFile = async (fileId) => {
    try {
      await fetch(`/api/files/${sessionId}/${fileId}`, { method: 'DELETE' })
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
      const newAssignments = { ...assignments }
      delete newAssignments[fileId]
      setAssignments(newAssignments)
    } catch (err) {
      console.error('Error removing file:', err)
    }
  }

  const handleCheckboxChange = (fileId, presetId, e) => {
    const isShiftClick = e.shiftKey
    const isChecked = e.target.checked

    setAssignments(prev => {
      const newAssignments = { ...prev }

      if (isShiftClick && lastClickedPreset === presetId) {
        // Find range
        let inRange = false
        uploadedFiles.forEach(file => {
          if (file.id === fileId || file.id === e.target.dataset.lastFileId) {
            inRange = !inRange
          }
          if (inRange || file.id === fileId || file.id === e.target.dataset.lastFileId) {
            if (isChecked) {
              newAssignments[file.id] = [...(newAssignments[file.id] || []), presetId]
            } else {
              newAssignments[file.id] = (newAssignments[file.id] || []).filter(p => p !== presetId)
            }
          }
        })
      } else {
        // Single file change
        if (isChecked) {
          newAssignments[fileId] = [...(newAssignments[fileId] || []), presetId]
        } else {
          newAssignments[fileId] = (newAssignments[fileId] || []).filter(p => p !== presetId)
        }
      }

      // Deduplicate
      Object.keys(newAssignments).forEach(id => {
        newAssignments[id] = [...new Set(newAssignments[id])]
      })

      return newAssignments
    })

    setLastClickedPreset(presetId)
  }

  const handleSelectAllForPreset = (presetId, isChecked) => {
    setAssignments(prev => {
      const newAssignments = { ...prev }
      uploadedFiles.forEach(file => {
        if (isChecked) {
          newAssignments[file.id] = [...(newAssignments[file.id] || []), presetId]
        } else {
          newAssignments[file.id] = (newAssignments[file.id] || []).filter(p => p !== presetId)
        }
      })
      // Deduplicate
      Object.keys(newAssignments).forEach(id => {
        newAssignments[id] = [...new Set(newAssignments[id])]
      })
      return newAssignments
    })
  }

  const handleProcessImages = async () => {
    const filesToProcess = uploadedFiles.filter(file => assignments[file.id]?.length > 0)
    if (filesToProcess.length === 0) return

    setProcessing(true)
    setProgress(0)
    setProcessingComplete(false)

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          presets: presets,
          assignments: Object.fromEntries(
            filesToProcess.map(file => [file.id, assignments[file.id]])
          ),
          files: filesToProcess,
          fileCrops: fileCrops,
          outputFolder: settings.outputFolder,
          sessionId: sessionId
        })
      })

      if (!response.ok) throw new Error('Processing failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (data.progress !== undefined) {
              setProgress(data.progress)
            }
            if (data.complete) {
              setProcessingComplete(true)
              if (data.outputPath) {
                setOutputPath(data.outputPath)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Processing error:', err)
      alert('Error processing images: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="image-converter">
      <div className="page-header">
        <h1>Image Converter</h1>
        <p>Upload images and apply presets</p>
      </div>

      <div className="upload-section">
        <div className="upload-zone">
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="file-input"
          />
          <label htmlFor="file-upload" className="upload-label">
            <span className="upload-icon">📁</span>
            <p>Drag and drop images here, or click to browse</p>
          </label>
        </div>
        <div className="url-upload">
          <input
            type="url"
            placeholder="Or paste an image URL..."
            className="url-input"
          />
          <button className="btn btn-secondary" onClick={handleUrlUpload}>Add URL</button>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="table-section">
          <div className="table-wrapper">
            <table className="preset-table">
              <thead>
                <tr>
                  <th>Image</th>
                  {presets.map(preset => (
                    <th key={preset.id} className="preset-column">
                      <label className="select-all-label">
                        <input
                          type="checkbox"
                          onChange={(e) => handleSelectAllForPreset(preset.id, e.target.checked)}
                          checked={uploadedFiles.every(file => assignments[file.id]?.includes(preset.id))}
                        />
                        {preset.name}
                      </label>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map(file => (
                  <tr key={file.id} className="file-row">
                    <td className="image-cell">
                      <div 
                        className="image-preview" 
                        onClick={() => setSelectedFile(file)}
                        title="Click to fine tune crop"
                      >
                        <img src={`/uploads/${file.filePath}`} alt={file.fileName} />
                        <div className="file-name">{file.fileName}</div>
                        {fileCrops[file.id] && <span className="crop-indicator">✂️</span>}
                      </div>
                    </td>
                    {presets.map(preset => (
                      <td key={preset.id} className="checkbox-cell">
                        <input
                          type="checkbox"
                          data-last-file-id={uploadedFiles[uploadedFiles.length - 1]?.id}
                          checked={assignments[file.id]?.includes(preset.id) || false}
                          onChange={(e) => handleCheckboxChange(file.id, preset.id, e)}
                        />
                      </td>
                    ))}
                    <td className="actions-cell">
                      <button 
                        className="btn btn-remove" 
                        onClick={() => handleRemoveFile(file.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="action-bar">
            <button
              className="btn btn-primary"
              disabled={processing || uploadedFiles.filter(file => assignments[file.id]?.length > 0).length === 0}
              onClick={handleProcessImages}
            >
              {processing ? 'Processing...' : 'Process Images'}
            </button>
            {processing && (
              <div className="progress-wrapper">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span>{progress.toFixed(0)}%</span>
              </div>
            )}
            {processingComplete && (
              <div className="complete-section">
                <p className="success-message">✅ Processing complete!</p>
                {outputPath && (
                  <>
                    <p className="output-path">
                      Files saved to: <code>{outputPath}</code>
                    </p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        window.open(`/api/download?outputFolder=${encodeURIComponent(settings.outputFolder)}`, '_blank')
                      }}
                    >
                      📥 Download All as ZIP
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedFile && (
        <CropModal 
          file={selectedFile} 
          onClose={() => setSelectedFile(null)} 
        />
      )}
    </div>
  )
}

export default ImageConverter
