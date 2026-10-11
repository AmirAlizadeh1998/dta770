package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"dta770/internal/database"
)

// AdminFinalReportItem خروجی کامل برای نمایش در جدول ادمین
type AdminFinalReportItem struct {
	ID         int        `json:"id"`
	UserID     int        `json:"user_id"`
	FullName   string     `json:"full_name"`
	Mobile     string     `json:"mobile"`
	DeviceID   int        `json:"device_id"`
	DeviceName string     `json:"device_name"`
	FilePath   string     `json:"file_path"`
	AdminNote  string     `json:"admin_note"`
	FromDate   time.Time  `json:"from_date"`
	ToDate     time.Time  `json:"to_date"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at"`
	Status     string     `json:"status"`
}

// UpdateReportPayload برای هندل کردن وضعیت و یادداشت ادمین
type UpdateReportPayload struct {
	Status    *string `json:"status"`
	AdminNote *string `json:"admin_note"`
}

func AdminFinalReportHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		query := `
			SELECT 
				fr.id, 
				fr.user_id, 
				COALESCE(u.full_name, u.user_name, 'کاربر نامشخص') AS full_name,
				COALESCE(u.mobile, '-') AS mobile,
				fr.device_id, 
				COALESCE(d.device_name, 'دستگاه نامشخص') AS device_name,
				fr.file_path,
				fr.admin_note,
				fr.from_date, 
				fr.to_date, 
				fr.created_at, 
				fr.updated_at, 
				fr.status
			FROM public.final_report fr
			LEFT JOIN public.users u ON fr.user_id = u.id
			LEFT JOIN public.devices d ON fr.device_id = d.id
			ORDER BY fr.created_at DESC
		`

		rows, err := database.DB.Query(query)
		if err != nil {
			log.Println("Admin fetch reports error:", err)
			http.Error(w, `{"error": "Failed to fetch reports"}`, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var reports []AdminFinalReportItem
		for rows.Next() {
			var item AdminFinalReportItem
			var dbStatus sql.NullString
			var updated sql.NullTime
			var filePath sql.NullString
			var adminNote sql.NullString

			err := rows.Scan(
				&item.ID,
				&item.UserID,
				&item.FullName,
				&item.Mobile,
				&item.DeviceID,
				&item.DeviceName,
				&filePath,
				&adminNote,
				&item.FromDate,
				&item.ToDate,
				&item.CreatedAt,
				&updated,
				&dbStatus,
			)
			if err != nil {
				log.Println("Scan error:", err)
				continue
			}

			if dbStatus.Valid && dbStatus.String != "" {
				item.Status = dbStatus.String
			} else {
				item.Status = "در صف پیگیری"
			}

			if updated.Valid {
				item.UpdatedAt = &updated.Time
			}

			if filePath.Valid {
				item.FilePath = filePath.String
			}

			if adminNote.Valid {
				item.AdminNote = adminNote.String
			}

			reports = append(reports, item)
		}

		if reports == nil {
			reports = []AdminFinalReportItem{}
		}

		json.NewEncoder(w).Encode(reports)

	case http.MethodPatch, http.MethodPut:
		// استخراج آیدی از انتهای URL: /api/admin/final-reports/{id}
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) < 1 {
			http.Error(w, `{"error": "Invalid URL path"}`, http.StatusBadRequest)
			return
		}

		idStr := parts[len(parts)-1]
		reportID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, `{"error": "Invalid report ID"}`, http.StatusBadRequest)
			return
		}

		var payload UpdateReportPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
			return
		}

		// بررسی اینکه حداقل یک فیلد برای آپدیت ارسال شده باشد
		if payload.Status == nil && payload.AdminNote == nil {
			http.Error(w, `{"error": "No update fields provided"}`, http.StatusBadRequest)
			return
		}

		now := time.Now()
		var setClauses []string
		var args []interface{}
		argIdx := 1

		if payload.Status != nil {
			setClauses = append(setClauses, "status = $"+strconv.Itoa(argIdx))
			args = append(args, *payload.Status)
			argIdx++
		}

		if payload.AdminNote != nil {
			setClauses = append(setClauses, "admin_note = $"+strconv.Itoa(argIdx))
			args = append(args, *payload.AdminNote)
			argIdx++
		}

		setClauses = append(setClauses, "updated_at = $"+strconv.Itoa(argIdx))
		args = append(args, now)
		argIdx++

		args = append(args, reportID)
		query := "UPDATE public.final_report SET " + strings.Join(setClauses, ", ") + " WHERE id = $" + strconv.Itoa(argIdx)

		res, err := database.DB.Exec(query, args...)
		if err != nil {
			log.Println("Update report error:", err)
			http.Error(w, `{"error": "Failed to update report"}`, http.StatusInternalServerError)
			return
		}

		rowsAffected, _ := res.RowsAffected()
		if rowsAffected == 0 {
			http.Error(w, `{"error": "Report not found"}`, http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Report updated successfully",
			"id":      reportID,
		})

	default:
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}
