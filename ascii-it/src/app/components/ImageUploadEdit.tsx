'use client'

import { Slider } from '@/components/ui/slider';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Checkbox } from './Checkbox';

function ImageUploadEdit() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCheckedColor, setIsCheckedColor] = useState(false);
  const [isCheckedTwitterBanner, setIsCheckedTwitterBanner] = useState(false);
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Reset zoom and pan when new image is loaded
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setImage(null);
      setPreviewUrl(null);
    }
  };

  // Calculate distance between two touch points
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch gesture
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      // Pan gesture
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  }, [pan]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        const newZoom = Math.min(Math.max(zoom * scale, 0.5), 5);
        setZoom(newZoom);
      }
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isDragging) {
      // Pan
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  }, [zoom, lastTouchDistance, isDragging, dragStart]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setLastTouchDistance(0);
  }, []);

  // Handle mouse wheel for desktop zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    const scale = delta > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * scale, 0.5), 5);
    setZoom(newZoom);
  }, [zoom]);

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
    if (!imageRef.current || !canvasRef.current || !previewUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const container = containerRef.current;
    if (!container) return;
    
    // Set canvas size to match the container
    canvas.width = isCheckedTwitterBanner ? 1500 : 400;
    canvas.height = isCheckedTwitterBanner ? 500 : 400;

    // Clear canvas with same background as container
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate the display size of the image in the container
    // The image is displayed with object-contain, so we need to calculate its actual rendered size
    const containerWidth = canvas.width;
    const containerHeight = canvas.height;
    const imageAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight;
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
    } else {
      // Image is taller than container
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
    }

    // Apply zoom to the display dimensions
    const zoomedWidth = displayWidth * zoom;
    const zoomedHeight = displayHeight * zoom;

    // Calculate the position - image is centered by default, then pan is applied
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    const x = centerX - zoomedWidth / 2 + pan.x;
    const y = centerY - zoomedHeight / 2 + pan.y;

    // Draw the image exactly as it appears in the container
    ctx.drawImage(img, x, y, zoomedWidth, zoomedHeight);

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
  }, [previewUrl, zoom, pan, image]);

  const displayImageUrl = previewUrl;

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
        onChange={handleFileChange}
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
                touchAction: 'none'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
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
          <div className='flex justify-between items-center align-center mt-4' style={{width: isCheckedTwitterBanner ? "500px" : "400px"}}>
            <div className='flex flex-col gap-2 justify-center align-center'>
              <span className="text-sm text-gray-400">File: {image?.name}</span>
              <span className="text-sm text-gray-400">File Size: {image ? Math.round(image.size / 1024 / 1024) : 0} MB</span>
            </div>
            {/* Zoom controls */}
            <div className="flex items-center gap-3" >
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
          <div className="flex items-center gap-2 mt-2" style={{width: "400px"}}>
            <span>density: </span>
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              className="p-4"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span>brightness: </span>
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              className="p-4"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span>font size: </span>
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              className="p-4"
            />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 mt-2">
              <Checkbox checked={isCheckedColor} onChange={() => setIsCheckedColor(!isCheckedColor)}/>
              <span>color?</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox checked={isCheckedTwitterBanner} onChange={() => setIsCheckedTwitterBanner(!isCheckedTwitterBanner)}/>
              <span>twitter banner?</span>
            </div>
          </div>
          <div className='flex flex-row justify-center items-center gap-4 mt-4'>
            <label
              htmlFor="image-upload"
              className="cursor-pointer px-2 py-2 text-white rounded-md transition flex flex-row items-center justify-center gap-2"
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
              className="cursor-pointer px-2 py-2 text-white rounded-md transition flex flex-row items-center justify-center gap-2"
            >
              <span className="text-md">download</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <label
              htmlFor="image-generate"
              className="cursor-pointer px-2 py-2 text-white rounded-md transition flex flex-row items-center justify-center gap-2"
            >
              <span className="text-md">generate</span>
              <img
                src="/gen.svg"
                alt="Generate icon"
                className="w-4 h-4"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploadEdit;