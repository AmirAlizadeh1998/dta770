package database

import (
	"database/sql"
	"dta770/config"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	var err error
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	DB, err = sql.Open("postgres", cfg.DatabaseUrl)
	if err != nil {
		log.Fatal(err)
	}
	if err = DB.Ping(); err != nil {
		log.Fatal("نمی‌تونم به دیتابیس وصل بشم:", err)
	}
	DB.SetMaxOpenConns(25)                 // حداکثر کانکشن‌های همزمان
	DB.SetMaxIdleConns(25)                 // حداکثر کانکشن‌های بیکار
	DB.SetConnMaxLifetime(5 * time.Minute) // حداکثر عمر یه کانکشن
	fmt.Println("✅ اتصال به دیتابیس برقرار شد")
}
