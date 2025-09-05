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
