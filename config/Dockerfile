# از ایمیج رسمی گو استفاده می‌کنیم
FROM golang:1.25-alpine

# تنظیم پوشه کاری داخل کانتینر
WORKDIR /app

# کپی کردن فایل‌های ماژول و نصب وابستگی‌ها
COPY ../backend/go.mod go.sum ./
RUN go mod download

# کپی کردن بقیه کدهای پروژه
COPY .. .

# بیلد کردن برنامه
RUN go build -o main .

# اجرای برنامه
CMD ["./main"]