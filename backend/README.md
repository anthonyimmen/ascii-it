# ASCII-IT Backend

Express.js backend for the ASCII art generator application with Firebase integration.

## Project Structure

```
backend/
├── src/                    # Source code
│   ├── config/            # Configuration files (Firebase config goes here)
│   ├── routes/            # API routes (future expansion)
│   ├── models/            # Data models (future expansion)  
│   ├── utils/             # Utility functions
│   └── app.js             # Main application file
├── images/                # Temporary uploaded files (before Firebase upload)
├── docs/                  # Documentation
└── node_modules/          # Dependencies
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## API Endpoints

- `GET /api/images` - Get all images (Firebase Firestore)
- `PUT /api/images` - Upload new image (Firebase Storage + Firestore)
- `GET /api/images/:id` - Get specific image (Firebase Firestore)
- `GET /images/:filename` - Serve temporary image files

## Firebase Integration

**Ready for Firebase setup:**
- **Storage**: For image file hosting
- **Firestore**: For image metadata
- **Authentication**: For user management (future)

**Next Steps:**
1. Set up Firebase project
2. Add Firebase SDK dependencies
3. Configure Firebase in `src/config/`
4. Implement Firebase Storage + Firestore integration