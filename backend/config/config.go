package config

import (
	"errors"
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	GapAPIKey    string `mapstructure:"GAP_API_KEY"`
	OpenAiApiKey string `mapstructure:"OPENAI_API_KEY"`
}

func Load() (*Config, error) {
	viper.SetConfigName(".env")
	viper.SetConfigType("env")

	viper.AddConfigPath(".")
	viper.AddConfigPath("./backend")
	viper.AddConfigPath("../..")

	// لود کردن متغیرهای محیطی سیستم‌عامل
	viper.AutomaticEnv()

	// اتصال متغیرهای محیطی به ساختار کانفیگ
	if err := viper.BindEnv("GAP_API_KEY"); err != nil {
		return nil, err
	}
	if err := viper.BindEnv("OPENAI_API_KEY"); err != nil {
		return nil, err
	}

	// تلاش برای خواندن فایل پیکربندی
	if err := viper.ReadInConfig(); err != nil {
		var configFileNotFoundError viper.ConfigFileNotFoundError
		if !errors.As(err, &configFileNotFoundError) {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}

	// چک کردن مقادیر (Validation)
	if cfg.GapAPIKey == "" {
		return nil, fmt.Errorf("GAP_API_KEY is required but was empty")
	}
	// اصلاح: نام کلید رو توی ارورها هم دقیق بنویس که موقع دیباگ اذیت نشی
	if cfg.OpenAiApiKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY is required but was empty")
	}

	return cfg, nil
}
