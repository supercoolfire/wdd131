# Image Converter UI

A React-based UI for batch image conversion with presets and visual cropping.

## Features

- 🖼️ **Image Upload**: Upload from local files or URLs
- 📋 **Presets**: Create, edit, and manage presets with custom settings
- ✂️ **Visual Cropping**: Use react-easy-crop to set crop positions
- 📊 **Batch Processing**: Table view with shift-click range selection
- 📦 **Multiple Formats**: Support for WebP, JPEG, PNG, and AVIF
- 📱 **Responsive Design**: Works on desktop and mobile

## Getting Started

### Installation

You can use npm or pnpm:

```bash
cd react
pnpm install
# or
npm install
```

### Running the Application

You need to run both the backend server and the frontend:

**Terminal 1 - Backend Server:**
```bash
cd react
pnpm run server
# or
npm run server
```

**Terminal 2 - Frontend Dev Server:**
```bash
cd react
pnpm run dev
# or
npm run dev
```

Then open your browser to `http://localhost:3000`

### First Time Setup

1. Go to **Settings** and set your output folder path (e.g., `../images/output`)
2. Go to **Presets Manager** to create or customize presets
3. Go to **Image Converter** to start processing images!

## Usage

### Creating Presets

1. Go to **Presets Manager** → Click **+ New Preset**
2. Upload a sample image to preview the crop
3. Set your desired aspect ratio, quality, output format, and crop sizes
4. Adjust the crop position and zoom using the visual editor
5. Save your preset

### Processing Images

1. Go to **Image Converter**
2. Upload images (local files or URLs)
3. Check the boxes to apply presets to images
   - Click a checkbox to toggle a single preset
   - Shift-click to select a range of images
   - Use the header checkbox to select/deselect all
4. Click **🚀 Process Images**

## Project Structure

```
react/
├── src/
│   ├── components/
│   │   ├── ImageConverter.jsx    # Main conversion interface
│   │   ├── PresetsManager.jsx    # Preset management
│   │   ├── PresetEditor.jsx      # Preset creation/editing with cropping
│   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   └── Settings.jsx          # Settings page
│   ├── contexts/
│   │   └── PresetsContext.jsx    # State management for presets
│   ├── App.jsx                   # Main app component
│   └── main.jsx                  # Entry point
├── server/
│   └── index.js                  # Express backend with Sharp processing
└── package.json
```

## Built With

- **React 18** - UI framework
- **Vite** - Build tool
- **react-easy-crop** - Image cropping
- **Express** - Backend server
- **Sharp** - Image processing
- **Multer** - File upload handling
