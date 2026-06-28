import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Get all leaves
app.get('/api/leaves', (req, res) => {
  db.all('SELECT * FROM leaves ORDER BY startDate ASC', [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
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
        res.status(400).json({ error: err.message });
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
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'deleted', changes: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
