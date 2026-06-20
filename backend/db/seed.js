const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'books.db');
const db = new Database(dbPath);

console.log('Connected to the SQLite database.');

const sampleBooks = [
  {
    title: 'The Great Gatsby',
    description: 'Classic American novel about the Jazz Age',
    notes: 'F. Scott Fitzgerald masterpiece',
    read_status: 'read'
  },
  {
    title: 'Atomic Habits',
    description: 'Self-improvement guide for building good habits',
    notes: 'James Clear - excellent practical advice',
    read_status: 'yet_to_read'
  },
  {
    title: 'Clean Code',
    description: 'Programming best practices and code quality',
    notes: 'Robert C. Martin - essential for developers',
    read_status: 'read'
  },
  {
    title: 'The Pragmatic Programmer',
    description: 'Software development wisdom and techniques',
    notes: 'Andrew Hunt and David Thomas',
    read_status: 'yet_to_read'
  },
  {
    title: 'Design Patterns',
    description: 'Software architecture patterns and best practices',
    notes: 'Gang of Four - classic reference',
    read_status: 'read'
  },
  {
    title: 'Refactoring',
    description: 'Code improvement techniques and methodologies',
    notes: 'Martin Fowler - practical guide',
    read_status: 'yet_to_read'
  },
  {
    title: 'You Don\'t Know JS',
    description: 'JavaScript deep dive and advanced concepts',
    notes: 'Kyle Simpson - comprehensive series',
    read_status: 'read'
  },
  {
    title: 'Eloquent JavaScript',
    description: 'JavaScript programming guide and reference',
    notes: 'Marijn Haverbeke - great for beginners',
    read_status: 'yet_to_read'
  }
];

const insertSQL = `
  INSERT INTO books (title, description, notes, read_status) 
  VALUES (?, ?, ?, ?)
`;

try {
  const insert = db.transaction((books) => {
    const stmt = db.prepare(insertSQL);
    for (const book of books) {
      stmt.run(book.title, book.description, book.notes, book.read_status);
      console.log(`Inserted: ${book.title}`);
    }
  });
  
  insert(sampleBooks);
  console.log('Sample data seeded successfully.');
} catch (err) {
  console.error('Error inserting data:', err.message);
}

db.close();
console.log('Database connection closed.');
