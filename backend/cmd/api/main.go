package main

import (
	"dta770/internal/database"
	"dta770/internal/handlers"
	"dta770/internal/middleware"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
)

func usersRouter(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		handlers.GetUsersHandler(w, r)
	case http.MethodPost:
		handlers.CreateUserHandler(w, r)
	case http.MethodPut:
		handlers.UpdateUserHandler(w, r)
	case http.MethodDelete:
		handlers.DeleteUserHandler(w, r)
	default:
		http.Error(w, "متد غیرمجاز", http.StatusMethodNotAllowed) // کد $405$
	}
}

// نکته مهم: این خط پایین کامنت معمولی نیست، دستور کامپایلره! حتما باید باشه.
//
//go:embed dist
var frontend embed.FS

func main() {
	// ۱. اجرای دیتابیس
	database.InitDB()

	// ۲. تنظیم روت‌ها
	mux := http.NewServeMux()

	// --- بخش فرانت‌اند (اضافه شده به mux) ---
	distFs, err := fs.Sub(frontend, "dist")
	if err != nil {
		log.Fatal("خطا در پیدا کردن پوشه فرانت‌اند: ", err)
	}
	// دقت کن که اینجا از mux.Handle استفاده کردیم نه http.Handle
	mux.Handle("/", http.FileServer(http.FS(distFs)))
	// ----------------------------------------

	mux.HandleFunc("/api/me", middleware.MainMiddleware(handlers.MeHandler))
	mux.HandleFunc("/api/login", middleware.MainMiddleware(handlers.LoginHandler))
	mux.HandleFunc("/api/users", middleware.MainMiddleware(usersRouter))
	mux.HandleFunc("/api/users/profile", middleware.MainMiddleware(handlers.UserProfileHandler))
	mux.HandleFunc("/api/roles", middleware.MainMiddleware(handlers.RolesHandler))
	mux.HandleFunc("/api/devices/active", middleware.MainMiddleware(handlers.GetActiveDevicesHandler))
	//mux.HandleFunc("/api/devices/analyze-ai", middleware.MainMiddleware(handlers.AnalyzeDeviceHandler))
	mux.HandleFunc("/api/devices/analyze", middleware.MainMiddleware(handlers.AnalyzeDeviceHandler))
	mux.HandleFunc("/api/devices/", middleware.MainMiddleware(handlers.DevicesHandler))
	mux.HandleFunc("/api/devices", middleware.MainMiddleware(handlers.DevicesHandler))
	mux.HandleFunc("/api/monitor/devices/", middleware.MainMiddleware(handlers.DeviceMonitorDetailHandler))
	mux.HandleFunc("/api/monitor/devices", middleware.MainMiddleware(handlers.GetDeviceLogDetailsHandler))
	mux.HandleFunc("/api/monitor/chart", middleware.MainMiddleware(handlers.GetDeviceChartData))
	mux.HandleFunc("/api/get-device-logs", middleware.MainMiddleware(handlers.GetDeviceLogs))
	mux.HandleFunc("/api/export-device-logs", middleware.MainMiddleware(handlers.ExportDeviceLogsHandler))

	//hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	//fmt.Println("New Hash for 123456:", string(hash))

	// ۳. اجرای سرور
	fmt.Println("🚀 Server running on http://localhost:8080 ...")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
