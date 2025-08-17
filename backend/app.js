const express = require('express');
const path = require('path');
const db = require('./database');
const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

// Example route
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email],
function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      res.json({ id: this.lastID });
    }
  });
});

app.get('/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      res.json({ users: rows });
    }
  });
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