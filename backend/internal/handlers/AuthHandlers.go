package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"dta770/internal/database"
	"dta770/internal/middleware"
	"dta770/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "فقط متد POST مجازه", http.StatusMethodNotAllowed)
		return
	}

	var req models.LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "فرمت داده‌ها غلط است", http.StatusBadRequest)
		return
	}

	var user models.User
	var roleName sql.NullString
	var hashedPassword string // یه متغیر واسه گرفتن رمز هش شده از دیتابیس

	// کوئری رو تغییر دادیم که پسورد رو برگردونه و دیگه پسورد رو تو WHERE چک نمی‌کنیم
	query := `
		SELECT u.id, u.user_name, u.password, r.name 
		FROM users u
		LEFT JOIN roles r ON u.role_id = r.id
		WHERE u.user_name = $1
	`

	// اسکن کردن نتیجه (رمز هش شده رو هم می‌گیریم)
	err = database.DB.QueryRow(query, req.UserName).Scan(&user.Id, &user.UserName, &hashedPassword, &roleName)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "نام کاربری یا رمز عبور اشتباه است", http.StatusUnauthorized)
		} else {
			log.Printf("Error querying user for login: %v", err)
			http.Error(w, "خطای سرور", http.StatusInternalServerError)
		}
		return
	}

	// اینجا جادوی bcrypt اتفاق میفته: مقایسه رمز خام با رمز هش شده دیتابیس
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password))
	if err != nil {
		// اگه ارور داد یعنی رمز اشتباهه
		http.Error(w, "نام کاربری یا رمز عبور اشتباه است", http.StatusUnauthorized)
		return
	}

	// بقیه کدت همونطوری می‌مونه...
	if roleName.Valid {
		user.RoleName = roleName.String
	} else {
		user.RoleName = "User"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.Id,
		"name":    user.UserName,
		"role":    user.RoleName,
		"exp":     time.Now().Add(time.Hour * 1).Unix(),
	})

	tokenString, err := token.SignedString(middleware.MySigningKey)
	if err != nil {
		log.Printf("Error signing token: %v", err)
		http.Error(w, "خطا در ساخت توکن", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(map[string]string{
		"token":   tokenString,
		"message": "خوش آمدید " + user.UserName,
		"status":  "success",
	})
	if err != nil {
		log.Printf("Error encoding login response: %v", err)
		return
	}
}

func MeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"message": "توکن معتبر است",
	})
	if err != nil {
		log.Printf("Error encoding me response: %v", err)
		return
	}
}
