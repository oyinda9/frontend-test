'use client';
import { useCallback, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import Image from 'next/image';

export default function PDFUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // File handling
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Signature handling
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(
      e.nativeEvent.offsetX * (canvas.width / canvas.clientWidth),
      e.nativeEvent.offsetY * (canvas.height / canvas.clientHeight)
    );
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(
      e.nativeEvent.offsetX * (canvas.width / canvas.clientWidth),
      e.nativeEvent.offsetY * (canvas.height / canvas.clientHeight)
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const saveSignature = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) setSignature(URL.createObjectURL(blob));
    }, 'image/png');
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  // PDF Export
  const exportPdf = async () => {
    if (!file || !signature || isExporting) return;

    try {
      setIsExporting(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Fetch signature as blob
      const signatureBlob = await fetch(signature).then(r => r.blob());
      const signatureBytes = await signatureBlob.arrayBuffer();
      
      const signatureImg = await pdfDoc.embedPng(signatureBytes);
      const { width, height } = signatureImg.scale(0.5);

      pdfDoc.getPages()[0].drawImage(signatureImg, {
        x: 50,
        y: 50,
        width,
        height,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed_${file.name.replace('.pdf', '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-3xl mx-auto p-6 border-2 border-white rounded-2xl bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">PDF Viewer with Signature</h1>
        
        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-900/20' : 'border-gray-500 hover:border-gray-400'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragActive(true)}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('pdf-upload')?.click()}
          >
            <input
              type="file"
              id="pdf-upload"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg text-gray-300">
                {isDragActive ? 'Drop your PDF here' : 'Drag & drop a PDF here or click to browse'}
              </p>
              <p className="text-sm text-gray-400">Supports PDF files only</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-white truncate max-w-xs">
                {file.name}
              </h2>
              <button
                onClick={() => {
                  setFile(null);
                  clearSignature();
                }}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
              >
                Change File
              </button>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow text-white">
              <h3 className="text-lg font-medium mb-3">Add Your Signature</h3>
              <div className="border border-gray-600 rounded-md p-2 bg-black">
                <canvas
                  ref={canvasRef}
                  width={800}  // Higher resolution canvas
                  height={400}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="border border-gray-600 w-full h-40 cursor-crosshair bg-black touch-none"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={saveSignature}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={!canvasRef.current}
                >
                  Save Signature
                </button>
                <button
                  onClick={clearSignature}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
              {signature && (
                <div className="mt-3">
                  <p className="text-sm text-gray-300 mb-1">Saved Signature:</p>
                  <div className="border border-gray-600 max-h-20 bg-black p-1">
                    <Image
                      src={signature}
                      alt="Saved signature"
                      width={160}
                      height={60}
                      className="object-contain h-full w-auto"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={exportPdf}
              disabled={!signature || isExporting}
              className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                signature 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isExporting ? 'Exporting...' : 'Export Signed PDF'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}