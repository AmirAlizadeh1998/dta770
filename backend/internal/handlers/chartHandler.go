package handlers

import (
	"database/sql"
	"dta770/internal/database" // پکیج دیتابیس خودت
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"
)

type ChartData struct {
	Time  string  `json:"time"`
	Value float64 `json:"value"`
}

func GetDeviceChartData(w http.ResponseWriter, r *http.Request) {
	// ۱. گرفتن پارامترها از کوئری
	q := r.URL.Query()
	imei := q.Get("imei")
	param := q.Get("param")
	timeframe := q.Get("timeframe")

	if imei == "" || param == "" || timeframe == "" {
		http.Error(w, "پارامترهای imei، param و timeframe الزامی هستند", http.StatusBadRequest)
		return
	}

	// ۲. وایت‌لیست پارامترها (جلوگیری از SQL Injection)
	validParams := map[string]bool{
		"ir_ave": true, "ir_cur": true, "ir_max": true, "ir_min": true, "is_ave": true, "is_cur": true, "is_max": true,
		"is_min": true, "it_ave": true, "it_cur": true, "it_max": true, "it_min": true, "thd_ir": true, "thd_is": true,
		"thd_it": true, "frq_ave": true, "frq_cur": true, "frq_max": true, "frq_min": true, "thd_vrn": true, "thd_vrs": true,
		"thd_vrt": true, "thd_vsn": true, "thd_vst": true, "thd_vtn": true, "v_rn_ave": true, "v_rn_cur": true, "v_rn_max": true,
		"v_rn_min": true, "v_rs_ave": true, "v_rs_cur": true, "v_rs_max": true, "v_rs_min": true, "v_rt_ave": true,
		"v_rt_cur": true, "v_rt_max": true, "v_rt_min": true, "v_sn_ave": true, "v_sn_cur": true, "v_sn_max": true,
		"v_sn_min": true, "v_tn_ave": true, "v_tn_cur": true, "v_tn_max": true, "v_tn_min": true, "v_ts_ave": true,
		"v_ts_cur": true, "v_ts_max": true, "v_ts_min": true, "cos_r_ave": true, "cos_r_cur": true, "cos_r_max": true,
		"cos_r_min": true, "cos_s_ave": true, "cos_s_cur": true, "cos_s_max": true, "cos_s_min": true, "cos_t_ave": true,
		"cos_t_cur": true, "cos_t_max": true, "cos_t_min": true, "p_act_r_ave": true,
		"p_act_r_cur": true, "p_act_r_max": true, "p_act_r_min": true, "p_act_s_ave": true, "p_act_s_cur": true,
		"p_act_s_max": true, "p_act_s_min": true, "p_act_t_ave": true, "p_act_t_cur": true, "p_act_t_max": true,
		"p_act_t_min": true, "sig_quality": true, "harmonic_1_R": true, "harmonic_1_S": true, "harmonic_1_T": true,
		"harmonic_2_R": true, "harmonic_2_S": true, "harmonic_2_T": true, "harmonic_3_R": true, "harmonic_3_S": true,
		"harmonic_3_T": true, "harmonic_4_R": true, "harmonic_4_S": true, "harmonic_4_T": true, "harmonic_5_R": true,
		"harmonic_5_S": true, "harmonic_5_T": true, "harmonic_6_R": true, "harmonic_6_S": true, "harmonic_6_T": true,
		"harmonic_7_R": true, "harmonic_7_S": true, "harmonic_7_T": true, "harmonic_8_R": true, "harmonic_8_S": true,
		"harmonic_8_T": true, "harmonic_9_R": true, "harmonic_9_S": true, "harmonic_9_T": true, "p_ract_r_ave": true,
		"p_ract_r_cur": true, "p_ract_r_max": true, "p_ract_r_min": true, "p_ract_s_ave": true, "p_ract_s_cur": true,
		"p_ract_s_max": true, "p_ract_s_min": true, "p_ract_t_ave": true, "p_ract_t_cur": true, "p_ract_t_max": true,
		"p_ract_t_min": true, "cos_total_ave": true, "cos_total_cur": true, "cos_total_max": true, "cos_total_min": true,
		"harmonic_10_R": true, "harmonic_10_S": true, "harmonic_10_T": true, "harmonic_11_R": true, "harmonic_11_S": true,
		"harmonic_11_T": true, "harmonic_12_R": true, "harmonic_12_S": true, "harmonic_12_T": true, "harmonic_13_R": true,
		"harmonic_13_S": true, "harmonic_13_T": true, "harmonic_14_R": true, "harmonic_14_S": true, "harmonic_14_T": true,
		"harmonic_15_R": true, "harmonic_15_S": true, "harmonic_15_T": true, "p_act_into_grid": true, "p_act_into_load": true,
		"p_apparent_r_ave": true, "p_apparent_r_cur": true, "p_apparent_r_max": true, "p_apparent_r_min": true,
		"p_apparent_s_ave": true, "p_apparent_s_cur": true, "p_apparent_s_max": true, "p_apparent_s_min": true,
		"p_apparent_t_ave": true, "p_apparent_t_cur": true, "p_apparent_t_max": true, "p_apparent_t_min": true,
		"p_ract_into_grid": true, "p_ract_into_load": true, "p_apparent_into_grid": true, "p_apparent_into_load": true,
	}

	if !validParams[param] {
		http.Error(w, "پارامتر درخواستی نامعتبر است", http.StatusBadRequest)
		return
	}

	// ۳. دریافت بازه مجاز دستگاه از جدول devices
	var devStartTime, devEndTime sql.NullTime
	err := database.DB.QueryRow("SELECT start_time, end_time FROM devices WHERE imei = $1", imei).Scan(&devStartTime, &devEndTime)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "دستگاه مورد نظر یافت نشد", http.StatusNotFound)
			return
		}
		log.Printf("Error fetching device limits: %v", err)
		http.Error(w, "خطای داخلی در بررسی وضعیت دستگاه", http.StatusInternalServerError)
		return
	}

	// 🌟 تعیین زمان مبنا (Anchor Time)
	// اگه دستگاه منقضی شده باشه، مبنا رو میذاریم روی زمان پایان دستگاه، وگرنه زمان فعلی سیستم
	anchorTime := time.Now()
	if devEndTime.Valid && devEndTime.Time.Before(anchorTime) {
		anchorTime = devEndTime.Time
	}

	// ۴. محاسبه بازه زمانی درخواستی کاربر نسبت به زمان مبنا
	var reqStartTime time.Time
	switch timeframe {
	case "1h":
		reqStartTime = anchorTime.Add(-1 * time.Hour)
	case "6h":
		reqStartTime = anchorTime.Add(-6 * time.Hour)
	case "12h":
		reqStartTime = anchorTime.Add(-12 * time.Hour)
	case "18h": // 🌟 اضافه شد
		reqStartTime = anchorTime.Add(-18 * time.Hour)
	case "24h":
		reqStartTime = anchorTime.Add(-24 * time.Hour)
	case "30h": // 🌟 اضافه شد
		reqStartTime = anchorTime.Add(-30 * time.Hour)
	case "36h": // 🌟 اضافه شد
		reqStartTime = anchorTime.Add(-36 * time.Hour)
	case "48h": // 🌟 اضافه شد
		reqStartTime = anchorTime.Add(-48 * time.Hour)
	case "72h": // 🌟 اضافه شد
		reqStartTime = anchorTime.Add(-72 * time.Hour)
	default:
		reqStartTime = anchorTime.Add(-1 * time.Hour) // پیش‌فرض ۱ ساعت
	}

	// ۵. ترکیب بازه کاربر با بازه مجاز دستگاه (ایجاد محدودیت نهایی)
	finalStartTime := reqStartTime
	if devStartTime.Valid && finalStartTime.Before(devStartTime.Time) {
		finalStartTime = devStartTime.Time
	}

	finalEndTime := anchorTime
	if devEndTime.Valid && finalEndTime.After(devEndTime.Time) {
		finalEndTime = devEndTime.Time
	}

	// بررسی اینکه آیا تداخلی وجود دارد یا خیر
	if finalStartTime.After(finalEndTime) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"data": []ChartData{}})
		return
	}

	// ۶. ساخت کوئری با اعمال شرط زمان شروع و پایان
	query := fmt.Sprintf(`
			SELECT created_at, (data->>'%s')::numeric AS val
			FROM device_logs 
			WHERE data::text ILIKE $1 
			  AND created_at >= $2 
			  AND created_at <= $3
			ORDER BY created_at
		`, param)

	imeiSearch := "%" + imei + "%"

	rows, err := database.DB.Query(query, imeiSearch, finalStartTime, finalEndTime)
	if err != nil {
		log.Printf("Error querying chart data: %v", err)
		http.Error(w, "خطای داخلی در دریافت دیتای نمودار", http.StatusInternalServerError)
		return
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {
			log.Printf("Error closing rows in chart data: %v", err)
		}
	}(rows)

	// ۷. خواندن و فرمت کردن دیتا
	var results []ChartData

	for rows.Next() {
		var createdAt time.Time
		var value sql.NullFloat64

		if err := rows.Scan(&createdAt, &value); err != nil {
			log.Printf("Error scanning chart row: %v", err)
			continue
		}

		val := 0.0
		if value.Valid {
			val = value.Float64
		}

		results = append(results, ChartData{
			Time:  createdAt.Format(time.RFC3339),
			Value: val,
		})
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating chart rows: %v", err)
		http.Error(w, "خطا در پردازش دیتای نمودار", http.StatusInternalServerError)
		return
	}

	if results == nil {
		results = []ChartData{}
	}

	// ۸. ارسال جواب
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(map[string]interface{}{
		"data": results,
	})
	if err != nil {
		log.Printf("Error encoding chart response: %v", err)
	}
}
