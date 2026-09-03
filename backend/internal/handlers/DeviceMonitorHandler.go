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

// DeviceMonitorDetailHandler returns the recent logs for a device selected by
// its database id. Logs are matched through devices.device_code and the
// customer_id value stored in device_logs.data.
func DeviceMonitorDetailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "متد مجاز نیست", http.StatusMethodNotAllowed)
		return
	}

	deviceID, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/api/monitor/devices/"))
	if err != nil || deviceID <= 0 {
		http.Error(w, "آیدی نامعتبر است", http.StatusBadRequest)
		return
	}

	type monitorDevice struct {
		ID         int            `json:"id"`
		DeviceName string         `json:"device_name"`
		IMEI       string         `json:"imei"`
		DeviceCode sql.NullString `json:"-"`
		StartTime  sql.NullTime   `json:"-"`
		EndTime    sql.NullTime   `json:"-"`
		LastSeenAt sql.NullTime   `json:"-"`
		Start      *time.Time     `json:"start_time"`
		End        *time.Time     `json:"end_time"`
		LastSeen   *time.Time     `json:"last_seen_at"`
	}

	var device monitorDevice
	err = database.DB.QueryRow(`
		SELECT id, device_name, imei, device_code, start_time, end_time, last_seen_at
		FROM devices
		WHERE id = $1
	`, deviceID).Scan(
		&device.ID,
		&device.DeviceName,
		&device.IMEI,
		&device.DeviceCode,
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
		device.Start = &device.StartTime.Time
	}
	if device.EndTime.Valid {
		device.End = &device.EndTime.Time
	}
	if device.LastSeenAt.Valid {
		device.LastSeen = &device.LastSeenAt.Time
	}

	deviceCode := strings.TrimSpace(device.DeviceCode.String)
	if !device.DeviceCode.Valid || deviceCode == "" {
		writeJSON(w, map[string]any{
			"device":      device,
			"latest_log":  nil,
			"recent_logs": []any{},
		})
		return
	}

	rows, err := database.DB.Query(`
		SELECT id, data, created_at
		FROM device_logs
		WHERE data->>'customer_id' = $1
		  AND ($2::timestamp IS NULL OR created_at >= $2)
		  AND ($3::timestamp IS NULL OR created_at <= $3)
		ORDER BY created_at DESC
		LIMIT 100
	`, deviceCode, nullTimeValue(device.StartTime), nullTimeValue(device.EndTime))
	if err != nil {
		log.Printf("logs query error: %v", err)
		http.Error(w, "خطا در دریافت لاگ‌ها", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type deviceLog struct {
		ID        int             `json:"id"`
		Data      json.RawMessage `json:"data"`
		CreatedAt time.Time       `json:"created_at"`
	}

	logs := make([]deviceLog, 0)
	for rows.Next() {
		var entry deviceLog
		if err := rows.Scan(&entry.ID, &entry.Data, &entry.CreatedAt); err != nil {
			log.Printf("scan log error: %v", err)
			http.Error(w, "خطای داخلی", http.StatusInternalServerError)
			return
		}
		logs = append(logs, entry)
	}
	if err := rows.Err(); err != nil {
		log.Printf("iterate log rows error: %v", err)
		http.Error(w, "خطای داخلی", http.StatusInternalServerError)
		return
	}

	var latest *deviceLog
	if len(logs) > 0 {
		latest = &logs[0]
	}

	writeJSON(w, map[string]any{
		"device":      device,
		"latest_log":  latest,
		"recent_logs": logs,
	})
}

// GetDeviceLogDetailsHandler returns the latest valid log for the selected device.
func GetDeviceLogDetailsHandler(w http.ResponseWriter, r *http.Request) {
	deviceIMEI := strings.TrimSpace(r.URL.Query().Get("imei"))
	deviceName := strings.TrimSpace(r.URL.Query().Get("device_name"))
	reqStartTime := strings.TrimSpace(r.URL.Query().Get("start_time"))
	reqEndTime := strings.TrimSpace(r.URL.Query().Get("end_time")) // We keep reading this for validation

	if deviceIMEI == "" || deviceName == "" {
		writeErrorJSON(w, http.StatusBadRequest, "هر دو پارامتر device_name و imei الزامی هستند")
		return
	}

	var deviceCode sql.NullString
	var startTime, endTime sql.NullTime
	var alarmData []byte

	var query string
	var args []any

	// 💡 تغییر اصلی اینجاست
	if reqStartTime != "" && reqEndTime != "" {
		// به جای پیدا کردن ماموریت "همپوشان"، مستقیم می‌ریم سراغ ماموریتی که
		// start_time اون با تاریخ ارسالی از فرانت‌اند مطابقت داره.
		// این کار باگ انتخاب شدن ماموریت جدیدتر رو حل می‌کنه.
		query = `
			SELECT device_code, start_time, end_time, alarm
			FROM devices
			WHERE device_name = $1 AND imei = $2
			ORDER BY abs(extract(epoch from (start_time - $3::timestamptz)))
			LIMIT 1
		`
		// برای پیدا کردن ماموریت منحصر به فرد، فقط به تاریخ شروع نیاز داریم.
		args = []any{deviceName, deviceIMEI, reqStartTime}
	} else {
		// این قسمت برای زمانیه که فرانت‌اند تاریخ نفرسته (رفتار قبلی)
		query = `
			SELECT device_code, start_time, end_time, alarm
			FROM devices
			WHERE device_name = $1 AND imei = $2
			ORDER BY id DESC
			LIMIT 1
		`
		args = []any{deviceName, deviceIMEI}
	}

	err := database.DB.QueryRow(query, args...).Scan(&deviceCode, &startTime, &endTime, &alarmData)

	if errors.Is(err, sql.ErrNoRows) {
		writeErrorJSON(w, http.StatusNotFound, "دستگاهی با این مشخصات (نام و IMEI و تاریخ) پیدا نشد")
		return
	}
	if err != nil {
		log.Printf("Error fetching device details: %v", err)
		writeErrorJSON(w, http.StatusInternalServerError, "خطا در ارتباط با دیتابیس")
		return
	}

	// بقیه کد بدون تغییر باقی می‌مونه چون منطقش درسته...
	// ... وقتی startTime و endTime درست از دیتابیس خونده بشن، لاگ‌ها هم درست فیلتر میشن.

	deviceCodeValue := strings.TrimSpace(deviceCode.String)
	if !deviceCode.Valid || deviceCodeValue == "" {
		writeErrorJSON(w, http.StatusBadRequest, "کد دستگاه برای این دستگاه تنظیم نشده است")
		return
	}

	startTimeParam := nullTimeValue(startTime)
	endTimeParam := nullTimeValue(endTime)
	var validLogData []byte
	var lastValidDataTime sql.NullTime

	err = database.DB.QueryRow(`
		SELECT data, created_at
		FROM device_logs
		WHERE data->>'customer_id' = $1
		  AND data ? 'model'
		  AND ($2::timestamptz IS NULL OR created_at >= $2)
		  AND ($3::timestamptz IS NULL OR created_at <= $3)
		ORDER BY created_at DESC
		LIMIT 1
	`, deviceCodeValue, startTimeParam, endTimeParam).Scan(&validLogData, &lastValidDataTime)

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		log.Printf("Error fetching valid log: %v", err)
		writeErrorJSON(w, http.StatusInternalServerError, "خطا در دریافت آخرین لاگ معتبر")
		return
	}
	if errors.Is(err, sql.ErrNoRows) {
		validLogData = []byte(`{}`)
	}

	var lastStatus sql.NullString
	var createdAt sql.NullTime

	err = database.DB.QueryRow(`
		SELECT data->>'IMEI', created_at
		FROM device_logs
		WHERE data->>'customer_id' = $1
		  AND ($2::timestamptz IS NULL OR created_at >= $2)
		  AND ($3::timestamptz IS NULL OR created_at <= $3)
		ORDER BY created_at DESC
		LIMIT 1
	`, deviceCodeValue, startTimeParam, endTimeParam).Scan(&lastStatus, &createdAt)

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		log.Printf("Error fetching current status: %v", err)
	}

	finalLogData, err := normalizeLogData(validLogData)
	if err != nil {
		log.Printf("Error normalizing log data: %v", err)
		writeErrorJSON(w, http.StatusInternalServerError, "خطا در تبدیل داده لاگ")
		return
	}
	if lastStatus.Valid && lastStatus.String == "offline" {
		finalLogData["IMEI"] = "offline"
	} else if lastStatus.Valid && lastStatus.String != "" {
		finalLogData["IMEI"] = deviceIMEI
	}

	response := models.DeviceDetailsResponse{
		IMEI:       deviceIMEI,
		DeviceName: deviceName,
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

	writeJSON(w, response)
}

func nullTimeValue(value sql.NullTime) any {
	if value.Valid {
		return value.Time
	}
	return nil
}

func normalizeValueToString(value any) string {
	switch value := value.(type) {
	case nil:
		return "null"
	case string:
		return value
	case float64:
		return strconv.FormatFloat(value, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(value)
	default:
		return ""
	}
}

func normalizeLogData(raw []byte) (map[string]string, error) {
	if len(raw) == 0 {
		return map[string]string{}, nil
	}

	var rawMap map[string]any
	if err := json.Unmarshal(raw, &rawMap); err != nil {
		return nil, err
	}

	normalized := make(map[string]string, len(rawMap))
	for key, value := range rawMap {
		normalized[key] = normalizeValueToString(value)
	}
	return normalized, nil
}

func writeJSON(w http.ResponseWriter, value any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(value)
}

func writeErrorJSON(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
