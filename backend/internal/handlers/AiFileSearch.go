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
	"strings"
	"time"

	"github.com/openai/openai-go"
)

func AiFileSearchHandler(client *openai.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

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
			fmt.Printf("ParseExcel error: %v\n", err)
			writeJSONError(w, "خطا در خواندن فایل", http.StatusBadRequest)
			return
		}

		if len(records) == 0 {
			writeJSONError(w, "فایل فاقد داده است", http.StatusBadRequest)
			return
		}

		req := analysis.BuildAIRequest(records)

		// ═══════════════════════════════════════════════════════
		// لاگ کردن دیتای خلاصه شده ارسالی به AI در کنسول
		// ═══════════════════════════════════════════════════════
		reqJSON, err := json.MarshalIndent(req, "", "  ")
		if err != nil {
			log.Printf("[AI-Payload] Error marshaling AIRequest: %v\n", err)
		} else {
			log.Printf("\n========== [AI REQUEST PAYLOAD START] ==========\n%s\n========== [AI REQUEST PAYLOAD END] ===========\n", string(reqJSON))
		}

		// ═══════════════════════════════════════════════════════
		// تا اینجا همه چیز JSON error بود
		// از اینجا به بعد SSE شروع میشه
		// ═══════════════════════════════════════════════════════

		flusher, ok := w.(http.Flusher)
		if !ok {
			writeJSONError(w, "Streaming not supported by server", http.StatusInternalServerError)
			return
		}

		// ست کردن headers برای SSE
		w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache, no-transform")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")

		// این خیلی مهمه - باید status رو قبل از اولین write بفرستی
		w.WriteHeader(http.StatusOK)
		flusher.Flush()

		onChunk := func(chunk string) {
			// JSON escape برای محتوای فارسی و special characters
			safeChunk := strings.ReplaceAll(chunk, "\\", "\\\\")
			safeChunk = strings.ReplaceAll(safeChunk, "\n", "\\n")
			safeChunk = strings.ReplaceAll(safeChunk, "\r", "\\r")
			safeChunk = strings.ReplaceAll(safeChunk, "\"", "\\\"")

			fmt.Fprintf(w, "data: %s\n\n", safeChunk)
			flusher.Flush()
		}

		err = ai.GenerateReportStream(r.Context(), client, req, onChunk)
		if err != nil {
			log.Printf("Stream error: %v\n", err)
			// حالا که توی SSE mode هستیم، خطا رو به صورت SSE میفرستیم
			errMsg := strings.ReplaceAll(err.Error(), "\n", "\\n")
			fmt.Fprintf(w, "data: [ERROR: %s]\n\n", errMsg)
			flusher.Flush()
			return
		}

		fmt.Fprintf(w, "data: [DONE]\n\n")
		flusher.Flush()
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
