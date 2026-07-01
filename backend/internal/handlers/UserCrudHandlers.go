package handlers

import (
	"database/sql"
	"dta770/internal/database"
	"dta770/internal/models"
	"encoding/json"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	// CORS و احراز هویت توسط mainMiddleware انجام میشه

	// کوئری آپدیت شد: هم role_id رو می‌گیریم، هم اسم نقش رو از جدول roles
	rows, err := database.DB.Query(`
		SELECT u.id, u.user_name, u.first_name, u.last_name, u.password, u.mobile, u.role_id, u.status, r.name as role_name
		FROM users u 
		LEFT JOIN roles r ON u.role_id = r.id
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {
			log.Printf("Error closing rows in GetUsersHandler: %v", err)
		}
	}(rows)

	var users []models.User

	for rows.Next() {
		var u models.User
		// lastName رو هم به NullString ها اضافه کردیم
		var mobile, status, roleName, lastName sql.NullString

		// اسکن کردن فیلدها به ترتیب SELECT
		err := rows.Scan(
			&u.Id,
			&u.UserName,
			&u.FirstName,
			&lastName, // <--- اینجا به جای u.LastName، متغیر موقت رو می‌دیم
			&u.Password,
			&mobile,
			&u.RoleId,
			&status,
			&roleName,
		)
		if err != nil {
			log.Printf("Error scanning user row: %v", err)
			http.Error(w, "خطای داخلی سرور هنگام خواندن اطلاعات کاربران", http.StatusInternalServerError)
			return
		}

		// مقادیر Nullable رو هندل می‌کنیم
		if lastName.Valid {
			u.LastName = lastName.String
		}
		if mobile.Valid {
			u.Mobile = mobile.String
		}
		if status.Valid {
			u.Status = status.String
		}
		if roleName.Valid {
			u.RoleName = roleName.String
		}

		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating user rows: %v", err)
		http.Error(w, "خطای داخلی سرور هنگام خواندن اطلاعات کاربران", http.StatusInternalServerError)
		return
	}

	if users == nil {
		users = []models.User{}
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(users)
	if err != nil {
		log.Printf("Error encoding users response: %v", err)
		return
	}
}

func CreateUserHandler(w http.ResponseWriter, r *http.Request) {
	var u models.User

	// ۱. دیکود کردن اطلاعاتی که فرانت‌اند (React) فرستاده
	err := json.NewDecoder(r.Body).Decode(&u)
	if err != nil {
		log.Printf("Error decoding new user body: %v", err)
		http.Error(w, "دیتای ارسالی نامعتبر است", http.StatusBadRequest) // کد 400
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		http.Error(w, "خطای سرور هنگام رمزنگاری پسورد", http.StatusInternalServerError)
		return
	}
	// پسورد هش شده رو جایگزین پسورد خام توی استراکت می‌کنیم
	u.Password = string(hashedPassword)

	// ۲. مدیریت فیلدهای Nullable
	mobile := sql.NullString{String: u.Mobile, Valid: u.Mobile != ""}
	status := sql.NullString{String: u.Status, Valid: u.Status != ""}

	// ۳. کوئری اینسرت (ستون role شد role_id)
	sqlStatement := `
		INSERT INTO users (user_name, password, mobile, role_id, status, first_name, last_name)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`

	// ۴. اجرای کوئری و گرفتن ID کاربر جدید
	err = database.DB.QueryRow(
		sqlStatement,
		u.UserName,  // $1
		u.Password,  // $2 (این الان همون پسورد هش شده است)
		mobile,      // $3
		u.RoleId,    // $4
		status,      // $5
		u.FirstName, // $6
		u.LastName,  // $7
	).Scan(&u.Id)
	if err != nil {
		// اینجا بعداً می‌تونی همون خطای تکراری بودن یوزرنیم (کد 23505) رو که حرفشو زدیم هندل کنی
		log.Printf("Error inserting user into database: %v", err)
		http.Error(w, "خطای داخلی سرور هنگام ساخت کاربر", http.StatusInternalServerError) // کد 500
		return
	}

	// ۵. ارسال تاییدیه و دیتای کاربر جدید به فرانت‌اند
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated) // کد 201 یعنی با موفقیت ساخته شد

	// حواست باشه بهتره پسورد هش شده رو به فرانت‌اند برنگردونی، ولی فعلا کد خودت رو دست نزدم!
	err = json.NewEncoder(w).Encode(u)
	if err != nil {
		log.Printf("Error encoding created user response: %v", err)
		return
	}
}

func UpdateUserHandler(w http.ResponseWriter, r *http.Request) {
	// گرفتن ID از URL
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "آیدی کاربر ارسال نشده است", http.StatusBadRequest) // کد 400
		return
	}

	var u models.User
	// خوندن دیتای جدید از فرانت‌اند
	err := json.NewDecoder(r.Body).Decode(&u)
	if err != nil {
		log.Printf("Error decoding update user body: %v", err)
		http.Error(w, "دیتای ارسالی نامعتبر است", http.StatusBadRequest) // کد 400
		return
	}

	// مدیریت فیلدهای Nullable (نقش رو از اینجا حذف کردیم)
	mobile := sql.NullString{String: u.Mobile, Valid: u.Mobile != ""}
	status := sql.NullString{String: u.Status, Valid: u.Status != ""}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		http.Error(w, "خطای سرور هنگام رمزنگاری پسورد", http.StatusInternalServerError)
		return
	}
	u.Password = string(hashedPassword)

	// کوئری آپدیت (ستون role شد role_id)
	sqlStatement := `
		UPDATE users 
		SET user_name = $1, password = $2, mobile = $3, role_id = $4, status = $5, first_name = $6, last_name = $7
		WHERE id = $8
	`

	// پاس دادن u.RoleId به جای role قدیمی
	res, err := database.DB.Exec(sqlStatement, u.UserName, u.Password, mobile, u.RoleId, status, u.FirstName, u.LastName, idStr)
	if err != nil {
		log.Printf("Error updating user: %v", err)
		http.Error(w, "خطای داخلی سرور", http.StatusInternalServerError) // کد 500
		return
	}

	// چک می‌کنیم اصلا کاربری با این آیدی پیدا شد یا نه
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "کاربری با این آیدی یافت نشد", http.StatusNotFound) // کد 404
		return
	}

	w.WriteHeader(http.StatusOK) // کد 200
	_, err = w.Write([]byte(`{"message": "کاربر با موفقیت ویرایش شد"}`))
	if err != nil {
		return
	}
}

func DeleteUserHandler(w http.ResponseWriter, r *http.Request) {
	// گرفتن ID از URL
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "آیدی کاربر برای حذف ارسال نشده است", http.StatusBadRequest) // کد 400
		return
	}

	// کوئری حذف
	sqlStatement := `DELETE FROM users WHERE id = $1`
	res, err := database.DB.Exec(sqlStatement, idStr)
	if err != nil {
		log.Printf("Error deleting user: %v", err)
		http.Error(w, "خطای داخلی سرور هنگام حذف", http.StatusInternalServerError) // کد 500
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "کاربری با این آیدی پیدا نشد", http.StatusNotFound) // کد 404
		return
	}

	w.WriteHeader(http.StatusOK) // کد 200
	_, err = w.Write([]byte(`{"message": "کاربر با موفقیت حذف شد"}`))
	if err != nil {
		return
	}
}
