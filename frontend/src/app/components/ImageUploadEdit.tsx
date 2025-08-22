'use client'

import { Slider } from '@/components/ui/slider';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Checkbox } from './Checkbox';
import { imageToAscii } from './ImageToAscii';
import Dropdown from './Dropdown';

// TODO: begin top 10-15 recently generated images being shown, add back touch image panning in window

interface ImageUploadEditProps {
  onImageUploaded?: () => void;
}

function ImageUploadEdit({ onImageUploaded }: ImageUploadEditProps) {
  const [image, setImage] = useState<File | null>(null);
  const [asciiImage, setAsciiImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [asciiPreviewUrl, setAsciiPreviewUrl] = useState<string | null>(null);
  const [isCheckedColor, setIsCheckedColor] = useState(true);
  const [isCheckedTwitterBanner, setIsCheckedTwitterBanner] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#222222");
  const [viewOriginal, setViewOriginal] = useState(true); 
  const [characterSet, setCharacterSet] = useState(".:*-=+%#@");
  const [density, setDensity] = useState(50);
  const [contrast, setContrast] = useState(5)
  const [asciiText, setAsciiText] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'copy' | 'copied'>('copy');

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to generate ASCII text only (no image file) - respects zoom and pan
  const generateAsciiText = (image: File, characterSet: string, density: number, contrast: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!containerRef.current) {
        reject(new Error('Container not available'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = function() {
        // Map character set
        let chars = characterSet;
        if (characterSet === ".:*-=+%#@") {
          chars = ".:*-=+%#@";
        } else if (characterSet === "⠁⠂⠃⠄⠅⠆⠇") {
          chars = "⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟";
        } else {
          chars = " ░▒▓█";
        }
        
        // Get container dimensions
        const container = containerRef.current!;
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // Calculate the display size of the image in the container
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
        
        // The viewport shows the entire container, so we need to capture exactly what's visible
        // regardless of zoom and pan
        
        // Set canvas dimensions for ASCII generation based on container size and density
        const minDensity = 1;
        const maxDensity = 10;
        const densityFactor = Math.max(minDensity, Math.min(density, maxDensity));
        
        // ASCII dimensions should match the container viewport
        // Adjust for ASCII character aspect ratio (characters are typically taller than wide)
        const asciiWidth = Math.floor(containerWidth * densityFactor / 10);
        const asciiHeight = Math.floor(containerHeight * densityFactor / 30); // Adjusted ratio to reduce vertical stretch
        
        canvas.width = asciiWidth;
        canvas.height = asciiHeight;
        
        // Create a temporary canvas that matches the container size
        const viewportCanvas = document.createElement('canvas');
        const viewportCtx = viewportCanvas.getContext('2d');
        viewportCanvas.width = containerWidth;
        viewportCanvas.height = containerHeight;
        
        // Calculate where to draw the image in the viewport canvas (same as display logic)
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        
        const imageLeft = centerX - zoomedWidth / 2 + pan.x;
        const imageTop = centerY - zoomedHeight / 2 + pan.y;
        
        // Draw the full image at the zoomed and panned position
        viewportCtx!.drawImage(img, imageLeft, imageTop, zoomedWidth, zoomedHeight);
        
        // Now scale the viewport canvas to ASCII resolution
        ctx!.drawImage(viewportCanvas, 0, 0, containerWidth, containerHeight, 0, 0, asciiWidth, asciiHeight);
        
        // Get image data
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        let asciiArt = '';
        
        // Process each pixel
        for (let y = 0; y < canvas.height; y++) {
          let row = '';
          for (let x = 0; x < canvas.width; x++) {
            const pixelIndex = (y * canvas.width + x) * 4;
            const r = pixels[pixelIndex];
            const g = pixels[pixelIndex + 1];
            const b = pixels[pixelIndex + 2];
            
            const pixelBrightness = Math.floor((r + g + b) / 3);
            
            // Apply contrast enhancement
            const normalizedBrightness = pixelBrightness / 255;
            const enhancedBrightness = Math.pow(normalizedBrightness, 1 / contrast);
            const clampedBrightness = Math.max(0, Math.min(1, enhancedBrightness));
            
            const charIndex = Math.floor(clampedBrightness * (chars.length - 1));
            const char = chars[charIndex];
            
            row += char;
          }
          asciiArt += row + '\n';
        }
        
        resolve(asciiArt);
      };
      
      img.onerror = function() {
        reject(new Error('Failed to load image'));
      };
      
      // Load the image file
      const reader = new FileReader();
      reader.onload = function(e) {
        if (e.target && e.target.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      reader.onerror = function() {
        reject(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(image);
    });
  };

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

  useEffect(() => {
    if (isCheckedTwitterBanner) {
      setPan({x: 0, y: 0});
    }
  }, [isCheckedTwitterBanner])
  

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
      setViewOriginal(true);
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

  // Handle touch events for mobile pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset zoom and pan
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Fill container with image
  const fillContainer = () => {
    if (!imageRef.current || !containerRef.current) return;
    
    const img = imageRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    const imageAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;
    
    // Calculate zoom to fill the container completely
    let fillZoom;
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider - scale to container height
      fillZoom = containerRect.height / (containerRect.width / imageAspectRatio);
    } else {
      // Image is taller - scale to container width  
      fillZoom = containerRect.width / (containerRect.height * imageAspectRatio);
    }
    
    setZoom(fillZoom + .07);
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
    
    // Get the actual display size of the container first
    const containerRect = container.getBoundingClientRect();
    const displayContainerWidth = containerRect.width;
    const displayContainerHeight = containerRect.height;
    
    // Set canvas size to match the actual displayed container dimensions
    const scaleFactor = 10; // High resolution multiplier
    canvas.width = displayContainerWidth * scaleFactor;
    canvas.height = displayContainerHeight * scaleFactor;

    // Clear canvas with same background as container
    ctx.fillStyle = backgroundColor;
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
        a.download = `ascii-${image?.name || 'image.png'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  }, [zoom, pan, image, isCheckedTwitterBanner]);

  const handleGenerateAscii = async () => {
    if (!image) return;
    
    try {
      const asciiImageFile = await imageToAscii(characterSet, isCheckedColor, true, image, backgroundColor, density, contrast);
      setAsciiImage(asciiImageFile);
      
      // Generate ASCII text without image file conversion
      const asciiText = await generateAsciiText(image, characterSet, density, contrast);
      setAsciiText(asciiText);
      setCopyState('copy'); // Reset copy state when new image is generated
      
      setViewOriginal(false); // Switch to ASCII view after generation
    } catch (error) {
      console.error('Error converting to ASCII:', error);
    }
  };

  const handleCopyAscii = async () => {
    if (!asciiText) return;
    
    try {
      await navigator.clipboard.writeText(asciiText);
      setCopyState('copied');
      console.log('ASCII text copied to clipboard');
    } catch (error) {
      console.error('Failed to copy ASCII text:', error);
    }
  };

  const handlePostImage = async () => {
    if (!asciiImage) return;
    
    try {
      // Upload the generated ASCII image to backend
      const formData = new FormData();
      formData.append('image', asciiImage);
      
      const response = await fetch('http://localhost:3000/api/images', {
        method: 'PUT',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('ASCII image uploaded successfully:', result);
        // Trigger refresh of image gallery
        onImageUploaded?.();
      } else {
        console.error('Failed to upload ASCII image:', response.statusText);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  // Switch between original and ASCII image
  const displayImageUrl = previewUrl;
  const displayAsciiPreviewUrl = asciiPreviewUrl;
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
                backgroundColor: "#292929",
                width: isCheckedTwitterBanner ? "min(500px, 90vw)" : "min(400px, 90vw)",
                height: isCheckedTwitterBanner ? "min(125px, 22vh)" : "min(400px, 60vh)",
                borderRadius: 3,
                border: "dashed #cececeff 1px",
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                transition: 'width 0.7s cubic-bezier(.4,0,.2,1), height 0.7s cubic-bezier(.4,0,.2,1)',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              { !viewOriginal && displayAsciiPreviewUrl ? 
                <img
                  ref={imageRef}
                  src={displayAsciiPreviewUrl}
                  alt="Selected preview"
                  className="object-contain absolute top-1/2 left-1/2"
                  style={{
                    width: "100%",
                    height: "100%",
                    transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                  draggable={false}
                /> :
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
                    userSelect: 'none',
                  }}
                  draggable={false}
                />
              }
            </div>
          </div>
          <div className='flex justify-between items-center align-center mt-4 mx-auto' style={{width: isCheckedTwitterBanner ? "min(500px, 90vw)" : "min(400px, 90vw)", transition: 'width 0.7s cubic-bezier(.4,0,.2,1), height 0.7s cubic-bezier(.4,0,.2,1)'}}>
            <div className='flex flex-col gap-2 justify-center align-center' style={{maxWidth: "300px"}}>
              <span className="text-sm text-gray-400">File: {displayFile?.name}</span>
              <span className="text-sm text-gray-400">File Size: {displayFile ? Math.round(displayFile.size / 1024 / 1024) : 0} MB</span>
            </div>
            {/* Zoom controls */}
            <div className='flex flex-col-reverse flex-end gap-2 justify-center align-center'>
              {/* Toggle between original and ASCII */}
              {asciiPreviewUrl &&
                <div className="flex justify-center">
                  <button
                    onClick={() => setViewOriginal(viewOriginal => !viewOriginal)}
                    className={`px-1 text-sm text-white justify-end cursor-pointer`}
                  >
                    {viewOriginal ? "view ascii" : "view original"}
                  </button>
              </div>
              }
              <div className="flex items-center justify-end align-center gap-3" >
                <button
                  onClick={() => setZoom(Math.min(zoom + 0.1, 10))}
                  className="cursor-pointer px-1 text-white rounded text-lg"
                >
                  +
                </button>
                <button
                  onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
                  className="cursor-pointer px-1 text-white rounded text-lg"
                >
                  -
                </button>
                <button
                  onClick={fillContainer}
                  className="cursor-pointer px-1 text-white rounded text-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button
                  onClick={resetZoom}
                  className="cursor-pointer px-1 text-white rounded text-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 px-1">
            <span>density: </span>
            <Slider
              value={[density]} // <-- Controlled value
              onValueChange={(value) => setDensity(value[0])} // <-- Update state
              min={1}
              max={10}
              step={1}
              className="p-4 pr-0"
            />
          </div>
          <div className="flex items-center gap-2 mt-2 px-1">
            <span>contrast: </span>
            <Slider
              value={[contrast]} // <-- Controlled value
              onValueChange={(value) => setContrast(value[0])} // <-- Update state
              min={1}
              max={5}
              step={.5}
              className="p-4 pr-0"
            />
          </div>
          <div className="flex items-center gap-2 mt-3 px-1">
            <span>background: </span>
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="ml-4 pl-2 py-1 text-white border-b-2 flex-1 w-1"
              style={{
                outline: 'none'
              }}
              placeholder="#292929"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
          <div className="flex items-center gap-6 mt-4 pt-2 px-1">
            <span>chars: </span>
              <Dropdown placeholder=".:*-=+%#@" options={[".:*-=+%#@", "⠁⠂⠃⠄⠅⠆⠇", " ░▒▓█"]} value={characterSet} onSelect={(option) => setCharacterSet((option as string))}/>
          </div>
          <div className="flex items-center gap-4 mt-4 px-1">
            <div className="flex items-center gap-2 mt-2">
              <Checkbox checked={isCheckedColor} onChange={() => setIsCheckedColor(!isCheckedColor)}/>
              <span>color?</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Checkbox checked={isCheckedTwitterBanner} onChange={() => setIsCheckedTwitterBanner(!isCheckedTwitterBanner)}/>
              <span>twitter banner?</span>
            </div>
          </div>
          <div className='flex flex-col justify-center items-center gap-4 mt-5 mb-6'>
            <div className='flex flex-row justify-center items-center gap-4'>
              <label
                htmlFor="image-upload"
                className="cursor-pointer px-2 pb-1 text-white transition flex flex-row items-center justify-center gap-2"
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
                className="cursor-pointer px-2 pb-1 text-white transition flex flex-row items-center justify-center gap-2"
              >
                <span className="text-md">download</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={handleCopyAscii}
                disabled={!asciiText}
                className="cursor-pointer px-2 pb-1 text-white transition flex flex-row items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="text-md">{copyState}</span>
                {copyState === 'copy' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
            <div className='flex flex-row justify-center items-center gap-4'>
              <button
                onClick={handleGenerateAscii}
                className="cursor-pointer px-2 pb-1 text-white transition flex flex-row items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="text-md">generate</span>
                <img
                  src="/gen.svg"
                  alt="Generate icon"
                  className="w-4 h-4"
                />
              </button>
              <button
                onClick={handlePostImage}
                disabled={!asciiImage}
                className="cursor-pointer px-3 py-2 text-white transition flex flex-row items-center justify-center gap-2 disabled:opacity-50 border border-white rounded-lg"
              >
                <span className="text-md">post</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploadEdit;