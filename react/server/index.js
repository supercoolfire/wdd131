import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import cors from 'cors'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3008

app.use(cors())
app.use(express.json())

const UPLOADS_DIR = path.join(__dirname, 'uploads')

async function init() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true })

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`)
  })
}

init()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})
const upload = multer({ storage })

const sessionFiles = {}

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const sessionId = req.body.sessionId
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' })
    }

    const fileInfo = {
      id: uuidv4(),
      fileName: req.file.originalname,
      filePath: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date().toISOString()
    }

    if (!sessionFiles[sessionId]) {
      sessionFiles[sessionId] = []
    }
    sessionFiles[sessionId].push(fileInfo)

    res.json(fileInfo)
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/files/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId
    const files = sessionFiles[sessionId] || []
    res.json(files)
  } catch (err) {
    console.error('Get files error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/files/:sessionId/:fileId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId
    const fileId = req.params.fileId
    
    const sessionFilesList = sessionFiles[sessionId] || []
    const fileIndex = sessionFilesList.findIndex(f => f.id === fileId)
    
    if (fileIndex !== -1) {
      const file = sessionFilesList[fileIndex]
      try {
        await fs.unlink(path.join(UPLOADS_DIR, file.filePath))
      } catch (e) {
        console.warn('Could not delete file:', e)
      }
      sessionFiles[sessionId].splice(fileIndex, 1)
    }
    
    res.status(204).send()
  } catch (err) {
    console.error('Delete file error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.use('/uploads', express.static(UPLOADS_DIR))

app.get('/api/download', async (req, res) => {
  try {
    const { outputFolder } = req.query
    const absolutePath = path.resolve(__dirname, '..', outputFolder)
    
    try {
      await fs.access(absolutePath)
    } catch {
      return res.status(404).json({ error: 'Output folder not found' })
    }
    
    const files = await fs.readdir(absolutePath)
    
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files found in output folder' })
    }
    
    const zip = new JSZip()
    
    for (const file of files) {
      const filePath = path.join(absolutePath, file)
      const stat = await fs.stat(filePath)
      
      if (stat.isFile()) {
        const content = await fs.readFile(filePath)
        zip.file(file, content)
      } else {
        const subFiles = await fs.readdir(filePath)
        for (const subFile of subFiles) {
          const subFilePath = path.join(filePath, subFile)
          const content = await fs.readFile(subFilePath)
          zip.folder(file).file(subFile, content)
        }
      }
    }
    
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="processed-images.zip"`)
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    res.send(zipBuffer)
  } catch (err) {
    console.error('Download error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/process', async (req, res) => {
  try {
    const { presets, assignments, files, fileCrops, outputFolder } = req.body
    console.log('Processing request received:', { presetsCount: presets.length, filesCount: files.length, fileCrops })

    const absoluteOutputPath = path.resolve(__dirname, '..', outputFolder)
    await fs.mkdir(absoluteOutputPath, { recursive: true })

    let totalTasks = 0
    let completedTasks = 0

    files.forEach(file => {
      const presetIds = assignments[file.id] || []
      presetIds.forEach(presetId => {
        const preset = presets.find(p => p.id === presetId)
        if (preset) {
          totalTasks += preset.crops.length
        }
      })
    })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    for (const file of files) {
      const presetIds = assignments[file.id] || []
      const inputPath = path.join(UPLOADS_DIR, file.filePath)
      const fileCrop = fileCrops && fileCrops[file.id]
      console.log('Processing file:', file.fileName, 'with crop data:', fileCrop)

      // Get image metadata for dimensions
      const metadata = await sharp(inputPath).metadata()
      const imgWidth = metadata.width || 1000
      const imgHeight = metadata.height || 1000
      console.log('Image dimensions:', imgWidth, 'x', imgHeight)

      for (const presetId of presetIds) {
        const preset = presets.find(p => p.id === presetId)
        if (!preset) continue

        const maxCropArea = Math.max(...preset.crops.map(c => {
          const height = Math.round(c.width / preset.aspectRatio)
          return c.width * height
        }))

        for (const cropSize of preset.crops) {
          try {
            const targetHeight = Math.round(cropSize.width / preset.aspectRatio)
            const cropArea = cropSize.width * targetHeight

            let quality = preset.baseQuality
            if (preset.dynamicQualityScaling) {
              const minQuality = 30
              const qualityScale = cropArea / maxCropArea
              quality = Math.round(minQuality + (preset.baseQuality - minQuality) * qualityScale)
              quality = Math.min(Math.max(quality, 1), 100)
            }

            let destPath = absoluteOutputPath
            if (preset.folderSuffix) {
              const folderName = path.basename(file.fileName, path.extname(file.fileName)) + cropSize.fileSuffix
              destPath = path.join(absoluteOutputPath, folderName)
              await fs.mkdir(destPath, { recursive: true })
            }

            const baseName = path.basename(file.fileName, path.extname(file.fileName))
            const outputFileName = `${baseName}${cropSize.fileSuffix}.${preset.outputFormat}`
            const outputFilePath = path.join(destPath, outputFileName)

            let pipeline = sharp(inputPath)
            const hasCrop = fileCrop && fileCrop.crop

            // Apply crop if we have crop settings
            if (hasCrop) {
              const cropData = fileCrop.crop
              console.log('Applying crop:', cropData)
              if (cropData.unit === '%') {
                const pixelX = Math.round((cropData.x / 100) * imgWidth)
                const pixelY = Math.round((cropData.y / 100) * imgHeight)
                const pixelWidth = Math.round((cropData.width / 100) * imgWidth)
                const pixelHeight = Math.round((cropData.height / 100) * imgHeight)
                console.log('Crop pixels:', { left: pixelX, top: pixelY, width: pixelWidth, height: pixelHeight })
                
                // Make sure we don't go out of bounds
                const validX = Math.max(0, pixelX)
                const validY = Math.max(0, pixelY)
                const validWidth = Math.min(pixelWidth, imgWidth - validX)
                const validHeight = Math.min(pixelHeight, imgHeight - validY)
                console.log('Valid crop:', { left: validX, top: validY, width: validWidth, height: validHeight })
                
                if (validWidth > 0 && validHeight > 0) {
                  pipeline = pipeline.extract({
                    left: validX,
                    top: validY,
                    width: validWidth,
                    height: validHeight
                  })
                }
              }
            } else {
              console.log('No crop data available, skipping extraction')
            }

            // Now resize to target dimensions
            if (cropSize.width > 0 && targetHeight > 0) {
              if (hasCrop) {
                // If we already cropped, just resize to fit without covering
                pipeline = pipeline.resize({
                  width: cropSize.width,
                  height: targetHeight,
                  fit: 'fill',
                  kernel: sharp.kernel.lanczos3
                })
              } else {
                // No crop, use cover with attention
                pipeline = pipeline.resize({
                  width: cropSize.width,
                  height: targetHeight,
                  fit: 'cover',
                  position: sharp.strategy.attention,
                  kernel: sharp.kernel.lanczos3
                })
              }
            }

            // Save in desired format
            console.log('Saving to:', outputFilePath)
            if (preset.outputFormat === 'webp') {
              await pipeline.webp({ quality, lossless: !preset.lossy, effort: 6, smartSubsample: true }).toFile(outputFilePath)
            } else if (preset.outputFormat === 'jpeg') {
              await pipeline.jpeg({ quality, mozjpeg: true }).toFile(outputFilePath)
            } else if (preset.outputFormat === 'png') {
              await pipeline.png({ quality, compressionLevel: 9 }).toFile(outputFilePath)
            } else if (preset.outputFormat === 'avif') {
              await pipeline.avif({ quality, effort: 6 }).toFile(outputFilePath)
            }

            completedTasks++
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            res.write(`data: ${JSON.stringify({ progress, message: `Processed ${outputFileName}` })}\n\n`)
          } catch (err) {
            console.error('Error processing crop:', err)
          }
        }
      }
    }

    res.write(`data: ${JSON.stringify({ complete: true, progress: 100, outputPath: absoluteOutputPath })}\n\n`)
    res.end()
  } catch (err) {
    console.error('Processing error:', err)
    res.status(500).json({ error: err.message })
  }
})
