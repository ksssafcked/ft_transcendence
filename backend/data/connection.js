const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'), (err) => {
    if (err) console.error('DB Connection error', err);
    else console.log('Connected to SQLite DB');
});

module.exports = db;
