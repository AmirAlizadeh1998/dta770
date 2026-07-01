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

	imei := q.Get("imei")
	startDate := q.Get("start_date")
	endDate := q.Get("end_date")
	parameter := q.Get("parameter")
	operator := q.Get("operator")
	firstFilterValue := q.Get("first_filter_value")
	secondFilterValue := q.Get("second_filter_value")

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

	// فیلتر IMEI
	if imei != "" {
		conditions = append(conditions, fmt.Sprintf("imei = $%d", paramCount))
		args = append(args, imei)
		paramCount++
	}

	// فیلتر تاریخ
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

	// فیلتر تحلیل داده
	if parameter != "" && operator != "" {
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

		switch dbOperator {
		case "between":
			if firstFilterValue == "" || secondFilterValue == "" {
				http.Error(w, `{"error": "firstFilterValue and secondFilterValue are required for between"}`, http.StatusBadRequest)
				return
			}

			cond := fmt.Sprintf("(data->>$%d)::numeric BETWEEN $%d AND $%d", paramCount, paramCount+1, paramCount+2)
			conditions = append(conditions, cond)
			args = append(args, parameter, firstFilterValue, secondFilterValue)
			paramCount += 3

		case "not_between":
			if firstFilterValue == "" || secondFilterValue == "" {
				http.Error(w, `{"error": "firstFilterValue and secondFilterValue are required for not_between"}`, http.StatusBadRequest)
				return
			}

			cond := fmt.Sprintf("(data->>$%d)::numeric NOT BETWEEN $%d AND $%d", paramCount, paramCount+1, paramCount+2)
			conditions = append(conditions, cond)
			args = append(args, parameter, firstFilterValue, secondFilterValue)
			paramCount += 3

		default:
			if firstFilterValue == "" {
				http.Error(w, `{"error": "firstFilterValue is required"}`, http.StatusBadRequest)
				return
			}

			cond := fmt.Sprintf("(data->>$%d)::numeric %s $%d", paramCount, dbOperator, paramCount+1)
			conditions = append(conditions, cond)
			args = append(args, parameter, firstFilterValue)
			paramCount += 2
		}
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	var totalLogs int
	countQuery := `SELECT COUNT(*) ` + baseQuery
	err := database.DB.QueryRow(countQuery, args...).Scan(&totalLogs)
	if err != nil {
		log.Println("Error counting logs:", err)
		http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
		return
	}

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
			dbSortColumn = fmt.Sprintf("(data->>'%s')::numeric", safeParam)
		} else {
			dbSortColumn = "created_at"
		}
	default:
		dbSortColumn = "created_at"
	}

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
		err := rows.Close()
		if err != nil {
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
