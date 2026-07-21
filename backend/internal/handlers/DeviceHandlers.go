package handlers

import (
	"database/sql"
	"dta770/internal/database"
	"dta770/internal/models"
	"dta770/internal/utils"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type PaginatedLogsResponse struct {
	Logs        []models.Logs `json:"logs"`
	CurrentPage int           `json:"currentPage"`
	TotalPages  int           `json:"totalPages"`
	TotalLogs   int           `json:"totalLogs"`
}

func DevicesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	role, err := utils.GetUserRoleFromRequest(r)
	if err != nil {
		http.Error(w, "دسترسی غیرمجاز", http.StatusUnauthorized)
		return
	}

	id, err := extractDeviceID(r.URL.Path)
	if err != nil {
		http.Error(w, "آیدی نامعتبر است", http.StatusBadRequest)
		return
	}

	switch r.Method {

	case http.MethodGet:
		// ✅ همه نقش‌ها میتونن لیست ببینن
		if role != models.RoleAdmin && role != models.RoleInstaller && role != models.RoleUser {
			http.Error(w, "اجازه دسترسی ندارید", http.StatusForbidden)
			return
		}
		handleGetDevices(w, r)

	case http.MethodPost:
		// ✅ فقط ادمین و نصاب میتونن بسازن
		if role != models.RoleAdmin && role != models.RoleInstaller {
			http.Error(w, "اجازه ایجاد دستگاه ندارید", http.StatusForbidden)
			return
		}
		handleCreateDevice(w, r)

	case http.MethodPut:
		// ✅ فقط ادمین اجازه ویرایش
		if role != models.RoleAdmin {
			http.Error(w, "اجازه ویرایش ندارید", http.StatusForbidden)
			return
		}
		if id == 0 {
			http.Error(w, "آیدی دستگاه مشخص نشده است", http.StatusBadRequest)
			return
		}
		handleUpdateDevice(w, r, id)

	case http.MethodDelete:
		// ✅ فقط ادمین اجازه حذف
		if role != models.RoleAdmin {
			http.Error(w, "اجازه حذف ندارید", http.StatusForbidden)
			return
		}
		if id == 0 {
			http.Error(w, "آیدی دستگاه مشخص نشده است", http.StatusBadRequest)
			return
		}
		handleDeleteDevice(w, r, id)

	default:
		http.Error(w, "متد مجاز نیست", http.StatusMethodNotAllowed)
	}
}

