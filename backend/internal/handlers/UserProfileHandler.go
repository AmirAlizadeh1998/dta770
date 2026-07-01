package handlers

import (
	"database/sql"
	"dta770/internal/database"
	"dta770/internal/models"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func UserProfileHandler(w http.ResponseWriter, r *http.Request) {
	// خوندن آیدی از توکن
	rawUserID := r.Context().Value("user_id")
	var userID int

	switch v := rawUserID.(type) {
	case float64:
		userID = int(v)
	case int:
		userID = v
	default:
		http.Error(w, `{"error": "خطای احراز هویت: آیدی نامعتبر"}`, http.StatusUnauthorized) // کد 401
		return
	}

	// ----------------------------------------------------
	// بخش جدید: هندل کردن آپدیت اطلاعات اگر متد PUT بود
	// ----------------------------------------------------
	if r.Method == http.MethodPut {
		var updateReq struct {
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Mobile    string `json:"mobile"`
			UserName  string `json:"user_name"` // اضافه شد
			Password  string `json:"password"`  // اضافه شد
		}

		if err := json.NewDecoder(r.Body).Decode(&updateReq); err != nil {
			http.Error(w, `{"error": "درخواست نامعتبر"}`, http.StatusBadRequest)
			return
		}

		var err error

		// بررسی اینکه آیا کاربر رمز عبور جدید وارد کرده یا نه
		if updateReq.Password != "" {
			// هش کردن پسورد جدید
			hashedPassword, hashErr := bcrypt.GenerateFromPassword([]byte(updateReq.Password), bcrypt.DefaultCost)
			if hashErr != nil {
				http.Error(w, `{"error": "خطا در پردازش رمز عبور"}`, http.StatusInternalServerError)
				return
			}
			// کوئری با پسورد
			updateQuery := `UPDATE users SET first_name = $1, last_name = $2, mobile = $3, user_name = $4, password = $5 WHERE id = $6`
			_, err = database.DB.Exec(updateQuery, updateReq.FirstName, updateReq.LastName, updateReq.Mobile, updateReq.UserName, string(hashedPassword), userID)
		} else {
			// کوئری بدون پسورد (رمز قبلی حفظ میشه)
			updateQuery := `UPDATE users SET first_name = $1, last_name = $2, mobile = $3, user_name = $4 WHERE id = $5`
			_, err = database.DB.Exec(updateQuery, updateReq.FirstName, updateReq.LastName, updateReq.Mobile, updateReq.UserName, userID)
		}

		if err != nil {
			log.Printf("Error updating user profile: %v", err)
			// اگه ارور بخاطر تکراری بودن user_name بود (تو دیتابیس constraint گذاشتیم)
			// معمولا ارور دیتابیس شامل کلمه unique constraint یا duplicate میشه
			http.Error(w, `{"error": "خطا در بروزرسانی اطلاعات (احتمالا نام کاربری تکراری است)"}`, http.StatusInternalServerError)
			return
		}
	}
	// ----------------------------------------------------

	var user models.User
	var firstName, lastName, mobile sql.NullString // موبایل هم ممکنه Null باشه

	// استفاده از JOIN برای گرفتن اسم نقش (role_name)
	query := `
		SELECT u.id, u.first_name, u.last_name, u.user_name, u.mobile, u.status, r.name as role_name 
		FROM users u
		LEFT JOIN roles r ON u.role_id = r.id
		WHERE u.id = $1`

	err := database.DB.QueryRow(query, userID).Scan(
		&user.Id,
		&firstName,
		&lastName,
		&user.UserName,
		&mobile,      // اضافه شد
		&user.Status, // اضافه شد (اگه تو مدل داری)
		&user.RoleName,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, `{"error": "کاربر پیدا نشد!"}`, http.StatusNotFound) // کد 404
			return
		}
		log.Printf("Error fetching user profile: %v", err)
		http.Error(w, `{"error": "خطای سرور"}`, http.StatusInternalServerError) // کد 500
		return
	}

	// هندل کردن Null ها
	if firstName.Valid {
		user.FirstName = firstName.String
	}
	if lastName.Valid {
		user.LastName = lastName.String
	}
	if mobile.Valid {
		user.Mobile = mobile.String
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(user)
	if err != nil {
		return
	}
}
