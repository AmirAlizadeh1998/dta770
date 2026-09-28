package handlers

import (
	"database/sql"
	"dta770/internal/database"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
)

func ExportDeviceLogsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "متد غیرمجاز"}`, http.StatusMethodNotAllowed)
		return
	}

	// ۱. گرفتن پارامترها از URL
	queryValues := r.URL.Query()
	deviceName := strings.TrimSpace(queryValues.Get("device_name"))
	imei := strings.TrimSpace(queryValues.Get("imei"))
	limitStr := strings.TrimSpace(queryValues.Get("limit"))
	startDate := strings.TrimSpace(queryValues.Get("startDate"))
	endDate := strings.TrimSpace(queryValues.Get("endDate"))

	if (deviceName == "") != (imei == "") {
		writeExportError(w, http.StatusBadRequest, "پارامترهای device_name و imei باید هم‌زمان ارسال شوند")
		return
	}

	var deviceCode string
	var devStart sql.NullString
	var devEnd sql.NullString

	if deviceName != "" {
		var nullableDeviceCode sql.NullString
		// دریافت start_time و end_time در کنار device_code
		err := database.DB.QueryRow(`
			SELECT device_code, start_time, end_time
			FROM devices
			WHERE device_name = $1 AND imei = $2
			LIMIT 1
		`, deviceName, imei).Scan(&nullableDeviceCode, &devStart, &devEnd)

		if errors.Is(err, sql.ErrNoRows) {
			writeExportError(w, http.StatusNotFound, "دستگاهی با این نام و IMEI پیدا نشد")
			return
		}
		if err != nil {
			log.Printf("خطا در پیدا کردن اطلاعات دستگاه برای خروجی اکسل: %v\n", err)
			writeExportError(w, http.StatusInternalServerError, "خطا در دریافت اطلاعات دستگاه")
			return
		}

		deviceCode = strings.TrimSpace(nullableDeviceCode.String)
		if !nullableDeviceCode.Valid || deviceCode == "" {
			writeExportError(w, http.StatusBadRequest, "کد دستگاه برای این دستگاه تنظیم نشده است")
			return
		}
	}

	// تنظیم بازه مجاز تاریخ‌ها بر اساس دستگاه (اگه تاریخی داده نشده باشه، یا خارج از بازه باشه)
	actualStart := startDate
	actualEnd := endDate

	if deviceName != "" {
		if devStart.Valid && devStart.String != "" {
			// اگه استارت دیت خالیه، یا از استارت دیت دستگاه عقب‌تره، همون تاریخ شروع دستگاه رو در نظر بگیر
			if actualStart == "" || actualStart < devStart.String {
				actualStart = devStart.String
			}
		}
		if devEnd.Valid && devEnd.String != "" {
			// اگه اند دیت خالیه، یا از اند دیت دستگاه جلوتره، همون تاریخ پایان دستگاه رو در نظر بگیر
			if actualEnd == "" || actualEnd > devEnd.String {
				actualEnd = devEnd.String
			}
		}
	}

	// ۲. ساخت داینامیک کوئری
	query := `SELECT id, created_at, data FROM device_logs WHERE 1=1`
	var args []interface{}
	argCounter := 1

	if deviceName != "" {
		query += fmt.Sprintf(` AND data->>'customer_id' = $%d`, argCounter)
		args = append(args, deviceCode)
		argCounter++
	}

	// فیلتر از تاریخ نهایی
	if actualStart != "" {
		query += fmt.Sprintf(` AND created_at >= $%d`, argCounter)
		args = append(args, actualStart)
		argCounter++
	}

	// فیلتر تا تاریخ نهایی
	if actualEnd != "" {
		query += fmt.Sprintf(` AND created_at <= $%d`, argCounter)
		args = append(args, actualEnd)
		argCounter++
	}

	// ۳. مرتب‌سازی (همیشه جدیدترین‌ها اول)
	query += ` ORDER BY created_at DESC`

	// ۴. اعمال لیمیت
	if limitStr != "" {
		limit, err := strconv.Atoi(limitStr)
		if err == nil && limit > 0 {
			query += fmt.Sprintf(` LIMIT $%d`, argCounter)
			args = append(args, limit)
			argCounter++
		}
	}

	// ۵. اجرای کوئری
	rows, err := database.DB.Query(query, args...)
	if err != nil {
		log.Printf("خطا در اجرای کوئری خروجی اکسل: %v\n", err)
		http.Error(w, `{"error": "خطا در دریافت اطلاعات دیتابیس"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type DeviceLog struct {
		ID        int             `json:"id"`
		CreatedAt string          `json:"created_at"`
		Data      json.RawMessage `json:"data"`
	}

	logs := make([]DeviceLog, 0)

	for rows.Next() {
		var l DeviceLog
		var dataBytes []byte

		if err := rows.Scan(&l.ID, &l.CreatedAt, &dataBytes); err != nil {
			log.Printf("خطا در اسکن رکورد: %v\n", err)
			continue
		}

		l.Data = dataBytes
		logs = append(logs, l)
	}

	if err := rows.Err(); err != nil {
		log.Printf("خطا در خواندن رکوردهای خروجی اکسل: %v\n", err)
		writeExportError(w, http.StatusInternalServerError, "خطا در خواندن اطلاعات دیتابیس")
		return
	}

	response := map[string]interface{}{
		"logs": logs,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("خطا در انکود کردن جواب: %v\n", err)
	}
}

func writeExportError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(map[string]string{"error": message}); err != nil {
		log.Printf("خطا در انکود کردن خطای خروجی اکسل: %v\n", err)
	}
}
