const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const dbFile = './test.db'

// Function to initialize the database
function initSQLiteDatabase() {
  // Check if the database file exists
  if (fs.existsSync(dbFile)) {
    // Delete the database file to reset it
    fs.unlinkSync(dbFile);
  }

  const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) return console.error(err.message);
  });
  // Create the table
  const sql = `CREATE TABLE inventory(id INTEGER PRIMARY KEY, item_name, quantity, price, description)`;
  db.run(sql, (err) => {
      if (err) {
      console.error('Error creating table:', err);
      } else {
      console.log('Inventory table created successfully');
      }
  });
  return db;
}

module.exports = {
    initSQLiteDatabase
}