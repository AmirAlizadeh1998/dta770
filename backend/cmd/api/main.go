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

	"github.com/sashabaranov/go-openai"
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
	// ۱. لود کردن کانفیگ برای یک‌بار در کل چرخه حیات برنامه
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// ۲. ساخت کانفیگ کلاینت OpenAI (GapGPT)
	gapGptConfig := openai.DefaultConfig(cfg.GapAPIKey)
	gapGptConfig.BaseURL = "https://api.gapgpt.app/v1"
	aiClient := openai.NewClientWithConfig(gapGptConfig)
	// ۱. اجرای دیتابیس
	database.InitDB()

	// ۲. تنظیم روت‌ها
	mux := http.NewServeMux()

	// --- بخش فرانت‌اند (اصلاح شده برای مشکل ۴۰۴ تو SPAها) ---
	distFs, err := fs.Sub(frontend, "dist")
	if err != nil {
		log.Fatal("خطا در پیدا کردن پوشه فرانت‌اند: ", err)
	}

	// فایل‌سرور استاندارد رو می‌ریزیم تو یه متغیر
	fileServer := http.FileServer(http.FS(distFs))

	// به جای mux.Handle، یه هندلر سفارشی با mux.HandleFunc می‌نویسیم
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// مسیر درخواستی رو درمیاریم
		reqPath := r.URL.Path
		if reqPath == "/" {
			reqPath = "index.html"
		} else {
			reqPath = reqPath[1:] // اسلشِ اولِ مسیر رو حذف می‌کنیم تا بگرده تو پوشه
		}

		// با fs.Stat چک می‌کنیم ببینیم اصلا همچین فایلی تو dist داریم؟
		if _, err := fs.Stat(distFs, reqPath); err != nil {
			// اگه فایل رو پیدا نکرد (ارور داد)، یعنی یه مسیریه که مال خود Reactـه
			// پس آدرس رو گول می‌زنیم و برمی‌گردونیم به روت تا index.html رو لود کنه!
			r.URL.Path = "/"
		}

		// حالا درخواست رو می‌دیم دست فایل‌سرور تا زحمت سِرو کردنش رو بکشه
		fileServer.ServeHTTP(w, r)
	})
	// ----------------------------------------

	mux.HandleFunc("/api/me", middleware.MainMiddleware(handlers.MeHandler))
	mux.HandleFunc("/api/login", middleware.MainMiddleware(handlers.LoginHandler))
	mux.HandleFunc("/api/chat", middleware.MainMiddleware(handlers.AiChatHandler(aiClient)))
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

	//hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	//fmt.Println("New Hash for 123456:", string(hash))

	// ۳. اجرای سرور
	fmt.Println("🚀 Server running on http://localhost:8080 ...")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
