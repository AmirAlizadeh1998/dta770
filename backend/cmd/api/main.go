package main

import (
	"dta770/config"
	"dta770/internal/database"
	"dta770/internal/handlers"
	"dta770/internal/middleware"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
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
		http.Error(w, "متد غیرمجاز", http.StatusMethodNotAllowed)
	}
}

//go:embed dist
var frontend embed.FS

func main() {
	// ۱. لود کردن کانفیگ
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// ۲. ساخت کلاینت رسمی OpenAI با BaseURL سفارشی GapGPT
	gapGptClient := openai.NewClient(
		option.WithBaseURL("https://api.gapgpt.app/v1"),
		option.WithAPIKey(cfg.GapAPIKey),
	)

	// ۳. اجرای دیتابیس
	database.InitDB()

	// ۴. تنظیم روت‌ها
	mux := http.NewServeMux()

	// --- بخش فرانت‌اند (SPA fallback) ---
	distFs, err := fs.Sub(frontend, "dist")
	if err != nil {
		log.Fatal("خطا در پیدا کردن پوشه فرانت‌اند: ", err)
	}

	fileServer := http.FileServer(http.FS(distFs))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		reqPath := r.URL.Path
		if reqPath == "/" {
			reqPath = "index.html"
		} else {
			reqPath = reqPath[1:]
		}

		if _, err := fs.Stat(distFs, reqPath); err != nil {
			r.URL.Path = "/"
		}

		fileServer.ServeHTTP(w, r)
	})
	// ----------------------------------------

	mux.HandleFunc("/api/me", middleware.MainMiddleware(handlers.MeHandler))
	mux.HandleFunc("/api/login", middleware.MainMiddleware(handlers.LoginHandler))
	//mux.HandleFunc("/api/ai/chat", middleware.MainMiddleware(handlers.AiChatHandler(&gapGptClient)))
	mux.HandleFunc("/api/ai/file-search", middleware.MainMiddleware(handlers.AiFileSearchHandler(&gapGptClient)))
	mux.HandleFunc("/api/users", middleware.MainMiddleware(usersRouter))
	mux.HandleFunc("/api/users/profile", middleware.MainMiddleware(handlers.UserProfileHandler))
	mux.HandleFunc("/api/roles", middleware.MainMiddleware(handlers.RolesHandler))
	mux.HandleFunc("/api/devices/active", middleware.MainMiddleware(handlers.GetActiveDevicesHandler))
	mux.HandleFunc("/api/devices/analyze", middleware.MainMiddleware(handlers.AnalyzeDeviceHandler))
	mux.HandleFunc("/api/devices/", middleware.MainMiddleware(handlers.DevicesHandler))
	mux.HandleFunc("/api/devices", middleware.MainMiddleware(handlers.DevicesHandler))
	mux.HandleFunc("/api/monitor/devices/", middleware.MainMiddleware(handlers.DeviceMonitorDetailHandler))
	mux.HandleFunc("/api/monitor/devices", middleware.MainMiddleware(handlers.GetDeviceLogDetailsHandler))
	mux.HandleFunc("/api/monitor/chart", middleware.MainMiddleware(handlers.GetDeviceChartData))
	mux.HandleFunc("/api/get-device-logs", middleware.MainMiddleware(handlers.GetDeviceLogs))
	mux.HandleFunc("/api/export-device-logs", middleware.MainMiddleware(handlers.ExportDeviceLogsHandler))

	fmt.Println("🚀 Server running on http://localhost:8080 ...")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
