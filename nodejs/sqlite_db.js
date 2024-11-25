const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const csv = require('csv-parser');

const dbFile = './test.db'
const dbDirectory = './db_files';

const runQuery = (db, query) => {
  return db.run(query, (err) => {
    if (err) {
      console.log('\x1b[31m%s\x1b[0m', `Query Failed: ${query}`)
      console.error(err)
    }
    else {
      console.log('\x1b[36m%s\x1b[0m', `Query Success: ${query}`)
    };
  });
}

// Function to initialize the database
async function initSQLiteDatabase() {
  // Check if the database file exists
  if (fs.existsSync(dbFile)) {
    // Delete the database file to reset it
    fs.unlinkSync(dbFile);
  }

  const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) return console.error(err.message);
  });
  return db;
}

async function initTables(db) {
  // read table specs from csv file
  let resObj = {};
  return new Promise((resolve, reject) => { 
    fs.createReadStream(`${dbDirectory}/table_specs.csv`)
    .pipe(csv())
    .on('data', (data) => {
      const table_name = data['table_name'];
      const column_name = data['column_name'];
      delete data['table_name'];
      delete data['column_name'];
      let new_obj = {[column_name] : data};
      if (table_name in resObj) resObj[table_name] = {...resObj[table_name], ...new_obj};
      else resObj[table_name] = new_obj;
    })
    .on('end', () => {
      // create table specs base on file data
      for (const table in resObj){
        let primary_keys_count = 0, primary_keys_str = "";
        let foreign_keys_count = 0, foreign_keys_str = "";
        
        const keys = Object.keys(resObj[table])
        let columns = keys.reduce((accum, column_name, idx) => {
            let curr_def = resObj[table][column_name];
            let curr_str = `${column_name}${(curr_def['type'].length > 0? ` ${curr_def['type']}` : "")}`;
            if (curr_def['primary_key'] === 'T') {
              primary_keys_str += `${primary_keys_count==0?'PRIMARY KEY (':''}${column_name},`;
              primary_keys_count++;
              curr_def['not_null'] = true;
              curr_def['unique'] = true;
              curr_def['primary_key'] = true;
            } else {
              curr_def['not_null'] = (curr_def['not_null'] === 'T'? true : false);
              curr_str += (curr_def['not_null'] === 'T'? ` NOT NULL` : "");
              curr_def['unique'] = (curr_def['unique'] === 'T'? true : false);
              curr_str += (curr_def['unique'] === 'T'? ` UNIQUE` : "");
              curr_def['primary_key'] = false;
            }
            if (curr_def['foreign_key'].length > 0) {
              foreign_keys_str += `FOREIGN KEY (${column_name}) REFERENCES ${curr_def['foreign_key']},`;
              foreign_keys_count++;
            } else {
              curr_def['foreign_key'] = null;
            }
            curr_str += (idx === keys.length-1? '' : ', ');
            return accum + curr_str
          }, "");
        primary_keys_str = primary_keys_str.slice(0,-1) + ")"
        foreign_keys_str = foreign_keys_str.slice(0,-1)

        // run create tables query
        const query = `CREATE TABLE ${table}(${columns}${primary_keys_count > 0? ", " + primary_keys_str : ""}${foreign_keys_count > 0? ", " + foreign_keys_str : ""})`;
        runQuery(db, query)
      }
      resolve(resObj)
    });
  })
}

async function populateData(db, tableSpecs) {
  let files = fs.readdirSync(`${dbDirectory}/tables`);
  
  files.forEach(filename => {
    const table = filename.split('.').slice(0, -1).join('.');
    
    fs.createReadStream(`${dbDirectory}/tables/${filename}`)
    .pipe(csv())
    .on('data', (data) => {
      const columns = Object.keys(data)
      const values = columns.map((key) => {
        switch (tableSpecs[table][key]['type']) {
          case 'TEXT':
          case 'VARCHAR':
            return `'${data[key]}'`
          case 'INTEGER':
          case 'NUMERIC':
            return data[key]
        }
      })
      const query = `INSERT INTO ${table}(${columns}) VALUES(${values})`
      runQuery(db, query)
    });
  });
}

const listRows = async (db, tableName) => {
    const query = `SELECT * FROM ${tableName}`;;
    return await new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) {
            reject(err);
        }
        resolve(rows);
    })});
};

module.exports = {
    initSQLiteDatabase,
    runQuery,
    initTables, 
    populateData,
    listRows
}