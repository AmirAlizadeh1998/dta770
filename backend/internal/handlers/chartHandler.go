package handlers

import (
	"database/sql"
	"dta770/internal/database"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

type ChartData struct {
	Time  string  `json:"time"`
	Value float64 `json:"value"`
}

var validChartParams = map[string]struct{}{
	"ir_ave": {}, "ir_cur": {}, "ir_max": {}, "ir_min": {},
	"is_ave": {}, "is_cur": {}, "is_max": {}, "is_min": {},
	"it_ave": {}, "it_cur": {}, "it_max": {}, "it_min": {},
	"thd_ir": {}, "thd_is": {}, "thd_it": {},
	"frq_ave": {}, "frq_cur": {}, "frq_max": {}, "frq_min": {},
	"thd_vrn": {}, "thd_vrs": {}, "thd_vrt": {}, "thd_vsn": {}, "thd_vst": {}, "thd_vtn": {},
	"v_rn_ave": {}, "v_rn_cur": {}, "v_rn_max": {}, "v_rn_min": {},
	"v_rs_ave": {}, "v_rs_cur": {}, "v_rs_max": {}, "v_rs_min": {},
	"v_rt_ave": {}, "v_rt_cur": {}, "v_rt_max": {}, "v_rt_min": {},
	"v_sn_ave": {}, "v_sn_cur": {}, "v_sn_max": {}, "v_sn_min": {},
	"v_tn_ave": {}, "v_tn_cur": {}, "v_tn_max": {}, "v_tn_min": {},
	"v_ts_ave": {}, "v_ts_cur": {}, "v_ts_max": {}, "v_ts_min": {},
	"cos_r_ave": {}, "cos_r_cur": {}, "cos_r_max": {}, "cos_r_min": {},
	"cos_s_ave": {}, "cos_s_cur": {}, "cos_s_max": {}, "cos_s_min": {},
	"cos_t_ave": {}, "cos_t_cur": {}, "cos_t_max": {}, "cos_t_min": {},
	"p_act_r_ave": {}, "p_act_r_cur": {}, "p_act_r_max": {}, "p_act_r_min": {},
	"p_act_s_ave": {}, "p_act_s_cur": {}, "p_act_s_max": {}, "p_act_s_min": {},
	"p_act_t_ave": {}, "p_act_t_cur": {}, "p_act_t_max": {}, "p_act_t_min": {},
	"sig_quality":  {},
	"harmonic_1_R": {}, "harmonic_1_S": {}, "harmonic_1_T": {},
	"harmonic_2_R": {}, "harmonic_2_S": {}, "harmonic_2_T": {},
	"harmonic_3_R": {}, "harmonic_3_S": {}, "harmonic_3_T": {},
	"harmonic_4_R": {}, "harmonic_4_S": {}, "harmonic_4_T": {},
	"harmonic_5_R": {}, "harmonic_5_S": {}, "harmonic_5_T": {},
	"harmonic_6_R": {}, "harmonic_6_S": {}, "harmonic_6_T": {},
	"harmonic_7_R": {}, "harmonic_7_S": {}, "harmonic_7_T": {},
	"harmonic_8_R": {}, "harmonic_8_S": {}, "harmonic_8_T": {},
	"harmonic_9_R": {}, "harmonic_9_S": {}, "harmonic_9_T": {},
	"harmonic_10_R": {}, "harmonic_10_S": {}, "harmonic_10_T": {},
	"harmonic_11_R": {}, "harmonic_11_S": {}, "harmonic_11_T": {},
	"harmonic_12_R": {}, "harmonic_12_S": {}, "harmonic_12_T": {},
	"harmonic_13_R": {}, "harmonic_13_S": {}, "harmonic_13_T": {},
	"harmonic_14_R": {}, "harmonic_14_S": {}, "harmonic_14_T": {},
	"harmonic_15_R": {}, "harmonic_15_S": {}, "harmonic_15_T": {},
	"p_ract_r_ave": {}, "p_ract_r_cur": {}, "p_ract_r_max": {}, "p_ract_r_min": {},
	"p_ract_s_ave": {}, "p_ract_s_cur": {}, "p_ract_s_max": {}, "p_ract_s_min": {},
	"p_ract_t_ave": {}, "p_ract_t_cur": {}, "p_ract_t_max": {}, "p_ract_t_min": {},
	"cos_total_ave": {}, "cos_total_cur": {}, "cos_total_max": {}, "cos_total_min": {},
	"p_act_into_grid": {}, "p_act_into_load": {},
	"p_apparent_r_ave": {}, "p_apparent_r_cur": {}, "p_apparent_r_max": {}, "p_apparent_r_min": {},
	"p_apparent_s_ave": {}, "p_apparent_s_cur": {}, "p_apparent_s_max": {}, "p_apparent_s_min": {},
	"p_apparent_t_ave": {}, "p_apparent_t_cur": {}, "p_apparent_t_max": {}, "p_apparent_t_min": {},
	"p_ract_into_grid": {}, "p_ract_into_load": {},
	"p_apparent_into_grid": {}, "p_apparent_into_load": {},
}

func GetDeviceChartData(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	deviceName := strings.TrimSpace(q.Get("device_name"))
	imei := strings.TrimSpace(q.Get("imei"))
	param := q.Get("param")
	timeframe := q.Get("timeframe")

	if deviceName == "" || imei == "" || param == "" || timeframe == "" {
		writeErrorJSON(w, http.StatusBadRequest, "پارامترهای device_name، imei، param و timeframe همگی الزامی هستند")
		return
	}
	if _, ok := validChartParams[param]; !ok {
		writeErrorJSON(w, http.StatusBadRequest, "پارامتر درخواستی نامعتبر است")
		return
	}

	var deviceCode sql.NullString
	var deviceStartTime, deviceEndTime sql.NullTime
	err := database.DB.QueryRow(`
		SELECT device_code, start_time, end_time
		FROM devices
		WHERE device_name = $1 AND imei = $2
		LIMIT 1
	`, deviceName, imei).Scan(&deviceCode, &deviceStartTime, &deviceEndTime)
	if errors.Is(err, sql.ErrNoRows) {
		writeErrorJSON(w, http.StatusNotFound, "دستگاه مورد نظر با این مشخصات یافت نشد")
		return
	}
	if err != nil {
		log.Printf("Error fetching device limits: %v", err)
		writeErrorJSON(w, http.StatusInternalServerError, "خطای داخلی در بررسی وضعیت دستگاه")
		return
	}

	deviceCodeValue := strings.TrimSpace(deviceCode.String)
	if !deviceCode.Valid || deviceCodeValue == "" {
		writeErrorJSON(w, http.StatusBadRequest, "کد دستگاه تنظیم نشده است")
		return
	}

	anchorTime := time.Now()
	if deviceEndTime.Valid && deviceEndTime.Time.Before(anchorTime) {
		anchorTime = deviceEndTime.Time
	}

	durationByTimeframe := map[string]time.Duration{
		"1h": time.Hour, "6h": 6 * time.Hour, "12h": 12 * time.Hour,
		"18h": 18 * time.Hour, "24h": 24 * time.Hour, "30h": 30 * time.Hour,
		"36h": 36 * time.Hour, "48h": 48 * time.Hour, "72h": 72 * time.Hour,
	}
	duration, ok := durationByTimeframe[timeframe]
	if !ok {
		duration = time.Hour
	}

	finalStartTime := anchorTime.Add(-duration)
	if deviceStartTime.Valid && finalStartTime.Before(deviceStartTime.Time) {
		finalStartTime = deviceStartTime.Time
	}
	finalEndTime := anchorTime
	if deviceEndTime.Valid && finalEndTime.After(deviceEndTime.Time) {
		finalEndTime = deviceEndTime.Time
	}
	if finalStartTime.After(finalEndTime) {
		writeJSON(w, map[string]any{"data": []ChartData{}})
		return
	}

	query := fmt.Sprintf(`
		SELECT created_at, (data->>'%s')::numeric AS val
		FROM device_logs
		WHERE data->>'customer_id' = $1
		  AND data ? '%s'
		  AND created_at >= $2
		  AND created_at <= $3
		ORDER BY created_at ASC
	`, param, param)

	rows, err := database.DB.Query(query, deviceCodeValue, finalStartTime, finalEndTime)
	if err != nil {
		log.Printf("Error querying chart data: %v", err)
		writeErrorJSON(w, http.StatusInternalServerError, "خطای داخلی در دریافت دیتای نمودار")
		return
	}
	defer rows.Close()

	results := make([]ChartData, 0)
	for rows.Next() {
		var createdAt time.Time
		var value sql.NullFloat64
		if err := rows.Scan(&createdAt, &value); err != nil {
			log.Printf("Error scanning chart row: %v", err)
			continue
		}

		chartValue := 0.0
		if value.Valid {
			chartValue = value.Float64
		}
		results = append(results, ChartData{
			Time:  createdAt.Format(time.RFC3339),
			Value: chartValue,
		})
	}
	if err := rows.Err(); err != nil {
		log.Printf("Error iterating chart rows: %v", err)
		writeErrorJSON(w, http.StatusInternalServerError, "خطا در پردازش دیتای نمودار")
		return
	}

	writeJSON(w, map[string]any{"data": results})
}
