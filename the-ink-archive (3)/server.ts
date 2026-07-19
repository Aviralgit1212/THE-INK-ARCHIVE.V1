import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_PIECES } from './src/data/content';

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// Ensure data folder exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.json');

// Helper to read database
function readDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(DEFAULT_PIECES, null, 2), 'utf8');
    return DEFAULT_PIECES;
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return DEFAULT_PIECES;
  }
}

// Helper to write database
function writeDb(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    broadcast({ type: 'update', pieces: data });
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// SSE Clients for real-time updates
let clients: any[] = [];

function broadcast(data: any) {
  clients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      console.error('Error broadcasting to client:', e);
    }
  });
}

// API Routes

// SSE endpoint for real-time synchronization
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const currentPieces = readDb();
  // Send initial load
  res.write(`data: ${JSON.stringify({ type: 'init', pieces: currentPieces })}\n\n`);

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Get all pieces
app.get('/api/pieces', (req, res) => {
  const pieces = readDb();
  res.json(pieces);
});

// Add/Update piece
app.post('/api/pieces', (req, res) => {
  const newPiece = req.body;
  if (!newPiece || !newPiece.slug) {
    return res.status(400).json({ error: 'Invalid piece data' });
  }

  const pieces = readDb();
  const index = pieces.findIndex((p: any) => p.slug === newPiece.slug);

  if (index >= 0) {
    // Update existing, merge keeping views
    const existing = pieces[index];
    pieces[index] = {
      ...existing,
      ...newPiece,
      views: typeof newPiece.views === 'number' ? newPiece.views : existing.views
    };
  } else {
    // Create new
    pieces.unshift({
      ...newPiece,
      views: typeof newPiece.views === 'number' ? newPiece.views : 0
    });
  }

  writeDb(pieces);
  res.json({ success: true, pieces });
});

// Delete piece
app.delete('/api/pieces/:slug', (req, res) => {
  const { slug } = req.params;
  const pieces = readDb();
  const filtered = pieces.filter((p: any) => p.slug !== slug);
  writeDb(filtered);
  res.json({ success: true, pieces: filtered });
});

// Increment view
app.post('/api/pieces/:slug/view', (req, res) => {
  const { slug } = req.params;
  const pieces = readDb();
  const index = pieces.findIndex((p: any) => p.slug === slug);
  if (index >= 0) {
    pieces[index].views = (pieces[index].views || 0) + 1;
    writeDb(pieces);
    return res.json({ success: true, views: pieces[index].views });
  }
  res.status(404).json({ error: 'Piece not found' });
});

// Serve frontend / Vite dev middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
