'use client'

import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { cn } from "@/lib/utils"
import { Checkbox } from './Checkbox';

function ImageUploadEdit() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCheckedColor, setIsCheckedColor] = useState(false);
  const [isCheckedTwitterBanner, setIsCheckedTwitterBanner] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setImage(null);
      setPreviewUrl(null);
    }
  };

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

      {/* Preview */}
      {previewUrl && (
        <div>
          <div className="flex flex-col-reverse justify-center items-center align-center gap-2">
            <img
              src={previewUrl}
              alt="Selected preview"
              className="max-w-[400px] max-h-[300px] border border-gray-400 rounded"
            />
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
