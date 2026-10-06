import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT, 10) || 5000;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all leaves
app.get('/api/leaves', (req, res) => {
  db.all('SELECT * FROM leaves ORDER BY startDate ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching leaves from SQLite:', err.message);
      res.status(500).json({ error: err.message, data: [] });
      return;
    }
    res.json({ data: rows || [] });
  });
});

// Add a new leave
app.post('/api/leaves', (req, res) => {
  const { name, startDate, endDate, reason, type } = req.body;
  if (!name || !startDate || !endDate || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.run(
    'INSERT INTO leaves (name, startDate, endDate, reason, type) VALUES (?, ?, ?, ?, ?)',
    [name, startDate, endDate, reason, type],
    function(err) {
      if (err) {
        console.error('Error inserting leave:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: 'success',
        data: { id: this.lastID, name, startDate, endDate, reason, type }
      });
    }
  );
});

// Delete a leave
app.delete('/api/leaves/:id', (req, res) => {
  db.run('DELETE FROM leaves WHERE id = ?', req.params.id, function(err) {
    if (err) {
      console.error('Error deleting leave:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'deleted', changes: this.changes });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Explicitly bind to 0.0.0.0 for Docker networking
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