func GetDeviceLogs(w http.ResponseWriter, r *http.Request) {
	// گرفتن پارامترهای کوئری از فرانت
	q := r.URL.Query()
	pageStr := q.Get("page")
	limitStr := q.Get("limit")
	imei := q.Get("imei")
	startDate := q.Get("startDate")
	endDate := q.Get("endDate")

	// ✨ گرفتن پارامترهای سورت
	sortBy := q.Get("sortBy")
	sortOrder := q.Get("sortOrder")

	// مقادیر پیش‌فرض
	page := 1
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	limit := 50
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	// ساخت شرط‌های داینامیک برای PostgreSQL
	var conditions []string
	var args []interface{}
	paramCount := 1

	if imei != "" {
		// کست کردن data به text برای سرچ راحت‌تر
		conditions = append(conditions, fmt.Sprintf("data::text ILIKE $%d", paramCount))
		args = append(args, "%"+imei+"%")
		paramCount++
	}

	if startDate != "" {
		conditions = append(conditions, fmt.Sprintf("created_at >= $%d", paramCount))
		args = append(args, startDate)
		paramCount++
	}

	if endDate != "" {
		conditions = append(conditions, fmt.Sprintf("created_at <= $%d", paramCount))
		args = append(args, endDate)
		paramCount++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// ۱. کوئری گرفتن تعداد کل رکوردها (برای محاسبه تعداد صفحات)
	var totalLogs int
	countQuery := "SELECT COUNT(*) FROM device_logs " + whereClause
	err := database.DB.QueryRow(countQuery, args...).Scan(&totalLogs)
	if err != nil {
		log.Printf("Error counting device logs: %v", err)
		http.Error(w, "خطای داخلی در شمارش لاگ‌ها", http.StatusInternalServerError)
		return
	}

	// محاسبه فرمول‌های صفحه‌بندی
	totalPages := 0
	if totalLogs > 0 {
		totalPages = int((totalLogs + limit - 1) / limit)
	}
	offset := int((page - 1) * limit) // فرمول محاسبه آفست

	// ✨ ۲. ساختاردهی داینامیک و امن برای ORDER BY
	orderDirection := "DESC" // پیش‌فرض
	if strings.ToLower(sortOrder) == "asc" {
		orderDirection = "ASC"
	}

	orderColumn := "created_at" // پیش‌فرض
	if sortBy == "imei" {
		orderColumn = "data->>'IMEI'"
	} else if sortBy == "created_at" {
		orderColumn = "created_at"
	}

	orderByClause := fmt.Sprintf("ORDER BY %s %s", orderColumn, orderDirection)

	// ۳. کوئری گرفتن لاگ‌های همون صفحه با سورت جدید
	dataQuery := "SELECT id, created_at, data FROM device_logs " + whereClause + " " + orderByClause + fmt.Sprintf(" LIMIT $%d OFFSET $%d", paramCount, paramCount+1)
	args = append(args, limit, offset)

	rows, err := database.DB.Query(dataQuery, args...)
	if err != nil {
		log.Printf("Error querying device logs: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {
			log.Printf("Error closing rows in GetDeviceLogs: %v", err)
		}
	}(rows)

	var logs []models.Logs
	for rows.Next() {
		var l models.Logs
		err := rows.Scan(&l.Id, &l.CreatedAt, &l.Data)
		if err != nil {
			log.Printf("Error scanning device log row: %v", err)
			http.Error(w, "خطای داخلی سرور هنگام خواندن لاگ‌ها", http.StatusInternalServerError)
			return
		}
		logs = append(logs, l)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating device log rows: %v", err)
		http.Error(w, "خطای داخلی سرور هنگام خواندن لاگ‌ها", http.StatusInternalServerError)
		return
	}

	if logs == nil {
		logs = []models.Logs{}
	}

	// ۴. آماده کردن جواب نهایی
	response := PaginatedLogsResponse{
		Logs:        logs,
		CurrentPage: page,
		TotalPages:  totalPages,
		TotalLogs:   totalLogs,
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		log.Printf("Error encoding device logs response: %v", err)
		return
	}
}

func GetActiveDevicesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT 
			d.id, 
			d.device_name, 
			d.owner_name, 
			d.imei,
			d.end_time,
			l.created_at AS last_seen_at,
			l.data->>'customer_id' AS customer_id,
			l.data->>'acin' AS acin  -- ✨ این خط اضافه شد
		FROM 
			devices d
		JOIN LATERAL (
			SELECT created_at, data 
			FROM device_logs 
			WHERE imei = d.imei 
			  AND data ? 'customer_id' 
			ORDER BY created_at DESC 
			LIMIT 1
		) l ON true
		WHERE l.created_at >= NOW() - INTERVAL '10 minutes'
	`)
	if err != nil {
		log.Printf("active devices query error: %v", err)
		http.Error(w, "خطا در دریافت دستگاه‌ها", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type ActiveDevice struct {
		ID           int       `json:"id"`
		CustomerID   string    `json:"customer_id"`
		OwnerName    string    `json:"owner_name"`
		IMEI         string    `json:"imei"`
		EndTime      string    `json:"end_time"`
		LastSeenAt   time.Time `json:"last_seen_at"`
		CustomerName string    `json:"device_name"`
		Acin         string    `json:"acin"` // ✨ این فیلد اضافه شد
	}

	var devices []ActiveDevice

	for rows.Next() {
		var d ActiveDevice
		var customerID sql.NullString
		var customerName sql.NullString
		var endTime sql.NullTime
		var ownerName sql.NullString
		var acin sql.NullString // ✨ متغیر کمکی برای acin

		// ✨ متغیر acin به Scan اضافه شد (ترتیب باید دقیقاً مثل SELECT باشه)
		err := rows.Scan(&d.ID, &customerName, &ownerName, &d.IMEI, &endTime, &d.LastSeenAt, &customerID, &acin)
		if err != nil {
			log.Printf("scan device error: %v", err)
			continue
		}

		if ownerName.Valid && ownerName.String != "" {
			d.OwnerName = ownerName.String
		} else {
			d.OwnerName = "نامشخص"
		}

		if customerName.Valid {
			d.CustomerName = customerName.String
		}

		if customerID.Valid && customerID.String != "" {
			d.CustomerID = customerID.String
		} else {
			d.CustomerID = "نامشخص"
		}

		if endTime.Valid {
			d.EndTime = endTime.Time.Format(time.RFC3339)
		} else {
			d.EndTime = ""
		}

		// ✨ مقداردهی acin
		if acin.Valid && acin.String != "" {
			d.Acin = acin.String
		} else {
			d.Acin = "0" // مقدار پیش‌فرض اگه وجود نداشت
		}

		devices = append(devices, d)
	}

	if err := rows.Err(); err != nil {
		log.Printf("rows error: %v", err)
		http.Error(w, "خطا در خواندن داده‌ها", http.StatusInternalServerError)
		return
	}

	if devices == nil {
		devices = []ActiveDevice{}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(devices); err != nil {
		log.Printf("encode active devices error: %v", err)
	}
}

// /////////////////////////////////////////////
// ///////////////// HELPERS ///////////////////
// /////////////////////////////////////////////
func extractDeviceID(path string) (int, error) {
	path = strings.TrimPrefix(path, "/api/devices")
	path = strings.Trim(path, "/")

	if path == "" {
		return 0, nil
	}

	id, err := strconv.Atoi(path)
	if err != nil {
		return 0, err
	}

	return id, nil
}

func handleGetDevices(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT 
			id, device_name, owner_name, imei, phone, address, longitude, latitude,
			fuse_box, null_connection, fuse_comb, line_balance, unit_earth, ups_battery,
			distance_from_trans, cable_size, three_phase, materials,
			description, is_active, voice_note_path, start_time, end_time, alarm
		FROM devices
		ORDER BY id DESC
	`)
	if err != nil {
		log.Printf("Error querying devices: %v", err)
		http.Error(w, "خطا در دریافت دستگاه‌ها", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var devices []models.Device

	for rows.Next() {
		var d models.Device
		var startTime, endTime sql.NullTime
		var alarm sql.NullString

		err := rows.Scan(
			&d.Id,
			&d.DeviceName,
			&d.OwnerName,
			&d.Imei,
			&d.Phone,
			&d.Address,
			&d.Longitude,
			&d.Latitude,
			&d.FuseBox,
			&d.NullConnection,
			&d.FuseComb,
			&d.LineBalance,
			&d.UnitEarth,
			&d.UpsBattery,
			&d.DistanceFromTrans,
			&d.CableSize,
			&d.ThreePhase,
			&d.Materials,
			&d.Description,
			&d.IsActive,
			&d.VoiceNotePath,
			&startTime,
			&endTime,
			&alarm, // ۲. اضافه کردن به اسکن (ترتیبش باید دقیقاً مثل کوئری SELECT باشه)
		)

		if err != nil {
			log.Printf("Error scanning device row: %v", err)
			http.Error(w, "خطای داخلی سرور", http.StatusInternalServerError)
			return
		}

		if startTime.Valid {
			d.StartTime = startTime.Time.Format(time.RFC3339)
		}

		if endTime.Valid {
			d.EndTime = endTime.Time.Format(time.RFC3339)
		}

		// ۳. اگر آلارم نال نبود، مقدارش رو می‌ریزیم تو دستگاه
		if alarm.Valid {
			d.Alarm = alarm.String
		}

		devices = append(devices, d)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating devices: %v", err)
		http.Error(w, "خطای داخلی سرور", http.StatusInternalServerError)
		return
	}

	if devices == nil {
		devices = []models.Device{}
	}

	if err := json.NewEncoder(w).Encode(devices); err != nil {
		log.Printf("Error encoding devices response: %v", err)
	}
}

func handleCreateDevice(w http.ResponseWriter, r *http.Request) {
	var d models.Device

	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "فرمت داده‌ها غلط است", http.StatusBadRequest)
		return
	}

	query := `
		INSERT INTO devices (
			device_name, owner_name, imei, start_time, end_time, phone, address, longitude, latitude,
			fuse_box, null_connection, fuse_comb, line_balance, unit_earth, ups_battery,
			distance_from_trans, cable_size, three_phase, materials,
			description, is_active, voice_note_path
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11, $12, $13, $14,
			$15, $16, $17, $18,
			$19, $20, $21, $22
		)
		RETURNING id
	`

	var newID int

	err := database.DB.QueryRow(
		query,
		d.DeviceName,
		d.OwnerName,
		d.Imei,
		utils.NullableTime(d.StartTime),
		utils.NullableTime(d.EndTime),
		d.Phone,
		d.Address,
		d.Longitude,
		d.Latitude,
		d.FuseBox,
		d.NullConnection,
		d.FuseComb,
		d.LineBalance,
		d.UnitEarth,
		d.UpsBattery,
		d.DistanceFromTrans,
		d.CableSize,
		d.ThreePhase,
		d.Materials,
		d.Description,
		d.IsActive,
		d.VoiceNotePath,
	).Scan(&newID)

	if err != nil {
		// اضافه کردن هدر JSON برای ارورها
		w.Header().Set("Content-Type", "application/json")

		// چک کردن خطای تکراری بودن IMEI
		if strings.Contains(err.Error(), "unique_imei") || strings.Contains(err.Error(), "23505") {
			w.WriteHeader(http.StatusConflict) // کد 409
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "این IMEI قبلاً در سیستم ثبت شده است! لطفا بررسی کنید. 🚫",
			})
			return
		}

		log.Printf("Error inserting device: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "خطا در ذخیره دستگاه",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "دستگاه با موفقیت ذخیره شد",
		"id":      newID,
	})
}

