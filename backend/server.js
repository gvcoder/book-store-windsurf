const express = require('express');
const cors = require('cors');
const { getDb } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// GET /api/books - Retrieve all books
app.get('/api/books', (req, res) => {
  try {
    const db = getDb();
    const { read_status } = req.query;
    
    let query = 'SELECT * FROM books';
    const params = [];
    
    if (read_status) {
      query += ' WHERE read_status = ?';
      params.push(read_status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const books = db.prepare(query).all(...params);
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET /api/books/:id - Retrieve single book
app.get('/api/books/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// POST /api/books - Create new book
app.post('/api/books', (req, res) => {
  try {
    const db = getDb();
    const { title, description, notes, read_status } = req.body;
    
    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (read_status && !['read', 'yet_to_read'].includes(read_status)) {
      return res.status(400).json({ error: 'read_status must be either "read" or "yet_to_read"' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO books (title, description, notes, read_status)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(title, description || null, notes || null, read_status || 'yet_to_read');
    
    const newBook = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// PUT /api/books/:id - Update existing book
app.put('/api/books/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { title, description, notes, read_status } = req.body;
    
    // Check if book exists
    const existingBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Validation
    if (title !== undefined && title.trim() === '') {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    
    if (read_status && !['read', 'yet_to_read'].includes(read_status)) {
      return res.status(400).json({ error: 'read_status must be either "read" or "yet_to_read"' });
    }
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    if (read_status !== undefined) {
      updates.push('read_status = ?');
      params.push(read_status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const query = `UPDATE books SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);
    
    const updatedBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    
    res.json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE /api/books/:id - Delete book
app.delete('/api/books/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    // Check if book exists
    const existingBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    db.prepare('DELETE FROM books WHERE id = ?').run(id);
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/books`);
});
