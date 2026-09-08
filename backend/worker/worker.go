package worker

import (
	"database/sql"
	"log"
	"time"
)

func StartDeviceDeactivationWorker(db *sql.DB) {
	// هر ۱ دقیقه یک‌بار دیتابیس رو چک می‌کنه
	ticker := time.NewTicker(1 * time.Minute)

	go func() {
		for range ticker.C {
			query := `
				UPDATE devices 
				SET deactivated_at = NOW(),
				    is_active = FALSE 
				WHERE end_time IS NOT NULL 
				  AND end_time <= NOW() 
				  AND (is_active = TRUE OR deactivated_at IS NULL)
			`
			result, err := db.Exec(query)
			if err != nil {
				log.Printf("[Worker Error] خطا در غیرفعال‌سازی دستگاه‌های منقضی‌شده: %v", err)
				continue
			}

			if rowsAffected, _ := result.RowsAffected(); rowsAffected > 0 {
				log.Printf("[Worker] تعداد %d دستگاه به دلیل اتمام زمان، غیرفعال و is_active=false شدند.", rowsAffected)
			}
		}
	}()
}
