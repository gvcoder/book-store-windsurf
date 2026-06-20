# Code Review - June 20, 2026

## Critical Issues

### 1. Missing Database Connection Cleanup - `backend/db/connection.js`
The database connection is never closed when the application shuts down, which can lead to:
- Resource leaks
- WAL file not being properly cleaned up
- Potential data corruption on abrupt termination

**Location**: Lines 7-20

**Fix**: Add graceful shutdown handler:
```javascript
process.on('SIGINT', closeDb);
process.on('SIGTERM', closeDb);
```

### 2. Missing Title Validation in PUT Endpoint - `backend/server.js`
The POST endpoint validates that title is not empty (line 68), but the PUT endpoint (line 114) allows updating title to an empty string.

**Location**: Lines 114-116

**Fix**: Add validation:
```javascript
if (title !== undefined && (title.trim() === '')) {
  return res.status(400).json({ error: 'Title cannot be empty' });
}
```

### 3. No Transaction for Seed Data - `backend/db/seed.js`
The seed script inserts multiple rows without a transaction. If one insert fails, partial data remains in the database.

**Location**: Lines 65-71

**Fix**: Wrap in transaction:
```javascript
const insert = db.transaction((books) => {
  const stmt = db.prepare(insertSQL);
  for (const book of books) {
    stmt.run(book.title, book.description, book.notes, book.read_status);
  }
});
insert(sampleBooks);
```

## Medium Priority Issues

### 4. Generic Error Messages May Leak Information - `backend/server.js`
Error responses are generic (line 15, 38, 57, 88, 146, 167), but in development mode, the full error stack is logged to console. In production, detailed error logging could expose sensitive information.

**Location**: Lines 13-16, 36-39, 55-58, 86-89, 144-147, 165-168

**Recommendation**: Use environment-based error logging:
```javascript
if (process.env.NODE_ENV === 'development') {
  console.error(err.stack);
}
```

### 5. Missing Input Type Validation - `backend/server.js`
The API doesn't validate that request body fields are strings. If someone sends `title: 123` or `title: {obj: "value"}`, it could cause unexpected behavior.

**Location**: Lines 65, 97

**Recommendation**: Add type validation:
```javascript
if (title !== undefined && typeof title !== 'string') {
  return res.status(400).json({ error: 'Title must be a string' });
}
```

### 6. No Rate Limiting - `backend/server.js`
The API has no rate limiting, making it vulnerable to abuse/DoS attacks.

**Recommendation**: Add rate limiting middleware like `express-rate-limit`.

### 7. CORS Configuration Too Permissive - `backend/server.js`
Line 9 uses `cors()` with default settings, which allows requests from any origin.

**Location**: Line 9

**Recommendation**: Configure specific allowed origins:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
```

## Low Priority Issues

### 8. Missing Content-Type Validation
The API doesn't validate that requests have `Content-Type: application/json`.

### 9. No Request Size Limit
Large request bodies could cause memory issues. Add:
```javascript
app.use(express.json({ limit: '1mb' }));
```

### 10. Database File in Git Repository
The `books.db`, `books.db-shm`, and `books.db-wal` files should be in `.gitignore`.

**Location**: `backend/db/`

### 11. Missing Health Check Endpoint
No endpoint to verify server/database health status.

### 12. Package.json Main Field Mismatch
`package.json` specifies `"main": "index.js"` (line 5) but the entry point is `server.js`.

**Location**: `backend/package.json` line 5

## Positive Aspects

- Good use of parameterized queries to prevent SQL injection
- Proper HTTP status codes (404, 400, 201, 500)
- CHECK constraint in database schema for `read_status`
- WAL mode enabled for better concurrency
- Clean separation of concerns with database module
