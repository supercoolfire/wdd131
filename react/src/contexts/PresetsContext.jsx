import { createContext, useContext, useState, useEffect } from 'react'

const PresetsContext = createContext()

const defaultPresets = [
  {
    id: 'hero',
    name: 'Hero',
    aspectRatio: 16/9,
    crops: [
      { fileSuffix: '-small', width: 500 },
      { fileSuffix: '-medium', width: 1000 },
      { fileSuffix: '-large', width: 1500 }
    ],
    baseQuality: 50,
    dynamicQualityScaling: true,
    lossy: true,
    outputFormat: 'webp',
    folderSuffix: false,
    cropPosition: { x: 0.5, y: 0.5 },
    zoom: 1
  },
  {
    id: 'portrait',
    name: 'Portrait',
    aspectRatio: 3/4,
    crops: [
      { fileSuffix: '-small', width: 300 },
      { fileSuffix: '-medium', width: 600 },
      { fileSuffix: '-large', width: 900 }
    ],
    baseQuality: 50,
    dynamicQualityScaling: true,
    lossy: true,
    outputFormat: 'webp',
    folderSuffix: false,
    cropPosition: { x: 0.5, y: 0.3 },
    zoom: 1
  },
  {
    id: 'landscape',
    name: 'Landscape',
    aspectRatio: 4/3,
    crops: [
      { fileSuffix: '-small', width: 300 },
      { fileSuffix: '-medium', width: 600 },
      { fileSuffix: '-large', width: 1000 }
    ],
    baseQuality: 50,
    dynamicQualityScaling: true,
    lossy: true,
    outputFormat: 'webp',
    folderSuffix: false,
    cropPosition: { x: 0.5, y: 0.5 },
    zoom: 1
  }
]

export function PresetsProvider({ children }) {
  const [presets, setPresets] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('imageConverterPresets')
    if (saved) {
      setPresets(JSON.parse(saved))
    } else {
      setPresets(defaultPresets)
      localStorage.setItem('imageConverterPresets', JSON.stringify(defaultPresets))
    }
  }, [])

  const savePresets = (newPresets) => {
    setPresets(newPresets)
    localStorage.setItem('imageConverterPresets', JSON.stringify(newPresets))
  }

  const addPreset = (preset) => {
    const newPreset = { ...preset, id: Date.now().toString() }
    savePresets([...presets, newPreset])
  }

  const updatePreset = (id, updatedPreset) => {
    savePresets(presets.map(p => p.id === id ? { ...p, ...updatedPreset } : p))
  }

  const deletePreset = (id) => {
    savePresets(presets.filter(p => p.id !== id))
  }

  const exportPresets = () => {
    const dataStr = JSON.stringify(presets, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'image-converter-presets.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importPresets = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result)
        savePresets(imported)
      } catch (err) {
        alert('Invalid presets file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <PresetsContext.Provider value={{
      presets,
      addPreset,
      updatePreset,
      deletePreset,
      exportPresets,
      importPresets
    }}>
      {children}
    </PresetsContext.Provider>
  )
}

export function usePresets() {
  return useContext(PresetsContext)
}
