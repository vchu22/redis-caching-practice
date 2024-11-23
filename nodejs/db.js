const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const csv = require('csv-parser');

const dbFile = './test.db'
const dbDirectory = './db_files'

function populateData(db) {

}

function initTables(db) {
  // read table specs from csv file
  let resObj = {};
  fs.createReadStream(`${dbDirectory}/tables.csv`)
  .pipe(csv())
  .on('data', (data) => {
    if (data['table_name'] in resObj) {
      resObj[data['table_name']].push(data);
    } else {
      resObj[data['table_name']] = [data];
    }
    delete data['table_name'];
    return resObj;
  })
  .on('end', () => {
    // create table specs base on file data
    for (const table in resObj){
      let primary_keys_count = 0, primary_keys_str = "";
      let foreign_keys_count = 0, foreign_keys_str = "";

      let columns = resObj[table].reduce(
        (accum, curr, idx) => {
          let str = curr['column_name'];
          str += (curr['type'].length > 0? ` ${curr['type']}` : "");
          if (curr['primary_key'] === 'T') {
            primary_keys_str += `${primary_keys_count==0?'PRIMARY KEY (':''}${curr['column_name']},`;
            primary_keys_count++;
          } else {
            str += (curr['not_null'] === 'T'? ` NOT NULL` : "");
            str += (curr['unique'] === 'T'? ` UNIQUE` : "");
          }
          if (curr['foreign_key'].length > 0) {
            foreign_keys_str += `FOREIGN KEY (${curr['column_name']}) REFERENCES ${curr['foreign_key']},`;
            foreign_keys_count++;
          }
          str += (idx === resObj[table].length-1? '' : ', ');
          return accum + str
        }, "");
      primary_keys_str = primary_keys_str.slice(0,-1) + ")"
      foreign_keys_str = foreign_keys_str.slice(0,-1)

      // run create table query
      let query = `CREATE TABLE ${table}(${columns}${primary_keys_count > 0? ", " + primary_keys_str : ""}${foreign_keys_count > 0? ", " + foreign_keys_str : ""})`;
      console.log('\x1b[36m%s\x1b[0m', "Execute query: " + query)
      db.run(query, (err) => {
          if (err) {
          console.error('Error creating table:', err);
          } else {
          console.log(`${table} table created successfully`);
          }
      });
    }
  });
}

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
  // initialize the tables
  initTables(db);
  populateData(db);
  return db;
}

module.exports = {
    initSQLiteDatabase
}