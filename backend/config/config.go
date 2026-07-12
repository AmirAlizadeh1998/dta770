package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	GapAPIKey string `mapstructure:"GAP_API_KEY"`
}

func Load() (*Config, error) {
	// به جای تعیین یک فایل هاردکد شده، نام فایل و نوعش رو مشخص می‌کنیم
	viper.SetConfigName(".env")
	viper.SetConfigType("env")

	// مسیرهای زیر رو به ترتیب برای پیدا کردن فایل .env جستجو کن:
	viper.AddConfigPath(".")         // ۱. مسیر جاری اجرای برنامه
	viper.AddConfigPath("./backend") // ۲. پوشه backend (اگر از روت اصلی پروژه اجرا کنی)
	viper.AddConfigPath("../..")     // ۳. دو پوشه عقب‌تر (اگر از داخل cmd/api اجرا کنی)

	// لود کردن متغیرهای محیطی سیستم‌عامل
	viper.AutomaticEnv()

	// تلاش برای خواندن فایل پیکربندی
	if err := viper.ReadInConfig(); err != nil {
		// اگر فایل پیدا نشد ولی متغیر توی سیستم‌عامل ست شده بود، ارور نده
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}

	// راستی! یادمون نره که برای چک کردن مقدار، فیلد درست رو بررسی کنیم
	if cfg.GapAPIKey == "" {
		return nil, fmt.Errorf("GAP_API_KEY is required but was empty")
	}

	return cfg, nil
}
