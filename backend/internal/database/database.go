package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	var err error
	connStr := "host=45.159.113.114 port=5432 user=tivan password=Tivan@1390 dbname=tivan_db sslmode=disable"
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	if err = DB.Ping(); err != nil {
		log.Fatal("نمی‌تونم به دیتابیس وصل بشم:", err)
	}
	fmt.Println("✅ اتصال به دیتابیس برقرار شد")
}
