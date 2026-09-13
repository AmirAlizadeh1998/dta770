package main

import (
	"bufio"
	"bytes"
	"dta770/config"
	"dta770/internal/database"
	"dta770/internal/handlers"
	"dta770/internal/middleware"
	"dta770/worker"
	"embed"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

// ==========================================
// 1. میدل‌ور جدید برای فیلتر کردن PING ها
// ==========================================

type gapGPTTransport struct {
	Base http.RoundTripper
}

func (t *gapGPTTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	base := t.Base
	if base == nil {
		base = http.DefaultTransport
	}
	resp, err := base.RoundTrip(req)
	if err != nil {
		return nil, err
	}
	resp.Body = &pingFilterBody{
		ReadCloser: resp.Body,
		bufReader:  bufio.NewReader(resp.Body),
		leftover:   &bytes.Buffer{},
	}
	return resp, nil
}

type pingFilterBody struct {
	io.ReadCloser
	bufReader    *bufio.Reader
	leftover     *bytes.Buffer
	eventHasData bool // اضافه کردن این فلگ برای مدیریت خطوط خالی
}

func (b *pingFilterBody) Read(p []byte) (int, error) {
	if b.leftover.Len() > 0 {
		return b.leftover.Read(p)
	}

	for {
		line, err := b.bufReader.ReadBytes('\n')

		trimmed := bytes.TrimSpace(line)

		// ۱. اگر خط کامنت است (مثل PING)
		if len(trimmed) > 0 && bytes.HasPrefix(trimmed, []byte(":")) {
			if err != nil {
				return 0, err
			}
			continue // کامنت دراپ می‌شود
		}

		// ۲. بررسی خالی بودن خط (جداکننده‌ی ایونت‌ها)
		if len(trimmed) == 0 {
			if len(line) > 0 { // یعنی فقط \n یا \r\n خونده شده
				if b.eventHasData {
					// چون دیتا داشتیم، این خط خالی رو به عنوان پایان ایونت پاس می‌دیم
					b.leftover.Write(line)
					b.eventHasData = false
				} else {
					// خط خالی اضافی و بدون دیتا (مثل خطِ بعد از PING) دراپ میشه
					// تا کلاینت سعی نکنه ایونت خالی رو پارس کنه
					if err != nil {
						return 0, err
					}
					continue
				}
			}
		} else {
			// ۳. دیتای معتبر (مثل data: ...)
			b.eventHasData = true
			b.leftover.Write(line)
		}

		// ۴. خروج و برگرداندن داده
		if b.leftover.Len() > 0 {
			return b.leftover.Read(p)
		}

		if err != nil {
			return 0, err
		}
	}
}

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

	filteredHTTPClient := &http.Client{
		Transport: &gapGPTTransport{Base: http.DefaultTransport},
	}

	// ۲. ساخت کلاینت رسمی OpenAI با BaseURL سفارشی GapGPT
	gapGptClient := openai.NewClient(
		option.WithHTTPClient(filteredHTTPClient),
		option.WithBaseURL("https://api.gapgpt.app/v1"),
		option.WithAPIKey(cfg.GapAPIKey),
	)

	// ۳. اجرای دیتابیس
	database.InitDB()
	worker.StartDeviceDeactivationWorker(database.DB)

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
