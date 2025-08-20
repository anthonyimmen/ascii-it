const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const app = express();

// Auto-load images on startup if images table is empty
function autoLoadImages() {
  db.get('SELECT COUNT(*) as count FROM images', [], (err, row) => {
    if (err) {
      console.error('Error checking images table:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Images table is empty, auto-loading images from filesystem...');
      const { loadImages } = require('./load-images');
      loadImages();
    } else {
      console.log(`Found ${row.count} existing images in database`);
    }
  });
}

// Initialize auto-loading after database connection
setTimeout(autoLoadImages, 1000);

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Image routes
app.get('/api/images', (req, res) => {
  db.all('SELECT * FROM images ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      res.json({ images: rows });
    }
  });
});

// Upload new image (PUT endpoint)
app.put('/api/images', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const { filename, originalname, path: filePath, size, mimetype } = req.file;

  // Insert new image into database
  const insertQuery = `INSERT INTO images (filename, original_name, file_path, file_size, mime_type) 
                       VALUES (?, ?, ?, ?, ?)`;
  
  db.run(insertQuery, [filename, originalname, filePath, size, mimetype], function(err) {
    if (err) {
      // Delete uploaded file if database insert fails
      fs.unlink(filePath, () => {});
      return res.status(400).json({ error: err.message });
    }

    // Check if we have more than 10 images and delete oldest ones
    db.all('SELECT * FROM images ORDER BY created_at DESC', [], (err, rows) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (rows.length > 10) {
        // Keep only the 10 most recent, delete the rest
        const imagesToDelete = rows.slice(10);
        
        imagesToDelete.forEach(image => {
          // Delete file from filesystem
          const imageFilePath = path.join(__dirname, 'images', image.filename);
          fs.unlink(imageFilePath, (err) => {
            if (err) console.error('Error deleting file:', err);
          });

          // Delete from database
          db.run('DELETE FROM images WHERE id = ?', [image.id], (err) => {
            if (err) console.error('Error deleting from database:', err);
          });
        });
      }

      // Return the newly created image
      res.json({
        id: this.lastID,
        filename,
        original_name: originalname,
        file_path: filePath,
        file_size: size,
        mime_type: mimetype,
        message: 'Image uploaded successfully'
      });
    });
  });
});

app.get('/api/images/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM images WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Image not found' });
    } else {
      res.json(row);
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});