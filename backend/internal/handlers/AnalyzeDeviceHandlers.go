package handlers

import (
	"database/sql"
	"dta770/internal/database"
	"dta770/internal/models"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
)

func AnalyzeDeviceHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	deviceCode := q.Get("device_code")
	startDate := q.Get("start_date")
	endDate := q.Get("end_date")
	parameter := strings.TrimSpace(q.Get("parameter"))
	operator := strings.TrimSpace(q.Get("operator"))
	firstFilterValue := strings.TrimSpace(q.Get("first_filter_value"))
	secondFilterValue := strings.TrimSpace(q.Get("second_filter_value"))

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 {
		limit = 50
	}

	offset := (page - 1) * limit

	baseQuery := `FROM device_logs WHERE 1=1`
	var conditions []string
	var args []interface{}
	paramCount := 1

	// ۱. فیلتر بر اساس device_code
	if deviceCode != "" {
		conditions = append(conditions, fmt.Sprintf("(data->>'customer_id') = $%d", paramCount))
		args = append(args, deviceCode)
		paramCount++

		// محدود کردن لاگ‌ها تا زمان غیرفعال شدن دستگاه
		var deactivatedAt sql.NullTime
		err := database.DB.QueryRow(`SELECT deactivated_at FROM devices WHERE device_code = $1`, deviceCode).Scan(&deactivatedAt)
		if err == nil && deactivatedAt.Valid {
			conditions = append(conditions, fmt.Sprintf("created_at <= $%d", paramCount))
			args = append(args, deactivatedAt.Time)
			paramCount++
		}
	}

	// ۲. فیلتر تاریخ (رفع تکرار اضافه)
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

	// ۳. فیلتر تحلیل پارامترها (هندلینگ ویژه برای acin و فیلترهای عمومی)
	if parameter != "" {
		// حالت اول: هندلینگ اختصاصی acin (وضعیت برق ورودی)
		if parameter == "acin" {
			if firstFilterValue != "0" && firstFilterValue != "1" {
				http.Error(w, `{"error": "مقدار وضعیت برق ورودی (acin) باید 0 یا 1 باشد"}`, http.StatusBadRequest)
				return
			}

			// برای acin شرط رو هم به صورت متنی و هم عددی داخل JSON هندل می‌کنیم تا اگر دیتابیس رشته بود یا عدد، مچ بشه
			// همچنین بررسی می‌کنیم که کلید acin داخل آبجکت data موجود باشه
			conditions = append(conditions, fmt.Sprintf("data ? 'acin' AND ((data->>'acin') = $%d OR (data->>'acin')::numeric = $%d)", paramCount, paramCount+1))
			args = append(args, firstFilterValue, firstFilterValue)
			paramCount += 2

		} else if operator != "" {
			// حالت دوم: بقیه پارامترهای عددی (ولتاژ، جریان، فرکانس و ...)
			dbOperator := operator
			if dbOperator == "==" {
				dbOperator = "="
			}

			validOperators := map[string]bool{
				">":           true,
				"<":           true,
				"=":           true,
				">=":          true,
				"<=":          true,
				"!=":          true,
				"between":     true,
				"not_between": true,
			}

			if !validOperators[dbOperator] {
				http.Error(w, `{"error": "Invalid operator"}`, http.StatusBadRequest)
				return
			}

			// جلوگیری از خطای ::numeric در صورتی که فیلد وجود نداشته باشه یا رشته خالی باشه
			safeNumericCond := fmt.Sprintf("data ? $%d AND (data->>$%d) ~ '^-?[0-9]+(\\.[0-9]+)?$'", paramCount, paramCount)

			switch dbOperator {
			case "between":
				if firstFilterValue == "" || secondFilterValue == "" {
					http.Error(w, `{"error": "first_filter_value and second_filter_value are required for between"}`, http.StatusBadRequest)
					return
				}

				cond := fmt.Sprintf("(%s AND (data->>$%d)::numeric BETWEEN $%d AND $%d)", safeNumericCond, paramCount, paramCount+1, paramCount+2)
				conditions = append(conditions, cond)
				args = append(args, parameter, firstFilterValue, secondFilterValue)
				paramCount += 3

			case "not_between":
				if firstFilterValue == "" || secondFilterValue == "" {
					http.Error(w, `{"error": "first_filter_value and second_filter_value are required for not_between"}`, http.StatusBadRequest)
					return
				}

				cond := fmt.Sprintf("(%s AND (data->>$%d)::numeric NOT BETWEEN $%d AND $%d)", safeNumericCond, paramCount, paramCount+1, paramCount+2)
				conditions = append(conditions, cond)
				args = append(args, parameter, firstFilterValue, secondFilterValue)
				paramCount += 3

			default:
				if firstFilterValue == "" {
					http.Error(w, `{"error": "first_filter_value is required"}`, http.StatusBadRequest)
					return
				}

				cond := fmt.Sprintf("(%s AND (data->>$%d)::numeric %s $%d)", safeNumericCond, paramCount, dbOperator, paramCount+1)
				conditions = append(conditions, cond)
				args = append(args, parameter, firstFilterValue)
				paramCount += 2
			}
		}
	}

	// اضافه کردن شرط‌ها به بیس کوئری
	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	// ۴. شمارش تعداد کل لاگ‌ها
	var totalLogs int
	countQuery := `SELECT COUNT(*) ` + baseQuery
	err := database.DB.QueryRow(countQuery, args...).Scan(&totalLogs)
	if err != nil {
		log.Println("Error counting logs:", err)
		http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
		return
	}

	// ۵. مدیریت سورت
	reqSortBy := q.Get("sort_by")
	sortOrder := strings.ToUpper(q.Get("sort_order"))
	if sortOrder != "ASC" && sortOrder != "DESC" {
		sortOrder = "DESC"
	}

	dbSortColumn := "created_at"
	switch reqSortBy {
	case "deviceId", "imei":
		dbSortColumn = "imei"
	case "time", "created_at":
		dbSortColumn = "created_at"
	case "value":
		if parameter != "" {
			safeParam := strings.ReplaceAll(parameter, "'", "''")
			// با استفاده از NULLIF و Regex خیالمون راحته که سورت هم ارور کست نمیده
			dbSortColumn = fmt.Sprintf("CASE WHEN (data->>'%s') ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (data->>'%s')::numeric ELSE NULL END", safeParam, safeParam)
		} else {
			dbSortColumn = "created_at"
		}
	default:
		dbSortColumn = "created_at"
	}

	// ۶. اجرای کوئری اصلی با Pagination
	query := `SELECT id, imei, data, created_at ` + baseQuery +
		fmt.Sprintf(" ORDER BY %s %s LIMIT $%d OFFSET $%d", dbSortColumn, sortOrder, paramCount, paramCount+1)

	args = append(args, limit, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		log.Println("Error fetching logs:", err)
		http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
		return
	}
	defer func(rows *sql.Rows) {
		if err := rows.Close(); err != nil {
			log.Println("Error closing rows:", err)
		}
	}(rows)

	var logs []models.Logs

	for rows.Next() {
		var logItem models.Logs
		var dataBytes []byte

		err := rows.Scan(&logItem.Id, &logItem.IMEI, &dataBytes, &logItem.CreatedAt)
		if err != nil {
			log.Println("Error scanning row:", err)
			continue
		}

		logItem.Data = dataBytes
		logs = append(logs, logItem)
	}

	if err = rows.Err(); err != nil {
		log.Println("Error iterating rows:", err)
		http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
		return
	}

	if logs == nil {
		logs = []models.Logs{}
	}

	response := map[string]interface{}{
		"Logs":       logs,
		"TotalLogs":  totalLogs,
		"TotalPages": (totalLogs + limit - 1) / limit,
		"Page":       page,
		"Limit":      limit,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Println("Error encoding response:", err)
	}
}
