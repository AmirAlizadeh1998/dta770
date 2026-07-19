package handlers

import (
	"dta770/internal/database"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

func ExportDeviceLogsHandler(w http.ResponseWriter, r *http.Request) {
	// فقط متد GET رو مجاز می‌کنیم
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "متد غیرمجاز"}`, http.StatusMethodNotAllowed)
		return
	}

	// ۱. گرفتن پارامترها از URL
	imei := r.URL.Query().Get("imei")
	limitStr := r.URL.Query().Get("limit")
	startDate := r.URL.Query().Get("startDate")
	endDate := r.URL.Query().Get("endDate")

	// ۲. ساخت داینامیک کوئری
	// فرض می‌کنم اسم جدول device_logs هست.
	query := `SELECT id, created_at, data FROM device_logs WHERE 1=1`
	var args []interface{}
	argCounter := 1 // برای شمارش متغیرهای $1, $2 و ...

	// فیلتر دستگاه
	if imei != "" {
		// اگه imei یه ستون جداست این خط رو استفاده کن:
		query += fmt.Sprintf(` AND imei = $%d`, argCounter)

		args = append(args, imei)
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

	var logs []DeviceLog

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

	// اگه دیتایی پیدا نشد یه آرایه خالی بفرستیم که فرانت کرش نکنه
	if logs == nil {
		logs = []DeviceLog{}
	}

	// ۸. ارسال جواب
	response := map[string]interface{}{
		"logs": logs,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("خطا در انکود کردن جواب: %v\n", err)
	}
}
