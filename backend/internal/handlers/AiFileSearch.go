package handlers

import (
	"dta770/internal/ai"
	"dta770/internal/analysis"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/sashabaranov/go-openai"
)

func AiFileSearchHandler(client *openai.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// حداکثر حجم فایل: مثلا 25MB
		if err := r.ParseMultipartForm(25 << 20); err != nil {
			log.Printf("ParseMultipartForm error: %v\n", err)
			writeJSONError(w, "فرمت درخواست یا حجم فایل نامعتبر است", http.StatusBadRequest)
			return
		}

		uploadedFile, fileHeader, err := r.FormFile("file")
		if err != nil {
			log.Printf("FormFile error: %v\n", err)
			writeJSONError(w, "فایل ارسال نشده یا قابل خواندن نیست", http.StatusBadRequest)
			return
		}
		defer uploadedFile.Close()

		// ذخیره فایل آپلودشده در temp
		tempDir := os.TempDir()
		safeFileName := filepath.Base(fileHeader.Filename)
		tempPath := filepath.Join(tempDir, fmt.Sprintf("%d_%s", time.Now().UnixNano(), safeFileName))

		dst, err := os.Create(tempPath)
		if err != nil {
			log.Printf("Create temp file error: %v\n", err)
			writeJSONError(w, "خطا در ذخیره موقت فایل", http.StatusInternalServerError)
			return
		}

		_, err = io.Copy(dst, uploadedFile)
		closeErr := dst.Close()
		if err != nil {
			log.Printf("Copy uploaded file error: %v\n", err)
			writeJSONError(w, "خطا در ذخیره فایل آپلودشده", http.StatusInternalServerError)
			return
		}
		if closeErr != nil {
			log.Printf("Close temp file error: %v\n", closeErr)
			writeJSONError(w, "خطا در بستن فایل موقت", http.StatusInternalServerError)
			return
		}

		defer func() {
			if err := os.Remove(tempPath); err != nil {
				log.Printf("Remove temp file error: %v\n", err)
			}
		}()

		fmt.Printf("Uploaded file saved temporarily: %s\n", tempPath)

		records, err := analysis.ParseExcel(tempPath)
		if err != nil {
			fmt.Printf("ParseCSV error: %v\n", err)
			writeJSONError(w, "خطا در خواندن فایل", http.StatusBadRequest)
			return
		}

		if len(records) == 0 {
			writeJSONError(w, "فایل فاقد داده است", http.StatusBadRequest)
			return
		}

		req := analysis.BuildAIRequest(records)

		b, _ := json.MarshalIndent(req, "", "  ")
		fmt.Println(string(b))

		report, err := ai.GenerateReport(client, req)
		if err != nil {
			writeJSONError(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"message": report,
		})
	}
}

func writeJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	}); err != nil {
		log.Printf("writeJSONError encode error: %v\n", err)
	}
}
