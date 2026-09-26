package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"dta770/internal/database"
	"dta770/internal/models"
)

func GetUserDevicesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "فقط متد GET مجاز است", http.StatusMethodNotAllowed)
		return
	}

	// استخراج user_id که توسط MainMiddleware درون Context ریکوئست قرار گرفته
	userIDVal := r.Context().Value("user_id")
	if userIDVal == nil {
		http.Error(w, "کاربر احراز هویت نشده است", http.StatusUnauthorized)
		return
	}

	// تبدیل نوع شناسه کاربر
	var userID int64
	switch v := userIDVal.(type) {
	case float64:
		userID = int64(v)
	case int64:
		userID = v
	case int:
		userID = int64(v)
	default:
		http.Error(w, "شناسه کاربر نامعتبر است", http.StatusBadRequest)
		return
	}

	// کوئری برای واکشی فقط دستگاه‌های این کاربر
	query := `
		SELECT id, device_name, imei, device_code, owner_name, user_id, is_active, created_at, updated_at
		FROM devices
		WHERE user_id = $1
		ORDER BY id DESC
	`

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		log.Printf("Error querying user devices: %v", err)
		http.Error(w, "خطا در دریافت لیست دستگاه‌ها", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	devices := make([]models.DeviceResponse, 0)
	for rows.Next() {
		var dev models.DeviceResponse
		if err := rows.Scan(
			&dev.ID,
			&dev.DeviceName,
			&dev.IMEI,
			&dev.DeviceCode,
			&dev.OwnerName,
			&dev.UserID,
			&dev.IsActive,
			&dev.CreatedAt,
			&dev.UpdatedAt,
		); err != nil {
			log.Printf("Error scanning device: %v", err)
			http.Error(w, "خطا در پردازش اطلاعات", http.StatusInternalServerError)
			return
		}
		devices = append(devices, dev)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"count":  len(devices),
		"data":   devices,
	})
}
