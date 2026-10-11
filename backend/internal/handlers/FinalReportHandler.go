package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"dta770/internal/database"
)

type FinalReportPayload struct {
	FromDate time.Time `json:"from_date"`
	ToDate   time.Time `json:"to_date"`
	DeviceID int       `json:"device_id"`
}

type FinalReport struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	DeviceID  int       `json:"device_id"`
	FromDate  time.Time `json:"from_date"`
	ToDate    time.Time `json:"to_date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Status    string    `json:"status"`
	FilePath  *string   `json:"file_path"`
	AdminNote *string   `json:"admin_note"`
}

func FinalReportHandler(w http.ResponseWriter, r *http.Request) {
	userIDValue := r.Context().Value("user_id")
	userID, ok := userIDValue.(int)

	if !ok || userID == 0 {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodPost:
		var payload FinalReportPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, `{"error": "Invalid payload"}`, http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		// شروع تراکنش برای همگام‌سازی لغو درخواست‌های قبلی و ایجاد درخواست جدید
		tx, err := database.DB.BeginTx(ctx, nil)
		if err != nil {
			log.Println("Error starting transaction:", err)
			http.Error(w, `{"error": "خطای سرور در پردازش درخواست"}`, http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		now := time.Now()

		// ۱. لغو خودکار تمام درخواست‌های قبلی کاربر که هنوز «در صف پیگیری» هستند
		cancelPrevQuery := `
			UPDATE public.final_report
			SET status = 'لغو شده', updated_at = $1
			WHERE user_id = $2 AND status = 'در صف پیگیری'
		`
		if _, err := tx.ExecContext(ctx, cancelPrevQuery, now, userID); err != nil {
			log.Println("Error cancelling previous reports:", err)
			http.Error(w, `{"error": "خطا در لغو درخواست‌های قبلی"}`, http.StatusInternalServerError)
			return
		}

		// ۲. ثبت درخواست جدید با وضعیت "در صف پیگیری"
		var newID int
		insertQuery := `
			INSERT INTO public.final_report (user_id, device_id, from_date, to_date, created_at, updated_at, status)
			VALUES ($1, $2, $3, $4, $5, $6, 'در صف پیگیری')
			RETURNING id
		`
		err = tx.QueryRowContext(ctx, insertQuery, userID, payload.DeviceID, payload.FromDate, payload.ToDate, now, now).Scan(&newID)
		if err != nil {
			log.Println("Error insert new report:", err)
			http.Error(w, `{"error": "خطا در ثبت درخواست جدید"}`, http.StatusInternalServerError)
			return
		}

		// ۳. نهایی‌سازی و ثبت تراکنش
		if err := tx.Commit(); err != nil {
			log.Println("Error committing transaction:", err)
			http.Error(w, `{"error": "خطا در نهایی‌سازی تراکنش"}`, http.StatusInternalServerError)
			return
		}

		report := FinalReport{
			ID:        newID,
			UserID:    userID,
			DeviceID:  payload.DeviceID,
			FromDate:  payload.FromDate,
			ToDate:    payload.ToDate,
			CreatedAt: now,
			UpdatedAt: now,
			Status:    "در صف پیگیری",
			FilePath:  nil,
			AdminNote: nil,
		}

		json.NewEncoder(w).Encode(report)

	case http.MethodGet:
		// استعلام گزارش‌ها همراه با فیلدهای file_path و admin_note
		query := `
			SELECT id, user_id, device_id, from_date, to_date, created_at, updated_at, status, file_path, admin_note
			FROM public.final_report
			WHERE user_id = $1
			ORDER BY created_at DESC
		`
		rows, err := database.DB.Query(query, userID)
		if err != nil {
			log.Println("Error fetching reports:", err)
			http.Error(w, `{"error": "Failed to fetch reports"}`, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var reports []FinalReport
		for rows.Next() {
			var r FinalReport
			var dbStatus sql.NullString
			var dbFilePath sql.NullString
			var dbAdminNote sql.NullString

			if err := rows.Scan(
				&r.ID,
				&r.UserID,
				&r.DeviceID,
				&r.FromDate,
				&r.ToDate,
				&r.CreatedAt,
				&r.UpdatedAt,
				&dbStatus,
				&dbFilePath,
				&dbAdminNote,
			); err != nil {
				log.Println("Error scanning report row:", err)
				continue
			}

			if dbStatus.Valid && dbStatus.String != "" {
				r.Status = dbStatus.String
			} else {
				r.Status = "در صف پیگیری"
			}

			if dbFilePath.Valid && dbFilePath.String != "" {
				r.FilePath = &dbFilePath.String
			}

			if dbAdminNote.Valid && dbAdminNote.String != "" {
				r.AdminNote = &dbAdminNote.String
			}

			reports = append(reports, r)
		}

		if reports == nil {
			reports = []FinalReport{}
		}
		json.NewEncoder(w).Encode(reports)

	case http.MethodDelete:
		pathParts := strings.Split(r.URL.Path, "/")
		idStr := pathParts[len(pathParts)-1]
		reportID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, `{"error": "Invalid ID"}`, http.StatusBadRequest)
			return
		}

		now := time.Now()
		// کاربر فقط درخواستی که "در صف پیگیری" هست رو بتونه لغو کنه
		query := `
			UPDATE public.final_report 
			SET status = 'لغو شده', updated_at = $1 
			WHERE id = $2 AND user_id = $3 AND status = 'در صف پیگیری'
		`

		result, err := database.DB.Exec(query, now, reportID, userID)
		if err != nil {
			http.Error(w, `{"error": "Failed to cancel report"}`, http.StatusInternalServerError)
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			http.Error(w, `{"error": "درخواست پیدا نشد یا قبلاً پردازش شده و امکان لغو ندارد"}`, http.StatusBadRequest)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"message": "Cancelled successfully"})

	default:
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}
