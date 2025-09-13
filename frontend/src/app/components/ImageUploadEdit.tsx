'use client'

import { Slider } from '@/components/ui/slider';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Checkbox } from './Checkbox';
import { generateAsciiFromImage, asciiToImage } from './ImageToAscii';
import Dropdown from './Dropdown';
import { fillContainer, downloadImage } from '../utils/imageUtils';
import { formatFileSize, cleanupObjectURL, fetchProfileInfo } from '../utils/fileUtils';
import { auth, storage } from '../firebase/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, type User } from 'firebase/auth';

interface ImageUploadEditProps {
  onImageUploaded?: () => void;
}

function ImageUploadEdit({ onImageUploaded }: ImageUploadEditProps) {
  const [image, setImage] = useState<File | null>(null);
  const [twitterProfileInfo, setTwitterProfileInfo] = useState<any | null>(null);
  const [fetchedTwitterUsername, setFetchedTwitterUsername] = useState<string | null>(null);
  const [twitterUsername, setTwitterUsername] = useState<string>('');
  const [asciiImage, setAsciiImage] = useState<File | null>(null);
  const [asciiProfileImage, setAsciiProfileImage] = useState<File | null>(null);
  const [asciiBannerImage, setAsciiBannerImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [asciiPreviewUrl, setAsciiPreviewUrl] = useState<string | null>(null);
  const [asciiProfilePreviewUrl, setAsciiProfilePreviewUrl] = useState<string | null>(null);
  const [asciiBannerPreviewUrl, setAsciiBannerPreviewUrl] = useState<string | null>(null);
  const [isCheckedColor, setIsCheckedColor] = useState(true);
  const [isCheckedTwitterBanner, setIsCheckedTwitterBanner] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#000");
  const [viewOriginal, setViewOriginal] = useState(true); 
  const [characterSet, setCharacterSet] = useState(".:*-=+%#@");
  const [density, setDensity] = useState(50);
  const [contrast, setContrast] = useState(5)
  const [asciiText, setAsciiText] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'copy' | 'copied'>('copy');
  const [isFetchingTwitter, setIsFetchingTwitter] = useState(false);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Track latest Twitter fetch to ignore stale responses
  const twitterRequestIdRef = useRef(0);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setCurrentUser);
    return () => unsub();
  }, []);

  // ---------- Helpers ----------
  const clearUploadState = useCallback(() => {
    cleanupObjectURL(previewUrl);
    cleanupObjectURL(asciiPreviewUrl);
    setImage(null);
    setPreviewUrl(null);
    setAsciiImage(null);
    setAsciiPreviewUrl(null);
  }, [previewUrl, asciiPreviewUrl]);

  const clearTwitterAsciiState = useCallback(() => {
    cleanupObjectURL(asciiProfilePreviewUrl);
    cleanupObjectURL(asciiBannerPreviewUrl);
    setAsciiProfileImage(null);
    setAsciiBannerImage(null);
    setAsciiProfilePreviewUrl(null);
    setAsciiBannerPreviewUrl(null);
  }, [asciiProfilePreviewUrl, asciiBannerPreviewUrl]);

  const resetCopy = useCallback(() => {
    setAsciiText(null);
    setCopyState('copy');
  }, []);

  // Switch between original and ASCII image
  const displayImageUrl = viewOriginal ? previewUrl : (asciiPreviewUrl || previewUrl);
  const displayAsciiPreviewUrl = asciiPreviewUrl;
  const displayFile = viewOriginal ? image : asciiImage;


  // Cleanup object URLs when they change/unmount
  useEffect(() => {
    return () => cleanupObjectURL(previewUrl);
  }, [previewUrl]);
  useEffect(() => {
    return () => cleanupObjectURL(asciiPreviewUrl);
  }, [asciiPreviewUrl]);

  // Create preview URL when asciiImage changes
  useEffect(() => {
    if (asciiImage) {
      // Clean up previous URL
      cleanupObjectURL(asciiPreviewUrl);
      // Create new URL for ASCII image
      const newAsciiUrl = URL.createObjectURL(asciiImage);
      setAsciiPreviewUrl(newAsciiUrl);
    } else {
      setAsciiPreviewUrl(null);
    }
  }, [asciiImage]);

  // Create preview URLs for ASCII Twitter images
  useEffect(() => {
    if (asciiProfileImage) {
      cleanupObjectURL(asciiProfilePreviewUrl);
      const newUrl = URL.createObjectURL(asciiProfileImage);
      setAsciiProfilePreviewUrl(newUrl);
    } else {
      setAsciiProfilePreviewUrl(null);
    }
  }, [asciiProfileImage]);

  useEffect(() => {
    if (asciiBannerImage) {
      cleanupObjectURL(asciiBannerPreviewUrl);
      const newUrl = URL.createObjectURL(asciiBannerImage);
      setAsciiBannerPreviewUrl(newUrl);
    } else {
      setAsciiBannerPreviewUrl(null);
    }
  }, [asciiBannerImage]);

  useEffect(() => {
    if (isCheckedTwitterBanner) {
      setPan({x: 0, y: 0});
    }
  }, [isCheckedTwitterBanner])
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && file.type.startsWith('image/')) {
      // Clean up previous URLs and states
      clearUploadState();
      // If previously viewing a Twitter profile, clear that state so the regular image upload flow renders correctly
      // Invalidate any in-flight Twitter fetch so late responses are ignored
      twitterRequestIdRef.current += 1;
      setTwitterProfileInfo(null);
      clearTwitterAsciiState();
      resetCopy();
      
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setViewOriginal(true);
      // Reset zoom and pan when new image is loaded
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      clearUploadState();
      setTwitterProfileInfo(null);
      clearTwitterAsciiState();
      resetCopy();
    }
    // Ensure choosing the same file triggers onChange next time
    if (e.currentTarget) {
      try { e.currentTarget.value = ''; } catch {}
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
  const handleFillContainer = () => {
    fillContainer(imageRef, containerRef, setZoom, setPan);
  };

  // Download the current view of the image(s)
  const handleDownloadImage = useCallback(() => {
    if (twitterProfileInfo) {
      // Download both profile and banner images
      if (asciiProfileImage || twitterProfileInfo.profileUrl) {
        const profileUrl = !viewOriginal && asciiProfilePreviewUrl
          ? asciiProfilePreviewUrl
          : twitterProfileInfo.profileUrl;
        downloadImageFromUrl(profileUrl, `${fetchedTwitterUsername || 'twitter'}-profile${!viewOriginal ? '-ascii' : ''}.jpg`);
      }
      
      if (asciiBannerImage || twitterProfileInfo.bannerUrl) {
        const bannerUrl = !viewOriginal && asciiBannerPreviewUrl
          ? asciiBannerPreviewUrl
          : twitterProfileInfo.bannerUrl;
        downloadImageFromUrl(bannerUrl, `${fetchedTwitterUsername || 'twitter'}-banner${!viewOriginal ? '-ascii' : ''}.jpg`);
      }
    } else if (image) {
      // Download regular image
      downloadImage(imageRef, canvasRef, containerRef, displayImageUrl, zoom, pan, backgroundColor, image);
    }
  }, [zoom, pan, image, backgroundColor, displayImageUrl, twitterProfileInfo, viewOriginal, asciiProfileImage, asciiBannerImage, asciiProfilePreviewUrl, asciiBannerPreviewUrl]);

  // Helper function to download image from URL
  const downloadImageFromUrl = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank'; // Open in new tab if download fails
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleTwitterProfileFetch = async (username: string) => {
    if (!username.trim()) return;
    setIsFetchingTwitter(true);
    const reqId = ++twitterRequestIdRef.current;

    try {
      const requested = username.trim();
      const profileInfo = await fetchProfileInfo(requested);
      // Ignore if a newer request started (e.g., user started uploading an image)
      if (reqId !== twitterRequestIdRef.current) return;
      setTwitterProfileInfo(profileInfo);
      setFetchedTwitterUsername(requested);
      // Show original Twitter images by default until ASCII is generated
      setViewOriginal(true);
      // Clear any previous states so generation targets Twitter
      clearUploadState();
      clearTwitterAsciiState();
      resetCopy();
      console.log('Twitter profile info:', profileInfo);
    } catch (error) {
      console.error('Error fetching Twitter profile:', error);
      if (reqId !== twitterRequestIdRef.current) return;
      setTwitterProfileInfo(null);
      // Ensure we default to original view and clear ASCII state on error as well
      setViewOriginal(true);
      clearUploadState();
      clearTwitterAsciiState();
      resetCopy();
    } finally {
      if (reqId === twitterRequestIdRef.current) setIsFetchingTwitter(false);
    }
  };

  const handleTwitterInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTwitterProfileFetch(twitterUsername);
      setTwitterUsername("")
    }
  };

  // Convert URL to File object
  const urlToFile = async (url: string, filename: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  };

  const handleGenerateAscii = async () => {
    if (!image && !twitterProfileInfo) return;
    
    try {
      // Prefer Twitter flow if a profile is loaded
      if (twitterProfileInfo) {
        // Handle Twitter profile images
        const tasks: Promise<string | null>[] = [];
        let profileAsciiText: string | null = null;
        let bannerAsciiText: string | null = null;
        
        // Generate ASCII for profile image
        if (twitterProfileInfo.profileUrl) {
          const profileImageFile = await urlToFile(twitterProfileInfo.profileUrl, 'profile.jpg');
          tasks.push((async () => {
            const gen = await generateAsciiFromImage(
              characterSet,
              isCheckedColor,
              true,
              profileImageFile,
              density,
              contrast,
              { targetCharWidth: 160 }
              
            );
            const asciiFile = await asciiToImage(gen.rich, backgroundColor, isCheckedColor, profileImageFile.name);
            setAsciiProfileImage(asciiFile);
            profileAsciiText = gen.plain;
            return gen.plain;
          })());
        }
        
        // Generate ASCII for banner image
        if (twitterProfileInfo.bannerUrl) {
          const bannerImageFile = await urlToFile(twitterProfileInfo.bannerUrl, 'banner.jpg');
          tasks.push((async () => {
            const gen = await generateAsciiFromImage(
              characterSet,
              isCheckedColor,
              true,
              bannerImageFile,
              density,
              contrast,
              { targetCharWidth: 200 }
            );
            const asciiFile = await asciiToImage(gen.rich, backgroundColor, isCheckedColor, bannerImageFile.name);
            setAsciiBannerImage(asciiFile);
            bannerAsciiText = gen.plain;
            return gen.plain;
          })());
        }
        
        await Promise.all(tasks);
        const maybeTexts: (string | null)[] = [profileAsciiText, bannerAsciiText];
        const parts: string[] = maybeTexts.filter((p): p is string => p !== null);
        if (parts.length > 0) {
          // Join profile then banner ASCII texts with two newlines
          const combined = parts.join('\n\n');
          setAsciiText(combined);
          setCopyState('copy');
        } else {
          setAsciiText(null);
        }
        setViewOriginal(false); // Switch to ASCII view after generation
      } else if (image) {
        // Handle regular image upload
        const gen = await generateAsciiFromImage(
          characterSet,
          isCheckedColor,
          true,
          image,
          density,
          contrast
        );
        setAsciiText(gen.plain);
        const asciiImageFile = await asciiToImage(gen.rich, backgroundColor, isCheckedColor, image.name);
        setAsciiImage(asciiImageFile);
        setCopyState('copy'); // Reset copy state when new image is generated
        
        setViewOriginal(false); // Switch to ASCII view after generation
      }
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
    if (!auth.currentUser) {
      console.warn('user must be logged in to post');
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      if (twitterProfileInfo && (asciiProfileImage || asciiBannerImage)) {
        // Send both profile and banner to backend for safety + upload
        const form = new FormData();
        form.append('twitterUsername', fetchedTwitterUsername || twitterUsername || 'twitter');
        if (asciiProfileImage) form.append('profile', asciiProfileImage);
        if (asciiBannerImage) form.append('banner', asciiBannerImage);
        const resp = await fetch('https://ascii-it--ascii-it-54ba2.us-central1.hosted.app/api/twitter-images', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!resp.ok) {
          const e = await resp.json().catch(() => ({}));
          throw new Error(`upload_failed: ${resp.status} ${JSON.stringify(e)}`);
        }
        await resp.json();
      } else if (asciiImage) {
        const form = new FormData();
        form.append('image', asciiImage);
        const resp = await fetch('https://ascii-it--ascii-it-54ba2.us-central1.hosted.app/api/images', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!resp.ok) {
          const e = await resp.json().catch(() => ({}));
          throw new Error(`upload_failed: ${resp.status} ${JSON.stringify(e)}`);
        }
        await resp.json();
      } else {
        console.warn('nothing to post: no ascii image(s) found');
        return;
      }
      onImageUploaded?.();
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  // Disable download until ASCII is generated (for both flows)
  const isDownloadDisabled = viewOriginal || (twitterProfileInfo
    ? !(asciiProfileImage || asciiBannerImage)
    : !asciiImage);

  const postDisabled = (!currentUser) || (!twitterProfileInfo ? !asciiImage : !(asciiProfileImage || asciiBannerImage));

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
      
      <div className="flex flex-row items-center justify-center gap-4 mb-1">
          <div className="flex items-center">
            <span className="text-white mr-2 pb-1">@</span>
            <input
              type="text"
              className="bg-transparent text-white outline-none border-0 border-b border-white pb-1 w-38"
              placeholder={isFetchingTwitter ? "loading..." : "twitter profile"}
              aria-busy={isFetchingTwitter}
              value={twitterUsername}
              onChange={(e) => setTwitterUsername(e.target.value)}
              onKeyDown={handleTwitterInputKeyDown}
            />
          </div>
          <span>or</span>
          <label
            htmlFor="image-upload"
            className="cursor-pointer px-2 py-0 text-white transition flex flex-row items-center justify-center gap-2"
          >
            <span className="text-md">upload</span>
            <img
              src="/upload.svg"
              alt="Upload icon"
              className="w-6 h-6"
            />
          </label>
        </div>
      

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
      {(displayImageUrl || twitterProfileInfo) && (
        <div className="px-10 mt-3">
          {!twitterProfileInfo && displayImageUrl &&
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
                {!viewOriginal && displayAsciiPreviewUrl ? 
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
          } 
          {twitterProfileInfo && 
            <div className="flex flex-col gap-9 sm:gap-12">
              <div className="flex flex-col-reverse justify-center items-center align-center">
                <div
                  className="relative overflow"
                  style={{
                    backgroundColor: "#292929",
                    width: 'min(500px, 90vw)',
                    aspectRatio: '4 / 1',
                    borderRadius: 3,
                    border: "dashed #cececeff 1px",
                  }}
                >
                  {/* Banner Image */}
                  {twitterProfileInfo.bannerUrl && (
                    <img
                      src={!viewOriginal && asciiBannerPreviewUrl ? asciiBannerPreviewUrl : twitterProfileInfo.bannerUrl}
                      alt="Twitter banner"
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Profile Image - positioned in bottom left, half on banner */}
                  {twitterProfileInfo.profileUrl && (
                    <div
                      className="absolute rounded-full overflow-hidden"
                      style={{
                        width: '17%',
                        height: '70%',
                        left: '4%',
                        bottom: '-40%', // Half overlap, responsive to container
                        border: "dashed #cececeff 1px",
                        marginBottom: '10px'
                      }}
                    >
                      <img
                        src={!viewOriginal && asciiProfilePreviewUrl ? asciiProfilePreviewUrl : twitterProfileInfo.profileUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className='flex justify-between items-center align-center mt-0 mx-auto' style={{width: 'min(500px, 90vw)'}}>
                <div className='flex flex-col gap-2 justify-center align-center' style={{maxWidth: "300px"}}>
                  <span className="text-sm text-gray-400 px-1">profile: @{fetchedTwitterUsername || ''}</span>
                </div>
                <div className='flex flex-col-reverse flex-end gap-2 justify-center align-center'>
                  {/* Toggle between original and ASCII */}
                  {(asciiProfilePreviewUrl || asciiBannerPreviewUrl) &&
                    <div className="flex justify-center">
                      <button
                        onClick={() => setViewOriginal(viewOriginal => !viewOriginal)}
                        className={`px-1 text-sm text-white justify-end cursor-pointer`}
                      >
                        {viewOriginal ? "view ascii" : "view original"}
                      </button>
                  </div>
                  }
                </div>
              </div>
            </div>
          }
          {!twitterProfileInfo && 
            <div className='flex justify-between items-center align-center mt-4 mx-auto' style={{width: isCheckedTwitterBanner ? "min(500px, 90vw)" : "min(400px, 90vw)", transition: 'width 0.7s cubic-bezier(.4,0,.2,1), height 0.7s cubic-bezier(.4,0,.2,1)'}}>
              <div className='flex flex-col gap-2 justify-center align-center' style={{maxWidth: "300px"}}>
                <span className="text-sm text-gray-400">File: {displayFile?.name}</span>
                <span className="text-sm text-gray-400">File Size: {displayFile ? formatFileSize(displayFile.size) : '0 KB'}</span>
              </div>
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
                    onClick={handleFillContainer}
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
          }
          {!twitterProfileInfo && 
            <div className="flex items-center gap-2 mt-2 px-1">
              <span>resolution: </span>
              <Slider
                value={[density]} // <-- Controlled value
                onValueChange={(value) => setDensity(value[0])} // <-- Update state
                min={1}
                max={10}
                step={1}
                className="p-4 pr-0"
              />
            </div>
          }
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
              placeholder="#000"
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
            {!twitterProfileInfo && 
              <div className="flex items-center gap-2 mt-3">
                <Checkbox checked={isCheckedTwitterBanner} onChange={() => setIsCheckedTwitterBanner(!isCheckedTwitterBanner)}/>
                <span>twitter banner?</span>
              </div>
            }
          </div>
            <div className='flex flex-col justify-between items-between gap-4 mt-5 mb-6'>
              <div className='flex flex-row justify-between gap-4'>
                <button
                  onClick={handleDownloadImage}
                  disabled={isDownloadDisabled}
                  className="cursor-pointer pb-1 text-white transition flex flex-row items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="text-md">download</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              <button
                onClick={handleGenerateAscii}
                className="cursor-pointer pb-1 text-white transition flex flex-row items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="text-md">generate</span>
                <img
                  src="/gen.svg"
                  alt="Generate icon"
                  className="w-4 h-4"
                />
              </button>
              <button
                onClick={handleCopyAscii}
                disabled={!asciiText}
                className="cursor-pointer pb-1 text-white transition flex flex-row items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="text-md">{copyState}</span>
                {copyState === 'copy' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 28 28">
                    <rect x="5" y="9" width="10" height="15" rx="2" ry="2" strokeWidth="2" />
                    <rect x="9" y="5" width="10" height="15" rx="2" ry="2" strokeWidth="2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 28 28">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="relative group">
                <button
                  onClick={handlePostImage}
                  disabled={postDisabled}
                  aria-describedby={postDisabled ? 'post-tooltip' : undefined}
                  className="pb-1 text-white transition flex flex-row items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="text-md">post</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
                {postDisabled && (
                  <div
                    id="post-tooltip"
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                  >
                    logged in users can post
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploadEdit;
