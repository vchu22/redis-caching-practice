const express = require("express");
const app = express();
const {initSQLiteDatabase} = require("./db")

const port = 3000;

// initilize sqlite DB
const db = initSQLiteDatabase();

app.get("/", (req, res) => {
    res.send("Hello from Node API")
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});