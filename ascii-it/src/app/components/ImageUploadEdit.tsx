'use client'

import { Slider } from '@/components/ui/slider';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Checkbox } from './Checkbox';
import { imageToAscii } from './ImageToAscii';

function ImageUploadEdit() {
  const [image, setImage] = useState<File | null>(null);
  const [asciiImage, setAsciiImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [asciiPreviewUrl, setAsciiPreviewUrl] = useState<string | null>(null);
  const [isCheckedColor, setIsCheckedColor] = useState(false);
  const [isCheckedTwitterBanner, setIsCheckedTwitterBanner] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#222222");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewOriginal, setViewOriginal] = useState(true); 
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (asciiPreviewUrl) URL.revokeObjectURL(asciiPreviewUrl);
    };
  }, []);

  // Create preview URL when asciiImage changes
  useEffect(() => {
    if (asciiImage) {
      // Clean up previous URL
      if (asciiPreviewUrl) {
        URL.revokeObjectURL(asciiPreviewUrl);
      }
      // Create new URL for ASCII image
      const newAsciiUrl = URL.createObjectURL(asciiImage);
      setAsciiPreviewUrl(newAsciiUrl);
    } else {
      setAsciiPreviewUrl(null);
    }
  }, [asciiImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && file.type.startsWith('image/')) {
      // Clean up previous URLs
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (asciiPreviewUrl) URL.revokeObjectURL(asciiPreviewUrl);
      
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAsciiImage(null); // Clear ASCII image when new image is uploaded
      setAsciiPreviewUrl(null);
      // Reset zoom and pan when new image is loaded
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setImage(null);
      setPreviewUrl(null);
      setAsciiImage(null);
      setAsciiPreviewUrl(null);
    }
  };

  // Handle mouse events for desktop pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset zoom and pan
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Download the current view of the image
  const downloadImage = useCallback(() => {
    if (!imageRef.current || !canvasRef.current || !displayImageUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const container = containerRef.current;
    if (!container) return;
    
    // Set canvas size to match the container
    canvas.width = isCheckedTwitterBanner ? 1500 : 400;
    canvas.height = isCheckedTwitterBanner ? 500 : 400;

    // Get the actual display size of the container
    const containerRect = container.getBoundingClientRect();
    const displayContainerWidth = containerRect.width;
    const displayContainerHeight = containerRect.height;

    // Clear canvas with same background as container
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate the display size of the image in the container
    const imageAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = displayContainerWidth / displayContainerHeight;

    let displayWidth, displayHeight;
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      displayWidth = displayContainerWidth;
      displayHeight = displayContainerWidth / imageAspectRatio;
    } else {
      // Image is taller than container
      displayHeight = displayContainerHeight;
      displayWidth = displayContainerHeight * imageAspectRatio;
    }

    // Apply zoom to the display dimensions
    const zoomedWidth = displayWidth * zoom;
    const zoomedHeight = displayHeight * zoom;

    // Calculate scale factors between display container and canvas
    const scaleX = canvas.width / displayContainerWidth;
    const scaleY = canvas.height / displayContainerHeight;

    // Scale the zoomed dimensions and pan values for the canvas
    const canvasZoomedWidth = zoomedWidth * scaleX;
    const canvasZoomedHeight = zoomedHeight * scaleY;
    const canvasPanX = pan.x * scaleX;
    const canvasPanY = pan.y * scaleY;

    // Calculate the position - image is centered by default, then pan is applied
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const x = centerX - canvasZoomedWidth / 2 + canvasPanX;
    const y = centerY - canvasZoomedHeight / 2 + canvasPanY;

    // Draw the image exactly as it appears in the container
    ctx.drawImage(img, x, y, canvasZoomedWidth, canvasZoomedHeight);

    // Download the canvas as an image
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited-${image?.name || 'image.png'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  }, [zoom, pan, image, isCheckedTwitterBanner]);

  const handleGenerateAscii = async () => {
    if (!image) return;
    
    setIsGenerating(true);
    try {
      const asciiImageFile = await imageToAscii(0, isCheckedColor, true, image, backgroundColor);
      setAsciiImage(asciiImageFile);
      setViewOriginal(false); // Switch to ASCII view after generation
    } catch (error) {
      console.error('Error converting to ASCII:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Switch between original and ASCII image
  const displayImageUrl = viewOriginal ? previewUrl : asciiPreviewUrl;
  const displayFile = viewOriginal ? image : asciiImage;

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {/* Hidden canvas for downloading */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Custom Upload Button */}
      {!displayImageUrl && 
        <label
          htmlFor="image-upload"
          className="cursor-pointer px-2 py-0 text-white rounded-md transition flex flex-row items-center justify-center gap-4 mb-1"
        >
          <span className="text-md">upload</span>
          <img
            src="/upload.svg"
            alt="Upload icon"
            className="w-8 h-8"
          />
        </label>
      }

      {/* Hidden File Input */}
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { 
          handleFileChange(e); 
          if (asciiPreviewUrl) {
            setAsciiPreviewUrl(null) // fix issue with changing asciiPreviewUrl also effects previewUrl
          }
        }}
      />

      {/* Preview and Controls */}
      {displayImageUrl && (
        <div>
          <div className="flex flex-col-reverse justify-center items-center align-center gap-2">
            <div
              ref={containerRef}
              className="relative overflow-hidden"
              style={{
                backgroundColor: "#222222",
                width: isCheckedTwitterBanner ? "500px" : "400px",
                height: isCheckedTwitterBanner ? "166.67px" : "400px",
                borderRadius: 3,
                border: "solid white .25px",
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                transition: 'width 0.4s cubic-bezier(.4,0,.2,1), height 0.7s cubic-bezier(.4,0,.2,1)'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={displayImageUrl}
                alt="Selected preview"
                className="object-contain absolute top-1/2 left-1/2"
                style={{
                  width: "100%",
                  height: "100%",
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
                draggable={false}
              />
            </div>
          </div>
          <div className='flex justify-between items-center align-center mt-4' style={{width: isCheckedTwitterBanner ? "500px" : "400px", transition: 'width 0.7s cubic-bezier(.4,0,.2,1), height 0.4s cubic-bezier(.4,0,.2,1)'}}>
            <div className='flex flex-col gap-2 justify-center align-center'>
              <span className="text-sm text-gray-400">File: {displayFile?.name}</span>
              <span className="text-sm text-gray-400">File Size: {displayFile ? Math.round(displayFile.size / 1024 / 1024) : 0} MB</span>
              {asciiImage && <span className="text-sm text-green-400">ASCII Generated ✓</span>}
            </div>
            {/* Zoom controls */}
            <div className='flex flex-col-reverse flex-end gap-2 justify-center align-center'>
              {/* Toggle between original and ASCII */}
              {asciiPreviewUrl &&
                <div className="flex gap-2 mb-2 justify-center">
                  <button
                    onClick={() => setViewOriginal(viewOriginal => !viewOriginal)}
                    className={`px-1 py-1 text-sm text-white justify-end cursor-pointer`}
                  >
                    {viewOriginal ? "view ascii" : "view original"}
                  </button>
              </div>
              }
              <div className="flex items-center justify-end align-center gap-3" >
                <button
                  onClick={() => setZoom(Math.min(zoom + 0.1, 5))}
                  className="px-2 py-1 text-white rounded text-lg"
                >
                  +
                </button>
                <button
                  onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
                  className="px-2 py-1 text-white rounded text-lg"
                >
                  -
                </button>
                <button
                  onClick={resetZoom}
                  className="px-2 py-1 text-white rounded text-lg"
                >
                  x
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span>density: </span>
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              className="p-4"
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span>brightness: </span>
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              className="p-4"
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span>font size: </span>
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              className="p-4"
            />
          </div>
          <div className="flex items-center gap-1 mt-3">
            <span>background: </span>
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="px-2 py-1 text-white border-b-2 border-white text-sm flex-1 w-10"
              placeholder="#222222"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 mt-2">
              <Checkbox checked={isCheckedColor} onChange={() => setIsCheckedColor(!isCheckedColor)}/>
              <span>color?</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Checkbox checked={isCheckedTwitterBanner} onChange={() => setIsCheckedTwitterBanner(!isCheckedTwitterBanner)}/>
              <span>twitter banner?</span>
            </div>
          </div>
          <div className='flex flex-row justify-center items-center gap-4 mt-5'>
            <label
              htmlFor="image-upload"
              className="cursor-pointer px-2 pb-1 text-white transition flex flex-row items-center justify-center gap-2 hover:border-b-2 hover:border-white"
            >
              <span className="text-md">upload</span>
              <img
                src="/upload.svg"
                alt="Upload icon"
                className="w-4 h-4"
              />
            </label>
            <button
              onClick={downloadImage}
              className="cursor-pointer px-2 pb-1 text-white transition flex flex-row items-center justify-center gap-2 hover:border-b-2 hover:border-white"
            >
              <span className="text-md">download</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={handleGenerateAscii}
              disabled={isGenerating}
              className="cursor-pointer px-2 pb-1 text-white transition flex flex-row items-center justify-center gap-2 hover:border-b-2 hover:border-white disabled:opacity-50"
            >
              <span className="text-md">generate</span>
              <img
                src="/gen.svg"
                alt="Generate icon"
                className="w-4 h-4"
              />
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
}

export default ImageUploadEdit;