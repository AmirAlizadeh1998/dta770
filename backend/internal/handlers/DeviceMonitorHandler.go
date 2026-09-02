// DeviceMonitorHandler.go

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
		AND ($2::timestamp IS NULL OR created_at >= $2)
		AND ($3::timestamp IS NULL OR created_at <= $3)
		ORDER BY created_at DESC
		LIMIT 100
	`, device.Imei, device.StartTime, device.EndTime)

	if err != nil {
		log.Printf("logs query error: %v", err)
		http.Error(w, "خطا در دریافت لاگ‌ها", http.StatusInternalServerError)
		return
	}
	defer func(rows *sql.Rows) {
		_ = rows.Close()
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

	response := map[string]any{
		"device":      device,
		"latest_log":  latest,
		"recent_logs": logs,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

func GetDeviceLogDetailsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	deviceIMEI := r.URL.Query().Get("imei")
	deviceName := r.URL.Query().Get("device_name")

	if deviceIMEI == "" || deviceName == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error": "هر دو پارامتر device_name و imei الزامی هستند رفیق!",
		})
		return
	}

	// --- مرحله ۱: اطلاعات پایه دستگاه رو با ترکیب (device_name, imei) از جدول devices می‌گیریم ---
	var persistedDeviceName string
	var startTime, endTime sql.NullTime
	var alarmData []byte

	deviceQuery := `
		SELECT device_name, start_time, end_time, alarm
		FROM devices
		WHERE device_name = $1 AND imei = $2
		LIMIT 1
	`
	err := database.DB.QueryRow(deviceQuery, deviceName, deviceIMEI).
		Scan(&persistedDeviceName, &startTime, &endTime, &alarmData)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "دستگاهی با این مشخصات (نام و IMEI) پیدا نشد!",
			})
			return
		}
		log.Printf("Error fetching device details: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error": "خطا در ارتباط با دیتابیس",
		})
		return
	}

	// --- مرحله ۲: آخرین لاگ معتبر رو پیدا می‌کنیم (محدود به بازه زمانی همین دستگاه) ---
	var validLogDataBytes []byte
	var lastValidDataTime sql.NullTime

	validLogQuery := `
		SELECT data, created_at
		FROM device_logs
		WHERE imei = $1
		AND data ? 'model'
		AND ($2::timestamp IS NULL OR created_at >= $2) -- شرط زمان شروع اختصاصی این دستگاه
		AND ($3::timestamp IS NULL OR created_at <= $3) -- شرط زمان پایان اختصاصی این دستگاه
		ORDER BY created_at DESC
		LIMIT 1
	`

	var startTimeParam, endTimeParam any
	if startTime.Valid {
		startTimeParam = startTime.Time
	}
	if endTime.Valid {
		endTimeParam = endTime.Time
	}

	err = database.DB.QueryRow(validLogQuery, deviceIMEI, startTimeParam, endTimeParam).
		Scan(&validLogDataBytes, &lastValidDataTime)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Printf("No valid log found for imei=%s in this timeframe", deviceIMEI)
			validLogDataBytes = []byte(`{}`)
		} else {
			log.Printf("Error fetching valid log: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "خطا در دریافت آخرین لاگ معتبر",
			})
			return
		}
	}

	// --- مرحله ۳: وضعیت فعلی رو چک می‌کنیم (آیا آخرین لاگ ثبت شده آفلاینه؟) ---
	var lastStatus string
	var createdAt sql.NullTime
	statusQuery := `
		SELECT (data->>'IMEI') as status, created_at
		FROM device_logs
		WHERE imei = $1
		AND ($2::timestamp IS NULL OR created_at >= $2) -- شرط زمان شروع
		AND ($3::timestamp IS NULL OR created_at <= $3) -- شرط زمان پایان
		ORDER BY created_at DESC
		LIMIT 1
	`
	err = database.DB.QueryRow(statusQuery, deviceIMEI, startTimeParam, endTimeParam).Scan(&lastStatus, &createdAt)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		log.Printf("Error fetching current status: %v", err)
	}

	// --- مرحله ۴: تجمیع اطلاعات ---
	finalLogData, err := normalizeLogData(validLogDataBytes)
	if err != nil {
		log.Printf("Error normalizing log data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error": "خطا در تبدیل داده لاگ",
		})
		return
	}

	if lastStatus == "offline" {
		finalLogData["IMEI"] = "offline"
	} else if lastStatus != "" {
		finalLogData["IMEI"] = deviceIMEI
	}

	response := models.DeviceDetailsResponse{
		IMEI:       deviceIMEI,
		DeviceName: persistedDeviceName,
		Data:       finalLogData,
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

	_ = json.NewEncoder(w).Encode(response)
}

func normalizeValueToString(v any) string {
	if v == nil {
		return "null"
	}

	switch val := v.(type) {
	case string:
		return val

	case float64:
		return strconv.FormatFloat(val, 'f', -1, 64)

	case bool:
		return strconv.FormatBool(val)

	default:
		return ""
	}
}

func normalizeLogData(raw []byte) (map[string]string, error) {
	var rawMap map[string]any

	if len(raw) == 0 {
		return map[string]string{}, nil
	}

	if err := json.Unmarshal(raw, &rawMap); err != nil {
		return nil, err
	}

	normalized := make(map[string]string, len(rawMap))

	for key, value := range rawMap {
		normalized[key] = normalizeValueToString(value)
	}

	return normalized, nil
}
