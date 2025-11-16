import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

export default function App() {
  const [image, setImage] = useState(null);
  const [processed, setProcessed] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const processImage = (img) => {
    setAnalyzing(true);

    setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = data[i + 1] = data[i + 2] = gray;
      }

      // Apply simple edge detection
      const edges = detectEdges(imageData);

      const threshold = 100;
      let crackPixels = 0;

      for (let i = 0; i < edges.length; i += 4) {
        if (edges[i] > threshold) {
          edges[i] = 255;
          edges[i + 1] = 0;
          edges[i + 2] = 0;
          crackPixels++;
        } else {
          edges[i] = data[i];
          edges[i + 1] = data[i + 1];
          edges[i + 2] = data[i + 2];
        }
      }

      ctx.putImageData(new ImageData(edges, canvas.width, canvas.height), 0, 0);

      const processedDataUrl = canvas.toDataURL();
      setProcessed(processedDataUrl);

      const totalPixels = canvas.width * canvas.height;
      const crackPercentage = ((crackPixels / totalPixels) * 100).toFixed(2);
      const severity =
        crackPercentage < 1
          ? "Minor"
          : crackPercentage < 3
          ? "Moderate"
          : "Critical";

      setResults({
        crackPercentage,
        severity,
        dimensions: `${canvas.width} x ${canvas.height}`,
        crackPixels,
        recommendation:
          severity === "Critical"
            ? "⚠️ Immediate repair required!"
            : severity === "Moderate"
            ? "🛠 Schedule maintenance soon"
            : "✅ Monitor regularly",
      });

      setAnalyzing(false);
    }, 1000);
  };

  const detectEdges = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const edges = new Uint8ClampedArray(data);

    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0,
          gy = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const pixel = data[idx];
            gx += pixel * sobelX[ky + 1][kx + 1];
            gy += pixel * sobelY[ky + 1][kx + 1];
          }
        }
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const idx = (y * width + x) * 4;
        edges[idx] = edges[idx + 1] = edges[idx + 2] = magnitude;
      }
    }

    return edges;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(event.target.result);
          processImage(img);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadResult = () => {
    if (processed) {
      const link = document.createElement("a");
      link.download = "crack-detection-result.png";
      link.href = processed;
      link.click();
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "text-red-600 bg-red-50";
      case "Moderate":
        return "text-orange-600 bg-orange-50";
      case "Minor":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="w-10 h-10 text-orange-400" />
            <h1 className="text-4xl font-bold text-white">
              Crack Detection System
            </h1>
          </div>
          <p className="text-slate-300 text-lg">
            AI-Powered Infrastructure Health Monitoring
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200">
            <strong>How it works:</strong> Upload an image of a wall or road
            surface. The system highlights crack areas in red using a Sobel edge
            detection algorithm.
          </p>
        </div>

        {/* Main Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" /> Upload Image
            </h2>

            <div
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              {!image ? (
                <div>
                  <Camera className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">Click to upload an image</p>
                  <p className="text-sm text-slate-500">
                    Supports: JPG, PNG, JPEG
                  </p>
                </div>
              ) : (
                <img
                  src={image}
                  alt="Original"
                  className="max-w-full h-auto rounded-lg"
                />
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {image && (
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              >
                Upload Different Image
              </button>
            )}
          </div>

          {/* Result Section */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" /> Detection Results
            </h2>

            {!processed ? (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Upload an image to see results</p>
                </div>
              </div>
            ) : analyzing ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-300">Analyzing image...</p>
                </div>
              </div>
            ) : (
              <div>
                <img
                  src={processed}
                  alt="Processed"
                  className="w-full rounded-lg mb-4"
                />
                <button
                  onClick={downloadResult}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Result
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Report */}
        {results && (
          <div className="mt-6 bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Analysis Report
            </h2>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Crack Coverage</p>
                <p className="text-2xl font-bold text-white">
                  {results.crackPercentage}%
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Severity Level</p>
                <p
                  className={`text-2xl font-bold ${getSeverityColor(
                    results.severity
                  )} px-3 py-1 rounded-lg inline-block`}
                >
                  {results.severity}
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Image Size</p>
                <p className="text-lg font-semibold text-white">
                  {results.dimensions}
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Crack Pixels</p>
                <p className="text-lg font-semibold text-white">
                  {results.crackPixels.toLocaleString()}
                </p>
              </div>
            </div>

            <div
              className={`mt-4 p-4 rounded-lg ${
                results.severity === "Critical"
                  ? "bg-red-900/30 border border-red-500/30"
                  : results.severity === "Moderate"
                  ? "bg-orange-900/30 border border-orange-500/30"
                  : "bg-green-900/30 border border-green-500/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {results.severity === "Critical" ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : results.severity === "Moderate" ? (
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                <span className="font-semibold text-white">Recommendation</span>
              </div>
              <p className="text-slate-200">{results.recommendation}</p>
            </div>
          </div>
        )}

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
