const fs = require('fs');
const path = require('path');
const db = require('./database');

const imagesDir = path.join(__dirname, 'images');

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (err) {
    return null;
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function loadImages() {
  console.log('Loading images from:', imagesDir);
  
  if (!fs.existsSync(imagesDir)) {
    console.error('Images directory does not exist:', imagesDir);
    return;
  }

  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error('Error reading images directory:', err);
      return;
    }

    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
    });

    console.log(`Found ${imageFiles.length} image files`);

    imageFiles.forEach(filename => {
      const filePath = path.join(imagesDir, filename);
      const fileSize = getFileSize(filePath);
      const mimeType = getMimeType(filename);
      const relativePath = path.join('images', filename);

      // Check if image already exists
      db.get('SELECT id FROM images WHERE filename = ?', [filename], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return;
        }

        if (row) {
          console.log(`Image ${filename} already exists in database`);
          return;
        }

        // Insert new image
        db.run(
          'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
          [filename, filename, relativePath, fileSize, mimeType],
          function(err) {
            if (err) {
              console.error(`Error inserting ${filename}:`, err);
            } else {
              console.log(`✓ Loaded ${filename} (ID: ${this.lastID})`);
            }
          }
        );
      });
    });
  });
}

// Run the script
loadImages();

// Close database connection after a delay to allow all operations to complete
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
}, 2000);