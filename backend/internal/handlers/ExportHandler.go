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
	// فقط متد GET رو مجاز می‌کنیم
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

	// IMEI is not unique. A selected device is resolved by the pair
	// (device_name, imei), then its device_code is used for log filtering.
	if (deviceName == "") != (imei == "") {
		writeExportError(w, http.StatusBadRequest, "پارامترهای device_name و imei باید هم‌زمان ارسال شوند")
		return
	}

	var deviceCode string
	if deviceName != "" {
		var nullableDeviceCode sql.NullString
		err := database.DB.QueryRow(`
			SELECT device_code
			FROM devices
			WHERE device_name = $1 AND imei = $2
			LIMIT 1
		`, deviceName, imei).Scan(&nullableDeviceCode)

		if errors.Is(err, sql.ErrNoRows) {
			writeExportError(w, http.StatusNotFound, "دستگاهی با این نام و IMEI پیدا نشد")
			return
		}
		if err != nil {
			log.Printf("خطا در پیدا کردن device_code برای خروجی اکسل: %v\n", err)
			writeExportError(w, http.StatusInternalServerError, "خطا در دریافت اطلاعات دستگاه")
			return
		}

		deviceCode = strings.TrimSpace(nullableDeviceCode.String)
		if !nullableDeviceCode.Valid || deviceCode == "" {
			writeExportError(w, http.StatusBadRequest, "کد دستگاه برای این دستگاه تنظیم نشده است")
			return
		}
	}

	// ۲. ساخت داینامیک کوئری
	// فرض می‌کنم اسم جدول device_logs هست.
	query := `SELECT id, created_at, data FROM device_logs WHERE 1=1`
	var args []interface{}
	argCounter := 1 // برای شمارش متغیرهای $1, $2 و ...

	// فیلتر دستگاه
	if deviceName != "" {
		// اگه imei یه ستون جداست این خط رو استفاده کن:
		query += fmt.Sprintf(` AND data->>'customer_id' = $%d`, argCounter)

		args = append(args, deviceCode)
		argCounter++
	}

	// فیلتر از تاریخ
	if startDate != "" {
		query += fmt.Sprintf(` AND created_at >= $%d`, argCounter)
		args = append(args, startDate)
		argCounter++
	}

	// فیلتر تا تاریخ
	if endDate != "" {
		query += fmt.Sprintf(` AND created_at <= $%d`, argCounter)
		args = append(args, endDate)
		argCounter++
	}

	// ۳. مرتب‌سازی (همیشه جدیدترین‌ها اول)
	query += ` ORDER BY created_at DESC`

	// ۴. اعمال لیمیت (اگر فرانت‌اند صفر یا خالی نفرستاده بود)
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

	// ۶. استراکچر برای نتیجه (اگه تو package models داری، از همون استفاده کن)
	type DeviceLog struct {
		ID        int             `json:"id"`
		CreatedAt string          `json:"created_at"`
		Data      json.RawMessage `json:"data"` // استفاده از RawMessage برای حفظ فرمت جیسون بدون تغییر
	}

	logs := make([]DeviceLog, 0)

	// ۷. اسکن کردن رکوردها
	for rows.Next() {
		var l DeviceLog
		var dataBytes []byte // دیتای جیسون رو به صورت آرایه بایت می‌گیریم

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

	// اگه دیتایی پیدا نشد یه آرایه خالی بفرستیم که فرانت کرش نکنه
	// ۸. ارسال جواب
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
