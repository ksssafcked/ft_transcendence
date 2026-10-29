#!/bin/sh

DB_FILE="./data/db.sqlite"
INIT_SQL="./data/init.sql"

if [ ! -s "$DB_FILE" ]; then
	echo "Initialisation de la base SQLite."
	sqlite3 "$DB_FILE" < "$INIT_SQL"
fi

npm start
