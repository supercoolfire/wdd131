import { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { usePresets } from "../contexts/PresetsContext";
import { useSession } from "../contexts/SessionContext";
import "./CropModal.css";

function CropModal({ file, onClose }) {
  const { presets } = usePresets();
  const { setFileCrop, fileCrops } = useSession();
  const [selectedOption, setSelectedOption] = useState("preset");
  const [selectedPresetId, setSelectedPresetId] = useState(presets[0]?.id);
  const [crop, setCrop] = useState();
  const imgRef = useRef(null);

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);
  const aspectRatio =
    selectedOption === "preset" && selectedPreset
      ? selectedPreset.aspectRatio
      : 16 / 9;

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = makeAspectCrop(
      {
        unit: "%",
        width: 100,
      },
      aspectRatio,
      width,
      height
    );
    const centeredCrop = centerCrop(initialCrop, width, height);
    setCrop(centeredCrop);
  }, [aspectRatio]);

  const handleApply = useCallback(() => {
    setFileCrop(file.id, {
      option: selectedOption,
      presetId: selectedPresetId,
      crop: crop,
      aspectRatio: aspectRatio,
    });
    alert("Crop settings saved!");
    onClose();
  }, [
    file.id,
    selectedOption,
    selectedPresetId,
    aspectRatio,
    crop,
    setFileCrop,
    onClose,
  ]);

  return (
    <div className="crop-modal-overlay" onClick={onClose}>
      <div className="crop-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Fine Tune Crop for {file.fileName}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="options-section">
            <h3>Select Crop Option</h3>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="default"
                  checked={selectedOption === "default"}
                  onChange={() => setSelectedOption("default")}
                />
                Default (16:9)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="preset"
                  checked={selectedOption === "preset"}
                  onChange={() => setSelectedOption("preset")}
                />
                Preset
              </label>
            </div>

            {selectedOption === "preset" && (
              <div className="preset-selector">
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                >
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.aspectRatio.toFixed(2)})
                    </option>
                  ))}
                </select>
                {selectedPreset && (
                  <div className="preset-details">
                    <p>Aspect Ratio: {selectedPreset.aspectRatio.toFixed(2)}</p>
                    <p>Quality: {selectedPreset.baseQuality}%</p>
                    <p>Format: {selectedPreset.outputFormat.toUpperCase()}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="crop-section">
            <div className="crop-container">
              <ReactCrop
                crop={crop}
                onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
                keepSelection
                aspect={aspectRatio}
              >
                <img
                  ref={imgRef}
                  src={`/uploads/${file.filePath}`}
                  alt="Crop me"
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
            <div className="crop-controls">
              <p>Drag the corners of the box to resize and position the crop!</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

export default CropModal;
