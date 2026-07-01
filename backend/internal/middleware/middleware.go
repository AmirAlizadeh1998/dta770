package middleware

import (
	"context"
	"dta770/internal/models"
	"fmt"
	"log"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

var MySigningKey = []byte(models.SecretKey)

func MainMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", models.FrontendOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.URL.Path != "/api/login" && r.URL.Path != "/api/test-sensor" && r.URL.Path != "/api/get-device-logs" {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "توکن مفقود است!", http.StatusUnauthorized)
				return
			}

			tokenString := ""
			if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				tokenString = authHeader[7:]
			}

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("متد امضای غیرمنتظره: %v", token.Header["alg"])
				}
				return MySigningKey, nil
			})

			if err != nil || !token.Valid {
				w.WriteHeader(http.StatusUnauthorized)
				_, writeErr := w.Write([]byte("توکن نامعتبر یا منقضی شده است"))
				if writeErr != nil {
					log.Printf("Error writing unauthorized response: %v", writeErr)
				}
				return
			}

			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				ctx := r.Context() // اول یه کپی از کانتکست می‌گیریم

				// ۱. چک کردن نقش به صورت مستقل
				if role, ok := claims["role"].(string); ok {
					ctx = context.WithValue(ctx, "userRole", role)
				}

				// ۲. چک کردن آیدی به صورت مستقل
				if id, ok := claims["user_id"]; ok {
					ctx = context.WithValue(ctx, "user_id", id)
				}

				// ۳. در نهایت ریکوئست رو با کانتکست جدید آپدیت می‌کنیم
				r = r.WithContext(ctx)
			}

		}

		// پاس دادن ریکوئست (که حالا شامل نقش هم هست) به هندلر بعدی
		next(w, r)
	}
}
