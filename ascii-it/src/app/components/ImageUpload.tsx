'use client'

import { useState } from 'react';

function ImageUploadEdit() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {/* Custom Upload Button */}
      <label
        htmlFor="image-upload"
        className="cursor-pointer px-4 py-4 text-white rounded-md transition"
      >
        <img
          src="/upload.svg"
          alt="Upload icon"
          className="w-10 h-10 "
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
        <div className="flex flex-col-reverse gap-2">
          <span className="text-sm text-gray-400">Selected File: {image?.name}</span>
          <span className="text-sm text-gray-400">File Size: {image ? Math.round(image.size / 1024 / 100 * 100) : 0} MB</span>
          <img
            src={previewUrl}
            alt="Selected preview"
            className="max-w-[300px] max-h-[200px] border border-gray-400 rounded"
          />
        </div>
      )}
    </div>
  );
}

export default ImageUploadEdit;
