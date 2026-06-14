import { createContext, useContext, useState, useEffect } from 'react'

const SessionContext = createContext()

function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem('sessionId')
    return saved || crypto.randomUUID()
  })
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [fileCrops, setFileCrops] = useState(() => {
    const saved = localStorage.getItem(`fileCrops-${sessionId}`)
    return saved ? JSON.parse(saved) : {}
  })

  useEffect(() => {
    localStorage.setItem('sessionId', sessionId)
  }, [sessionId])

  useEffect(() => {
    localStorage.setItem(`fileCrops-${sessionId}`, JSON.stringify(fileCrops))
  }, [fileCrops, sessionId])

  const setFileCrop = (fileId, cropData) => {
    setFileCrops(prev => ({
      ...prev,
      [fileId]: cropData
    }))
  }

  return (
    <SessionContext.Provider value={{ 
      sessionId, 
      setSessionId, 
      uploadedFiles, 
      setUploadedFiles,
      fileCrops,
      setFileCrop 
    }}>
      {children}
    </SessionContext.Provider>
  )
}

function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

export { SessionProvider, useSession }