func handleUpdateDevice(w http.ResponseWriter, r *http.Request, id int) {
	var d models.Device

	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "فرمت داده‌ها غلط است", http.StatusBadRequest)
		return
	}

	query := `
		UPDATE devices SET 
			device_name = $1,
			imei = $2,
			start_time = $3,
			end_time = $4,
			phone = $5,
			address = $6,
			longitude = $7,
			latitude = $8,
			fuse_box = $9,
			null_connection = $10,
			fuse_comb = $11,
			line_balance = $12,
			unit_earth = $13,
			ups_battery = $14,
			distance_from_trans = $15,
			cable_size = $16,
			three_phase = $17,
			materials = $18,
			description = $19,
			is_active = $20,
			voice_note_path = $21,
			updated_at = $22,
			alarm = $23,
			owner_name = $24
		WHERE id = $25
	`

	result, err := database.DB.Exec(
		query,
		d.DeviceName,
		d.Imei,
		utils.NullableTime(d.StartTime),
		utils.NullableTime(d.EndTime),
		d.Phone,
		d.Address,
		d.Longitude,
		d.Latitude,
		d.FuseBox,
		d.NullConnection,
		d.FuseComb,
		d.LineBalance,
		d.UnitEarth,
		d.UpsBattery,
		d.DistanceFromTrans,
		d.CableSize,
		d.ThreePhase,
		d.Materials,
		d.Description,
		d.IsActive,
		d.VoiceNotePath,
		time.Now().Format(time.RFC3339),
		d.Alarm,
		d.OwnerName,
		id,
	)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")

		// بررسی خطای تکراری در آپدیت
		if strings.Contains(err.Error(), "unique_imei") || strings.Contains(err.Error(), "23505") {
			w.WriteHeader(http.StatusConflict) // کد 409
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "این IMEI قبلاً برای یک دستگاه دیگر ثبت شده است! 🚫",
			})
			return
		}

		log.Printf("Error updating device: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "خطا در بروزرسانی دستگاه",
		})
		return
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error checking affected rows: %v", err)
		http.Error(w, "خطای داخلی سرور", http.StatusInternalServerError)
		return
	}

	if affectedRows == 0 {
		http.Error(w, "دستگاه پیدا نشد", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "دستگاه با موفقیت بروزرسانی شد",
	})
}

func handleDeleteDevice(w http.ResponseWriter, r *http.Request, id int) {
	result, err := database.DB.Exec(`
		DELETE FROM devices
		WHERE id = $1
	`, id)

	if err != nil {
		log.Printf("Error deleting device: %v", err)
		http.Error(w, "خطا در حذف دستگاه", http.StatusInternalServerError)
		return
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error checking affected rows: %v", err)
		http.Error(w, "خطای داخلی سرور", http.StatusInternalServerError)
		return
	}

	if affectedRows == 0 {
		http.Error(w, "دستگاه پیدا نشد", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "دستگاه با موفقیت حذف شد",
	})
}
