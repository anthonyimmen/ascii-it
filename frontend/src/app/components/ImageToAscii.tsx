export function generateAsciiFromImage(
  setType: string,
  color: boolean,
  brightness: boolean,
  image: File | null,
  density: number,
  contrast: number,
  options?: { targetCharWidth?: number }
): Promise<{ plain: string; rich: string }> {
  const characterSets = [
    " .:*-=+%#@",
    " ⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟",
    " ░▒▓█"
  ];

  // Map the setType to a character set
  if (setType == ".:*-=+%#@") {
    setType = characterSets[0];
  } else if (setType == "⠁⠂⠃⠄⠅⠆⠇") {
    setType = characterSets[1];
  } else {
    setType = " ░▒▓█";
  }

  return new Promise((resolve, reject) => {
    if (!image) {
      reject(new Error('No image provided'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
      // Set canvas dimensions - scale down for ASCII art
      const minDensity = 1;
      const maxDensity = 10; // You can set this to whatever you want
      const densityFactor = Math.max(minDensity, Math.min(density, maxDensity));

      // Base width scaled by density factor unless overridden
      const baseMaxWidth = options?.targetCharWidth
        ? Math.max(1, Math.floor(options.targetCharWidth))
        : Math.floor(200 * densityFactor / 10);
      const aspectRatio = (img.height / img.width) * 0.5;
      canvas.width = baseMaxWidth;
      canvas.height = Math.floor(baseMaxWidth * aspectRatio);

      // Draw image to canvas
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const chars = setType;

      let asciiArt = '';

      // Smaller step for higher density (more characters)
      const xStep = Math.max(1, Math.floor(1 / densityFactor));
      const yStep = Math.max(1, Math.floor(1 / densityFactor));

      // Process each pixel row
      for (let y = 0; y < canvas.height; y += yStep) {
        let row = '';
        for (let x = 0; x < canvas.width; x += xStep) {
          const pixelIndex = (y * canvas.width + x) * 4;
          const r = pixels[pixelIndex];
          const g = pixels[pixelIndex + 1];
          const b = pixels[pixelIndex + 2];
          const a = pixels[pixelIndex + 3];

          const pixelBrightness = Math.floor((r + g + b) / 3);

          // Apply contrast enhancement to make whites brighter and darks darker
          const normalizedBrightness = pixelBrightness / 255;
          const enhancedBrightness = Math.pow(normalizedBrightness, 1 / contrast);
          const clampedBrightness = Math.max(0, Math.min(1, enhancedBrightness));

          const charIndex = Math.floor(clampedBrightness * (chars.length - 1));
          const char = chars[charIndex];

          let styledChar = char;
          if (color || brightness) {
            const styles = [] as string[];
            if (color) styles.push(`color: rgb(${r}, ${g}, ${b})`);
            if (brightness) styles.push(`opacity: ${a / 255}`);
            styledChar = `<span style="${styles.join('; ')}">${char}</span>`;
          }
          row += styledChar;
        }
        asciiArt += row + '\n';
      }

      // Plain text version for copying (no HTML)
      const plainText = asciiArt.replace(/<[^>]*>/g, '');
      resolve({ plain: plainText, rich: asciiArt });
    };

    img.onerror = function () {
      reject(new Error('Failed to load image'));
    };

    // Load the image file
    const reader = new FileReader();
    reader.onload = function (e) {
      if (e.target && e.target.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read image file'));
      }
    };
    reader.onerror = function () {
      reject(new Error('Failed to read image file'));
    };
    reader.readAsDataURL(image);
  });
}

export function asciiToImage(
  asciiArt: string,
  backgroundColor: string = "#222222",
  color: boolean = false,
  originalFileName?: string,
  pixelScale?: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const htmlCanvas = document.createElement('canvas');
    const htmlCtx = htmlCanvas.getContext('2d');

    try {
      // Set canvas size for the ASCII art
      const fontSize = 12;
      const charWidth = fontSize * 0.5;
      const lineHeight = fontSize;
      const lines = asciiArt
        .split('\n')
        .filter((line) => line.trim().length > 0); // Remove empty lines
      const maxLineLength = Math.max(
        0,
        ...lines.map((line) => line.replace(/<[^>]*>/g, '').length)
      );

      // Logical layout size in CSS pixels
      const layoutWidth = Math.max(1, Math.floor(maxLineLength * charWidth));
      const layoutHeight = Math.max(1, Math.floor(lines.length * lineHeight));

      // Render at higher pixel density for sharper output
      const scale = 4;
      const effectiveScale = Math.max(1, Math.floor(pixelScale ?? scale));

      htmlCanvas.width = layoutWidth * effectiveScale;
      htmlCanvas.height = layoutHeight * effectiveScale;
      htmlCtx!.scale(effectiveScale, effectiveScale);

      // Fill background
      htmlCtx!.fillStyle = backgroundColor;
      // Use logical layout size for fill after scaling
      htmlCtx!.fillRect(0, 0, layoutWidth, layoutHeight);

      // Set text properties
      htmlCtx!.font = `${fontSize}px 'Courier New', monospace`;
      htmlCtx!.textBaseline = 'top';

      // Draw ASCII art line by line
      lines.forEach((line, lineIndex) => {
        const y = lineIndex * lineHeight;
        let chIndex = 0;

        if (color && line.includes('<span')) {
          // Parse HTML spans for color information
          const spanRegex = /<span style="([^"]*)"[^>]*>([^<]*)<\/span>/g;
          let match;
          let lastIndex = 0;

          while ((match = spanRegex.exec(line)) !== null) {
            // Handle any plain text before this span
            const plainText = line.substring(lastIndex, match.index);
            for (let i = 0; i < plainText.length; i++) {
              if (plainText[i] !== '<' && plainText[i] !== '>') {
                const x = chIndex * charWidth;
                htmlCtx!.fillStyle = 'white';
                htmlCtx!.fillText(plainText[i], x, y);
                chIndex++;
              }
            }

            // Parse the style attribute for color
            const styleAttr = match[1];
            const colorMatch = styleAttr.match(/color:\s*rgb\(([^)]+)\)/);
            const opacityMatch = styleAttr.match(/opacity:\s*([^;]+)/);

            let fillColor = 'white';
            if (colorMatch) {
              const rgbValues = colorMatch[1].split(',').map((v) => parseInt(v.trim()));
              fillColor = `rgb(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]})`;
            }

            // Apply opacity if present
            if (opacityMatch) {
              const opacity = parseFloat(opacityMatch[1]);
              if (colorMatch) {
                const rgbValues = colorMatch[1].split(',').map((v) => parseInt(v.trim()));
                fillColor = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${opacity})`;
              } else {
                fillColor = `rgba(255, 255, 255, ${opacity})`;
              }
            }

            // Draw the character with the parsed color
            const ch = match[2];
            const x = chIndex * charWidth;
            htmlCtx!.fillStyle = fillColor;
            htmlCtx!.fillText(ch, x, y);
            chIndex++;

            lastIndex = spanRegex.lastIndex;
          }

          // Handle any remaining plain text after the last span
          const remainingText = line.substring(lastIndex).replace(/<[^>]*>/g, '');
          for (let i = 0; i < remainingText.length; i++) {
            const x = chIndex * charWidth;
            htmlCtx!.fillStyle = 'white';
            htmlCtx!.fillText(remainingText[i], x, y);
            chIndex++;
          }
        } else {
          // No color styling, draw as plain white text
          const cleanLine = line.replace(/<[^>]*>/g, '');
          for (let i = 0; i < cleanLine.length; i++) {
            const ch = cleanLine[i];
            const x = i * charWidth;
            htmlCtx!.fillStyle = 'white';
            htmlCtx!.fillText(ch, x, y);
          }
        }
      });

      // Convert canvas to blob (PNG for crisp text) and then to File
      htmlCanvas.toBlob((blob) => {
        if (blob) {
          const base = originalFileName ? originalFileName.replace(/\.[^/.]+$/, '') : 'image';
          const fileName = `ascii-${base}.png`;
          const file = new File([blob], fileName, { type: 'image/png' });
          resolve(file);
        } else {
          reject(new Error('Failed to create image file'));
        }
      }, 'image/png');
    } catch (e) {
      reject(e);
    }
  });
}

// Backward-compatible wrapper: generate text then render to image
export function imageToAscii(
  setType: string,
  color: boolean,
  brightness: boolean,
  image: File | null,
  backgroundColor: string = "#222222",
  density: number,
  contrast: number
): Promise<File> {
  return new Promise(async (resolve, reject) => {
    try {
      const { rich } = await generateAsciiFromImage(
        setType,
        color,
        brightness,
        image,
        density,
        contrast
      );
      const out = await asciiToImage(rich, backgroundColor, color, image?.name);
      resolve(out);
    } catch (e) {
      reject(e);
    }
  });
}
