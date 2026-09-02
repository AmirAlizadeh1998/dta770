package handlers

import (
	"database/sql"
	"dta770/internal/database"
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
	w.Header().Set("Content-Type", "application/json")

	// ۱. گرفتن پارامترها از کوئری (هم device_name و هم imei)
	q := r.URL.Query()
	deviceName := q.Get("device_name")
	imei := q.Get("imei")
	param := q.Get("param")
	timeframe := q.Get("timeframe")

	if deviceName == "" || imei == "" || param == "" || timeframe == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error": "پارامترهای device_name، imei، param و timeframe همگی الزامی هستند",
		})
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
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "پارامتر درخواستی نامعتبر است"})
		return
	}

	// ۳. دریافت بازه مجاز دستگاه از جدول devices با ترکیب (device_name, imei)
	var devStartTime, devEndTime sql.NullTime
	deviceLimitQuery := `
		SELECT start_time, end_time
		FROM devices
		WHERE device_name = $1 AND imei = $2
		LIMIT 1
	`
	err := database.DB.QueryRow(deviceLimitQuery, deviceName, imei).Scan(&devStartTime, &devEndTime)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "دستگاه مورد نظر با این مشخصات یافت نشد"})
			return
		}
		log.Printf("Error fetching device limits: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "خطای داخلی در بررسی وضعیت دستگاه"})
		return
	}

	// ۴. تعیین زمان مبنا (Anchor Time)
	// اگه دستگاه منقضی شده باشه، مبنا رو میذاریم روی زمان پایان دستگاه، وگرنه زمان فعلی سیستم
	anchorTime := time.Now()
	if devEndTime.Valid && devEndTime.Time.Before(anchorTime) {
		anchorTime = devEndTime.Time
	}

	// ۵. محاسبه بازه زمانی درخواستی کاربر نسبت به زمان مبنا
	var reqStartTime time.Time
	switch timeframe {
	case "1h":
		reqStartTime = anchorTime.Add(-1 * time.Hour)
	case "6h":
		reqStartTime = anchorTime.Add(-6 * time.Hour)
	case "12h":
		reqStartTime = anchorTime.Add(-12 * time.Hour)
	case "18h":
		reqStartTime = anchorTime.Add(-18 * time.Hour)
	case "24h":
		reqStartTime = anchorTime.Add(-24 * time.Hour)
	case "30h":
		reqStartTime = anchorTime.Add(-30 * time.Hour)
	case "36h":
		reqStartTime = anchorTime.Add(-36 * time.Hour)
	case "48h":
		reqStartTime = anchorTime.Add(-48 * time.Hour)
	case "72h":
		reqStartTime = anchorTime.Add(-72 * time.Hour)
	default:
		reqStartTime = anchorTime.Add(-1 * time.Hour)
	}

	// ۶. ترکیب بازه کاربر با بازه مجاز دستگاه (محدودیت نهایی)
	finalStartTime := reqStartTime
	if devStartTime.Valid && finalStartTime.Before(devStartTime.Time) {
		finalStartTime = devStartTime.Time
	}

	finalEndTime := anchorTime
	if devEndTime.Valid && finalEndTime.After(devEndTime.Time) {
		finalEndTime = devEndTime.Time
	}

	// اگر بازه نامعتبر باشد دیتای خالی برمی‌گردانیم
	if finalStartTime.After(finalEndTime) {
		_ = json.NewEncoder(w).Encode(map[string]any{"data": []ChartData{}})
		return
	}

	// ۷. اجرای کوئری برای استخراج لاگ‌ها
	query := fmt.Sprintf(`
		SELECT created_at, (data->>'%s')::numeric AS val
		FROM device_logs
		WHERE imei = $1
		AND data ? '%s'
		  AND created_at >= $2
		  AND created_at <= $3
		ORDER BY created_at ASC
	`, param, param)

	rows, err := database.DB.Query(query, imei, finalStartTime, finalEndTime)
	if err != nil {
		log.Printf("Error querying chart data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "خطای داخلی در دریافت دیتای نمودار"})
		return
	}
	defer func(rows *sql.Rows) {
		_ = rows.Close()
	}(rows)

	// ۸. خواندن و فرمت کردن دیتا
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
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "خطا در پردازش دیتای نمودار"})
		return
	}

	if results == nil {
		results = []ChartData{}
	}

	_ = json.NewEncoder(w).Encode(map[string]any{
		"data": results,
	})
}
