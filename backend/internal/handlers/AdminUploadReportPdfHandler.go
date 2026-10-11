package handlers

import (
	"database/sql"
	"dta770/config"
	"dta770/internal/database"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func AdminUploadReportPDFHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// ۱. بررسی متد فقط POST
		if r.Method != http.MethodPost {
			http.Error(w, "متد مجاز نیست", http.StatusMethodNotAllowed)
			return
		}

		// ۲. تعیین سقف حجم مجاز (۲۵ مگابایت)
		const maxUploadSize = 25 << 20
		r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			http.Error(w, "حجم فایل بیش از حد مجاز (حداکثر ۲۵ مگابایت) است", http.StatusBadRequest)
			return
		}

		// ۳. دریافت report_id از بدنه فرم
		reportID := strings.TrimSpace(r.FormValue("report_id"))
		if reportID == "" {
			http.Error(w, "شناسه گزارش (report_id) الزامی است", http.StatusBadRequest)
			return
		}

		// ۴. دریافت مسیر فایل قبلی از دیتابیس (قبل از هر تغییری)
		var oldFilePath sql.NullString
		err := database.DB.QueryRow(`SELECT file_path FROM public.final_report WHERE id = $1`, reportID).Scan(&oldFilePath)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			log.Printf("خطا در استعلام فایل قبلی گزارش %s: %v\n", reportID, err)
		}

		// ۵. دریافت فایل ارسالی
		file, header, err := r.FormFile("pdf")
		if err != nil {
			http.Error(w, "فایلی با فیلد pdf ارسال نشده است", http.StatusBadRequest)
			return
		}
		defer file.Close()

		// ۶. اعتبارسنجی پسوند فایل
		ext := strings.ToLower(filepath.Ext(header.Filename))
		if ext != ".pdf" {
			http.Error(w, "تنها فرمت PDF مجاز به بارگذاری است", http.StatusBadRequest)
			return
		}

		// ۷. ساخت مسیر پوشه روی هارد دیسک
		uploadReportsDir := filepath.Join(cfg.UploadDir, "reports")
		if err := os.MkdirAll(uploadReportsDir, os.ModePerm); err != nil {
			http.Error(w, "خطا در دسترسی به پوشه آپلود", http.StatusInternalServerError)
			return
		}

		// ۸. ساخت نام یونیک برای فایل جدید
		uniqueFileName := fmt.Sprintf("report_%s_%d.pdf", reportID, time.Now().Unix())
		diskPath := filepath.Join(uploadReportsDir, uniqueFileName)

		// ایجاد فایل روی هارد دیسک
		dstFile, err := os.Create(diskPath)
		if err != nil {
			http.Error(w, "خطا در ساخت فایل در سرور", http.StatusInternalServerError)
			return
		}
		defer dstFile.Close()

		// کپی داده‌ها به فایل مقصد
		if _, err := io.Copy(dstFile, file); err != nil {
			_ = os.Remove(diskPath) // پاک کردن فایل ناقص
			http.Error(w, "خطا در نوشتن محتوای فایل", http.StatusInternalServerError)
			return
		}

		// ۹. آدرس وب برای فرانت‌اند و دیتابیس
		webURLPath := fmt.Sprintf("/uploads/reports/%s", uniqueFileName)

		// ۱۰. به‌روزرسانی دیتابیس
		query := `
			UPDATE public.final_report
			SET file_path = $1, status = 'تکمیل شد', updated_at = NOW()
			WHERE id = $2
		`
		res, err := database.DB.Exec(query, webURLPath, reportID)
		if err != nil {
			_ = os.Remove(diskPath) // رول‌بک فایل جدید در صورت خطای دیتابیس
			http.Error(w, "خطا در ثبت اطلاعات در دیتابیس", http.StatusInternalServerError)
			return
		}

		rowsAffected, _ := res.RowsAffected()
		if rowsAffected == 0 {
			_ = os.Remove(diskPath) // اگه رکوردی آپدیت نشد، فایل جدید سرگردان نمونه
			http.Error(w, "گزارشی با این شناسه یافت نشد", http.StatusNotFound)
			return
		}

		// ۱۱. حذف امن فایل قبلی از روی دیسک
		if oldFilePath.Valid && oldFilePath.String != "" {
			oldFileName := filepath.Base(oldFilePath.String)
			oldDiskPath := filepath.Join(uploadReportsDir, oldFileName)

			// بررسی امنیتی: فایل دقیقاً مال همین گزارش باشه و تصادفی فایل جدید نباشه
			expectedPrefix := fmt.Sprintf("report_%s_", reportID)
			if strings.HasPrefix(oldFileName, expectedPrefix) && oldDiskPath != diskPath {
				if err := os.Remove(oldDiskPath); err != nil {
					log.Printf("هشدار: فایل قبلی (%s) حذف نشد: %v\n", oldDiskPath, err)
				} else {
					log.Printf("فایل قدیمی با موفقیت حذف شد: %s\n", oldFileName)
				}
			}
		}

		// ۱۲. پاسخ JSON تمیز به فرانت‌اند
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":   true,
			"message":   "فایل با موفقیت آپلود و گزارش تکمیل شد",
			"file_path": webURLPath,
		})
	}
}
