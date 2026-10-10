package handlers

import (
	"dta770/internal/database"
	"dta770/internal/models"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

func LimitsRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		// گرفتن حدود یک دستگاه (نیازمند device_id در کوئری)
		GetDeviceLimitsHandler(w, r)
	case http.MethodPost, http.MethodPut:
		// ذخیره و آپدیت حدود دستگاه (نیازمند device_id در کوئری)
		UpsertDeviceLimitsHandler(w, r)
	default:
		http.Error(w, "متد غیرمجاز", http.StatusMethodNotAllowed)
	}
}

// GetParametersHandler گرفتن لیست تمام پارامترهای ثابت سیستم
func GetParametersHandler(w http.ResponseWriter, r *http.Request) {
	query := `SELECT id, "name", unit, label_fa FROM public.parameters ORDER BY id ASC`
	rows, err := database.DB.Query(query)
	if err != nil {
		http.Error(w, "خطا در دریافت لیست پارامترها", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var params []models.Parameter
	for rows.Next() {
		var p models.Parameter
		if err := rows.Scan(&p.ID, &p.Name, &p.Unit, &p.LabelFa); err == nil {
			params = append(params, p)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(params)
}

// GetDeviceLimitsHandler گرفتن حدود تنظیم شده برای یک دستگاه خاص
func GetDeviceLimitsHandler(w http.ResponseWriter, r *http.Request) {
	deviceIDStr := r.URL.Query().Get("device_id")
	deviceID, err := strconv.Atoi(deviceIDStr)
	if err != nil || deviceID <= 0 {
		http.Error(w, "شناسه دستگاه نامعتبر است", http.StatusBadRequest)
		return
	}

	query := `
		SELECT 
			dpl.id, 
			p.id AS parameter_id, 
			p.name AS parameter_name, 
			p.label_fa, 
			p.unit, 
			dpl.min_val, 
			dpl.max_val, 
			COALESCE(dpl.is_active, true) AS is_active
		FROM public.parameters p
		LEFT JOIN public.device_parameter_limits dpl 
			ON p.id = dpl.parameter_id AND dpl.device_id = $1
		ORDER BY p.id ASC;
	`

	rows, err := database.DB.Query(query, deviceID)
	if err != nil {
		log.Printf("Error querying limits: %v", err)
		http.Error(w, "خطا در دریافت لیست پارامترها", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	limits := make([]models.DeviceParameterLimit, 0)
	for rows.Next() {
		var l models.DeviceParameterLimit
		l.DeviceID = deviceID
		err := rows.Scan(&l.ID, &l.ParameterID, &l.ParameterName, &l.LabelFa, &l.Unit, &l.MinVal, &l.MaxVal, &l.IsActive)
		if err != nil {
			log.Printf("Error scanning limit row: %v", err)
			continue
		}
		limits = append(limits, l)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(limits)
}

// UpsertDeviceLimitsHandler ذخیره یا آپدیت حدود تنظیمات و اطلاعات پایه پارامترها
func UpsertDeviceLimitsHandler(w http.ResponseWriter, r *http.Request) {
	deviceIDStr := r.URL.Query().Get("device_id")
	deviceID, err := strconv.Atoi(deviceIDStr)
	if err != nil || deviceID <= 0 {
		http.Error(w, "شناسه دستگاه نامعتبر است", http.StatusBadRequest)
		return
	}

	var reqData []models.LimitUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&reqData); err != nil {
		http.Error(w, "فرمت دیتای ارسالی نامعتبر است", http.StatusBadRequest)
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "خطا در شروع تراکنش پایگاه‌داده", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// ۱. کوئری آپدیت جدول parameters (اطلاعات عمومی پارامترها)
	updateParamQuery := `
		UPDATE public.parameters 
		SET "name" = $1, label_fa = $2, unit = $3
		WHERE id = $4;
	`
	paramStmt, err := tx.Prepare(updateParamQuery)
	if err != nil {
		log.Printf("Error preparing param query: %v", err)
		http.Error(w, "خطا در پردازش اطلاعات", http.StatusInternalServerError)
		return
	}
	defer paramStmt.Close()

	// ۲. کوئری آپدیت/ثبت جدول device_parameter_limits (حدود مختص دستگاه)
	upsertLimitQuery := `
		INSERT INTO public.device_parameter_limits 
			(device_id, parameter_id, min_val, max_val, is_active, updated_at)
		VALUES 
			($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (device_id, parameter_id) 
		DO UPDATE SET
			min_val = EXCLUDED.min_val,
			max_val = EXCLUDED.max_val,
			is_active = EXCLUDED.is_active,
			updated_at = NOW();
	`
	limitStmt, err := tx.Prepare(upsertLimitQuery)
	if err != nil {
		log.Printf("Error preparing limit query: %v", err)
		http.Error(w, "خطا در پردازش اطلاعات", http.StatusInternalServerError)
		return
	}
	defer limitStmt.Close()

	// اجرای کوئری‌ها به ازای هر پارامتر ارسالی
	for _, limit := range reqData {
		if limit.ParameterID <= 0 {
			continue
		}

		// اول جدول پارامترهای عمومی رو آپدیت می‌کنیم
		_, err := paramStmt.Exec(limit.ParameterName, limit.LabelFa, limit.Unit, limit.ParameterID)
		if err != nil {
			log.Printf("Error updating parameter info %d: %v", limit.ParameterID, err)
			http.Error(w, "خطا در ذخیره اطلاعات پایه پارامتر", http.StatusInternalServerError)
			return
		}

		// دوم محدوده و فعال/غیرفعال بودن رو برای این دستگاه خاص ذخیره می‌کنیم
		_, err = limitStmt.Exec(deviceID, limit.ParameterID, limit.MinVal, limit.MaxVal, limit.IsActive)
		if err != nil {
			log.Printf("Error upserting limit for param %d: %v", limit.ParameterID, err)
			http.Error(w, "خطا در ذخیره محدوده‌های پارامتر", http.StatusInternalServerError)
			return
		}
	}

	// تایید نهایی تراکنش
	if err := tx.Commit(); err != nil {
		http.Error(w, "خطا در ثبت نهایی تراکنش", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "اطلاعات پارامترها و محدوده‌های دستگاه با موفقیت به‌روزرسانی شدند"}`))
}
