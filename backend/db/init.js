const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'books.db');
const db = new Database(dbPath);

console.log('Connected to the SQLite database.');

const createTableSQL = `
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    read_status TEXT NOT NULL CHECK(read_status IN ('read', 'yet_to_read')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

try {
  db.exec(createTableSQL);
  console.log('Books table created successfully.');
} catch (err) {
  console.error('Error creating table:', err.message);
}

db.close();
console.log('Database connection closed.');
