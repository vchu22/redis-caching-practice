const express = require("express");
const app = express();
const {initSQLiteDatabase, initTables, populateData, listRows} = require("./sqlite_db")

const port = 3000;

// initilize sqlite DB
let db;
(async function() {
    db = await initSQLiteDatabase();
    // initialize the tables
    initTables(db).then((tableSpecs) => {
        populateData(db, tableSpecs);
    })})();

app.get("/", (req, res) => {
    res.send("Hello from Node API");
})

app.get("/all-items", async (req, res) => {
    res.send(await listRows(db, 'product'));
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});