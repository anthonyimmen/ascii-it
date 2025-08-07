export function imageToAscii(setType: string, color: boolean, brightness: boolean, image: File | null, backgroundColor: string = "#222222"): Promise<File> {
  const characterSets = [
    ".:*-=+%#@",
    "⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟",
    " ░▒▓█"
  ];

  // Map the setType to a character set
  if (setType == ".:*-=+%#@") {
    setType = characterSets[0];
  } else if (setType == "⠁⠂⠃⠄⠅⠆⠇") {
    setType = characterSets[1];
  } else {
    setType = " ░▒▓█"
  }

  return new Promise((resolve, reject) => {
    if (!image) {
      reject(new Error('No image provided'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
      // Set canvas dimensions - scale down for ASCII art
      const maxWidth = 100;
      const aspectRatio = img.height / img.width;

      // TODO: add in adjustable detail slider divide on the width and multiply the height
      // TODO: add in adjustable brightness detection?
      canvas.width = Math.min(img.width, maxWidth) / .5;
      canvas.height = Math.floor(Math.min(img.width, maxWidth) * aspectRatio);
      
      // Draw image to canvas
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Get character set
      const chars = setType;
      
      let asciiArt = '';
      
      // Process each pixel row
      for (let y = 0; y < canvas.height; y++) {
        let row = '';
        
        for (let x = 0; x < canvas.width; x++) {
          const pixelIndex = (y * canvas.width + x) * 4;
          const r = pixels[pixelIndex];
          const g = pixels[pixelIndex + 1];
          const b = pixels[pixelIndex + 2];
          const a = pixels[pixelIndex + 3];
          
          // Calculate brightness (0-255)
          const pixelBrightness = Math.floor((r + g + b) / 3);
          
          // Map brightness to character index
          const charIndex = Math.floor((pixelBrightness / 255) * (chars.length - 1));
          const char = chars[charIndex];
          
          // Apply color and brightness styling
          let styledChar = char;
          
          if (color || brightness) {
            let styles = [];
            
            if (color) {
              styles.push(`color: rgb(${r}, ${g}, ${b})`);
            }
            
            if (brightness) {
              const opacity = a / 255;
              styles.push(`opacity: ${opacity}`);
            }
            
            styledChar = `<span style="${styles.join('; ')}">${char}</span>`;
          }
          
          row += styledChar;
        }
        
        asciiArt += row + '\n';
      }
      
      // Convert ASCII to canvas and then to File
      const htmlCanvas = document.createElement('canvas');
      const htmlCtx = htmlCanvas.getContext('2d');
      
      // Set canvas size for the ASCII art
      const fontSize = 12;
      const charWidth = fontSize * .5;
      const lineHeight = fontSize;
      const lines = asciiArt.split('\n').filter(line => line.trim().length > 0); // Remove empty lines
      const maxLineLength = Math.max(...lines.map(line => line.replace(/<[^>]*>/g, '').length));
      
      htmlCanvas.width = maxLineLength * charWidth;
      htmlCanvas.height = lines.length * lineHeight;
      
      // Fill background
      htmlCtx!.fillStyle = backgroundColor;
      htmlCtx!.fillRect(0, 0, htmlCanvas.width, htmlCanvas.height);
      
      // Set text properties
      htmlCtx!.font = `${fontSize}px 'Courier New', monospace`;
      htmlCtx!.textBaseline = 'top';
      
      // Draw ASCII art line by line
      lines.forEach((line, lineIndex) => {
        const y = lineIndex * lineHeight;
        let charIndex = 0;
        
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
                const x = charIndex * charWidth;
                htmlCtx!.fillStyle = 'white';
                htmlCtx!.fillText(plainText[i], x, y);
                charIndex++;
              }
            }
            
            // Parse the style attribute for color
            const styleAttr = match[1];
            const colorMatch = styleAttr.match(/color:\s*rgb\(([^)]+)\)/);
            const opacityMatch = styleAttr.match(/opacity:\s*([^;]+)/);
            
            let fillColor = 'white';
            if (colorMatch) {
              const rgbValues = colorMatch[1].split(',').map(v => parseInt(v.trim()));
              fillColor = `rgb(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]})`;
            }
            
            // Apply opacity if present
            if (opacityMatch) {
              const opacity = parseFloat(opacityMatch[1]);
              if (colorMatch) {
                const rgbValues = colorMatch[1].split(',').map(v => parseInt(v.trim()));
                fillColor = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${opacity})`;
              } else {
                fillColor = `rgba(255, 255, 255, ${opacity})`;
              }
            }
            
            // Draw the character with the parsed color
            const char = match[2];
            const x = charIndex * charWidth;
            htmlCtx!.fillStyle = fillColor;
            htmlCtx!.fillText(char, x, y);
            charIndex++;
            
            lastIndex = spanRegex.lastIndex;
          }
          
          // Handle any remaining plain text after the last span
          const remainingText = line.substring(lastIndex).replace(/<[^>]*>/g, '');
          for (let i = 0; i < remainingText.length; i++) {
            const x = charIndex * charWidth;
            htmlCtx!.fillStyle = 'white';
            htmlCtx!.fillText(remainingText[i], x, y);
            charIndex++;
          }
        } else {
          // No color styling, draw as plain white text
          const cleanLine = line.replace(/<[^>]*>/g, '');
          for (let i = 0; i < cleanLine.length; i++) {
            const char = cleanLine[i];
            const x = i * charWidth;
            htmlCtx!.fillStyle = 'white';
            htmlCtx!.fillText(char, x, y);
          }
        }
      });
      
      // Convert canvas to blob and then to File
      htmlCanvas.toBlob((blob) => {
        if (blob) {
          const fileName = `ascii-it-${image?.name || 'image.png'}`;
          const file = new File([blob], fileName, { type: 'image/png' });
          resolve(file);
        } else {
          reject(new Error('Failed to create image file'));
        }
      }, 'image/png');
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
}