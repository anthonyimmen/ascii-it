// Function to generate ASCII text only (no image file) - respects zoom and pan
export const generateAsciiText = (
  image: File,
  characterSet: string,
  density: number,
  contrast: number,
  containerRef: React.RefObject<HTMLDivElement | null>,
  zoom: number,
  pan: { x: number; y: number }
): Promise<string> => {
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

// Fill container with image
export const fillContainer = (
  imageRef: React.RefObject<HTMLImageElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  setZoom: (zoom: number) => void,
  setPan: (pan: { x: number; y: number }) => void
) => {
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
export const downloadImage = (
  imageRef: React.RefObject<HTMLImageElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  displayImageUrl: string | null,
  zoom: number,
  pan: { x: number; y: number },
  backgroundColor: string,
  image: File | null
) => {
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
  const scaleFactor = 2; // Reasonable resolution multiplier
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
  }, 'image/jpeg', 0.9);
};