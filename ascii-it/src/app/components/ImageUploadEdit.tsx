'use client'

import { Slider } from '@/components/ui/slider';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Checkbox } from './Checkbox';

function ImageUploadEdit() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [showCropTool, setShowCropTool] = useState(false);
  const [isCheckedColor, setIsCheckedColor] = useState(false);
  const [isCheckedTwitterBanner, setIsCheckedTwitterBanner] = useState(false);

  // Crop tool states
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCroppedImageUrl(null);
      setShowCropTool(true);
      // Reset crop area when new image is loaded
      setCropArea({ x: 50, y: 50, width: 200, height: 150 });
    } else {
      setImage(null);
      setPreviewUrl(null);
      setCroppedImageUrl(null);
      setShowCropTool(false);
    }
  };

  const getMousePosition = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragHandle(handle);
    setDragStart(getMousePosition(e));
    setInitialCrop({ ...cropArea });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragHandle || !initialCrop || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    const deltaX = currentPos.x - dragStart.x;
    const deltaY = currentPos.y - dragStart.y;

    let newCrop = { ...initialCrop };

    switch (dragHandle) {
      case 'move':
        newCrop.x = Math.max(0, Math.min(containerWidth - newCrop.width, initialCrop.x + deltaX));
        newCrop.y = Math.max(0, Math.min(containerHeight - newCrop.height, initialCrop.y + deltaY));
        break;
      case 'nw':
        newCrop.x = Math.max(0, Math.min(initialCrop.x + initialCrop.width - 20, initialCrop.x + deltaX));
        newCrop.y = Math.max(0, Math.min(initialCrop.y + initialCrop.height - 20, initialCrop.y + deltaY));
        newCrop.width = initialCrop.width - (newCrop.x - initialCrop.x);
        newCrop.height = initialCrop.height - (newCrop.y - initialCrop.y);
        break;
      case 'ne':
        newCrop.y = Math.max(0, Math.min(initialCrop.y + initialCrop.height - 20, initialCrop.y + deltaY));
        newCrop.width = Math.max(20, Math.min(containerWidth - initialCrop.x, initialCrop.width + deltaX));
        newCrop.height = initialCrop.height - (newCrop.y - initialCrop.y);
        break;
      case 'sw':
        newCrop.x = Math.max(0, Math.min(initialCrop.x + initialCrop.width - 20, initialCrop.x + deltaX));
        newCrop.width = initialCrop.width - (newCrop.x - initialCrop.x);
        newCrop.height = Math.max(20, Math.min(containerHeight - initialCrop.y, initialCrop.height + deltaY));
        break;
      case 'se':
        newCrop.width = Math.max(20, Math.min(containerWidth - initialCrop.x, initialCrop.width + deltaX));
        newCrop.height = Math.max(20, Math.min(containerHeight - initialCrop.y, initialCrop.height + deltaY));
        break;
      case 'n':
        newCrop.y = Math.max(0, Math.min(initialCrop.y + initialCrop.height - 20, initialCrop.y + deltaY));
        newCrop.height = initialCrop.height - (newCrop.y - initialCrop.y);
        break;
      case 's':
        newCrop.height = Math.max(20, Math.min(containerHeight - initialCrop.y, initialCrop.height + deltaY));
        break;
      case 'w':
        newCrop.x = Math.max(0, Math.min(initialCrop.x + initialCrop.width - 20, initialCrop.x + deltaX));
        newCrop.width = initialCrop.width - (newCrop.x - initialCrop.x);
        break;
      case 'e':
        newCrop.width = Math.max(20, Math.min(containerWidth - initialCrop.x, initialCrop.width + deltaX));
        break;
    }

    // Final boundary check to ensure crop area stays within container
    newCrop.width = Math.min(newCrop.width, containerWidth - newCrop.x);
    newCrop.height = Math.min(newCrop.height, containerHeight - newCrop.y);

    setCropArea(newCrop);
  }, [isDragging, dragHandle, dragStart, initialCrop]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
    setInitialCrop(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const applyCrop = () => {
    if (!previewUrl) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate scale factors
      const scaleX = img.width / 400;
      const scaleY = img.height / 300;

      canvas.width = cropArea.width * scaleX;
      canvas.height = cropArea.height * scaleY;

      ctx?.drawImage(
        img,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const croppedDataUrl = canvas.toDataURL();
      setCroppedImageUrl(croppedDataUrl);
      setShowCropTool(false);
    };

    img.src = previewUrl;
  };

  const resetCrop = () => {
    setCroppedImageUrl(null);
    setShowCropTool(true);
  };

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    width: '8px',
    height: '8px',
    backgroundColor: '#3b82f6',
    border: '1px solid white',
    cursor: 'grab'
  };

  const displayImageUrl = croppedImageUrl || previewUrl;

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
      {/* Custom Upload Button */}
      <label
        htmlFor="image-upload"
        className="cursor-pointer px-2 py-0 text-white rounded-md transition flex flex-row items-center justify-center gap-4 mb-1"
      >
        <span className="text-md">upload image</span>
        <img
          src="/upload.svg"
          alt="Upload icon"
          className="w-8 h-8"
        />
      </label>

      {/* Hidden File Input */}
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Crop Tool */}
      {showCropTool && previewUrl && (
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-semibold text-white">Crop Your Image</h3>
          <div 
            ref={containerRef}
            className="relative inline-block border-2 border-gray-400"
            style={{ width: '400px', height: '300px' }}
          >
            <img
              src={previewUrl}
              alt="Crop preview"
              className="w-full h-full object-cover"
              draggable={false}
            />
            
            {/* Crop overlay */}
            <div
              className="absolute border-2 border-gray-400 bg-opacity-10 cursor-move"
              style={{
                left: `${cropArea.x}px`,
                top: `${cropArea.y}px`,
                width: `${cropArea.width}px`,
                height: `${cropArea.height}px`
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
              {/* Corner handles */}
              <div
                style={{ ...handleStyle, left: '-4px', top: '-4px', cursor: 'nw-resize' }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'nw'); }}
              />
              <div
                style={{ ...handleStyle, right: '-4px', top: '-4px', cursor: 'ne-resize' }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'ne'); }}
              />
              <div
                style={{ ...handleStyle, left: '-4px', bottom: '-4px', cursor: 'sw-resize' }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'sw'); }}
              />
              <div
                style={{ ...handleStyle, right: '-4px', bottom: '-4px', cursor: 'se-resize' }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'se'); }}
              />
              
              {/* Edge handles */}
              <div
                style={{ ...handleStyle, left: '50%', top: '-4px', transform: 'translateX(-50%)', cursor: 'n-resize' }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'n'); }}
              />
              <div
                style={{ ...handleStyle, left: '50%', bottom: '-4px', transform: 'translateX(-50%)', cursor: 's-resize' }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 's'); }}
              />
              <div
                style={{ ...handleStyle, left: '-4px', top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'w'); }}
              />
              <div
                style={{ ...handleStyle, right: '-4px', top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'e'); }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={applyCrop}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Apply Crop
            </button>
            <button
              onClick={() => setShowCropTool(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Skip Crop
            </button>
          </div>
          
          <div className="text-sm text-gray-400">
            Crop Size: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
          </div>
        </div>
      )}

      {/* Preview and Controls */}
      {displayImageUrl && !showCropTool && (
        <div>
          <div className="flex flex-col-reverse justify-center items-center align-center gap-2">
            <img
              src={displayImageUrl}
              alt="Selected preview"
              className="max-w-[400px] max-h-[300px] border border-gray-400 rounded"
            />
            {croppedImageUrl && (
              <button
                onClick={resetCrop}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Recrop Image
              </button>
            )}
          </div>
          <div className='flex flex-col gap-2 mt-4'>
            <span className="text-sm text-gray-400">Selected File: {image?.name}</span>
            <span className="text-sm text-gray-400">File Size: {image ? Math.round(image.size / 1024 / 1024) : 0} MB</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
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
              <span>twitter banner size?</span>
            </div>
          </div>
          <label
            htmlFor="image-generate"
            className="cursor-pointer px-2 py-2 text-white rounded-md transition flex flex-row items-center justify-center gap-2 m-4"
          >
            <span className="text-md">generate</span>
            <img
              src="/gen.svg"
              alt="Generate icon"
              className="w-4 h-4"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default ImageUploadEdit;