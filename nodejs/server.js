const express = require("express");
const app = express();
const {initSQLiteDatabase, initTables, populateData, listFilteredItems} = require("./sqlite_db")

const port = 3000;

// initilize sqlite DB
let db;
(async function() {
    db = await initSQLiteDatabase();
    // initialize the tables
    initTables(db).then((tableSpecs) => {
        populateData(db, tableSpecs);
    })})();

// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// API routes declarations
app.get("/", (req, res) => {
    res.send("Hello from Node API");
})

app.get("/all-items", async (req, res) => {
    res.send(await listAllRows(db, 'product'));
})

app.get("/filter-items/", async (req, res) => {
    const rows = await listFilteredItems(db, 'product', req.query)
    res.send(rows)
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});