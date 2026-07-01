// DeviceMonitorDetailHandler.go

package handlers

import (
	"database/sql"
	"dta770/internal/database"
	"dta770/internal/models"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func DeviceMonitorDetailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "متد مجاز نیست", http.StatusMethodNotAllowed)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/monitor/devices/")
	deviceID, err := strconv.Atoi(path)
	if err != nil || deviceID <= 0 {
		http.Error(w, "آیدی نامعتبر است", http.StatusBadRequest)
		return
	}

	type MonitorDevice struct {
		Id         int          `json:"id"`
		Customer   string       `json:"device_name"`
		Imei       string       `json:"imei"`
		StartTime  sql.NullTime `json:"-"`
		EndTime    sql.NullTime `json:"-"`
		LastSeenAt sql.NullTime `json:"-"`
		StartStr   *time.Time   `json:"start_time"`
		EndStr     *time.Time   `json:"end_time"`
		LastSeen   *time.Time   `json:"last_seen_at"`
	}

	var device MonitorDevice

	err = database.DB.QueryRow(`
		SELECT id, device_name, imei, start_time, end_time, last_seen_at
		FROM devices
		WHERE id = $1
	`, deviceID).Scan(
		&device.Id,
		&device.Customer,
		&device.Imei,
		&device.StartTime,
		&device.EndTime,
		&device.LastSeenAt,
	)

	if errors.Is(err, sql.ErrNoRows) {
		http.Error(w, "دستگاه پیدا نشد", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("device query error: %v", err)
		http.Error(w, "خطای داخلی", http.StatusInternalServerError)
		return
	}

	if device.StartTime.Valid {
		device.StartStr = &device.StartTime.Time
	}
	if device.EndTime.Valid {
		device.EndStr = &device.EndTime.Time
	}
	if device.LastSeenAt.Valid {
		device.LastSeen = &device.LastSeenAt.Time
	}

	// گرفتن لاگ‌ها بر اساس IMEI
	rows, err := database.DB.Query(`
		SELECT id, data, created_at
		FROM device_logs
		WHERE imei = $1
		ORDER BY created_at DESC
		LIMIT 100
	`, device.Imei)

	if err != nil {
		log.Printf("logs query error: %v", err)
		http.Error(w, "خطا در دریافت لاگ‌ها", http.StatusInternalServerError)
		return
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {
		}
	}(rows)

	type DeviceLog struct {
		Id        int             `json:"id"`
		Data      json.RawMessage `json:"data"`
		CreatedAt time.Time       `json:"created_at"`
	}

	var logs []DeviceLog

	for rows.Next() {
		var l DeviceLog
		if err := rows.Scan(&l.Id, &l.Data, &l.CreatedAt); err != nil {
			log.Printf("scan log error: %v", err)
			http.Error(w, "خطای داخلی", http.StatusInternalServerError)
			return
		}
		logs = append(logs, l)
	}

	var latest *DeviceLog
	if len(logs) > 0 {
		latest = &logs[0]
	}

	response := map[string]interface{}{
		"device":      device,
		"latest_log":  latest,
		"recent_logs": logs,
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		return
	}
}

func GetDeviceLogDetailsHandler(w http.ResponseWriter, r *http.Request) {
	deviceIMEI := r.URL.Query().Get("imei")
	if deviceIMEI == "" {
		http.Error(w, `{"error": "IMEI رو نفرستادی رفیق!"}`, http.StatusBadRequest)
		return
	}

	// --- مرحله ۱: اطلاعات پایه دستگاه رو از جدول devices می‌گیریم ---
	var startTime, endTime sql.NullTime
	var alarmData []byte

	deviceQuery := `SELECT start_time, end_time, alarm FROM devices WHERE imei = $1`
	err := database.DB.QueryRow(deviceQuery, deviceIMEI).Scan(&startTime, &endTime, &alarmData)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, `{"error": "دستگاهی با این IMEI پیدا نشد!"}`, http.StatusNotFound)
			return
		}
		log.Printf("Error fetching device details: %v", err)
		http.Error(w, `{"error": "خطا در ارتباط با دیتابیس"}`, http.StatusInternalServerError)
		return
	}

	// --- مرحله ۲: آخرین لاگ معتبر رو پیدا می‌کنیم (لاگ‌های آفلاین رو نادیده می‌گیریم) ---
	var validLogDataBytes []byte
	var lastValidDataTime sql.NullTime
	// نکته مهم: اینجا فرض کردیم لاگ معتبر همیشه کلید 'model' رو داره.
	// از اپراتور ؟ توی PostgreSQL استفاده کردیم.
	validLogQuery := `
		SELECT data, created_at
		FROM device_logs
		WHERE imei = $1
		AND data ? 'model'
		AND ($2::timestamp IS NULL OR created_at >= $2) -- شرط زمان شروع
		AND ($3::timestamp IS NULL OR created_at <= $3) -- شرط زمان پایان
		ORDER BY created_at DESC
		LIMIT 1
	`

	var startTimeParam, endTimeParam interface{}
	if startTime.Valid {
		startTimeParam = startTime.Time
	}
	if endTime.Valid {
		endTimeParam = endTime.Time
	}

	err = database.DB.QueryRow(validLogQuery, deviceIMEI, startTimeParam, endTimeParam).
		Scan(&validLogDataBytes, &lastValidDataTime)

	// --- مرحله ۳: وضعیت فعلی رو چک می‌کنیم (آیا آخرین لاگ ثبت شده آفلاینه؟) ---
	var lastStatus string
	var createdAt sql.NullTime
	statusQuery := `
		SELECT (data->>'IMEI') as status, created_at
		FROM device_logs
		WHERE imei = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	err = database.DB.QueryRow(statusQuery, deviceIMEI).Scan(&lastStatus, &createdAt)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		log.Printf("Error fetching current status: %v", err)
	}

	// --- مرحله ۴: تجمیع اطلاعات ---
	var finalLogData models.LogData
	if len(validLogDataBytes) > 0 {
		if err := json.Unmarshal(validLogDataBytes, &finalLogData); err != nil {
			log.Printf("Error unmarshaling log data: %v", err)
		}
	}

	// اگه آخرین لاگ ثبت شده کلمه offline بود، وضعیت رو توی فیلد IMEI لاگِ نهایی ست می‌کنیم
	if lastStatus == "offline" {
		finalLogData.IMEI = "offline"
	} else if lastStatus != "" {
		// اگه آفلاین نبود، می‌تونی همون IMEI اصلی دستگاه رو توش بذاری
		finalLogData.IMEI = deviceIMEI
	}

	response := models.DeviceDetailsResponse{
		IMEI: deviceIMEI,
		Data: finalLogData,
	}

	if len(alarmData) > 0 {
		response.Alarm = alarmData
	}
	if startTime.Valid {
		response.StartTime = &startTime.Time
	}
	if endTime.Valid {
		response.EndTime = &endTime.Time
	}
	if createdAt.Valid {
		response.CreatedAt = createdAt.Time
	}
	if lastValidDataTime.Valid {
		response.LastValidDataTime = &lastValidDataTime.Time
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		return
	}
}
